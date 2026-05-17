import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import PredictionForm from './components/PredictionForm';
import Leaderboard from './components/Leaderboard';

// 1. IMPORTE LE NOUVEAU COMPOSANT PERSO
import PersonalRank from './components/PersonalRank';

// Import des icônes Lucide
import { Mic, User, LogOut, Sparkles, BarChart3, Settings, Heart } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewAdmin, setViewAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('pronos');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // État de protection contre les clics fantômes / focus résiduels
  const [isReady, setIsReady] = useState(false);

  const ADMIN_NAME = "Kevin"; 
  const isAdmin = user && user.displayName === ADMIN_NAME;

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

  // 🛡️ BOUCLIER ANTI-CLIC FANTÔME : 
  // On attend 600ms APRÈS que l'utilisateur soit connecté pour activer le bouton profil
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
    e.preventDefault(); // Bloque l'action par défaut
    e.stopPropagation(); // Évite la propagation du clic
    if (!isReady) return; 
    setShowLogoutModal(true);
  };

  return (
    <div style={styles.dashboardContainer}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <Mic size={18} color="#ff007f" style={{ flexShrink: 0 }} />
          <span style={styles.logo}>ESC 2026</span>
          {isAdmin && <span style={styles.adminBadge}>ADMIN</span>}
        </div>

        {/* Bouton Profil protégé par pointerEvents et disabled */}
        <button 
          onClick={handleOpenLogoutModal} 
          disabled={!isReady}
          style={{
            ...styles.profileBtn,
            pointerEvents: isReady ? 'auto' : 'none', // Rend le bouton intouchable par le navigateur au chargement
            opacity: isReady ? 1 : 0.8
          }}
        >
          <User size={14} style={{ flexShrink: 0 }} />
          <span style={styles.profileBtnText}>{user.displayName || "Joueur"}</span>
        </button>
      </header>

      <main style={styles.main}>
        {/* Navigation par onglets */}
        <div style={styles.tabContainer}>
          <button 
            onClick={() => setActiveTab('pronos')} 
            style={activeTab === 'pronos' ? styles.tabActive : styles.tab}
          >
            <Sparkles size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Pronos
          </button>
          
          <button 
            onClick={() => setActiveTab('topPerso')} 
            style={activeTab === 'topPerso' ? styles.tabActive : styles.tab}
          >
            <Heart size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Mon Top
          </button>

          <button 
            onClick={() => setActiveTab('leaderboard')} 
            style={activeTab === 'leaderboard' ? styles.tabActive : styles.tab}
          >
            <BarChart3 size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Classement
          </button>
        </div>

        {/* Bouton d'accès admin rapide */}
        {isAdmin && (
          <button onClick={() => setViewAdmin(true)} style={styles.adminQuickBtn}>
            <Settings size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Ouvrir la console d'administration
          </button>
        )}

        {/* AFFICHAGE CONDITIONNEL DES ONGLETS */}
        {activeTab === 'pronos' && user.uid && (
          <PredictionForm user={user} />
        )}
        
        {activeTab === 'topPerso' && user.uid && (
          <PersonalRank user={user} />
        )}
        
        {activeTab === 'leaderboard' && (
          <Leaderboard />
        )}
      </main>

      {/* MODALE SUPERPOSÉE POUR L'ADMINISTRATION */}
      {isAdmin && viewAdmin && (
        <div style={styles.adminModalOverlay}>
          <div style={styles.adminModalContent}>
            <AdminPanel onBack={() => setViewAdmin(false)} />
          </div>
        </div>
      )}

      {/* MODALE DE DÉCONNEXION COMPACTE */}
      {showLogoutModal && (
        <div style={styles.logoutModalOverlay} onClick={() => setShowLogoutModal(false)}>
          <div style={styles.logoutModalContent} onClick={(e) => e.stopPropagation()}>
            <h4 style={styles.logoutModalTitle}>Mon Compte</h4>
            <p style={styles.logoutModalUser}>Connecté en tant que <strong>{user.displayName || "Joueur"}</strong></p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
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
  dashboardContainer: { minHeight: '100vh', background: '#0f0c20', color: '#fff', fontFamily: "'Outfit', sans-serif" },
  header: { position: 'sticky', top: 0, zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(15, 12, 32, 0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', boxSizing: 'border-box' },
  logo: { fontFamily: "'Fredoka', sans-serif", fontSize: '1.1rem', fontWeight: 500, letterSpacing: '0.05em', color: '#ff007f' },
  adminBadge: { fontFamily: "'Fredoka', sans-serif", letterSpacing: '0.05em', background: '#ff007f', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 500, flexShrink: 0 },
  profileBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', fontWeight: 500, maxWidth: '140px', transition: '0.2s' },
  profileBtnText: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  main: { padding: '20px', maxWidth: '600px', margin: '0 auto', paddingTop: '10px' },
  tabContainer: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', transition: '0.2s' },
  tabActive: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', background: '#ff007f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', boxShadow: '0 0 15px rgba(255,0,127,0.4)' },
  adminQuickBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', marginBottom: '20px', background: 'rgba(49, 130, 206, 0.15)', border: '1px solid #3182ce', color: '#63b3ed', borderRadius: '8px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: '0.95rem' },
  adminModalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 12, 32, 0.96)', backdropFilter: 'blur(10px)', zIndex: 2000, overflowY: 'auto', padding: '30px 0' },
  adminModalContent: { maxWidth: '600px', margin: '0 auto', width: '90%' },
  logoutModalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 12, 32, 0.7)', backdropFilter: 'blur(5px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  logoutModalContent: { background: '#15102a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '20px', width: '85%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' },
  logoutModalTitle: { fontFamily: "'Fredoka', sans-serif", margin: '0 0 10px 0', color: '#ff007f', fontSize: '1.2rem', fontWeight: 400 },
  logoutModalUser: { fontSize: '0.9rem', color: '#cbd5e0', margin: 0 },
  confirmLogoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", background: '#e53e3e', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' },
  cancelLogoutBtn: { fontFamily: "'Outfit', sans-serif", background: 'transparent', color: '#a0aec0', border: 'none', padding: '8px', cursor: 'pointer', fontSize: '0.85rem' }
};

export default App;