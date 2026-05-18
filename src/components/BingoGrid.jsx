import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Shuffle, Lock, CheckCircle2, Star, Trophy, Sparkles } from 'lucide-react';
import { BINGO_ITEMS } from '../data/bingoItems';

const BingoGrid = ({ user, onOpenLeaderboard }) => {
  const [grid, setGrid] = useState(null);           // array of 9 item objects
  const [isLocked, setIsLocked] = useState(false);
  const [validatedMap, setValidatedMap] = useState({}); // { itemId: count }
  const [completedAt, setCompletedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [winnerName, setWinnerName] = useState(null);

  // ─── Load user grid + listen to global bingo state ───────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    
    let unsubBingo = null;

    const init = async () => {
      try {
        // Load user's grid doc
        const gridSnap = await getDoc(doc(db, 'bingo_grids', user.uid));
        if (gridSnap.exists()) {
          const data = gridSnap.data();
          
          if (data.grid && Array.isArray(data.grid)) {
            setGrid(data.grid.map(id => BINGO_ITEMS.find(i => i.id === id)).filter(Boolean));
          }
          setIsLocked(data.locked || false);
          setCompletedAt(data.completedAt || null);
        }

        // Listen to global validated items in real-time
        unsubBingo = onSnapshot(doc(db, 'bingo_state', 'global'), (snap) => {
          if (snap.exists()) {
            setValidatedMap(snap.data().validated || {});
          }
        });
      } catch (error) {
        console.error("Erreur lors de la récupération du Bingo :", error);
      } finally {
        setLoading(false);
      }
    };

    init();
    return () => { if (unsubBingo) unsubBingo(); };
  }, [user?.uid]);

  // ─── Auto-detect bingo completion ────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid || !grid || !isLocked || completedAt) return;

    const allValidated = grid.every(item => (validatedMap[item.id] || 0) >= 1);
    if (allValidated) {
      const now = new Date();
      setDoc(doc(db, 'bingo_grids', user.uid), { completedAt: now }, { merge: true });
      setCompletedAt(now);
      setJustWon(true);
      setTimeout(() => setJustWon(false), 4000);
    }
  }, [validatedMap, grid, isLocked, completedAt, user?.uid]);

  // ─── Generate a random grid ───────────────────────────────────────────────
  const generateGrid = useCallback(() => {
    const shuffled = [...BINGO_ITEMS].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 9);
    setGrid(picked);
    setIsLocked(false);
    setCompletedAt(null);
  }, []);

  // ─── Lock the grid ────────────────────────────────────────────────────────
  const handleLock = async () => {
    if (!user?.uid || !grid || saving) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'bingo_grids', user.uid), {
        grid: grid.map(i => i.id),
        locked: true,
        completedAt: null,
        displayName: user.displayName || 'Anonyme',
        updatedAt: new Date()
      });
      setIsLocked(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const matchCount = grid ? grid.filter(item => (validatedMap[item.id] || 0) >= 1).length : 0;
  const totalHits = grid ? grid.reduce((sum, item) => sum + (validatedMap[item.id] || 0), 0) : 0;

  if (!user) {
    return <div style={styles.loadingText}>Connexion en cours...</div>;
  }

  if (loading) {
    return <div style={styles.loadingText}>Préparation de ta carte...</div>;
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
        @keyframes winPulse { 0%,100% { box-shadow: 0 0 20px rgba(255,215,0,0.4); } 50% { box-shadow: 0 0 60px rgba(255,215,0,0.9), 0 0 100px rgba(255,215,0,0.4); } }
        .bingo-cell-hit { animation: pop 0.4s ease; }
      `}</style>

      {/* ── BINGO WIN BANNER ── */}
      {completedAt && (
        <div style={{
          ...styles.winBanner,
          animation: justWon ? 'winPulse 1s ease infinite' : 'none'
        }}>
          <Trophy size={20} color="#ffd700" />
          <span>BINGO ! Tu as complété ta carte ! 🎉</span>
          <Trophy size={20} color="#ffd700" />
        </div>
      )}

      {/* ── HEADER INFO ── */}
      <div style={styles.headerRow}>
        <div style={styles.scoreChip}>
          <CheckCircle2 size={14} color="#48bb78" />
          <span style={{ color: '#48bb78', fontWeight: 600 }}>{matchCount}/9</span>
          <span style={{ color: '#718096', fontSize: '0.75rem' }}>cases</span>
        </div>
        <div style={styles.scoreChip}>
          <Star size={14} color="#f6ad55" />
          <span style={{ color: '#f6ad55', fontWeight: 600 }}>{totalHits}</span>
          <span style={{ color: '#718096', fontSize: '0.75rem' }}>occurrences</span>
        </div>
        {isLocked && (
          <div style={styles.lockedChip}>
            <Lock size={12} />
            Grille verrouillée
          </div>
        )}
      </div>

      {/* ── GRID ── */}
      {grid ? (
        <div style={styles.grid}>
          {grid.map((item, idx) => {
            const hitCount = validatedMap[item.id] || 0;
            const isHit = hitCount >= 1;
            return (
              <div
                key={item.id}
                className={isHit ? 'bingo-cell-hit' : ''}
                style={{
                  ...styles.cell,
                  background: isHit
                    ? 'linear-gradient(135deg, rgba(255,0,127,0.25), rgba(255,0,127,0.1))'
                    : 'rgba(255,255,255,0.03)',
                  borderColor: isHit ? '#ff007f' : 'rgba(255,255,255,0.08)',
                  boxShadow: isHit ? '0 0 12px rgba(255,0,127,0.3), inset 0 0 20px rgba(255,0,127,0.05)' : 'none',
                }}
              >
                <span style={styles.cellEmoji}>{item.emoji}</span>
                <span style={{
                  ...styles.cellLabel,
                  color: isHit ? '#fff' : '#a0aec0',
                  fontWeight: isHit ? 600 : 400,
                }}>
                  {item.label}
                </span>
                {hitCount > 1 && (
                  <span style={styles.hitBadge}>×{hitCount}</span>
                )}
                {isHit && (
                  <div style={styles.checkOverlay}>
                    <CheckCircle2 size={16} color="#ff007f" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <Sparkles size={40} color="#ff007f" style={{ opacity: 0.5 }} />
          <p style={styles.emptyText}>Tu n'as pas encore de grille.</p>
          <p style={styles.emptySubText}>Génère-en une depuis la zone d'action ci-dessous !</p>
        </div>
      )}

      {/* ── INFO CARD ── */}
      <div style={styles.infoCard}>
        {isLocked ? (
          <p style={styles.infoText}>
            <Lock size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Ta grille est verrouillée. Les cases se colorent automatiquement quand l'admin valide un événement en direct !
          </p>
        ) : (
          <p style={styles.infoText}>
            <Shuffle size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Génère autant de grilles que tu veux. Quand tu es satisfait(e), verrouille-la — impossible de revenir en arrière !
          </p>
        )}
      </div>

      {/* 👑 ZONE ACTIONS FLOTTANTE EN BAS (BOUTONS CÔTE À CÔTE) */}
      <div style={styles.actionZone}>
        <div style={styles.btnGroup}>
          
          {/* 1. Groupe Principal Fléchier / Validation (À gauche) */}
          {!isLocked ? (
            <>
              <button onClick={generateGrid} style={styles.shuffleBtn}>
                <Shuffle size={16} />
                {grid ? 'Regénérer' : 'Générer la grille'}
              </button>
              {grid && (
                <button onClick={handleLock} disabled={saving} style={styles.lockBtn}>
                  <Lock size={16} />
                  {saving ? 'Verrouillage...' : 'Verrouiller'}
                </button>
              )}
            </>
          ) : (
            <div style={styles.lockedNotice}>
              <Lock size={16} style={{ marginRight: '8px' }} />
              <span>Grille active & verrouillée</span>
            </div>
          )}

          {/* 2. Bouton Leaderboard (À droite) */}
          <button 
            type="button"
            onClick={onOpenLeaderboard} 
            style={styles.leaderboardBtn}
            title="Classement Général"
          >
            <Trophy size={20} color="#ffd700" />
          </button>
          
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { paddingBottom: '140px', fontFamily: "'Outfit', sans-serif" },
  loadingText: { textAlign: 'center', color: '#a0aec0', padding: '40px', fontFamily: "'Outfit', sans-serif" },

  winBanner: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.1))',
    border: '1px solid rgba(255,215,0,0.5)',
    borderRadius: '12px', padding: '14px', marginBottom: '16px',
    color: '#ffd700', fontWeight: 700, fontSize: '1rem', fontFamily: "'Fredoka', sans-serif",
    letterSpacing: '0.03em'
  },

  headerRow: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' },
  scoreChip: {
    display: 'flex', alignItems: 'center', gap: '5px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px', padding: '5px 10px', fontSize: '0.85rem',
    fontFamily: "'Outfit', sans-serif"
  },
  lockedChip: {
    display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto',
    background: 'rgba(246,173,85,0.1)', border: '1px solid rgba(246,173,85,0.3)',
    color: '#f6ad55', borderRadius: '20px', padding: '5px 10px',
    fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif"
  },

  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
    marginBottom: '16px'
  },
  cell: {
    position: 'relative', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '5px',
    padding: '10px 6px', borderRadius: '12px', border: '1px solid',
    minHeight: '90px', textAlign: 'center', transition: 'all 0.3s ease',
    cursor: 'default', boxSizing: 'border-box'
  },
  cellEmoji: { fontSize: '1.4rem', lineHeight: 1 },
  cellLabel: {
    fontSize: '0.7rem', lineHeight: '1.2',
    fontFamily: "'Outfit', sans-serif", transition: 'color 0.3s ease'
  },
  hitBadge: {
    position: 'absolute', top: '4px', right: '6px',
    fontSize: '0.65rem', fontWeight: 700, color: '#ff007f',
    background: 'rgba(255,0,127,0.15)', borderRadius: '8px', padding: '1px 4px'
  },
  checkOverlay: {
    position: 'absolute', top: '4px', left: '6px'
  },

  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '8px', padding: '50px 20px', background: 'rgba(255,255,255,0.02)',
    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', marginBottom: '16px',
    textAlign: 'center'
  },
  emptyText: { margin: 0, color: '#cbd5e0', fontWeight: 500 },
  emptySubText: { margin: 0, color: '#718096', fontSize: '0.85rem' },

  infoCard: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px', padding: '12px 14px'
  },
  infoText: {
    margin: 0, fontSize: '0.8rem', color: '#718096', lineHeight: '1.4',
    fontFamily: "'Outfit', sans-serif"
  },

  actionZone: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '1126px',
    background: 'rgba(22, 23, 29, 0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    padding: '16px 20px',
    paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    boxSizing: 'border-box',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    zIndex: 100,
    boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column'
  },
  btnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%'
  },
  shuffleBtn: {
    flex: 1, height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#fff', padding: '14px', borderRadius: '10px', cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: '0.95rem', boxSizing: 'border-box'
  },
  lockBtn: {
    flex: 1, height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: '#ff007f', border: 'none',
    color: '#fff', padding: '14px', borderRadius: '10px', cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.95rem',
    boxShadow: '0 0 15px rgba(255,0,127,0.3)', boxSizing: 'border-box'
  },
  lockedNotice: { 
    flex: 1, height: '50px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', background: 'rgba(255, 255, 255, 0.05)', color: '#718096', 
    border: 'none', padding: '14px', borderRadius: '10px', textAlign: 'center', 
    fontWeight: 600, fontSize: '1rem', fontFamily: "'Outfit', sans-serif" 
  },
  leaderboardBtn: { 
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', 
    width: '50px', height: '50px', background: 'rgba(255, 255, 255, 0.04)', 
    border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '10px', 
    cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box' 
  }
};

export default BingoGrid;