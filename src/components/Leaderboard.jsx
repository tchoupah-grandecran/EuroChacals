import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, getDoc, doc, getDocs } from 'firebase/firestore';
import ScoreModal from './ScoreModal';
import { BINGO_ITEMS } from '../data/bingoItems';

// 📊 Import des icônes Lucide
import { BarChart3, Trophy, Medal, User, Zap, RefreshCw } from 'lucide-react';

const Leaderboard = () => {
  // Navigation interne du Leaderboard
  const [activeSubTab, setActiveSubTab] = useState('pronos'); // 'pronos' ou 'bingo'

  // État commun / Pronos
  const [rankings, setRankings] = useState([]);
  const [loadingPronos, setLoadingPronos] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [liveResults, setLiveResults] = useState(null);

  // État Bingo
  const [grids, setGrids] = useState([]); 
  const [validated, setValidated] = useState({});
  const [loadingBingo, setLoadingBingo] = useState(true);

  // ─── EFFECTS PRONOS ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchOfficialResults = async () => {
      try {
        const snap = await getDoc(doc(db, 'results', 'officialRawScores'));
        if (snap.exists()) {
          setLiveResults(snap.data());
        }
      } catch (error) {
        console.error("Erreur chargement résultats officiels:", error);
      }
    };
    fetchOfficialResults();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const playersList = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setRankings(playersList);
      setLoadingPronos(false);
    }, (error) => {
      console.error("Erreur écoute leaderboard:", error);
      setLoadingPronos(false);
    });
    return () => unsubscribe();
  }, []);

  // ─── EFFECTS BINGO ───────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'bingo_state', 'global'), (snap) => {
      setValidated(snap.exists() ? (snap.data().validated || {}) : {});
    });
    return () => unsub();
  }, []);

  const loadBingoGrids = async () => {
    setLoadingBingo(true);
    try {
      const snap = await getDocs(collection(db, 'bingo_grids'));
      const data = snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(g => g.locked); 
      setGrids(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBingo(false);
    }
  };

  useEffect(() => { 
    loadBingoGrids(); 
  }, []);

  // ─── CALCULS BINGO ───────────────────────────────────────────────────
  const computeBingoStats = () => {
    return grids.map(g => {
      const matchCount = (g.grid || []).filter(id => (validated[id] || 0) >= 1).length;
      const totalHits = (g.grid || []).reduce((sum, id) => sum + (validated[id] || 0), 0);
      const hasBingo = matchCount === (g.grid || []).length && (g.grid || []).length === 9;
      return {
        uid: g.uid,
        displayName: g.displayName || 'Anonyme',
        matchCount,
        totalHits,
        hasBingo,
        completedAt: g.completedAt ? (g.completedAt.toDate ? g.completedAt.toDate() : new Date(g.completedAt)) : null,
      };
    });
  };

  const bingoStats = computeBingoStats();

  const bingoWinners = bingoStats
    .filter(s => s.hasBingo && s.completedAt)
    .sort((a, b) => a.completedAt - b.completedAt);

  const bingoOccurrenceRanking = [...bingoStats]
    .sort((a, b) => b.totalHits !== a.totalHits ? b.totalHits - a.totalHits : b.matchCount - a.matchCount);

  const topBingoItems = BINGO_ITEMS
    .map(item => ({ ...item, count: validated[item.id] || 0 }))
    .filter(i => i.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ─── OUTILS RENDER ───────────────────────────────────────────────────
  const renderRankIcon = (index) => {
    switch (index) {
      case 0: return <Trophy size={18} color="#ffd700" style={styles.iconGlow} />;
      case 1: return <Medal size={18} color="#c0c0c0" />;
      case 2: return <Medal size={18} color="#cd7f32" />;
      default: return <User size={16} color="#a0aec0" />;
    }
  };

  const formatTime = (date) => {
    if (!date) return '—';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={styles.container}>
      {/* Sélecteur de sous-onglets internes */}
      <div style={styles.subTabContainer}>
        <button 
          onClick={() => setActiveSubTab('pronos')} 
          style={activeSubTab === 'pronos' ? styles.subTabActive : styles.subTab}
        >
          🔮 Pronostics
        </button>
        <button 
          onClick={() => setActiveSubTab('bingo')} 
          style={activeSubTab === 'bingo' ? styles.subTabActive : styles.subTab}
        >
          🎲 Bingo
        </button>
      </div>

      {/* ─── VUE 1 : CLASSEMENT PRONOSTICS ─── */}
      {activeSubTab === 'pronos' && (
        <div>
          <div style={styles.headerRow}>
            <h2 style={styles.title}>
              <BarChart3 size={20} color="#ff007f" style={{ marginRight: '8px' }} />
              Classement des chacaux
            </h2>
          </div>
          <p style={styles.subtitle}>Mis à jour selon les résultats officiels</p>

          {loadingPronos ? (
            <p style={styles.loadingText}>Calcul du classement en direct...</p>
          ) : (
            <div style={styles.list}>
              {rankings.length === 0 ? (
                <p style={styles.emptyText}>Aucun pronostic validé pour le moment.</p>
              ) : (
                rankings.map((player, index) => {
                  const isFirst = index === 0;
                  return (
                    <div 
                      key={player.id} 
                      onClick={() => setSelectedPlayer(player)}
                      style={{ ...(isFirst ? styles.rowWinner : styles.row), cursor: 'pointer' }}
                    >
                      <div style={styles.playerInfo}>
                        <div style={styles.rankIconContainer}>
                          {renderRankIcon(index)}
                        </div>
                        <span style={styles.name}>{player.displayName || "Anonyme"}</span>
                      </div>
                      <div style={styles.scoreBadge}>
                        {player.score} pts
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── VUE 2 : CLASSEMENTS BINGO ─── */}
      {activeSubTab === 'bingo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Section Premier Bingo */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Trophy size={16} color="#ffd700" />
              <h3 style={styles.sectionTitle}>Premier Bingo !</h3>
              <button onClick={loadBingoGrids} style={styles.refreshBtn}>
                <RefreshCw size={12} />
              </button>
            </div>

            {loadingBingo ? (
              <p style={styles.loadingText}>Vérification des grilles...</p>
            ) : bingoWinners.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={{ fontSize: '1.2rem' }}>⏳</span>
                <p style={styles.emptyText}>Personne n'a encore complété sa grille...</p>
              </div>
            ) : (
              <div style={styles.rankList}>
                {bingoWinners.map((player, idx) => (
                  <div key={player.uid} style={{
                    ...styles.rankRow,
                    background: idx === 0 ? 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(0,0,0,0.2))' : 'rgba(0,0,0,0.2)',
                    borderColor: idx === 0 ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ ...styles.rankPos, color: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#718096' }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <span style={styles.playerName}>{player.displayName}</span>
                    <span style={styles.timeStamp}>{formatTime(player.completedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section Occurrences */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Zap size={16} color="#f6ad55" />
              <h3 style={styles.sectionTitle}>Plus d'occurrences</h3>
            </div>
            <p style={styles.sectionDesc}>Classé par nombre total de coches cumulées sur la grille.</p>

            {loadingBingo ? (
              <p style={styles.loadingText}>Calcul des occurrences...</p>
            ) : bingoOccurrenceRanking.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={{ fontSize: '1.2rem' }}>🎲</span>
                <p style={styles.emptyText}>Aucune grille verrouillée pour l'instant.</p>
              </div>
            ) : (
              <div style={styles.rankList}>
                {bingoOccurrenceRanking.map((player, idx) => (
                  <div key={player.uid} style={{
                    ...styles.rankRow,
                    background: idx === 0 ? 'linear-gradient(135deg, rgba(246,173,85,0.1), rgba(0,0,0,0.2))' : 'rgba(0,0,0,0.2)',
                    borderColor: idx === 0 ? 'rgba(246,173,85,0.3)' : 'rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ ...styles.rankPos, color: idx === 0 ? '#f6ad55' : '#718096' }}>#{idx + 1}</span>
                    <div style={styles.playerInfoGrid}>
                      <span style={styles.playerName}>{player.displayName}</span>
                      <span style={styles.playerSub}>{player.matchCount}/9 cases cochées</span>
                    </div>
                    <div style={styles.scoreBox}>
                      <span style={styles.scoreValue}>{player.totalHits}</span>
                      <span style={styles.scoreLabel}>pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Événements de la soirée */}
          {topBingoItems.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={{ fontSize: '0.9rem' }}>🔥</span>
                <h3 style={styles.sectionTitle}>Top événements de la soirée</h3>
              </div>
              <div style={styles.topItemsList}>
                {topBingoItems.map((item) => (
                  <div key={item.id} style={styles.topItemRow}>
                    <span style={styles.topItemEmoji}>{item.emoji}</span>
                    <span style={styles.topItemLabel}>{item.label}</span>
                    <span style={styles.topItemCount}>×{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modale de détails des scores (uniquement pour les pronos) */}
      <ScoreModal 
        isOpen={Boolean(selectedPlayer)} 
        onClose={() => setSelectedPlayer(null)} 
        player={selectedPlayer}
        liveResults={liveResults}
      />
    </div>
  );
};

const styles = {
  container: { fontFamily: "'Outfit', sans-serif" },
  
  // Onglets internes de navigation
  subTabContainer: { display: 'flex', background: 'rgba(0, 0, 0, 0.2)', padding: '4px', borderRadius: '10px', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.04)' },
  subTab: { flex: 1, padding: '8px 0', background: 'transparent', border: 'none', color: '#a0aec0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Outfit', sans-serif", transition: '0.2s' },
  subTabActive: { flex: 1, padding: '8px 0', background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif", boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
  
  // Styles Pronos
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: '0', color: '#ff007f', fontFamily: "'Fredoka', sans-serif", fontSize: '1.25rem', display: 'flex', alignItems: 'center', fontWeight: 500 },
  subtitle: { color: '#a0aec0', margin: '4px 0 16px 0', fontSize: '0.8rem' },
  loadingText: { textAlign: 'center', color: '#a0aec0', fontSize: '0.85rem', padding: '15px 0' },
  emptyText: { textAlign: 'center', color: '#a0aec0', fontSize: '0.85rem', padding: '15px 0' },
  
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.04)', transition: '0.15s' },
  rowWinner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'linear-gradient(90deg, rgba(255, 0, 127, 0.1) 0%, rgba(0, 0, 0, 0.25) 100%)', borderRadius: '10px', border: '1px solid rgba(255, 0, 127, 0.3)', boxShadow: '0 4px 15px rgba(255, 0, 127, 0.05)' },
  playerInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  rankIconContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' },
  iconGlow: { filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.4))' },
  name: { fontWeight: 500, fontSize: '0.95rem', color: '#fff' },
  scoreBadge: { background: '#ff007f', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' },

  // Styles Bingo
  section: { background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  sectionTitle: { margin: 0, fontFamily: "'Fredoka', sans-serif", fontSize: '0.95rem', fontWeight: 400, color: '#fff', flex: 1 },
  sectionDesc: { margin: '-4px 0 10px 0', fontSize: '0.75rem', color: '#718096', lineHeight: '1.4' },
  refreshBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#718096', width: '24px', height: '24px', borderRadius: '6px', cursor: 'pointer' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '15px', textAlign: 'center' },
  
  rankList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  rankRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', border: '1px solid' },
  rankPos: { fontFamily: "'Fredoka', sans-serif", fontSize: '0.9rem', minWidth: '24px' },
  playerInfoGrid: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  playerName: { fontSize: '0.85rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  playerSub: { fontSize: '0.7rem', color: '#718096' },
  timeStamp: { fontSize: '0.75rem', color: '#a0aec0', fontFamily: 'monospace', marginLeft: 'auto' },
  scoreBox: { display: 'flex', alignItems: 'baseline', gap: '2px' },
  scoreValue: { fontSize: '1.1rem', fontWeight: 700, color: '#f6ad55', fontFamily: "'Fredoka', sans-serif" },
  scoreLabel: { fontSize: '0.7rem', color: '#718096' },

  topItemsList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  topItemRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)' },
  topItemEmoji: { fontSize: '0.9rem' },
  topItemLabel: { flex: 1, fontSize: '0.8rem', color: '#cbd5e0' },
  topItemCount: { fontSize: '0.8rem', fontWeight: 700, color: '#ff007f', fontFamily: "'Fredoka', sans-serif" }
};

export default Leaderboard;