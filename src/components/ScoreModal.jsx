import React from 'react';

// 📊 Import des icônes Lucide nécessaires
import { 
  X, Trophy, Scale, Smartphone, Award, Trash2, 
  Layers, CheckCircle, FileText, List
} from 'lucide-react';

// 🌍 Le Master pour retrouver les noms complets et les drapeaux via l'ID (Code Pays)
const MASTER_COUNTRIES = [
  { id: 'AL', name: 'Albanie', flag: '🇦🇱' }, { id: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { id: 'AM', name: 'Arménie', flag: '🇦🇲' }, { id: 'AU', name: 'Australie', flag: '🇦🇺' },
  { id: 'AT', name: 'Autriche', flag: '🇦🇹' }, { id: 'AZ', name: 'Azerbaïdjan', flag: '🇦🇿' },
  { id: 'BE', name: 'Belgique', flag: '🇧🇪' }, { id: 'BG', name: 'Bulgarie', flag: '🇧🇬' }, { id: 'CY', name: 'Chypre', flag: '🇨🇾' },
  { id: 'HR', name: 'Croatie', flag: '🇭🇷' }, { id: 'DK', name: 'Danemark', flag: '🇩🇰' },
  { id: 'ES', name: 'Espagne', flag: '🇪🇸' }, { id: 'EE', name: 'Estonie', flag: '🇪🇪' },
  { id: 'FI', name: 'Finlande', flag: '🇫🇮' }, { id: 'FR', name: 'France', flag: '🇫🇷' },
  { id: 'GE', name: 'Géorgie', flag: '🇬🇪' }, { id: 'GR', name: 'Grèce', flag: '🇬🇷' },
  { id: 'IE', name: 'Irlande', flag: '🇮🇪' }, { id: 'IS', name: 'Islande', flag: '🇮🇸' },
  { id: 'IL', name: 'Israël', flag: '🇮🇱' }, { id: 'IT', name: 'Italie', flag: '🇮🇹' },
  { id: 'LV', name: 'Lettonie', flag: '🇱🇻' }, { id: 'LT', name: 'Lituanie', flag: '🇱🇹' },
  { id: 'LU', name: 'Luxembourg', flag: '🇱🇺' }, { id: 'MT', name: 'Malte', flag: '🇲🇹' },
  { id: 'MD', name: 'Moldavie', flag: '🇲🇩' }, { id: 'NO', name: 'Norvège', flag: '🇳🇴' },
  { id: 'NL', name: 'Pays-Bas', flag: '🇳🇱' }, { id: 'PL', name: 'Pologne', flag: '🇵🇱' },
  { id: 'PT', name: 'Portugal', flag: '🇵🇹' }, { id: 'CZ', name: 'Tchéquie', flag: '🇨🇿' },
  { id: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' }, { id: 'SM', name: 'Saint-Marin', flag: '🇸🇲' },
  { id: 'RS', name: 'Serbie', flag: '🇷🇸' }, { id: 'SI', name: 'Slovénie', flag: '🇸🇮' },
  { id: 'SE', name: 'Suède', flag: '🇸🇪' }, { id: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { id: 'UA', name: 'Ukraine', flag: '🇺🇦' }
];

// Helper: get flag + name from country id
const getCountryLabel = (id) => {
  if (!id) return '-';
  const country = MASTER_COUNTRIES.find(c => c.id === id);
  return country ? `${country.flag} ${country.name}` : id;
};

// Helper: colored point badge
const renderPointBadge = (pts) => {
  if (pts > 0) {
    return <span style={{ ...styles.badge, color: '#68d391', backgroundColor: 'rgba(104, 211, 145, 0.12)', border: '1px solid rgba(104, 211, 145, 0.2)' }}>+{pts} pts</span>;
  }
  if (pts < 0) {
    return <span style={{ ...styles.badge, color: '#fc8181', backgroundColor: 'rgba(252, 129, 129, 0.12)', border: '1px solid rgba(252, 129, 129, 0.2)' }}>{pts} pts</span>;
  }
  return <span style={{ ...styles.badge, color: '#718096', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>0 pt</span>;
};

const ScoreModal = ({ isOpen, onClose, player, liveResults }) => {
  if (!isOpen || !player) return null;

  // ── 1. Player predictions (stored in leaderboard document) ────────────────
  const predictions = player?.predictions || {};
  const predTop5       = predictions.top5          || [];
  const predTop3Jury   = predictions.top3Jury      || [];
  const predTop3Public = predictions.top3Public    || [];
  const predMost12     = predictions.mostTwelvePoints || '';
  const predLast       = predictions.lastPlace     || '';
  const predPoints     = predictions.winnerPublicPoints;
  const predZeroPoints = predictions.zeroPoints    || [];

  // ── 2. Official results (from results/officialRawScores) ──────────────────
  // liveResults = { scores: [...], mostTwelvePoints: 'XX' }
  // scores entries: { id, name, flag, jury, public, total }
  const officialScores    = liveResults?.scores || [];
  // Only consider countries that have been given scores (total is defined & >= 0)
  const activeScores      = officialScores.filter(c => typeof c.total === 'number');
  const resultsAvailable  = activeScores.length > 0;

  // Build sorted rankings from official scores
  const sortedByTotal  = [...activeScores].sort((a, b) => b.total  - a.total);
  const sortedByJury   = [...activeScores].sort((a, b) => b.jury   - a.jury);
  const sortedByPublic = [...activeScores].sort((a, b) => b.public - a.public);

  const officialIds       = sortedByTotal.map(c => c.id);
  const officialTop5      = officialIds.slice(0, 5);
  const officialLastId    = officialIds[officialIds.length - 1];
  const officialJuryIds   = sortedByJury.map(c => c.id);
  const officialPublicIds = sortedByPublic.map(c => c.id);
  const officialMost12    = liveResults?.mostTwelvePoints || '';
  const officialWinner    = sortedByTotal[0]; // { id, jury, public, total, ... }

  // ── 3. Compute each category score (mirrors AdminPanel logic exactly) ─────
  let totalComputed = 0;

  // --- Top 5 Général ---
  const top5Rows = predTop5.map((countryId, idx) => {
    let pts = 0;
    let note = '';
    if (resultsAvailable && countryId) {
      if (idx === 0 && countryId === officialIds[0]) {
        pts = 5; note = '🏆 Vainqueur exact !';
      } else if (idx === 0 && officialTop5.includes(countryId)) {
        pts = 2; note = 'Dans le Top 5 (pas 1er)';
      } else if (idx > 0 && officialTop5.includes(countryId)) {
        pts = 2; note = 'Dans le Top 5';
      } else if (countryId) {
        pts = 0;
        note = idx === 0
          ? `Faux — Vainqueur réel : ${getCountryLabel(officialIds[0])}`
          : 'Hors du Top 5';
      }
    } else if (!resultsAvailable) {
      note = 'En attente des résultats officiels';
    }
    totalComputed += pts;
    return { idx, countryId, pts, note };
  });

  // --- Top 3 Jury ---
  const top3JuryRows = predTop3Jury.map((countryId, idx) => {
    let pts = 0;
    let note = '';
    if (resultsAvailable && countryId) {
      if (idx === 0 && countryId === officialJuryIds[0]) {
        pts = 3; note = '🥇 1er Jury exact !';
      } else if (officialJuryIds.slice(0, 3).includes(countryId)) {
        pts = 1; note = 'Dans le Top 3 Jury';
      } else {
        pts = 0;
        note = idx === 0
          ? `Faux — 1er Jury réel : ${getCountryLabel(officialJuryIds[0])}`
          : 'Hors du Top 3 Jury';
      }
    } else if (!resultsAvailable) {
      note = 'En attente des résultats officiels';
    }
    totalComputed += pts;
    return { idx, countryId, pts, note };
  });

  // --- Top 3 Public ---
  const top3PublicRows = predTop3Public.map((countryId, idx) => {
    let pts = 0;
    let note = '';
    if (resultsAvailable && countryId) {
      if (idx === 0 && countryId === officialPublicIds[0]) {
        pts = 3; note = '🥇 1er Télévote exact !';
      } else if (officialPublicIds.slice(0, 3).includes(countryId)) {
        pts = 1; note = 'Dans le Top 3 Public';
      } else {
        pts = 0;
        note = idx === 0
          ? `Faux — 1er Public réel : ${getCountryLabel(officialPublicIds[0])}`
          : 'Hors du Top 3 Public';
      }
    } else if (!resultsAvailable) {
      note = 'En attente des résultats officiels';
    }
    totalComputed += pts;
    return { idx, countryId, pts, note };
  });

  // --- Most 12 points ---
  let most12Pts = 0;
  let most12Note = '';
  if (resultsAvailable) {
    if (predMost12 && predMost12 === officialMost12) {
      most12Pts = 5; most12Note = 'Correct ! (+5)';
    } else if (predMost12) {
      most12Note = officialMost12
        ? `Faux — Réel : ${getCountryLabel(officialMost12)}`
        : 'Résultat non encore publié';
    }
  } else {
    most12Note = 'En attente des résultats officiels';
  }
  totalComputed += most12Pts;

  // --- Dernier (Last place) ---
  let lastPts = 0;
  let lastNote = '';
  if (resultsAvailable) {
    if (predLast && predLast === officialLastId) {
      lastPts = 7; lastNote = '🥄 Cuillère de bois trouvée ! (+7)';
    } else if (predLast) {
      lastNote = officialLastId
        ? `Faux — Dernier réel : ${getCountryLabel(officialLastId)}`
        : 'Résultat non encore publié';
    }
  } else {
    lastNote = 'En attente des résultats officiels';
  }
  totalComputed += lastPts;

  // --- Points public du vainqueur ---
  let winnerPts = 0;
  let winnerNote = '';
  if (resultsAvailable && officialWinner && predPoints !== undefined && predPoints !== null) {
    const targetPublic = officialWinner.public;
    const delta = Math.abs(Number(predPoints) - targetPublic);
    winnerNote = `Pari : ${predPoints} pts — ${getCountryLabel(officialWinner.id)} a eu ${targetPublic} pts du public (écart : ${delta})`;
    if (delta === 0)       winnerPts = 100;
    else if (delta <= 20)  winnerPts = 50;
    else if (delta <= 50)  winnerPts = 20;
    else if (delta <= 75)  winnerPts = 10;
    else if (delta <= 150) winnerPts = 5;
    else if (delta <= 200) winnerPts = 1;
    else                   winnerNote += ' — Écart trop important';
  } else if (!resultsAvailable) {
    winnerNote = 'En attente des résultats officiels';
  } else if (predPoints === undefined || predPoints === null) {
    winnerNote = 'Aucun pari enregistré';
  }
  totalComputed += winnerPts;

  // --- Pari Zéro Point ---
  const zeroRows = predZeroPoints.map((countryId) => {
    let pts = 0;
    let note = 'En attente des résultats officiels';
    if (resultsAvailable) {
      const actual = activeScores.find(c => c.id === countryId);
      if (actual) {
        if (actual.total === 0) {
          pts = 15; note = `✅ 0 point confirmé ! (+15)`;
        } else {
          pts = -5; note = `❌ A obtenu ${actual.total} pts (-5)`;
        }
      } else {
        note = 'Pays non trouvé dans les résultats';
      }
    }
    totalComputed += pts;
    return { countryId, pts, note };
  });

  // --- Bonus Grille Perso (myPersonalRank) ---
  // +2 pts per exact rank match (user rank i === official rank i)
  // -2 pts per official top-5 country found in user's personal bottom 5
  // Only rows that earn or cost points are shown; zero-impact rows are hidden.
  const personalRankRows = [];
  const myPersonalRank = predictions.myPersonalRank || [];

  if (resultsAvailable && myPersonalRank.length > 0 && myPersonalRank.length === officialIds.length) {
    const userBottom5 = myPersonalRank.slice(-5);

    myPersonalRank.forEach((countryId, userIdx) => {
      // +2 for an exact rank hit
      if (countryId === officialIds[userIdx]) {
        const officialRank = userIdx + 1; // same for both
        personalRankRows.push({
          countryId,
          pts: 2,
          note: `Rang exact #${officialRank} ✓`,
          type: 'exact'
        });
        totalComputed += 2;
      }
    });

    // -2 for each official top-5 country buried in the user's bottom 5
    officialTop5.forEach((favId) => {
      if (userBottom5.includes(favId)) {
        const userRank = myPersonalRank.indexOf(favId) + 1;
        personalRankRows.push({
          countryId: favId,
          pts: -2,
          note: `Favori officiel relégué à ta place #${userRank}`,
          type: 'penalty'
        });
        totalComputed -= 2;
      }
    });

    // Sort: positives first, then negatives
    personalRankRows.sort((a, b) => b.pts - a.pts);
  }

  // ── 4. Render ─────────────────────────────────────────────────────────────
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <FileText size={20} color="#ff007f" style={{ flexShrink: 0 }} />
            <h2 style={styles.modalTitle}>
              {player?.displayName || player?.name || 'Joueur'}
            </h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <div style={styles.content}>
          {!resultsAvailable && (
            <div style={styles.warningBanner}>
              ⏳ Les résultats officiels ne sont pas encore disponibles. Les points affichés sont des estimations à 0 en attente de publication par l'admin.
            </div>
          )}

          <h3 style={styles.sectionTitle}>Détail de la grille de pronostics</h3>
          <div style={styles.table}>

            {/* ── TOP 5 GÉNÉRAL ─────────────────────────────────────────── */}
            <div style={styles.categoryDivider}>
              <Trophy size={14} style={{ marginRight: '6px' }} />
              Top 5 Général
            </div>
            {predTop5.length === 0 ? (
              <p style={styles.noData}>Aucun pronostic Top 5 enregistré.</p>
            ) : (
              top5Rows.map(({ idx, countryId, pts, note }) => (
                <div key={idx} style={styles.tableRow}>
                  <div style={styles.rowLeft}>
                    <span style={styles.positionLabel}>#{idx + 1}</span>
                    <div style={styles.pronoInfo}>
                      <span style={styles.countryName}>{getCountryLabel(countryId)}</span>
                      <span style={styles.explication}>{note}</span>
                    </div>
                  </div>
                  {renderPointBadge(pts)}
                </div>
              ))
            )}

            {/* ── TOP 3 JURY ────────────────────────────────────────────── */}
            <div style={styles.categoryDivider}>
              <Scale size={14} style={{ marginRight: '6px' }} />
              Top 3 Vote du Jury
            </div>
            {predTop3Jury.length === 0 ? (
              <p style={styles.noData}>Aucun pronostic Jury enregistré.</p>
            ) : (
              top3JuryRows.map(({ idx, countryId, pts, note }) => (
                <div key={idx} style={styles.tableRow}>
                  <div style={styles.rowLeft}>
                    <span style={styles.positionLabel}>#{idx + 1}</span>
                    <div style={styles.pronoInfo}>
                      <span style={styles.countryName}>{getCountryLabel(countryId)}</span>
                      <span style={styles.explication}>{note}</span>
                    </div>
                  </div>
                  {renderPointBadge(pts)}
                </div>
              ))
            )}

            {/* ── TOP 3 PUBLIC ──────────────────────────────────────────── */}
            <div style={styles.categoryDivider}>
              <Smartphone size={14} style={{ marginRight: '6px' }} />
              Top 3 Télévote Public
            </div>
            {predTop3Public.length === 0 ? (
              <p style={styles.noData}>Aucun pronostic Télévote enregistré.</p>
            ) : (
              top3PublicRows.map(({ idx, countryId, pts, note }) => (
                <div key={idx} style={styles.tableRow}>
                  <div style={styles.rowLeft}>
                    <span style={styles.positionLabel}>#{idx + 1}</span>
                    <div style={styles.pronoInfo}>
                      <span style={styles.countryName}>{getCountryLabel(countryId)}</span>
                      <span style={styles.explication}>{note}</span>
                    </div>
                  </div>
                  {renderPointBadge(pts)}
                </div>
              ))
            )}

            {/* ── BONUS SPÉCIFIQUES ─────────────────────────────────────── */}
            <div style={styles.categoryDivider}>
              <Award size={14} style={{ marginRight: '6px' }} />
              Bonus Spécifiques
            </div>

            {/* Most 12 points */}
            <div style={styles.tableRow}>
              <div style={styles.rowLeft}>
                <span style={styles.iconWidth}><Award size={14} color="#ffd700" /></span>
                <div style={styles.pronoInfo}>
                  <span style={styles.itemTitle}>
                    Max de 12 pts Jury : <strong style={styles.countryName}>{getCountryLabel(predMost12)}</strong>
                  </span>
                  <span style={styles.explication}>{most12Note || 'Aucun pari enregistré'}</span>
                </div>
              </div>
              {renderPointBadge(most12Pts)}
            </div>

            {/* Last place */}
            <div style={styles.tableRow}>
              <div style={styles.rowLeft}>
                <span style={styles.iconWidth}><Award size={14} color="#fc8181" /></span>
                <div style={styles.pronoInfo}>
                  <span style={styles.itemTitle}>
                    Dernier de la Finale : <strong style={styles.countryName}>{getCountryLabel(predLast)}</strong>
                  </span>
                  <span style={styles.explication}>{lastNote || 'Aucun pari enregistré'}</span>
                </div>
              </div>
              {renderPointBadge(lastPts)}
            </div>

            {/* Points public du vainqueur */}
            <div style={styles.tableRow}>
              <div style={styles.rowLeft}>
                <span style={styles.iconWidth}><Layers size={14} color="#f6ad55" /></span>
                <div style={styles.pronoInfo}>
                  <span style={styles.itemTitle}>Points Public du Vainqueur</span>
                  <span style={styles.explication}>{winnerNote || 'Aucun pari enregistré'}</span>
                </div>
              </div>
              {renderPointBadge(winnerPts)}
            </div>

            {/* ── PARI ZÉRO POINT ───────────────────────────────────────── */}
            <div style={styles.categoryDivider}>
              <Trash2 size={14} style={{ marginRight: '6px' }} />
              Pari Risqué : Les "0 Point"
            </div>
            {predZeroPoints.length === 0 ? (
              <p style={styles.noData}>Aucun pays risqué sélectionné.</p>
            ) : (
              zeroRows.map(({ countryId, pts, note }, i) => (
                <div key={i} style={styles.tableRow}>
                  <div style={styles.rowLeft}>
                    <span style={styles.iconWidth}><Trash2 size={14} color="#cbd5e0" /></span>
                    <div style={styles.pronoInfo}>
                      <span style={styles.countryName}>{getCountryLabel(countryId)}</span>
                      <span style={styles.explication}>{note}</span>
                    </div>
                  </div>
                  {renderPointBadge(pts)}
                </div>
              ))
            )}

            {/* ── BONUS CLASSEMENT PERSO ────────────────────────────────── */}
            {resultsAvailable && (
              <>
                <div style={styles.categoryDivider}>
                  <List size={14} style={{ marginRight: '6px' }} />
                  Bonus — Classement Complet Personnel
                </div>

                {myPersonalRank.length === 0 ? (
                  <p style={styles.noData}>Aucun classement personnel enregistré.</p>
                ) : myPersonalRank.length !== officialIds.length ? (
                  <p style={styles.noData}>
                    Classement incomplet ({myPersonalRank.length} pays sur {officialIds.length}) — recalcul impossible.
                  </p>
                ) : personalRankRows.length === 0 ? (
                  <p style={styles.noData}>Aucun rang exact ni favori mal classé — 0 pt dans cette catégorie.</p>
                ) : (
                  personalRankRows.map(({ countryId, pts, note }, i) => (
                    <div key={i} style={{
                      ...styles.tableRow,
                      background: pts > 0
                        ? 'rgba(104, 211, 145, 0.04)'
                        : 'rgba(252, 129, 129, 0.04)'
                    }}>
                      <div style={styles.rowLeft}>
                        <span style={styles.iconWidth}>
                          <CheckCircle size={14} color={pts > 0 ? '#68d391' : '#fc8181'} />
                        </span>
                        <div style={styles.pronoInfo}>
                          <span style={styles.countryName}>{getCountryLabel(countryId)}</span>
                          <span style={styles.explication}>{note}</span>
                        </div>
                      </div>
                      {renderPointBadge(pts)}
                    </div>
                  ))
                )}
              </>
            )}

          </div>

          {/* ── TOTAL ─────────────────────────────────────────────────────── */}
          <div style={styles.totalBlock}>
            <span style={styles.totalLabel}>Score total validé</span>
            <span style={styles.totalPoints}>{player?.score ?? 0} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 3, 15, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' },
  modal: { background: 'linear-gradient(135deg, #161233 0%, #0f0c20 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '25px', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.7)', color: '#fff', fontFamily: "'Outfit', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', gap: '12px' },
  modalTitle: { margin: 0, fontSize: '1.25rem', color: '#fff', fontFamily: "'Fredoka', sans-serif", fontWeight: 500, letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  closeBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', color: '#cbd5e0', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { marginTop: '20px' },
  warningBanner: { background: 'rgba(246, 173, 85, 0.1)', border: '1px solid rgba(246, 173, 85, 0.3)', color: '#f6ad55', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', lineHeight: '1.4', marginBottom: '16px' },
  sectionTitle: { color: '#ff007f', fontSize: '0.9rem', marginBottom: '12px', marginTop: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  table: { display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' },
  categoryDivider: { display: 'flex', alignItems: 'center', fontSize: '0.78rem', color: '#9f7aea', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid rgba(159,122,234,0.15)', paddingBottom: '4px', marginTop: '14px', marginBottom: '4px', letterSpacing: '0.03em' },
  tableRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.02)', alignItems: 'center', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', gap: '8px' },
  rowLeft: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 },
  positionLabel: { fontSize: '0.78rem', color: '#ff007f', fontWeight: 700, minWidth: '24px', background: 'rgba(255,0,127,0.08)', padding: '2px 4px', borderRadius: '4px', textAlign: 'center', flexShrink: 0 },
  iconWidth: { minWidth: '22px', display: 'flex', justifyContent: 'center', flexShrink: 0 },
  pronoInfo: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  itemTitle: { color: '#fff', fontWeight: 500, fontSize: '0.88rem' },
  countryName: { color: '#4fd1c5', fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  explication: { fontSize: '0.75rem', color: '#a0aec0', marginTop: '2px', lineHeight: '1.3' },
  noData: { margin: '4px 0', fontSize: '0.8rem', color: '#718096', fontStyle: 'italic' },
  badge: { fontSize: '0.78rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', minWidth: '62px', textAlign: 'center', flexShrink: 0 },
  totalBlock: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', background: 'rgba(255, 0, 127, 0.06)', border: '1px solid rgba(255, 0, 127, 0.2)', padding: '14px 18px', borderRadius: '10px' },
  totalLabel: { fontSize: '0.95rem', fontWeight: 500, color: '#cbd5e0' },
  totalPoints: { color: '#ff007f', fontSize: '1.5rem', fontWeight: 700, textShadow: '0 0 12px rgba(255,0,127,0.4)' }
};

export default ScoreModal;