import React from 'react';

// 📊 Import des icônes Lucide nécessaires
import { 
  X, Trophy, Scale, Smartphone, Award, Trash2, 
  Layers, CheckCircle, FileText 
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

// Fonction helper pour obtenir l'affichage propre d'un pays (Flag + Nom)
const getCountryLabel = (id) => {
  if (!id) return '-';
  const country = MASTER_COUNTRIES.find(c => c.id === id);
  return country ? `${country.flag} ${country.name}` : id;
};

// Fonction helper pour styliser les badges de points avec des feedbacks visuels clairs
const renderPointBadge = (pts, labelOverride = null) => {
  if (pts > 0) {
    return <span style={{ ...styles.badge, color: '#68d391', backgroundColor: 'rgba(104, 211, 145, 0.12)', border: '1px solid rgba(104, 211, 145, 0.2)' }}>+{pts} pts</span>;
  }
  if (pts < 0) {
    return <span style={{ ...styles.badge, color: '#fc8181', backgroundColor: 'rgba(252, 129, 129, 0.12)', border: '1px solid rgba(252, 129, 129, 0.2)' }}>{pts} pts</span>;
  }
  return <span style={{ ...styles.badge, color: '#718096', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>{labelOverride || '0 pt'}</span>;
};

const ScoreModal = ({ isOpen, onClose, player, liveResults }) => {
  if (!isOpen) return null;

  // 1. Récupération des pronos du joueur
  const predictions = player?.predictions || {};
  const predTop5 = predictions.top5 || [];
  const predTop3Jury = predictions.top3Jury || [];
  const predTop3Public = predictions.top3Public || [];
  const predMost12 = predictions.mostTwelvePoints;
  const predLast = predictions.lastPlace;
  const predPoints = predictions.winnerPublicPoints;
  const predZeroPoints = predictions.zeroPoints || [];

  // 2. Extraction de la vérité officielle (depuis les scores saisis par l'admin)
  const officialScores = liveResults?.scores || [];
  const activeOfficialScores = [...officialScores].filter(c => c.total !== undefined);
  
  // Tri pour obtenir les différents classements officiels requis
  const sortedOfficialCountries = [...activeOfficialScores].sort((a, b) => b.total - a.total);
  const officialIds = sortedOfficialCountries.map(c => c.id);
  const officialTop5 = officialIds.slice(0, 5);
  const officialLastPlaceId = officialIds[officialIds.length - 1];

  const officialJuryIds = [...activeOfficialScores].sort((a, b) => b.jury - a.jury).map(c => c.id);
  const officialPublicIds = [...activeOfficialScores].sort((a, b) => b.public - a.public).map(c => c.id);
  const officialMost12 = liveResults?.mostTwelvePoints || '';

  // 3. Variables de cumul pour isoler la part issue de la "Grille Complète" (le reste des points)
  let computedSubtotal = 0;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#ff007f" />
            <h2 style={styles.modalTitle}>Détails des points : {player?.displayName || player?.name}</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <div style={styles.content}>
          <h3 style={styles.sectionTitle}>Analyse de la Grille de pronostics</h3>
          <div style={styles.table}>
            
            {/* 1. TOP 5 GÉNÉRAL */}
            <div style={styles.categoryDivider}>
              <Trophy size={14} style={{ marginRight: '6px' }} /> Top 5 Général
            </div>
            {predTop5.length === 0 ? (
              <p style={styles.noData}>Aucun pronostic Top 5 enregistré.</p>
            ) : (
              predTop5.map((countryId, idx) => {
                let pts = 0;
                let explication = "Pas dans le Top 5";
                
                if (idx === 0 && countryId === officialIds[0]) {
                  pts = 5;
                  explication = "Vainqueur Exact !";
                } else if (idx === 0 && officialTop5.includes(countryId)) {
                  pts = 2;
                  explication = "Dans le Top 5 (mais pas 1er)";
                } else if (idx > 0 && officialTop5.includes(countryId)) {
                  pts = 2;
                  explication = "Dans le Top 5";
                } else if (idx === 0 && countryId) {
                  explication = `Faux (Réel Vainqueur : ${getCountryLabel(officialIds[0])})`;
                }

                computedSubtotal += pts;

                return (
                  <div key={idx} style={styles.tableRow}>
                    <div style={styles.rowLeft}>
                      <span style={styles.positionLabel}>#{idx + 1}</span>
                      <div style={styles.pronoInfo}>
                        <span style={styles.countryName}>{getCountryLabel(countryId)}</span>
                        <span style={styles.explication}>{explication}</span>
                      </div>
                    </div>
                    {renderPointBadge(pts, idx === 0 ? '0 pt' : '0 pt')}
                  </div>
                );
              })
            )}

            {/* 2. TOP 3 JURY */}
            <div style={styles.categoryDivider}>
              <Scale size={14} style={{ marginRight: '6px' }} /> Top 3 Vote du Jury
            </div>
            {predTop3Jury.length === 0 ? (
              <p style={styles.noData}>Aucun pronostic Jury enregistré.</p>
            ) : (
              predTop3Jury.map((countryId, idx) => {
                let pts = 0;
                let explication = "Hors du Top 3 Jury";

                if (idx === 0 && countryId === officialJuryIds[0]) {
                  pts = 3;
                  explication = "1er Jury Exact !";
                } else if (officialJuryIds.slice(0, 3).includes(countryId)) {
                  pts = 1;
                  explication = "Dans le Top 3 Jury";
                } else if (idx === 0 && countryId) {
                  explication = `Faux (Réel 1er Jury : ${getCountryLabel(officialJuryIds[0])})`;
                }

                computedSubtotal += pts;

                return (
                  <div key={idx} style={styles.tableRow}>
                    <div style={styles.rowLeft}>
                      <span style={styles.positionLabel}>#{idx + 1}</span>
                      <div style={styles.pronoInfo}>
                        <span style={styles.countryName}>{getCountryLabel(countryId)}</span>
                        <span style={styles.explication}>{explication}</span>
                      </div>
                    </div>
                    {renderPointBadge(pts)}
                  </div>
                );
              })
            )}

            {/* 3. TOP 3 PUBLIC */}
            <div style={styles.categoryDivider}>
              <Smartphone size={14} style={{ marginRight: '6px' }} /> Top 3 Télévote Public
            </div>
            {predTop3Public.length === 0 ? (
              <p style={styles.noData}>Aucun pronostic Télévote enregistré.</p>
            ) : (
              predTop3Public.map((countryId, idx) => {
                let pts = 0;
                let explication = "Hors du Top 3 Public";

                if (idx === 0 && countryId === officialPublicIds[0]) {
                  pts = 3;
                  explication = "1er Télévote Exact !";
                } else if (officialPublicIds.slice(0, 3).includes(countryId)) {
                  pts = 1;
                  explication = "Dans le Top 3 Télévote";
                } else if (idx === 0 && countryId) {
                  explication = `Faux (Réel 1er Public : ${getCountryLabel(officialPublicIds[0])})`;
                }

                computedSubtotal += pts;

                return (
                  <div key={idx} style={styles.tableRow}>
                    <div style={styles.rowLeft}>
                      <span style={styles.positionLabel}>#{idx + 1}</span>
                      <div style={styles.pronoInfo}>
                        <span style={styles.countryName}>{getCountryLabel(countryId)}</span>
                        <span style={styles.explication}>{explication}</span>
                      </div>
                    </div>
                    {renderPointBadge(pts)}
                  </div>
                );
              })
            )}

            {/* 4. PRONOSTICS BONUS UNIQUE */}
            <div style={styles.categoryDivider}>
              <Award size={14} style={{ marginRight: '6px' }} /> Bonus Spécifiques
            </div>
            
            {/* Max de 12 points */}
            {(() => {
              const isCorrect = predMost12 && predMost12 === officialMost12;
              const pts = isCorrect ? 5 : 0;
              computedSubtotal += pts;
              return (
                <div style={styles.tableRow}>
                  <div style={styles.rowLeft}>
                    <span style={styles.iconWidth}><Award size={14} color="#ffd700" /></span>
                    <div style={styles.pronoInfo}>
                      <span style={styles.itemTitle}>Max de 12 pts Jury : <strong style={styles.countryName}>{getCountryLabel(predMost12)}</strong></span>
                      <span style={styles.explication}>{isCorrect ? "Correct ! (+5)" : `Faux (Réel : ${getCountryLabel(officialMost12)})`}</span>
                    </div>
                  </div>
                  {renderPointBadge(pts)}
                </div>
              );
            })()}

            {/* Dernier de la finale */}
            {(() => {
              const isCorrect = predLast && predLast === officialLastPlaceId;
              const pts = isCorrect ? 7 : 0;
              computedSubtotal += pts;
              return (
                <div style={styles.tableRow}>
                  <div style={styles.rowLeft}>
                    <span style={styles.iconWidth}><Award size={14} color="#fc8181" /></span>
                    <div style={styles.pronoInfo}>
                      <span style={styles.itemTitle}>Dernier de la Finale : <strong style={styles.countryName}>{getCountryLabel(predLast)}</strong></span>
                      <span style={styles.explication}>{isCorrect ? "Cuillère de bois trouvée ! (+7)" : `Faux (Réel : ${getCountryLabel(officialLastPlaceId)})`}</span>
                    </div>
                  </div>
                  {renderPointBadge(pts)}
                </div>
              );
            })()}

            {/* Points public du vainqueur */}
            {(() => {
              const absoluteWinner = activeOfficialScores.find(c => c.id === officialIds[0]);
              let pts = 0;
              let explication = "Aucun point pronostiqué ou écart > 200";
              
              if (absoluteWinner && predPoints !== undefined && predPoints !== null) {
                const targetPoints = absoluteWinner.public;
                const delta = Math.abs(predPoints - targetPoints);
                explication = `Pari : ${predPoints} pts (Réel ${getCountryLabel(officialIds[0])} : ${targetPoints} pts | Écart de ${delta})`;
                
                if (delta === 0) pts = 100;
                else if (delta <= 20) pts = 50;
                else if (delta <= 50) pts = 20;
                else if (delta <= 75) pts = 10;
                else if (delta <= 150) pts = 5;
                else if (delta <= 200) pts = 1;
              }
              computedSubtotal += pts;
              return (
                <div style={styles.tableRow}>
                  <div style={styles.rowLeft}>
                    <span style={styles.iconWidth}><Layers size={14} color="#f6ad55" /></span>
                    <div style={styles.pronoInfo}>
                      <span style={styles.itemTitle}>Points Public Vainqueur</span>
                      <span style={styles.explication}>{explication}</span>
                    </div>
                  </div>
                  {renderPointBadge(pts)}
                </div>
              );
            })()}

            {/* 5. PARI RISQUÉ : LES 0 POINTS */}
            <div style={styles.categoryDivider}>
              <Trash2 size={14} style={{ marginRight: '6px' }} /> Pari Risqué : Les "0 Point"
            </div>
            {predZeroPoints.length === 0 ? (
              <p style={styles.noData}>Aucun pays risqué sélectionné.</p>
            ) : (
              predZeroPoints.map((countryId, index) => {
                const actualData = activeOfficialScores.find(c => c.id === countryId);
                let pts = 0;
                let explication = "En attente des scores";

                if (actualData) {
                  if (actualData.total === 0) {
                    pts = 15;
                    explication = "Parfait ! Le pays a fini avec 0 point (+15)";
                  } else {
                    pts = -5;
                    explication = `Raté ! Il a obtenu ${actualData.total} pts (-5)`;
                  }
                }
                computedSubtotal += pts;

                return (
                  <div key={index} style={styles.tableRow}>
                    <div style={styles.rowLeft}>
                      <span style={styles.iconWidth}><Trash2 size={14} color="#cbd5e0" /></span>
                      <div style={styles.pronoInfo}>
                        <span style={styles.countryName}>{getCountryLabel(countryId)}</span>
                        <span style={styles.explication}>{explication}</span>
                      </div>
                    </div>
                    {renderPointBadge(pts)}
                  </div>
                );
              })
            )}

            {/* 6. LE RESTE DES POINTS (CLASSEMENT COMPLET PERSO) */}
            <div style={styles.categoryDivider}>
              <CheckCircle size={14} style={{ marginRight: '6px' }} /> Classement Complet & Bonus Grille
            </div>
            {(() => {
              // Par déduction logique : (Total Validé Admin) - (Tout ce qu'on vient de calculer au-dessus)
              const totalPlayerScore = player?.score || 0;
              const gridPerformancePoints = totalPlayerScore - computedSubtotal;
              return (
                <div style={styles.tableRow}>
                  <div style={styles.rowLeft}>
                    <span style={styles.iconWidth}><CheckCircle size={14} color="#ff007f" /></span>
                    <div style={styles.pronoInfo}>
                      <span style={styles.itemTitle}>Justesse de la Grille Complète</span>
                      <span style={styles.explication}>Points générés par vos rangs exacts (de 1 à 26) et pénalités de favoris</span>
                    </div>
                  </div>
                  {renderPointBadge(gridPerformancePoints)}
                </div>
              );
            })()}

          </div>

          {/* TOTAL DU JOUEUR SYNCHRONISÉ */}
          <div style={styles.totalBlock}>
            Total validé de Jacques : <span style={styles.totalPoints}>{player?.score} points</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 3, 15, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: 'linear-gradient(135deg, #161233 0%, #0f0c20 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '25px', borderRadius: '16px', width: '92%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.7)', color: '#fff', fontFamily: "'Outfit', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' },
  modalTitle: { margin: 0, fontSize: '1.25rem', color: '#fff', fontFamily: "'Fredoka', sans-serif", fontWeight: 500, letterSpacing: '0.02em' },
  closeBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', color: '#cbd5e0', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  content: { marginTop: '20px' },
  sectionTitle: { color: '#ff007f', fontSize: '0.95rem', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  table: { display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' },
  categoryDivider: { display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: '#9f7aea', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid rgba(159,122,234,0.15)', paddingBottom: '4px', marginTop: '14px', marginBottom: '4px', letterSpacing: '0.03em' },
  tableRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.02)', alignItems: 'center', borderRadius: '6px', background: 'rgba(255,255,255,0.01)' },
  rowLeft: { display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 },
  positionLabel: { fontSize: '0.8rem', color: '#ff007f', fontWeight: 700, minWidth: '22px', background: 'rgba(255,0,127,0.08)', padding: '2px 4px', borderRadius: '4px', textAlign: 'center' },
  iconWidth: { minWidth: '22px', display: 'flex', justifyContent: 'center' },
  pronoInfo: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  itemTitle: { color: '#fff', fontWeight: 500, fontSize: '0.88rem' },
  countryName: { color: '#4fd1c5', fontWeight: 600, fontSize: '0.88rem' },
  explication: { fontSize: '0.75rem', color: '#a0aec0', marginTop: '2px' },
  noData: { margin: '4px 0', fontSize: '0.8rem', color: '#718096', fontStyle: 'italic' },
  badge: { fontSize: '0.78rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', minWidth: '58px', textAlign: 'center', flexShrink: 0 },
  totalBlock: { textAlign: 'right', marginTop: '18px', fontWeight: 500, fontSize: '1.05rem', color: '#cbd5e0' },
  totalPoints: { color: '#ff007f', fontSize: '1.4rem', fontWeight: 700, marginLeft: '6px', textShadow: '0 0 12px rgba(255,0,127,0.4)' }
};

export default ScoreModal;