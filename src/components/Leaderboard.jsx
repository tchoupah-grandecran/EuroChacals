import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, doc, getDocs } from 'firebase/firestore';
import ScoreModal from './ScoreModal';
import { BINGO_ITEMS } from '../data/bingoItems';

// 📊 Import des icônes Lucide
import { BarChart3, Trophy, Medal, User, Zap, RefreshCw, Sparkles, Grid3x3, Clock, Flame } from 'lucide-react';

// 🧠 MOTEUR DE CALCUL CENTRALISÉ
export const computePlayerScore = (predictions = {}, liveResults) => {
  let total = 0;
  let details = {
    top5: [], top3Jury: [], top3Public: [],
    most12: { pts: 0, countryId: null, realId: null },
    last: { pts: 0, countryId: null, realId: null },
    winnerPts: { pts: 0, val: null, realPts: null },
    zeros: [],
    personalRank: { bonus: 0, malus: 0 }
  };

  const officialScores = liveResults?.scores || [];
  const activeScores = officialScores.filter(c => typeof c.total === 'number');
  const resultsAvailable = activeScores.length > 0;

  if (!resultsAvailable) return { total: 0, details, resultsAvailable };

  const sortedByTotal = [...activeScores].sort((a, b) => b.total - a.total);
  const sortedByJury = [...activeScores].sort((a, b) => b.jury - a.jury);
  const sortedByPublic = [...activeScores].sort((a, b) => b.public - a.public);

  const officialIds = sortedByTotal.map(c => c.id);
  const officialTop5 = officialIds.slice(0, 5);
  const officialBottom5 = officialIds.slice(-5);
  const officialJuryIds = sortedByJury.map(c => c.id);
  const officialPublicIds = sortedByPublic.map(c => c.id);
  
  const winnerId = officialIds[0];
  const lastId = officialIds[officialIds.length - 1];
  const realMost12 = liveResults?.mostTwelvePoints || '';
  const winnerActual = sortedByTotal[0];

  // Top 5
  (predictions.top5 || []).forEach((countryId, idx) => {
    let pts = 0, note = '';
    if (idx === 0 && countryId === winnerId) { pts = 5; note = '🏆 Vainqueur exact !'; }
    else if (idx === 0 && officialTop5.includes(countryId)) { pts = 2; note = 'Dans le Top 5 (pas 1er)'; }
    else if (idx > 0 && officialTop5.includes(countryId)) { pts = 2; note = 'Dans le Top 5'; }
    else if (countryId) { pts = 0; note = idx === 0 ? `Faux — Vrai vainqueur :` : 'Hors du Top 5'; }
    total += pts;
    details.top5.push({ countryId, pts, note, realTarget: idx === 0 ? winnerId : null });
  });

  // Top 3 Jury
  (predictions.top3Jury || []).forEach((countryId, idx) => {
    let pts = 0, note = '';
    if (idx === 0 && countryId === officialJuryIds[0]) { pts = 3; note = '🥇 1er Jury exact !'; }
    else if (officialJuryIds.slice(0, 3).includes(countryId)) { pts = 1; note = 'Dans le Top 3 Jury'; }
    else { pts = 0; note = idx === 0 ? `Faux — Vrai 1er Jury :` : 'Hors du Top 3 Jury'; }
    total += pts;
    details.top3Jury.push({ countryId, pts, note, realTarget: idx === 0 ? officialJuryIds[0] : null });
  });

  // Top 3 Public
  (predictions.top3Public || []).forEach((countryId, idx) => {
    let pts = 0, note = '';
    if (idx === 0 && countryId === officialPublicIds[0]) { pts = 3; note = '🥇 1er Télévote exact !'; }
    else if (officialPublicIds.slice(0, 3).includes(countryId)) { pts = 1; note = 'Dans le Top 3 Public'; }
    else { pts = 0; note = idx === 0 ? `Faux — Vrai 1er Public :` : 'Hors du Top 3 Public'; }
    total += pts;
    details.top3Public.push({ countryId, pts, note, realTarget: idx === 0 ? officialPublicIds[0] : null });
  });

  // Most 12 Points
  if (predictions.mostTwelvePoints) {
    if (predictions.mostTwelvePoints === realMost12) { details.most12.pts = 5; total += 5; }
    details.most12.countryId = predictions.mostTwelvePoints;
    details.most12.realId = realMost12;
  }

  // Dernière place
  if (predictions.lastPlace) {
    if (predictions.lastPlace === lastId) { details.last.pts = 7; total += 7; }
    details.last.countryId = predictions.lastPlace;
    details.last.realId = lastId;
  }

  // Points Vainqueur
  if (winnerActual && predictions.winnerPublicPoints != null) {
    const delta = Math.abs(Number(predictions.winnerPublicPoints) - winnerActual.public);
    let pts = 0;
    if (delta === 0) pts = 100;
    else if (delta <= 20) pts = 50;
    else if (delta <= 50) pts = 20;
    else if (delta <= 75) pts = 10;
    else if (delta <= 150) pts = 5;
    else if (delta <= 200) pts = 1;
    details.winnerPts = { pts, val: predictions.winnerPublicPoints, realPts: winnerActual.public, delta };
    total += pts;
  }

  // Zero Points
  (predictions.zeroPoints || []).forEach((countryId) => {
    const actual = activeScores.find(c => c.id === countryId);
    let pts = 0, note = 'En attente';
    if (actual && actual.total === 0) { pts = 15; note = `✅ 0 point confirmé !`; }
    else if (actual) { pts = -5; note = `❌ A obtenu ${actual.total} pts`; }
    total += pts;
    details.zeros.push({ countryId, pts, note });
  });

  // Classement Personnel (Bonus / Malus concaténés)
  let pBonus = 0;
  let pMalus = 0;
const myRank = predictions.predictions?.myPersonalRank || [];
  
  if (myRank.length > 0) {
    const userTop5 = myRank.slice(0, 5);
    const userBottom5 = myRank.slice(-5);

    myRank.forEach((countryId, userIdx) => {
      const officialIdx = officialIds.indexOf(countryId);
      if (officialIdx === -1) return;

      let countryPts = 0;
      if (userIdx === officialIdx) countryPts += 2; // Rang exact

      const inUserTop = userTop5.includes(countryId);
      const inUserBottom = userBottom5.includes(countryId);
      const inOfficialTop = officialTop5.includes(countryId);
      const inOfficialBottom = officialBottom5.includes(countryId);

      if (inUserTop && inOfficialTop) countryPts += 2;
      if (inUserBottom && inOfficialBottom) countryPts += 2;

      if (inUserBottom && inOfficialTop) countryPts -= 2;
      if (inUserTop && inOfficialBottom) countryPts -= 2;

      if (countryPts > 0) pBonus += countryPts;
      if (countryPts < 0) pMalus += countryPts;
    });

    total += (pBonus + pMalus);
    details.personalRank.bonus = pBonus;
    details.personalRank.malus = pMalus;
  }

  return { total, details, resultsAvailable };
};

