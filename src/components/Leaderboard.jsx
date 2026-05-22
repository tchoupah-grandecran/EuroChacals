import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, doc, getDocs } from 'firebase/firestore';
import ScoreModal from './ScoreModal';
import { BINGO_ITEMS } from '../data/bingoItems';
import { useTheme } from '../ThemeContext';
import { BarChart3, Trophy, Medal, User, Sparkles, Grid3x3, Flame } from 'lucide-react';

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

  const isNestedShape = predictions.predictions && typeof predictions.predictions === 'object';
  const root = predictions;
  const nested = isNestedShape ? predictions.predictions : predictions;

  const predLastPlace  = root.lastPlace;
  const predMost12     = root.mostTwelvePoints;
  const predZeros      = root.zeroPoints || [];
  const predWinnerPts  = root.winnerPublicPoints;
  const predTop5       = root.top5 || nested.top5 || [];
  const predTop3Jury   = root.top3Jury || nested.top3Jury || [];
  const predTop3Public = root.top3Public || nested.top3Public || [];
  const myRank         = root.myPersonalRank || nested.myPersonalRank || [];

  const sortedByTotal  = [...activeScores].sort((a, b) => b.total  - a.total);
  const sortedByJury   = [...activeScores].sort((a, b) => b.jury   - a.jury);
  const sortedByPublic = [...activeScores].sort((a, b) => b.public - a.public);

  const officialIds       = sortedByTotal.map(c => c.id);
  const officialTop5      = officialIds.slice(0, 5);
  const officialBottom5   = officialIds.slice(-5);
  const officialJuryIds   = sortedByJury.map(c => c.id);
  const officialPublicIds = sortedByPublic.map(c => c.id);
  const winnerId          = officialIds[0];
  const lastId            = officialIds[officialIds.length - 1];
  const realMost12        = liveResults?.mostTwelvePoints || '';
  const winnerActual      = sortedByTotal[0];

  predTop5.forEach((countryId, idx) => {
    let pts = 0, note = '';
    if (idx === 0 && countryId === winnerId)                    { pts = 5; note = 'Vainqueur exact !'; }
    else if (idx === 0 && officialTop5.includes(countryId))    { pts = 2; note = 'Dans le Top 5 (pas 1er)'; }
    else if (idx > 0  && officialTop5.includes(countryId))     { pts = 2; note = 'Dans le Top 5'; }
    else if (countryId) { pts = 0; note = idx === 0 ? 'Faux — Vrai vainqueur :' : 'Hors du Top 5'; }
    total += pts;
    details.top5.push({ countryId, pts, note, realTarget: idx === 0 ? winnerId : null });
  });

  predTop3Jury.forEach((countryId, idx) => {
    let pts = 0, note = '';
    if (idx === 0 && countryId === officialJuryIds[0])         { pts = 3; note = '1er Jury exact !'; }
    else if (officialJuryIds.slice(0, 3).includes(countryId)) { pts = 1; note = 'Dans le Top 3 Jury'; }
    else { pts = 0; note = idx === 0 ? 'Faux — Vrai 1er Jury :' : 'Hors du Top 3 Jury'; }
    total += pts;
    details.top3Jury.push({ countryId, pts, note, realTarget: idx === 0 ? officialJuryIds[0] : null });
  });

  predTop3Public.forEach((countryId, idx) => {
    let pts = 0, note = '';
    if (idx === 0 && countryId === officialPublicIds[0])          { pts = 3; note = '1er Télévote exact !'; }
    else if (officialPublicIds.slice(0, 3).includes(countryId))  { pts = 1; note = 'Dans le Top 3 Public'; }
    else { pts = 0; note = idx === 0 ? 'Faux — Vrai 1er Public :' : 'Hors du Top 3 Public'; }
    total += pts;
    details.top3Public.push({ countryId, pts, note, realTarget: idx === 0 ? officialPublicIds[0] : null });
  });

  if (predMost12) {
    if (predMost12 === realMost12) { details.most12.pts = 5; total += 5; }
    details.most12.countryId = predMost12;
    details.most12.realId    = realMost12;
  }

  if (predLastPlace) {
    if (predLastPlace === lastId) { details.last.pts = 7; total += 7; }
    details.last.countryId = predLastPlace;
    details.last.realId    = lastId;
  }

  if (winnerActual && predWinnerPts != null) {
    const delta = Math.abs(Number(predWinnerPts) - winnerActual.public);
    let pts = 0;
    if (delta === 0) pts = 100; else if (delta <= 20) pts = 50; else if (delta <= 50) pts = 20;
    else if (delta <= 75) pts = 10; else if (delta <= 150) pts = 5; else if (delta <= 200) pts = 1;
    details.winnerPts = { pts, val: predWinnerPts, realPts: winnerActual.public, delta };
    total += pts;
  }

  predZeros.forEach((countryId) => {
    const actual = activeScores.find(c => c.id === countryId);
    let pts = 0, note = 'En attente';
    if (actual && actual.total === 0) { pts = 15; note = '0 point confirmé !'; }
    else if (actual)                  { pts = -5; note = `A obtenu ${actual.total} pts`; }
    total += pts;
    details.zeros.push({ countryId, pts, note });
  });

  if (myRank.length > 0) {
    let rawBonus = 0, rawMalus = 0;
    const userTop5    = myRank.slice(0, 5);
    const userBottom5 = myRank.slice(-5);
    myRank.forEach((countryId, userIdx) => {
      const officialIdx = officialIds.indexOf(countryId);
      if (officialIdx === -1) return;
      let countryPts = 0;
      if (userIdx === officialIdx) countryPts += 2;
      const inUserTop    = userTop5.includes(countryId);
      const inUserBottom = userBottom5.includes(countryId);
      const inOfficialTop    = officialTop5.includes(countryId);
      const inOfficialBottom = officialBottom5.includes(countryId);
      if (inUserTop    && inOfficialTop)    countryPts += 2;
      if (inUserBottom && inOfficialBottom) countryPts += 2;
      if (inUserBottom && inOfficialTop)    countryPts -= 2;
      if (inUserTop    && inOfficialBottom) countryPts -= 2;
      if (countryPts > 0) rawBonus += countryPts;
      if (countryPts < 0) rawMalus += countryPts;
    });
    const finalBonus = Math.min(rawBonus, 10);
    const finalMalus = Math.max(rawMalus, -10);
    total += (finalBonus + finalMalus);
    details.personalRank.bonus = finalBonus;
    details.personalRank.malus = finalMalus;
  }

  return { total, details, resultsAvailable };
};

