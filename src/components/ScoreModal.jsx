import React from 'react';

// 📊 Import des icônes Lucide
import { 
  X, Trophy, Scale, Smartphone, Award, Trash2, 
  Layers, CheckCircle, FileText, List, AlertTriangle
} from 'lucide-react';

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

const getCountryLabel = (id) => {
  if (!id) return '-';
  const country = MASTER_COUNTRIES.find(c => c.id === id);
  return country ? `${country.flag} ${country.name}` : id;
};

const renderPointBadge = (pts) => {
  if (pts > 0) return <span style={{ ...styles.badge, color: '#68d391', backgroundColor: 'rgba(104, 211, 145, 0.12)', border: '1px solid rgba(104, 211, 145, 0.2)' }}>+{pts} pts</span>;
  if (pts < 0) return <span style={{ ...styles.badge, color: '#fc8181', backgroundColor: 'rgba(252, 129, 129, 0.12)', border: '1px solid rgba(252, 129, 129, 0.2)' }}>{pts} pts</span>;
  return <span style={{ ...styles.badge, color: '#718096', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>0 pt</span>;
};

const ScoreModal = ({ isOpen, onClose, player }) => {
  if (!isOpen || !player) return null;

  // On récupère toutes les données pré-calculées par le Leaderboard !
  const { scoreDetails: details, resultsAvailable, computedScore, predictions } = player;

  const most12Note = resultsAvailable 
    ? (details.most12.pts > 0 ? 'Correct ! (+5)' : (details.most12.realId ? `Faux — Réel : ${getCountryLabel(details.most12.realId)}` : 'Résultat non publié'))
    : 'En attente';

  const lastNote = resultsAvailable 
    ? (details.last.pts > 0 ? '🥄 Cuillère de bois ! (+7)' : (details.last.realId ? `Faux — Dernier réel : ${getCountryLabel(details.last.realId)}` : 'Résultat non publié'))
    : 'En attente';

  const winnerNote = resultsAvailable && details.winnerPts.val != null
    ? `Pari : ${details.winnerPts.val} pts — Réel : ${details.winnerPts.realPts} (écart : ${details.winnerPts.delta})`
    : (details.winnerPts.val == null ? 'Aucun pari' : 'En attente');

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <FileText size={20} color="#ff007f" style={{ flexShrink: 0 }} />
            <h2 style={styles.modalTitle}>{player.displayName || 'Joueur'}</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>
        </div>

        <div style={styles.content}>
          {!resultsAvailable && (
            <div style={styles.warningBanner}>
              ⏳ Les résultats officiels ne sont pas encore disponibles. Les points calculés sont à zéro.
            </div>
          )}

          <h3 style={styles.sectionTitle}>Détail de la grille de pronostics</h3>
          <div style={styles.table}>
            
            {/* Top 5 */}
            <div style={styles.categoryDivider}><Trophy size={14} style={{ marginRight: '6px' }} /> Top 5 Général</div>
            {details.top5.length === 0 ? <p style={styles.noData}>Aucun pronostic enregistré.</p> : details.top5.map((item, idx) => (
              <div key={idx} style={styles.tableRow}>
                <div style={styles.rowLeft}>
                  <span style={styles.positionLabel}>#{idx + 1}</span>
                  <div style={styles.pronoInfo}>
                    <span style={styles.countryName}>{getCountryLabel(item.countryId)}</span>
                    <span style={styles.explication}>{item.note} {item.realTarget ? getCountryLabel(item.realTarget) : ''}</span>
                  </div>
                </div>
                {renderPointBadge(item.pts)}
              </div>
            ))}

            {/* Top 3 Jury */}
            <div style={styles.categoryDivider}><Scale size={14} style={{ marginRight: '6px' }} /> Top 3 Jury</div>
            {details.top3Jury.length === 0 ? <p style={styles.noData}>Aucun pronostic enregistré.</p> : details.top3Jury.map((item, idx) => (
              <div key={idx} style={styles.tableRow}>
                <div style={styles.rowLeft}>
                  <span style={styles.positionLabel}>#{idx + 1}</span>
                  <div style={styles.pronoInfo}>
                    <span style={styles.countryName}>{getCountryLabel(item.countryId)}</span>
                    <span style={styles.explication}>{item.note} {item.realTarget ? getCountryLabel(item.realTarget) : ''}</span>
                  </div>
                </div>
                {renderPointBadge(item.pts)}
              </div>
            ))}
            
            {/* Top 3 Public */}
            <div style={styles.categoryDivider}><Smartphone size={14} style={{ marginRight: '6px' }} /> Top 3 Télévote</div>
            {details.top3Public.length === 0 ? <p style={styles.noData}>Aucun pronostic enregistré.</p> : details.top3Public.map((item, idx) => (
              <div key={idx} style={styles.tableRow}>
                <div style={styles.rowLeft}>
                  <span style={styles.positionLabel}>#{idx + 1}</span>
                  <div style={styles.pronoInfo}>
                    <span style={styles.countryName}>{getCountryLabel(item.countryId)}</span>
                    <span style={styles.explication}>{item.note} {item.realTarget ? getCountryLabel(item.realTarget) : ''}</span>
                  </div>
                </div>
                {renderPointBadge(item.pts)}
              </div>
            ))}

            {/* Bonus Spécifiques */}
            <div style={styles.categoryDivider}><Award size={14} style={{ marginRight: '6px' }} /> Bonus Spécifiques</div>
            <div style={styles.tableRow}>
              <div style={styles.rowLeft}><span style={styles.iconWidth}><Award size={14} color="#ffd700" /></span><div style={styles.pronoInfo}><span style={styles.itemTitle}>Max 12 pts Jury : <strong style={styles.countryName}>{getCountryLabel(details.most12.countryId)}</strong></span><span style={styles.explication}>{most12Note}</span></div></div>{renderPointBadge(details.most12.pts)}
            </div>
            <div style={styles.tableRow}>
              <div style={styles.rowLeft}><span style={styles.iconWidth}><Award size={14} color="#fc8181" /></span><div style={styles.pronoInfo}><span style={styles.itemTitle}>Dernier Finale : <strong style={styles.countryName}>{getCountryLabel(details.last.countryId)}</strong></span><span style={styles.explication}>{lastNote}</span></div></div>{renderPointBadge(details.last.pts)}
            </div>
            <div style={styles.tableRow}>
              <div style={styles.rowLeft}><span style={styles.iconWidth}><Layers size={14} color="#f6ad55" /></span><div style={styles.pronoInfo}><span style={styles.itemTitle}>Points Vainqueur</span><span style={styles.explication}>{winnerNote}</span></div></div>{renderPointBadge(details.winnerPts.pts)}
            </div>

            {/* Zero Points */}
            <div style={styles.categoryDivider}><Trash2 size={14} style={{ marginRight: '6px' }} /> Les "0 Point"</div>
            {details.zeros.length === 0 ? <p style={styles.noData}>Aucun pays risqué sélectionné.</p> : details.zeros.map((item, i) => (
              <div key={i} style={styles.tableRow}><div style={styles.rowLeft}><span style={styles.iconWidth}><Trash2 size={14} color="#cbd5e0" /></span><div style={styles.pronoInfo}><span style={styles.countryName}>{getCountryLabel(item.countryId)}</span><span style={styles.explication}>{item.note}</span></div></div>{renderPointBadge(item.pts)}</div>
            ))}

            {/* Classement Perso CONCATÉNÉ */}
            {resultsAvailable && (details.personalRank.bonus > 0 || details.personalRank.malus < 0) && (
              <>
                <div style={styles.categoryDivider}><List size={14} style={{ marginRight: '6px' }} /> Bonus / Malus (Classement Personnel)</div>
                
                {details.personalRank.bonus > 0 && (
                  <div style={{ ...styles.tableRow, background: 'rgba(104, 211, 145, 0.04)' }}>
                    <div style={styles.rowLeft}>
                      <span style={styles.iconWidth}><CheckCircle size={14} color="#68d391" /></span>
                      <div style={styles.pronoInfo}>
                        <span style={styles.itemTitle}>Bonus de similitude globale</span>
                        <span style={styles.explication}>Positions exactes & Top/Bottom respectés</span>
                      </div>
                    </div>
                    {renderPointBadge(details.personalRank.bonus)}
                  </div>
                )}
                
                {details.personalRank.malus < 0 && (
                  <div style={{ ...styles.tableRow, background: 'rgba(252, 129, 129, 0.04)' }}>
                    <div style={styles.rowLeft}>
                      <span style={styles.iconWidth}><AlertTriangle size={14} color="#fc8181" /></span>
                      <div style={styles.pronoInfo}>
                        <span style={styles.itemTitle}>Malus d'inversion absolue</span>
                        <span style={styles.explication}>Favoris relégués tout en bas (et inversement)</span>
                      </div>
                    </div>
                    {renderPointBadge(details.personalRank.malus)}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={styles.totalBlock}>
            <span style={styles.totalLabel}>Score total</span>
            <span style={styles.totalPoints}>{computedScore} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles inchangés
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