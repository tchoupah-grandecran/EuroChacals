import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Login, { loadStoredSession, clearStoredSession } from './components/Login';
import AdminPanel from './components/AdminPanel';
import PredictionForm from './components/PredictionForm';
import Leaderboard from './components/Leaderboard';
import BingoGrid from './components/BingoGrid';
import PersonalRank from './components/PersonalRank';
import RulesModal from './components/RulesModal';

import { Mic, User, LogOut, Sparkles, BarChart3, Trophy, X, HelpCircle, Grid3x3, Settings } from 'lucide-react';

function App() {
  const [firebaseUser, setFirebaseUser]                 = useState(null);
  const [appUser, setAppUser]                           = useState(null); // Holds the structural unified mapping { uid, displayName }
  const [loading, setLoading]                           = useState(true);
  const [viewAdmin, setViewAdmin]                       = useState(false);
  const [activeTab, setActiveTab]                       = useState('pronos');
  const [showLogoutModal, setShowLogoutModal]           = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showRulesModal, setShowRulesModal]             = useState(false);
  const [isReady, setIsReady]                           = useState(false);

  const ADMIN_NAME = "Kevin";
  const isAdmin = appUser && appUser.displayName === ADMIN_NAME;

  // Track global Firebase auth states
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser ?? null);
      
      if (currentUser) {
        // Fallback fallback recovery layer: query firestore for original UID 
        // if user refreshed browser and login.jsx flow skipped
        const localSession = loadStoredSession();
        if (localSession && localSession.displayName === currentUser.displayName) {
          setAppUser({ uid: localSession.uid, displayName: localSession.displayName });
        } else {
          try {
            const q = query(
              collection(db, 'users'), 
              where('userNameLower', '==', currentUser.displayName?.toLowerCase() || '')
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              const data = snap.docs[0].data();
              setAppUser({ uid: data.uid, displayName: data.userName });
            } else {
              // Edge case security fallback
              setAppUser({ uid: currentUser.uid, displayName: currentUser.displayName });
            }
          } catch (e) {
            console.error("Erreur lors de la récupération du profil utilisateur map tracking:", e);
            setAppUser({ uid: currentUser.uid, displayName: currentUser.displayName });
          }
        }
      } else {
        setAppUser(null);
        clearStoredSession();
      }
      
      setShowLogoutModal(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Direct manual session capture link straight from Login component actions
  const handleSessionRestored = (stableUid, displayName) => {
    setAppUser({ uid: stableUid, displayName });
  };

  useEffect(() => {
    if (appUser) {
      const timer = setTimeout(() => setIsReady(true), 600);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [appUser]);

  const handleLogout = async () => {
    try {
      clearStoredSession();
      await signOut(auth);
    } catch (err) {
      console.error("Erreur de déconnexion", err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh', background: '#0f0c20', color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
        Entrée dans l'arène...
      </div>
    );
  }

  if (!firebaseUser || !appUser) return <Login onSessionRestored={handleSessionRestored} />;

  const handleOpenLogoutModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isReady) return;
    setShowLogoutModal(true);
  };

  return (
    <div style={styles.dashboardContainer}>
      <style>{`
        @media (max-width: 360px) {
          .rules-btn-text { display: none !important; }
        }
      `}</style>

      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <Mic size={18} color="#ff007f" style={{ flexShrink: 0 }} />
          <span style={styles.logo}>ESC 2026</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setShowRulesModal(true)} style={styles.rulesBtn} title="Règles de calcul">
            <HelpCircle size={14} color="#ff007f" style={{ flexShrink: 0 }} />
            <span className="rules-btn-text" style={styles.rulesBtnText}>Règles</span>
          </button>

          <button
            onClick={handleOpenLogoutModal}
            disabled={!isReady}
            style={{ ...styles.profileBtn, pointerEvents: isReady ? 'auto' : 'none', opacity: isReady ? 1 : 0.8 }}
          >
            <User size={14} style={{ flexShrink: 0 }} />
            <span style={styles.profileBtnText}>{appUser.displayName || "Joueur"}</span>
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.tabContainer}>
          <button onClick={() => setActiveTab('pronos')} style={activeTab === 'pronos' ? styles.tabActive : styles.tab}>
            <Sparkles size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Mes pronos
          </button>
          <button onClick={() => setActiveTab('classement')} style={activeTab === 'classement' ? styles.tabActive : styles.tab}>
            <BarChart3 size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Mon choix
          </button>
          <button onClick={() => setActiveTab('bingo')} style={activeTab === 'bingo' ? styles.tabActive : styles.tab}>
            <Grid3x3 size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Bingo
          </button>
        </div>

        {/* Feeding appUser wrapper containing matching linked system document configurations safely below */}
        {activeTab === 'pronos'     && appUser.uid && <PredictionForm user={appUser} onOpenLeaderboard={() => setShowLeaderboardModal(true)} />}
        {activeTab === 'classement' && appUser.uid && <PersonalRank  user={appUser} onOpenLeaderboard={() => setShowLeaderboardModal(true)} />}
        {activeTab === 'bingo'      && appUser.uid && <BingoGrid      user={appUser} onOpenLeaderboard={() => setShowLeaderboardModal(true)} />}
      </main>

      {/* Admin modal */}
      {isAdmin && viewAdmin && (
        <div style={styles.adminModalOverlay}>
          <div style={styles.adminModalContent}>
            <AdminPanel onBack={() => setViewAdmin(false)} />
          </div>
        </div>
      )}

      {/* Leaderboard modal */}
      {showLeaderboardModal && (
        <div style={styles.leaderboardModalOverlay} onClick={() => setShowLeaderboardModal(false)}>
          <div style={styles.leaderboardModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.leaderboardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={20} color="#ffd700" />
                <h3 style={styles.leaderboardTitle}>Classement Général</h3>
              </div>
              <button style={styles.closeModalBtn} onClick={() => setShowLeaderboardModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={styles.leaderboardScrollContainer}>
              <Leaderboard />
            </div>
          </div>
        </div>
      )}

      {/* Rules modal */}
      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />

      {/* Account / logout modal */}
      {showLogoutModal && (
        <div style={styles.logoutModalOverlay} onClick={() => setShowLogoutModal(false)}>
          <div style={styles.logoutModalContent} onClick={(e) => e.stopPropagation()}>
            <h4 style={styles.logoutModalTitle}>Mon Compte</h4>
            <p style={styles.logoutModalUser}>
              Connecté en tant que <strong>{appUser.displayName || "Joueur"}</strong>
              {isAdmin && <span style={styles.adminInlineBadge}>Admin</span>}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              {isAdmin && (
                <button
                  onClick={() => { setShowLogoutModal(false); setViewAdmin(true); }}
                  style={styles.adminMenuBtn}
                >
                  <Settings size={16} style={{ marginRight: '8px' }} /> Console Admin
                </button>
              )}
              <button onClick={handleLogout} style={styles.confirmLogoutBtn}>
                <LogOut size={16} style={{ marginRight: '8px' }} /> Déconnexion
              </button>
              <button onClick={() => setShowLogoutModal(false)} style={styles.cancelLogoutBtn}>
                Rester dans l'arène
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  dashboardContainer: { minHeight: '100vh', background: '#0f0c20', color: '#fff', fontFamily: "'Outfit', sans-serif", position: 'relative' },
  header: { position: 'sticky', top: 0, zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(15, 12, 32, 0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', boxSizing: 'border-box' },
  logo: { fontFamily: "'Fredoka', sans-serif", fontSize: '1.1rem', fontWeight: 500, letterSpacing: '0.05em', color: '#ff007f' },
  rulesBtn: { display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255, 0, 127, 0.05)', border: '1px solid rgba(255, 0, 127, 0.2)', color: '#fff', padding: '6px 10px', borderRadius: '20px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: '0.8rem', fontWeight: 500, transition: '0.2s' },
  rulesBtnText: { color: '#cbd5e0' },
  profileBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', fontWeight: 500, maxWidth: '140px', transition: '0.2s' },
  profileBtnText: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  main: { padding: '20px', maxWidth: '600px', margin: '0 auto', paddingTop: '10px' },
  tabContainer: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', transition: '0.2s' },
  tabActive: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', background: '#ff007f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', boxShadow: '0 0 15px rgba(255,0,127,0.4)' },
  leaderboardModalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 12, 32, 0.85)', backdropFilter: 'blur(8px)', zIndex: 2500, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  leaderboardModalContent: { background: '#15102a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 15px 35px rgba(0,0,0,0.6)' },
  leaderboardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' },
  leaderboardTitle: { fontFamily: "'Fredoka', sans-serif", margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: 500 },
  leaderboardScrollContainer: { overflowY: 'auto', flex: 1, paddingRight: '4px' },
  closeModalBtn: { background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: '#a0aec0', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' },
  adminModalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 12, 32, 0.96)', backdropFilter: 'blur(10px)', zIndex: 2000, overflowY: 'auto', padding: '30px 0' },
  adminModalContent: { maxWidth: '600px', margin: '0 auto', width: '90%' },
  logoutModalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 12, 32, 0.7)', backdropFilter: 'blur(5px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  logoutModalContent: { background: '#15102a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '20px', width: '85%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' },
  logoutModalTitle: { fontFamily: "'Fredoka', sans-serif", margin: '0 0 10px 0', color: '#ff007f', fontSize: '1.2rem', fontWeight: 400 },
  logoutModalUser: { fontSize: '0.9rem', color: '#cbd5e0', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  adminInlineBadge: { background: 'rgba(49, 130, 206, 0.2)', color: '#63b3ed', border: '1px solid rgba(49, 130, 206, 0.4)', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '6px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.03em' },
  adminMenuBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", background: 'rgba(49, 130, 206, 0.15)', border: '1px solid #3182ce', color: '#63b3ed', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: '0.2s' },
  confirmLogoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", background: '#e53e3e', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' },
  cancelLogoutBtn: { fontFamily: "'Outfit', sans-serif", background: 'transparent', color: '#a0aec0', border: 'none', padding: '8px', cursor: 'pointer', fontSize: '0.85rem' },
};

export default App;