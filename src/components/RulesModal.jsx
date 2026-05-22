import React from 'react';
import { X, Trophy, Scale, Smartphone, Zap, Skull, Binary, Award, TrendingDown, HelpCircle, Sparkles, BarChart3, Dices } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const RulesModal = ({ isOpen, onClose }) => {
  const { theme: t } = useTheme();
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,22,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '520px', background: t.bgModal, borderRadius: '16px', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', maxHeight: '85vh', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', fontFamily: t.fontBody }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={20} color={t.accent} />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontFamily: t.fontDisplay, color: '#fff', fontWeight: 500 }}>Règles et calculs</h2>
          </div>
          <button style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          <SectionTitle t={t} icon={<Sparkles size={14} />} label="Barème des pronostics" />
          <Card t={t}>
            <RuleRow icon={<Trophy size={17} color={t.accent} />} label="Top 5 Général">
              <PtLine pts={5}  text="pour le vainqueur trouvé exactement" />
              <PtLine pts={2}  text="par pays dans le top 5 (hors 1re place)" />
            </RuleRow>
            <Sep t={t} />
            <RuleRow icon={<Scale size={17} color="#63b3ed" />} label="Top 3 Jury">
              <PtLine pts={3} text="pour le 1er du jury trouvé exactement" />
              <PtLine pts={1} text="par pays présent dans le top 3 jury (2e ou 3e)" />
              <Note t={t} text="Seule la 1re place rapporte le bonus de rang exact." />
            </RuleRow>
            <Sep t={t} />
            <RuleRow icon={<Smartphone size={17} color="#f6ad55" />} label="Top 3 Télévote">
              <PtLine pts={3} text="pour le 1er du télévote trouvé exactement" />
              <PtLine pts={1} text="par pays présent dans le top 3 télévote (2e ou 3e)" />
              <Note t={t} text="Même logique que le jury : seule la 1re place est bonifiée au rang." />
            </RuleRow>
            <Sep t={t} />
            <RuleRow icon={<Zap size={17} color="#ecc94b" />} label="Bonus spéciaux">
              <PtLine pts={5} text="pour le pays ayant reçu le plus de « 12 points » des jurys" />
              <PtLine pts={7} text="pour la lanterne rouge (dernier du classement général)" />
            </RuleRow>
            <Sep t={t} />
            <RuleRow icon={<Binary size={17} color="#4fd1c5" />} label="Points télévote du vainqueur">
              <Note t={t} text="Devine le score exact envoyé par le télévote au grand gagnant :" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginTop: '2px' }}>
                {[['Score exact',100],['Écart ≤ 20',50],['Écart ≤ 50',20],['Écart ≤ 75',10],['Écart ≤ 150',5],['Écart ≤ 200',1]].map(([label, pts]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#a0aec0' }}>{label}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '1px 6px', borderRadius: '20px', color: '#68d391', background: 'rgba(104,211,145,0.1)', flexShrink: 0 }}>+{pts} pts</span>
                  </div>
                ))}
              </div>
            </RuleRow>
            <Sep t={t} />
            <RuleRow icon={<Skull size={17} color="#e53e3e" />} label="Pari Zéro point (5 pays max)">
              <PtLine pts={15} text="par pays confirmé à 0 point" />
              <PtLine pts={-5} text="par pays qui sauve finalement l'honneur" />
            </RuleRow>
          </Card>

          <SectionTitle t={t} icon={<BarChart3 size={14} />} label="Classement personnel" />
          <Card t={t}>
            <Note t={t} text="Pour chaque pays de ton classement complet, trois critères sont évalués. Bonus et malus sont chacun plafonnés à ±10 pts." />
            <Sep t={t} />
            <RuleRow icon={<Award size={17} color="#a855f7" />} label="Bonus">
              <PtLine pts={2} text="par rang exact (même position que le classement officiel)" />
              <PtLine pts={2} text="par pays que tu as mis dans ton top 5 et qui finit dans le top 5 officiel" />
              <PtLine pts={2} text="par pays que tu as mis dans ton bottom 5 et qui finit dans le bottom 5 officiel" />
              <Note t={t} text="Plafond : +10 pts maximum au total." />
            </RuleRow>
            <Sep t={t} />
            <RuleRow icon={<TrendingDown size={17} color="#fc8181" />} label="Malus d'inversion">
              <PtLine pts={-2} text="par favori du top 5 officiel que tu as relégué dans ton bottom 5" />
              <PtLine pts={-2} text="par pays du bottom 5 officiel que tu as placé dans ton top 5" />
              <Note t={t} text="Plafond : −10 pts maximum au total." />
            </RuleRow>
          </Card>

          <SectionTitle t={t} icon={<Dices size={14} />} label="Règles du bingo" />
          <Card t={t}>
            {[
              "Génère une grille de 9 cases aléatoires avant le début du show.",
              "Verrouille ta grille pour participer officiellement.",
              "Pendant la soirée, l'administrateur valide les événements en direct. Tes cases se colorent automatiquement.",
              "Si un événement se répète (×2, ×3…), tu accumules des occurrences supplémentaires au classement bingo.",
            ].map((text, n) => (
              <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: t.accent, background: t.accentSoft, border: `1px solid ${t.accentBorder}`, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{n + 1}</span>
                <span style={{ fontSize: '0.83rem', color: '#cbd5e0', lineHeight: 1.4 }}>{text}</span>
              </div>
            ))}
          </Card>

        </div>
      </div>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const SectionTitle = ({ t, icon, label }) => (
  <h3 style={{ margin: '6px 0 2px', fontFamily: t.fontDisplay, fontSize: '0.95rem', color: t.accent, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
    {icon}{label}
  </h3>
);

const Card = ({ t, children }) => (
  <div style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {children}
  </div>
);

const RuleRow = ({ icon, label, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
    <span style={{ marginTop: '1px', flexShrink: 0 }}>{icon}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: '0 0 6px', fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>{children}</div>
    </div>
  </div>
);

const PtLine = ({ pts, text }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '1px 6px', borderRadius: '20px', flexShrink: 0, whiteSpace: 'nowrap', color: pts > 0 ? '#68d391' : '#fc8181', background: pts > 0 ? 'rgba(104,211,145,0.1)' : 'rgba(252,129,129,0.1)' }}>
      {pts > 0 ? `+${pts}` : pts} pt{Math.abs(pts) > 1 ? 's' : ''}
    </span>
    <span style={{ fontSize: '0.83rem', color: '#cbd5e0', lineHeight: 1.4 }}>{text}</span>
  </div>
);

const Note = ({ t, text }) => (
  <p style={{ margin: 0, fontSize: '0.78rem', color: t.textFaint, lineHeight: 1.4, fontStyle: 'italic' }}>{text}</p>
);

const Sep = ({ t }) => (
  <div style={{ height: '1px', background: t.border, margin: '2px 0' }} />
);

export default RulesModal;