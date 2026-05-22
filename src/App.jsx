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
import { ThemeProvider, useTheme } from './ThemeContext.jsx';

import {
  Mic, Star, User, LogOut, Sparkles, BarChart3,
  Trophy, X, HelpCircle, Grid3x3, Settings, Baby
} from 'lucide-react';

// ── Inner app (has access to ThemeContext) ────────────────────────────────────
function AppInner() {
  const { theme, toggle } = useTheme();

  const [firebaseUser, setFirebaseUser]                 = useState(null);
  const [appUser, setAppUser]                           = useState(null);
  const [loading, setLoading]                           = useState(true);
  const [viewAdmin, setViewAdmin]                       = useState(false);
  const [activeTab, setActiveTab]                       = useState('pronos');
  const [showLogoutModal, setShowLogoutModal]           = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showRulesModal, setShowRulesModal]             = useState(false);
  const [isReady, setIsReady]                           = useState(false);

  const ADMIN_NAME = "Kevin";
  const isAdmin    = appUser && appUser.displayName === ADMIN_NAME;
  const isJunior   = theme.id === 'junior';

  // If user was on Bingo and switches to Junior, bounce to pronos
  useEffect(() => {
    if (isJunior && activeTab === 'bingo') setActiveTab('pronos');
  }, [isJunior]);

  // Track global Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser ?? null);
      if (currentUser) {
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
              setAppUser({ uid: currentUser.uid, displayName: currentUser.displayName });
            }
          } catch (e) {
            console.error("Erreur récupération profil:", e);
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
    try { clearStoredSession(); await signOut(auth); }
    catch (err) { console.error("Erreur de déconnexion", err); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh', background: theme.bgApp, color: '#fff', fontFamily: theme.fontBody }}>
        Entrée dans l'arène...
      </div>
    );
  }

  if (!firebaseUser || !appUser) return <Login onSessionRestored={handleSessionRestored} />;

  const handleOpenLogoutModal = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isReady) return;
    setShowLogoutModal(true);
  };

  // ── Derived styles (theme-aware) ──
  const t = theme; // shorthand

  const tabStyle = (key) => ({
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '10px 4px',
    background: activeTab === key ? t.accent : 'rgba(255,255,255,0.05)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    fontFamily: t.fontBody,
    fontSize: '0.85rem',
    transition: 'background 0.2s',
    ...(activeTab === key ? { boxShadow: t.tabShadow } : {}),
  });

  return (
    <div style={{ minHeight: '100vh', background: t.bgApp, color: t.textPrimary, fontFamily: t.fontBody, position: 'relative' }}>

      {/* ── HEADER ── */}
      <header style={{ ...styles.header, background: t.bgHeader }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <Mic size={18} color={t.logoColor} style={{ flexShrink: 0 }} />
          <span style={{ ...styles.logo, color: t.logoColor, fontFamily: t.fontDisplay }}>
            ESC 2026 {isJunior ? 'Junior' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Rules */}
          <button onClick={() => setShowRulesModal(true)} style={{ ...styles.iconBtn, border: `1px solid ${t.accentBorder}`, background: t.accentSoft }}>
            <HelpCircle size={14} color={t.accent} style={{ flexShrink: 0 }} />
          </button>

          {/* Profile */}
          <button
            onClick={handleOpenLogoutModal}
            disabled={!isReady}
            style={{
              ...styles.iconBtn,
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${t.border}`,
              pointerEvents: isReady ? 'auto' : 'none',
              opacity: isReady ? 1 : 0.8,
              maxWidth: '130px',
            }}
          >
            <User size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: 500 }}>
              {appUser.displayName || 'Joueur'}
            </span>
          </button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={styles.main}>
        <div style={styles.tabContainer}>
          <button onClick={() => setActiveTab('pronos')} style={tabStyle('pronos')}>
            <Sparkles size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Mes pronos
          </button>
          <button onClick={() => setActiveTab('classement')} style={tabStyle('classement')}>
            <BarChart3 size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Mon choix
          </button>
          {!isJunior && (
            <button onClick={() => setActiveTab('bingo')} style={tabStyle('bingo')}>
              <Grid3x3 size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Bingo
            </button>
          )}
        </div>

        {activeTab === 'pronos'     && appUser.uid && <PredictionForm user={appUser} onOpenLeaderboard={() => setShowLeaderboardModal(true)} />}
        {activeTab === 'classement' && appUser.uid && <PersonalRank   user={appUser} onOpenLeaderboard={() => setShowLeaderboardModal(true)} />}
        {activeTab === 'bingo'      && appUser.uid && !isJunior && <BingoGrid user={appUser} onOpenLeaderboard={() => setShowLeaderboardModal(true)} />}
      </main>

      {/* ── Admin modal ── */}
      {isAdmin && viewAdmin && (
        <div style={styles.adminModalOverlay}>
          <div style={styles.adminModalContent}>
            <AdminPanel onBack={() => setViewAdmin(false)} />
          </div>
        </div>
      )}

      {/* ── Leaderboard modal ── */}
      {showLeaderboardModal && (
        <div style={styles.modalOverlay} onClick={() => setShowLeaderboardModal(false)}>
          <div style={{ ...styles.modalContent, background: t.bgModal }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={20} color="#ffd700" />
                <h3 style={{ ...styles.modalTitle, fontFamily: t.fontDisplay }}>Classement Général</h3>
              </div>
              <button style={styles.closeModalBtn} onClick={() => setShowLeaderboardModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={styles.modalScroll}><Leaderboard /></div>
          </div>
        </div>
      )}

      {/* ── Rules modal ── */}
      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />

      {/* ── Account / logout modal ── */}
      {showLogoutModal && (
        <div style={styles.modalOverlay} onClick={() => setShowLogoutModal(false)}>
          <div style={{ ...styles.logoutContent, background: t.bgModal }} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ ...styles.logoutTitle, color: t.accent, fontFamily: t.fontDisplay }}>Mon Compte</h4>
            <p style={styles.logoutUser}>
              Connecté en tant que <strong>{appUser.displayName || 'Joueur'}</strong>
            </p>

            {/* TOGGLE JUNIOR OPTION */}
            <div style={styles.toggleRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Baby size={16} color={isJunior ? '#f9a825' : '#cbd5e0'} />
                <span style={{ fontSize: '0.9rem', color: '#cbd5e0' }}>Mode Junior</span>
              </div>
              <button 
                onClick={toggle}
                style={{
                  ...styles.switchTrack,
                  backgroundColor: isJunior ? '#f9a825' : 'rgba(255, 255, 255, 0.15)'
                }}
                aria-label="Basculer mode Junior"
              >
                <div style={{
                  ...styles.switchThumb,
                  transform: isJunior ? 'translateX(20px)' : 'translateX(0px)'
                }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {isAdmin && (
                <button onClick={() => { setShowLogoutModal(false); setViewAdmin(true); }} style={styles.adminMenuBtn}>
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

// ── Root with provider ────────────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

// ── Static styles (layout only — no colors) ───────────────────────────────────
const styles = {
  juniorBanner: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', padding: '5px 16px',
    background: 'rgba(249,168,37,0.06)',
    borderBottom: '1px solid rgba(249,168,37,0.12)',
    flexWrap: 'wrap',
  },
  header: {
    position: 'sticky', top: 0, zIndex: 1000,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    boxSizing: 'border-box',
  },
  logo: { fontSize: '1.1rem', fontWeight: 500, letterSpacing: '0.05em' },
  iconBtn: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '6px 10px', borderRadius: '20px',
    cursor: 'pointer', color: '#fff',
    fontFamily: "'Outfit', sans-serif",
    transition: 'background 0.2s, border-color 0.2s',
  },
  main: { padding: '20px', maxWidth: '600px', margin: '0 auto', paddingTop: '10px' },
  tabContainer: { display: 'flex', gap: '8px', marginBottom: '20px' },
  // Modals
  modalOverlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(15,12,32,0.85)', backdropFilter: 'blur(8px)',
    zIndex: 2500, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px',
  },
  modalContent: {
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
    padding: '20px', width: '100%', maxWidth: '500px', maxHeight: '85vh',
    display: 'flex', flexDirection: 'column', boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px',
  },
  modalTitle: { margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: 500 },
  modalScroll: { overflowY: 'auto', flex: 1, paddingRight: '4px' },
  closeModalBtn: {
    background: 'rgba(255,255,255,0.05)', border: 'none', color: '#a0aec0',
    width: '30px', height: '30px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  adminModalOverlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(15,12,32,0.96)', backdropFilter: 'blur(10px)',
    zIndex: 2000, overflowY: 'auto', padding: '30px 0',
  },
  adminModalContent: { maxWidth: '1200px', margin: '0 auto', width: '90%' },
  logoutContent: {
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
    padding: '20px', width: '85%', maxWidth: '320px',
    textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
  },
  logoutTitle: { margin: '0 0 10px', fontSize: '1.2rem', fontWeight: 400 },
  logoutUser: { fontSize: '0.9rem', color: '#cbd5e0', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  
  // Custom Switch / Toggle Button Styles
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    marginBottom: '14px'
  },
  switchTrack: {
    position: 'relative',
    width: '44px',
    height: '24px',
    borderRadius: '15px',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
  },
  switchThumb: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s ease',
  },

  adminBadge: { background: 'rgba(49,130,206,0.2)', color: '#63b3ed', border: '1px solid rgba(49,130,206,0.4)', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '6px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.03em' },
  adminMenuBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", background: 'rgba(49,130,206,0.15)', border: '1px solid #3182ce', color: '#63b3ed', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' },
  confirmLogoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", background: '#e53e3e', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' },
  cancelLogoutBtn: { fontFamily: "'Outfit', sans-serif", background: 'transparent', color: '#a0aec0', border: 'none', padding: '8px', cursor: 'pointer', fontSize: '0.85rem' },
};

export default App;