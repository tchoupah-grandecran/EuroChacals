import React from 'react';
import { X, Trophy, Scale, Smartphone, Zap, Skull, Binary, Award, Layers, HelpCircle, Sparkles, BarChart3, Dices } from 'lucide-react';

const RulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header de la Modal */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <HelpCircle size={22} color="#ff007f" />
            <h2 style={styles.title}>Règles et calculs</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Corps de la Modal */}
        <div style={styles.body}>
          
          {/* SECTION PRONOSTICS */}
          <h3 style={styles.sectionTitle}>
  <Sparkles size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
  Bareme des pronostics
</h3>
          
          <div style={styles.card}>
            <div style={styles.ruleRow}>
              <Trophy size={18} color="#ff007f" style={styles.icon} />
              <div>
                <strong style={styles.ruleName}>Top 5 Général :</strong>
                <span style={styles.ruleDetails}><span style={styles.plus}>+5 pts</span> pour le vainqueur exact / <span style={styles.plus}>+2 pts</span> par pays présent dans le reste du Top 5.</span>
              </div>
            </div>

            <div style={styles.ruleRow}>
              <Scale size={18} color="#63b3ed" style={styles.icon} />
              <div>
                <strong style={styles.ruleName}>Top 3 Jury :</strong>
                <span style={styles.ruleDetails}><span style={styles.plus}>+3 pts</span> par rang exact / <span style={styles.plus}>+1 pt</span> si le pays est dans ton top 3 mais pas au bon rang.</span>
              </div>
            </div>

            <div style={styles.ruleRow}>
              <Smartphone size={18} color="#f6ad55" style={styles.icon} />
              <div>
                <strong style={styles.ruleName}>Top 3 Public :</strong>
                <span style={styles.ruleDetails}><span style={styles.plus}>+3 pts</span> par rang exact / <span style={styles.plus}>+1 pt</span> si le pays est dans ton top 3 mais pas au bon rang.</span>
              </div>
            </div>

            <div style={styles.ruleRow}>
              <Zap size={18} color="#ecc94b" style={styles.icon} />
              <div>
                <strong style={styles.ruleName}>Statistiques & Bonus :</strong>
                <span style={styles.ruleDetails}><span style={styles.plus}>+5 pts</span> si tu trouves le roi des "12 points" / <span style={styles.plus}>+7 pts</span> pour la Cuillère de bois (Dernier officiel).</span>
              </div>
            </div>

            <div style={styles.ruleRow}>
              <Binary size={18} color="#4fd1c5" style={styles.icon} />
              <div>
                <strong style={styles.ruleName}>Points Public Vainqueur :</strong>
                <p style={{ ...styles.ruleDetails, margin: '4px 0 0 0', fontSize: '0.85rem', color: '#cbd5e0' }}>
                  Précision chirurgicale demandée sur le score du Télévote du gagnant :<br />
                  🎯 Pil-poil : <span style={styles.plus}>+100 pts</span> | 
                  ±20 pts : <span style={styles.plus}>+50 pts</span> | 
                  ±50 pts : <span style={styles.plus}>+20 pts</span><br />
                  ±75 pts : <span style={styles.plus}>+10 pts</span> | 
                  ±150 pts : <span style={styles.plus}>+5 pts</span> | 
                  ±200 pts : <span style={styles.plus}>+1 pt</span>
                </p>
              </div>
            </div>

            <div style={styles.ruleRow}>
              <Skull size={18} color="#e53e3e" style={styles.icon} />
              <div>
                <strong style={styles.ruleName}>Pari Zéro Point (Max 5 choix) :</strong>
                <span style={styles.ruleDetails}><span style={styles.plus}>+15 pts</span> par pays validé à 0 point total. Attention, <span style={styles.minus}>-5 pts</span> de malus par erreur si le pays sauve l'honneur !</span>
              </div>
            </div>
          </div>

          {/* SECTION CLASSEMENT COMPLET VS OFFICIEL */}
          <h3 style={styles.sectionTitle}>
  <BarChart3 size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
  Bonus de comparaison
</h3>
          <div style={styles.card}>
            <div style={styles.ruleRow}>
              <Award size={18} color="#a855f7" style={styles.icon} />
              <div>
                <strong style={styles.ruleName}>Précision chirurgicale :</strong>
                <span style={styles.ruleDetails}><span style={styles.plus}>+2 pts</span> par rang exact trouvé sur l'intégralité de ton classement complet par rapport au dénouement officiel.</span>
              </div>
            </div>
            <div style={styles.ruleRow}>
              <Layers size={18} color="#fc8181" style={styles.icon} />
              <div>
                <strong style={styles.ruleName}>Malus d'Inversion Absolue :</strong>
                <span style={styles.ruleDetails}>Tu as confondu les torchons et les serviettes ? <span style={styles.minus}>-2 pts</span> par favori relégué tout en bas ou inversement. Un membre du Top 5 officiel placé dans ton Bottom 5 (ou l'inverse) déclenche ce malus.</span>
              </div>
            </div>
          </div>

          {/* SECTION BINGO */}
          <h3 style={styles.sectionTitle}>
  <Dices size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
  Règles du bingo
</h3>
          <div style={styles.card}>
            <p style={{ ...styles.ruleDetails, margin: 0, lineHeight: '1.5' }}>
              • Génère une grille de 9 cases aléatoires avant le début du show.<br />
              • Dès que tu es satisfait(e), <strong>verrouille ta grille</strong> pour participer officiellement.<br />
              • Pendant la soirée, l'administrateur valide les événements en direct. Tes cases se coloreront automatiquement.<br />
              • <span style={styles.plus}>Multiplicateurs :</span> Si un événement se produit plusieurs fois (ex: ×2, ×3), tu accumules des occurrences supplémentaires au classement ! Tout bonus complété rapporte gros.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 8, 22, 0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' },
  modal: { width: '100%', maxWidth: '560px', background: '#16132d', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', maxHeight: '85vh', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', fontFamily: "'Outfit', sans-serif" },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' },
  headerTitle: { display: 'flex', alignItems: 'center', gap: '10px' },
  title: { margin: 0, fontSize: '1.2rem', fontFamily: "'Fredoka', sans-serif", color: '#fff', letterSpacing: '0.03em' },
  closeBtn: { background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' },
  body: { padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { 
  margin: '4px 0 8px 0', 
  fontFamily: "'Fredoka', sans-serif", 
  fontSize: '1rem', 
  color: '#ff007f', 
  letterSpacing: '0.02em', 
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center'
},
 card: { background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' },
  ruleRow: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  icon: { marginTop: '2px', flexShrink: 0 },
  ruleName: { color: '#fff', fontSize: '0.9rem', marginRight: '6px' },
  ruleDetails: { color: '#cbd5e0', fontSize: '0.9rem', lineHeight: '1.4' },
  plus: { color: '#68d391', fontWeight: 600 },
  minus: { color: '#fc8181', fontWeight: 600 }
};

export default RulesModal;