const Leaderboard = () => {
  const [activeSubTab, setActiveSubTab] = useState('pronos');

  const [playersBase, setPlayersBase] = useState([]);
  const [allPredictions, setAllPredictions] = useState({});
  const [liveResults, setLiveResults] = useState(null);
  
  const [loadingPronos, setLoadingPronos] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const [grids, setGrids] = useState([]); 
  const [validated, setValidated] = useState({});
  const [loadingBingo, setLoadingBingo] = useState(true);

  // 1. Écoute des résultats officiels
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'results', 'officialRawScores'), (snap) => {
      setLiveResults(snap.exists() ? snap.data() : null);
    });
    return () => unsub();
  }, []);

  // 2. Écoute de la liste des joueurs
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'leaderboard'), (snap) => {
      setPlayersBase(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 3. Écoute de TOUTES les prédictions (pour calculer en local)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'predictions'), (snap) => {
      const preds = {};
      snap.docs.forEach(d => { preds[d.id] = d.data(); });
      setAllPredictions(preds);
      setLoadingPronos(false);
    });
    return () => unsub();
  }, []);

  // 4. Calcul et tri dynamique du classement
  const computedRankings = useMemo(() => {
    const rankings = playersBase.map(player => {
      const preds = allPredictions[player.id] || {};
      const scoreData = computePlayerScore(preds, liveResults);
      return {
        ...player,
        computedScore: scoreData.total,
        scoreDetails: scoreData.details,
        resultsAvailable: scoreData.resultsAvailable,
        predictions: preds
      };
    });
    return rankings.sort((a, b) => b.computedScore - a.computedScore);
  }, [playersBase, allPredictions, liveResults]);


  // ─── EFFECTS BINGO (Inchangés) ───
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
      setGrids(snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(g => g.locked));
    } catch (e) { console.error(e); } 
    finally { setLoadingBingo(false); }
  };

  useEffect(() => { loadBingoGrids(); }, []);

  const computeBingoStats = () => grids.map(g => {
    const matchCount = (g.grid || []).filter(id => (validated[id] || 0) >= 1).length;
    const totalHits = (g.grid || []).reduce((sum, id) => sum + (validated[id] || 0), 0);
    return { uid: g.uid, displayName: g.displayName || 'Anonyme', matchCount, totalHits, hasBingo: matchCount === 9, completedAt: g.completedAt?.toDate?.() || null };
  });

  const bingoStats = computeBingoStats();
  const bingoWinners = bingoStats.filter(s => s.hasBingo && s.completedAt).sort((a, b) => a.completedAt - b.completedAt);
  const bingoOccurrenceRanking = [...bingoStats].sort((a, b) => b.totalHits !== a.totalHits ? b.totalHits - a.totalHits : b.matchCount - a.matchCount);
  const topBingoItems = BINGO_ITEMS.map(i => ({ ...i, count: validated[i.id] || 0 })).filter(i => i.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);

  const renderRankIcon = (index) => {
    if (index === 0) return <Trophy size={18} color="#ffd700" style={styles.iconGlow} />;
    if (index === 1) return <Medal size={18} color="#c0c0c0" />;
    if (index === 2) return <Medal size={18} color="#cd7f32" />;
    return <User size={16} color="#a0aec0" />;
  };

  return (
    <div style={styles.container}>
      <div style={styles.subTabContainer}>
        <button onClick={() => setActiveSubTab('pronos')} style={activeSubTab === 'pronos' ? styles.subTabActive : styles.subTab}>
          <Sparkles size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Pronostics
        </button>
        <button onClick={() => setActiveSubTab('bingo')} style={activeSubTab === 'bingo' ? styles.subTabActive : styles.subTab}>
          <Grid3x3 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Bingo
        </button>
      </div>

      {activeSubTab === 'pronos' && (
        <div>
          <div style={styles.headerRow}>
            <h2 style={styles.title}><BarChart3 size={20} color="#ff007f" style={{ marginRight: '8px' }} /> Classement des chacaux</h2>
          </div>
          <p style={styles.subtitle}>Calculé en temps réel selon les résultats officiels</p>

          {loadingPronos ? (
            <p style={styles.loadingText}>Calcul du classement en direct...</p>
          ) : (
            <div style={styles.list}>
              {computedRankings.length === 0 ? (
                <p style={styles.emptyText}>Aucun pronostic validé pour le moment.</p>
              ) : (
                computedRankings.map((player, index) => {
                  const isFirst = index === 0;
                  return (
                    <div key={player.id} onClick={() => setSelectedPlayer(player)} style={{ ...(isFirst ? styles.rowWinner : styles.row), cursor: 'pointer' }}>
                      <div style={styles.playerInfo}>
                        <div style={styles.rankIconContainer}>{renderRankIcon(index)}</div>
                        <span style={styles.name}>{player.displayName || "Anonyme"}</span>
                      </div>
                      <div style={styles.scoreBadge}>{player.computedScore} pts</div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* RESTE DU RENDER BINGO INCHANGÉ... (Omission pour concision, garde ton code actuel ici) */}

      {/* La modale reçoit le joueur pré-calculé ! */}
      <ScoreModal isOpen={Boolean(selectedPlayer)} onClose={() => setSelectedPlayer(null)} player={selectedPlayer} />
    </div>
  );
};

const styles = {
  container: { fontFamily: "'Outfit', sans-serif" },
  subTabContainer: { display: 'flex', background: 'rgba(0, 0, 0, 0.2)', padding: '4px', borderRadius: '10px', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.04)' },
  subTab: { flex: 1, padding: '8px 0', background: 'transparent', border: 'none', color: '#a0aec0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Outfit', sans-serif", transition: '0.2s' },
  subTabActive: { flex: 1, padding: '8px 0', background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif", boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: '0', color: '#ff007f', fontFamily: "'Fredoka', sans-serif", fontSize: '1.25rem', display: 'flex', alignItems: 'center', fontWeight: 500 },
  subtitle: { color: '#a0aec0', margin: '4px 0 16px 0', fontSize: '0.8rem' },
  loadingText: { textAlign: 'center', color: '#a0aec0', fontSize: '0.85rem', padding: '15px 0' },
  emptyText: { textAlign: 'center', color: '#a0aec0', fontSize: '0.85rem', padding: '15px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: '6px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.04)', transition: '0.15s' },
  rowWinner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'linear-gradient(90deg, rgba(255, 0, 127, 0.1) 0%, rgba(0, 0, 0, 0.25) 100%)', borderRadius: '10px', border: '1px solid rgba(255, 0, 127, 0.3)', boxShadow: '0 4px 15px rgba(255, 0, 127, 0.05)' },
  playerInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  rankIconContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' },
  iconGlow: { filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.4))' },
  name: { fontWeight: 500, fontSize: '0.95rem', color: '#fff' },
  scoreBadge: { background: '#ff007f', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }
};

export default Leaderboard;