const Leaderboard = () => {
  const { theme: t } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState('pronos');
  const [playersBase, setPlayersBase]   = useState([]);
  const [allPredictions, setAllPredictions] = useState({});
  const [liveResults, setLiveResults]   = useState(null);
  const [loadingPronos, setLoadingPronos] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [grids, setGrids]               = useState([]);
  const [validated, setValidated]       = useState({});
  const [loadingBingo, setLoadingBingo] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'results', 'officialRawScores'), (snap) => {
      setLiveResults(snap.exists() ? snap.data() : null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'leaderboard'), (snap) => {
      setPlayersBase(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'predictions'), (snap) => {
      const preds = {};
      snap.docs.forEach(d => { preds[d.id] = d.data(); });
      setAllPredictions(preds);
      setLoadingPronos(false);
    });
    return () => unsub();
  }, []);

  const computedRankings = useMemo(() => {
    const rankings = playersBase.map(player => {
      const preds = allPredictions[player.id] || player.predictions || {};
      const scoreData = computePlayerScore(preds, liveResults);
      return { ...player, computedScore: scoreData.total, scoreDetails: scoreData.details, resultsAvailable: scoreData.resultsAvailable, predictions: preds };
    });
    return rankings.sort((a, b) => b.computedScore - a.computedScore);
  }, [playersBase, allPredictions, liveResults]);

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
    } catch (e) { console.error(e); } finally { setLoadingBingo(false); }
  };
  useEffect(() => { loadBingoGrids(); }, []);

  const computeBingoStats = () => grids.map(g => {
    const matchCount = (g.grid || []).filter(id => (validated[id] || 0) >= 1).length;
    const totalHits  = (g.grid || []).reduce((sum, id) => sum + (validated[id] || 0), 0);
    return { uid: g.uid, displayName: g.displayName || 'Anonyme', matchCount, totalHits, hasBingo: matchCount === 9, completedAt: g.completedAt?.toDate?.() || null };
  });

  const bingoStats             = computeBingoStats();
  const bingoWinners           = bingoStats.filter(s => s.hasBingo && s.completedAt).sort((a, b) => a.completedAt - b.completedAt);
  const bingoOccurrenceRanking = [...bingoStats].sort((a, b) => b.totalHits !== a.totalHits ? b.totalHits - a.totalHits : b.matchCount - a.matchCount);
  const topBingoItems          = BINGO_ITEMS.map(i => ({ ...i, count: validated[i.id] || 0 })).filter(i => i.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);

  const renderRankIcon = (index) => {
    if (index === 0) return <Trophy size={18} color="#ffd700" style={{ filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.4))' }} />;
    if (index === 1) return <Medal  size={18} color="#c0c0c0" />;
    if (index === 2) return <Medal  size={18} color="#cd7f32" />;
    return <User size={16} color={t.textMuted} />;
  };

  // Derived tab styles
  const subTabActive = { flex: 1, padding: '8px 0', background: t.accentSoft, border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: t.fontBody, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' };
  const subTab       = { flex: 1, padding: '8px 0', background: 'transparent', border: 'none', color: t.textMuted, borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, fontFamily: t.fontBody, transition: '0.2s' };
  const rowWinner    = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: `linear-gradient(90deg, ${t.accentSoft} 0%, rgba(0,0,0,0.25) 100%)`, borderRadius: '10px', border: `1px solid ${t.accentBorder}`, boxShadow: `0 4px 15px ${t.accentSoft}` };
  const row          = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: `1px solid ${t.border}`, transition: '0.15s' };
  const scoreBadge   = { background: t.accent, color: '#fff', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' };

  return (
    <div style={{ fontFamily: t.fontBody }}>
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px', marginBottom: '20px', border: `1px solid ${t.border}` }}>
        <button onClick={() => setActiveSubTab('pronos')} style={activeSubTab === 'pronos' ? subTabActive : subTab}>
          <Sparkles size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Pronostics
        </button>
        <button onClick={() => setActiveSubTab('bingo')} style={activeSubTab === 'bingo' ? subTabActive : subTab}>
          <Grid3x3 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Bingo
        </button>
      </div>

      {activeSubTab === 'pronos' && (
        <div>
          <h2 style={{ margin: '0', color: t.accent, fontFamily: t.fontDisplay, fontSize: '1.25rem', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
            <BarChart3 size={20} color={t.accent} style={{ marginRight: '8px' }} /> Classement des chacaux
          </h2>
          <p style={{ color: t.textMuted, margin: '4px 0 16px 0', fontSize: '0.8rem' }}>Calculé en temps réel</p>

          {loadingPronos ? (
            <p style={{ textAlign: 'center', color: t.textMuted, fontSize: '0.85rem', padding: '15px 0' }}>Calcul du classement en direct...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {computedRankings.length === 0 ? (
                <p style={{ textAlign: 'center', color: t.textMuted, fontSize: '0.85rem', padding: '15px 0' }}>Aucun pronostic validé pour le moment.</p>
              ) : (
                computedRankings.map((player, index) => (
                  <div key={player.id} onClick={() => setSelectedPlayer(player)} style={{ ...(index === 0 ? rowWinner : row), cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>{renderRankIcon(index)}</div>
                      <span style={{ fontWeight: 500, fontSize: '0.95rem', color: '#fff' }}>{player.displayName || "Anonyme"}</span>
                    </div>
                    <div style={scoreBadge}>{player.computedScore} pts</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'bingo' && (
        <div>
          <h2 style={{ margin: '0', color: t.accent, fontFamily: t.fontDisplay, fontSize: '1.25rem', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
            <Grid3x3 size={20} color={t.accent} style={{ marginRight: '8px' }} /> Classement Bingo
          </h2>

          {loadingBingo ? (
            <p style={{ textAlign: 'center', color: t.textMuted, fontSize: '0.85rem', padding: '15px 0' }}>Chargement des grilles...</p>
          ) : (
            <>
              {bingoWinners.length > 0 && (
                <div style={{ marginBottom: '16px', marginTop: '12px' }}>
                  <p style={{ color: t.textMuted, margin: '0 0 8px 0', fontSize: '0.8rem' }}>Bingo complétés</p>
                  {bingoWinners.map((s, i) => (
                    <div key={s.uid} style={{ ...row, marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>{renderRankIcon(i)}</div>
                        <span style={{ fontWeight: 500, fontSize: '0.95rem', color: '#fff' }}>{s.displayName}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: t.textMuted }}>
                        {s.completedAt ? s.completedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ color: t.textMuted, margin: '12px 0 8px 0', fontSize: '0.8rem' }}>Progression des grilles</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {bingoOccurrenceRanking.length === 0 ? (
                  <p style={{ textAlign: 'center', color: t.textMuted, fontSize: '0.85rem', padding: '15px 0' }}>Aucune grille verrouillée.</p>
                ) : (
                  bingoOccurrenceRanking.map((s, index) => (
                    <div key={s.uid} style={index === 0 ? rowWinner : row}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>{renderRankIcon(index)}</div>
                        <span style={{ fontWeight: 500, fontSize: '0.95rem', color: '#fff' }}>{s.displayName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: t.textMuted }}>{s.matchCount}/9</span>
                        <div style={scoreBadge}>{s.totalHits} hits</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {topBingoItems.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <p style={{ color: t.textMuted, margin: '0 0 8px 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                    <Flame size={14} style={{ marginRight: '4px', color: '#fc8181' }} /> Top événements de la soirée
                  </p>
                  {topBingoItems.map(item => (
                    <div key={item.id} style={{ ...row, marginBottom: '6px' }}>
                      <span style={{ fontSize: '1rem', marginRight: '8px' }}>{item.emoji}</span>
                      <span style={{ flex: 1, fontWeight: 500, fontSize: '0.85rem', color: '#fff' }}>{item.label}</span>
                      <div style={scoreBadge}>×{item.count}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ScoreModal isOpen={Boolean(selectedPlayer)} onClose={() => setSelectedPlayer(null)} player={selectedPlayer} />
    </div>
  );
};

export default Leaderboard;