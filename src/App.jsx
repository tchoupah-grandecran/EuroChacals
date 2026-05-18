import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import PredictionForm from './components/PredictionForm';
import Leaderboard from './components/Leaderboard';
import BingoGrid from './components/BingoGrid';
import PersonalRank from './components/PersonalRank';
import RulesModal from './components/RulesModal';

// Import des icônes Lucide
import { Mic, User, LogOut, Sparkles, BarChart3, Settings, Trophy, X, HelpCircle, Grid3x3 } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setViewAdmin] = useState(false); 
  const [viewAdmin, setViewAdminState] = useState(false); 
  const [activeTab, setActiveTab] = useState('pronos');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  
  // État de protection contre les clics fantômes / focus résiduels
  const [isReady, setIsReady] = useState(false);

  const ADMIN_NAME = "Kevin"; 
  const isAdmin = user && user.displayName === ADMIN_NAME;

  const toggleAdminView = (val) => {
    setViewAdminState(val);
    if(typeof setViewAdmin === 'function') setViewAdmin(val);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (!currentUser.displayName) {
          let attempts = 0;
          let freshUser = currentUser;
          
          while (!freshUser.displayName && attempts < 5) {
            await freshUser.reload();
            freshUser = auth.currentUser;
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
          }
          setUser(freshUser);
        } else {
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      
      setShowLogoutModal(false);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => setIsReady(true), 600);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh', background: '#0f0c20', color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
        Entrée dans l'arène...
      </div>
    );
  }

  if (!user) return <Login />;

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
          .rules-btn-text {
            display: none !important;
          }
        }
      `}</style>

      {/* HEADER ÉPURÉ (Plus de badge admin) */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <Mic size={18} color="#ff007f" style={{ flexShrink: 0 }} />
          <span style={styles.logo}>ESC 2026</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Bouton Règles */}
          <button 
            onClick={() => setShowRulesModal(true)} 
            style={styles.rulesBtn}
            title="Règles de calcul"
          >
            <HelpCircle size={14} color="#ff007f" style={{ flexShrink: 0 }} />
            <span className="rules-btn-text" style={styles.rulesBtnText}>Règles</span>
          </button>

          {/* Bouton Profil */}
          <button 
            onClick={handleOpenLogoutModal} 
            disabled={!isReady}
            style={{
              ...styles.profileBtn,
              pointerEvents: isReady ? 'auto' : 'none', 
              opacity: isReady ? 1 : 0.8
            }}
          >
            <User size={14} style={{ flexShrink: 0 }} />
            <span style={styles.profileBtnText}>{user.displayName || "Joueur"}</span>
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Navigation par onglets */}
        <div style={styles.tabContainer}>
          <button 
            onClick={() => setActiveTab('pronos')} 
            style={activeTab === 'pronos' ? styles.tabActive : styles.tab}
          >
            <Sparkles size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Mes pronos
          </button>
          
          <button 
            onClick={() => setActiveTab('classement')} 
            style={activeTab === 'classement' ? styles.tabActive : styles.tab}
          >
            <BarChart3 size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Mon choix
          </button>

          <button 
            onClick={() => setActiveTab('bingo')} 
            style={activeTab === 'bingo' ? styles.tabActive : styles.tab}
          >
            <Grid3x3 size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Bingo
          </button>
        </div>

        {/* Le gros bouton admin a été retiré d'ici pour désencombrer l'écran principal */}

        {/* AFFICHAGE CONDITIONNEL DES ONGLETS */}
        {activeTab === 'pronos' && user.uid && (
          <PredictionForm user={user} onOpenLeaderboard={() => setShowLeaderboardModal(true)} />
        )}
        
        {activeTab === 'classement' && user.uid && (
          <PersonalRank user={user} onOpenLeaderboard={() => setShowLeaderboardModal(true)} />
        )}

        {activeTab === 'bingo' && user.uid && (
          <BingoGrid user={user} onOpenLeaderboard={() => setShowLeaderboardModal(true)} />
        )}
      </main>

      {/* MODALE SUPERPOSÉE POUR L'ADMINISTRATION */}
      {isAdmin && viewAdmin && (
        <div style={styles.adminModalOverlay}>
          <div style={styles.adminModalContent}>
            <AdminPanel onBack={() => toggleAdminView(false)} />
          </div>
        </div>
      )}

      {/* 👑 MODALE DU LEADERBOARD */}
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

      {/* 🔮 MODALE DES RÈGLES */}
      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />

      {/* MODALE DE COMPTE MODIFIÉE POUR KEVIN */}
      {showLogoutModal && (
        <div style={styles.logoutModalOverlay} onClick={() => setShowLogoutModal(false)}>
          <div style={styles.logoutModalContent} onClick={(e) => e.stopPropagation()}>
            <h4 style={styles.logoutModalTitle}>Mon Compte</h4>
            <p style={styles.logoutModalUser}>
              Connecté en tant que <strong>{user.displayName || "Joueur"}</strong>
              {isAdmin && <span style={styles.adminInlineBadge}>Admin</span>}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              
              {/* BOUTON ADMIN INSÉRÉ ICI UNIQUEMENT POUR L'ADMIN */}
              {isAdmin && (
                <button 
                  onClick={() => {
                    setShowLogoutModal(false); // Ferme d'abord le menu profil
                    toggleAdminView(true);     // Ouvre le panel admin
                  }} 
                  style={styles.adminMenuBtn}
                >
                  <Settings size={16} style={{ marginRight: '8px' }} /> Console Admin
                </button>
              )}

              <button onClick={() => signOut(auth)} style={styles.confirmLogoutBtn}>
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
  
  // Nouveaux styles discrets dédiés à l'admin
  adminInlineBadge: { background: 'rgba(49, 130, 206, 0.2)', color: '#63b3ed', border: '1px solid rgba(49, 130, 206, 0.4)', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '6px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.03em' },
  adminMenuBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", background: 'rgba(49, 130, 206, 0.15)', border: '1px solid #3182ce', color: '#63b3ed', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: '0.2s' },
  
  confirmLogoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", background: '#e53e3e', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' },
  cancelLogoutBtn: { fontFamily: "'Outfit', sans-serif", background: 'transparent', color: '#a0aec0', border: 'none', padding: '8px', cursor: 'pointer', fontSize: '0.85rem' }
};

export default App;