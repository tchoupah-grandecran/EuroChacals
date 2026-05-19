import React, { useState } from 'react';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Import des icônes Lucide
import { Mic, User, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'esc2026_session';

const saveSession = (uid, displayName) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ uid, displayName }));
  } catch (_) {}
};

export const loadStoredSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

export const clearStoredSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
};

const Login = ({ onSessionRestored }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Il me faut un prénom pour te reconnaître ! 😉");
      return;
    }

    setError('');
    setLoading(true);

    try {
      // ── Step 1: Check Local Storage Session ─────────────────────────────
      const stored = loadStoredSession();
      if (stored && stored.displayName.toLowerCase() === trimmedName.toLowerCase()) {
        const userCredential = await signInAnonymously(auth);
        await updateProfile(userCredential.user, { displayName: stored.displayName });
        
        // Return original stored stable UID to parent app layout
        onSessionRestored?.(stored.uid, stored.displayName);
        return;
      }

      // ── Step 2: Check global users registry in Firestore ────────────────
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userNameLower', '==', trimmedName.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Found user mapping profile! Reconnect utilizing original stored tracking UID
        const existingUserDoc = querySnapshot.docs[0].data();
        const userCredential = await signInAnonymously(auth);
        await updateProfile(userCredential.user, { displayName: existingUserDoc.userName });
        
        saveSession(existingUserDoc.uid, existingUserDoc.userName);
        onSessionRestored?.(existingUserDoc.uid, existingUserDoc.userName);
        return;
      }

      // ── Step 3: Brand New Account Setup ──────────────────────────────────
      const userCredential = await signInAnonymously(auth);
      const newFirebaseUid = userCredential.user.uid;
      
      await updateProfile(userCredential.user, { displayName: trimmedName });

      // Build primary master tracking map identity document
      await setDoc(doc(db, 'users', newFirebaseUid), {
        uid: newFirebaseUid,
        userName: trimmedName,
        userNameLower: trimmedName.toLowerCase(),
        createdAt: new Date().toISOString()
      });

      saveSession(newFirebaseUid, trimmedName);
      onSessionRestored?.(newFirebaseUid, trimmedName);

    } catch (err) {
      console.error(err);
      setError("Impossible de rejoindre l'arène pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <Mic size={32} color="#ff007f" />
        </div>
        <h1 style={styles.title}>Eurovision 2026</h1>
        <p style={styles.subtitle}>Entre ton pseudo/nom pour rejoindre la partie</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <User size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Pseudo/nom
            </label>
            <input
              type="text"
              placeholder="Chacal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={20}
              style={styles.input}
            />
          </div>

          {error && (
            <p style={styles.error}>
              <AlertCircle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={loading ? styles.buttonDisabled : styles.button}
          >
            {loading ? 'Entrée en scène...' : 'Rejoindre la partie'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh', width: '100vw', background: 'linear-gradient(135deg, #0f0c20 0%, #15102a 50%, #2b1055 100%)', color: '#fff', fontFamily: "'Outfit', sans-serif" },
  card: { background: 'rgba(255, 255, 255, 0.05)', padding: '40px', borderRadius: '16px', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', width: '100%', maxWidth: '400px', textAlign: 'center', boxSizing: 'border-box' },
  title: { fontFamily: "'Fredoka', sans-serif", fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '1.8rem', margin: '10px 0', color: '#ff007f', textShadow: '0 0 15px rgba(255, 0, 127, 0.4)' },
  subtitle: { fontSize: '0.95rem', color: '#a0aec0', marginBottom: '30px' },
  form: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  inputGroup: { marginBottom: '25px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e0', fontWeight: 400 },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.25)', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: "'Outfit', sans-serif" },
  button: { background: '#ff007f', color: '#fff', padding: '14px', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 500, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', marginTop: '5px', boxShadow: '0 0 15px rgba(255,0,127,0.3)', transition: 'background 0.2s' },
  buttonDisabled: { background: '#4a5568', color: '#a0aec0', padding: '14px', border: 'none', borderRadius: '8px', fontSize: '1rem', fontFamily: "'Outfit', sans-serif", cursor: 'not-allowed', marginTop: '5px' },
  error: { color: '#fc8181', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', fontWeight: 500 },
};

export default Login;