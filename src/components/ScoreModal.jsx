import React, { useState } from 'react';
import { X, Trophy, Scale, Smartphone, Award, Trash2, List, ChevronDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const MASTER_COUNTRIES = [
  { id: 'AL', name: 'Albanie', flag: '🇦🇱' }, { id: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { id: 'AM', name: 'Arménie', flag: '🇦🇲' }, { id: 'AU', name: 'Australie', flag: '🇦🇺' },
  { id: 'AT', name: 'Autriche', flag: '🇦🇹' }, { id: 'AZ', name: 'Azerbaïdjan', flag: '🇦🇿' },
  { id: 'BE', name: 'Belgique', flag: '🇧🇪' }, { id: 'BG', name: 'Bulgarie', flag: '🇧🇬' },
  { id: 'CY', name: 'Chypre', flag: '🇨🇾' }, { id: 'HR', name: 'Croatie', flag: '🇭🇷' },
  { id: 'DK', name: 'Danemark', flag: '🇩🇰' }, { id: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { id: 'EE', name: 'Estonie', flag: '🇪🇪' }, { id: 'FI', name: 'Finlande', flag: '🇫🇮' },
  { id: 'FR', name: 'France', flag: '🇫🇷' }, { id: 'GE', name: 'Géorgie', flag: '🇬🇪' },
  { id: 'GR', name: 'Grèce', flag: '🇬🇷' }, { id: 'IE', name: 'Irlande', flag: '🇮🇪' },
  { id: 'IS', name: 'Islande', flag: '🇮🇸' }, { id: 'IL', name: 'Israël', flag: '🇮🇱' },
  { id: 'IT', name: 'Italie', flag: '🇮🇹' }, { id: 'LV', name: 'Lettonie', flag: '🇱🇻' },
  { id: 'LT', name: 'Lituanie', flag: '🇱🇹' }, { id: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { id: 'MT', name: 'Malte', flag: '🇲🇹' }, { id: 'MD', name: 'Moldavie', flag: '🇲🇩' },
  { id: 'NO', name: 'Norvège', flag: '🇳🇴' }, { id: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
  { id: 'PL', name: 'Pologne', flag: '🇵🇱' }, { id: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { id: 'CZ', name: 'Tchéquie', flag: '🇨🇿' }, { id: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
  { id: 'SM', name: 'Saint-Marin', flag: '🇸🇲' }, { id: 'RS', name: 'Serbie', flag: '🇷🇸' },
  { id: 'SI', name: 'Slovénie', flag: '🇸🇮' }, { id: 'SE', name: 'Suède', flag: '🇸🇪' },
  { id: 'CH', name: 'Suisse', flag: '🇨🇭' }, { id: 'UA', name: 'Ukraine', flag: '🇺🇦' },
];

const getCountry = (id) => MASTER_COUNTRIES.find(c => c.id === id);
const getLabel   = (id) => { const c = getCountry(id); return c ? `${c.flag} ${c.name}` : (id || '—'); };

const chip = { display: 'inline-block', fontSize: '0.78rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', minWidth: '36px', textAlign: 'center', flexShrink: 0 };

const PtsChip = ({ pts }) => {
  if (pts > 0) return <span style={{ ...chip, color: '#68d391', background: 'rgba(104,211,145,0.1)' }}>+{pts}</span>;
  if (pts < 0) return <span style={{ ...chip, color: '#fc8181', background: 'rgba(252,129,129,0.1)' }}>{pts}</span>;
  return <span style={{ ...chip, color: '#4a5568', background: 'transparent' }}>—</span>;
};

const StatusIcon = ({ pts, waiting }) => {
  if (waiting) return <Clock size={12} color="#f6ad55" style={{ flexShrink: 0 }} />;
  if (pts > 0)  return <CheckCircle size={12} color="#68d391" style={{ flexShrink: 0 }} />;
  if (pts < 0)  return <XCircle     size={12} color="#fc8181" style={{ flexShrink: 0 }} />;
  return <XCircle size={12} color="#4a5568" style={{ flexShrink: 0 }} />;
};

const ScoreLine = ({ label, sub, pts, waiting }) => {
  const accent = pts > 0 ? '#68d391' : pts < 0 ? '#fc8181' : 'rgba(255,255,255,0.04)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderLeft: `2px solid ${accent}`, borderRadius: '6px', background: 'rgba(0,0,0,0.2)', gap: '8px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: pts === 0 ? '#4a5568' : '#e2e8f0' }}>{label}</span>
        {sub && (
          <span style={{ fontSize: '0.72rem', color: '#718096', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <StatusIcon pts={pts} waiting={waiting} />{sub}
          </span>
        )}
      </div>
      <PtsChip pts={pts} />
    </div>
  );
};

const Bucket = ({ icon, title, lines, t }) => {
  const [open, setOpen] = useState(true);
  const total  = lines.reduce((a, l) => a + l.pts, 0);
  const scored = lines.some(l => l.pts !== 0);
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
      <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff', fontFamily: t.fontBody }} onClick={() => setOpen(o => !o)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', color: '#718096', marginRight: '6px' }}>{icon}</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
          {scored && (
            <span style={{ ...chip, color: total >= 0 ? '#68d391' : '#fc8181', background: total >= 0 ? 'rgba(104,211,145,0.1)' : 'rgba(252,129,129,0.1)', marginLeft: '6px' }}>
              {total >= 0 ? '+' : ''}{total}
            </span>
          )}
        </span>
        <ChevronDown size={14} color="#718096" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {lines.map((l, i) => <ScoreLine key={i} {...l} />)}
        </div>
      )}
    </div>
  );
};

const ScoreModal = ({ isOpen, onClose, player }) => {
  const { theme: t } = useTheme();
  if (!isOpen || !player) return null;

  const { scoreDetails: d, resultsAvailable, computedScore, displayName } = player;
  const waiting = !resultsAvailable;

  const classementsLines = [
    ...d.top5.map((item, idx) => ({
      label: idx === 0 ? `Vainqueur — ${getLabel(item.countryId)}` : `Top 5 #${idx + 1} — ${getLabel(item.countryId)}`,
      sub: item.pts === 5 ? 'Exact !' : item.pts === 2 ? 'Dans le top 5' : item.realTarget ? `Vrai vainqueur : ${getLabel(item.realTarget)}` : 'Hors du top 5',
      pts: item.pts, waiting,
    })),
    ...d.top3Jury.map((item, idx) => ({
      label: `Jury #${idx + 1} — ${getLabel(item.countryId)}`,
      sub: item.pts === 3 ? 'Exact !' : item.pts === 1 ? 'Dans le top 3' : item.realTarget ? `Vrai 1er : ${getLabel(item.realTarget)}` : 'Hors du top 3',
      pts: item.pts, waiting,
    })),
    ...d.top3Public.map((item, idx) => ({
      label: `Télévote #${idx + 1} — ${getLabel(item.countryId)}`,
      sub: item.pts === 3 ? 'Exact !' : item.pts === 1 ? 'Dans le top 3' : item.realTarget ? `Vrai 1er : ${getLabel(item.realTarget)}` : 'Hors du top 3',
      pts: item.pts, waiting,
    })),
  ];

  const bonusLines = [
    { label: `Max 12 pts — ${getLabel(d.most12.countryId)}`, sub: d.most12.pts > 0 ? 'Correct' : d.most12.realId ? `Réel : ${getLabel(d.most12.realId)}` : 'En attente', pts: d.most12.pts, waiting: waiting && d.most12.pts === 0 },
    { label: `Dernier — ${getLabel(d.last.countryId)}`, sub: d.last.pts > 0 ? 'Correct' : d.last.realId ? `Dernier réel : ${getLabel(d.last.realId)}` : 'En attente', pts: d.last.pts, waiting: waiting && d.last.pts === 0 },
    { label: `Pts télévote vainqueur — ${d.winnerPts.val ?? '—'}`, sub: d.winnerPts.realPts != null ? `Réel : ${d.winnerPts.realPts} pts (écart : ${d.winnerPts.delta})` : 'En attente', pts: d.winnerPts.pts, waiting: waiting && d.winnerPts.pts === 0 },
    ...d.zeros.map(item => ({ label: `Zéro point — ${getLabel(item.countryId)}`, sub: item.note, pts: item.pts, waiting: waiting && item.pts === 0 })),
  ];

  const persoLines = [
    d.personalRank.bonus > 0 ? { label: 'Bonus de similitude', sub: 'Positions exactes & top/bottom respectés', pts: d.personalRank.bonus, waiting: false } : null,
    d.personalRank.malus < 0 ? { label: "Malus d'inversion", sub: 'Favoris relégués en bas (ou inversement)', pts: d.personalRank.malus, waiting: false } : null,
  ].filter(Boolean);

  return (
    <>
      <style>{`@keyframes smFadeIn { from { opacity:0; transform:translateY(12px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } } .sm-modal { animation: smFadeIn 0.22s ease; }`}</style>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5,3,15,0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }} onClick={onClose}>
        <div className="sm-modal" style={{ background: t.bgModal, border: `1px solid ${t.border}`, borderRadius: '18px', width: '100%', maxWidth: '420px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.7)', color: '#fff', fontFamily: t.fontBody, position: 'relative', padding: '28px 20px 20px', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>

          <button style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${t.border}`, color: '#718096', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <X size={16} />
          </button>

          {/* HERO */}
          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: 500, color: t.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{displayName || 'Joueur'}</p>
            <p style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: '4rem', fontWeight: 600, lineHeight: 1, color: t.accent, textShadow: `0 0 40px ${t.accentGlow}` }}>{computedScore}</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#4a5568', letterSpacing: '0.06em', textTransform: 'uppercase' }}>points</p>
            {waiting && (
              <p style={{ margin: '12px 0 0', fontSize: '0.78rem', color: '#f6ad55', background: 'rgba(246,173,85,0.08)', border: '1px solid rgba(246,173,85,0.2)', borderRadius: '6px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center' }}>
                <Clock size={12} style={{ marginRight: '5px' }} /> Résultats pas encore publiés
              </p>
            )}
          </div>

          <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${t.border} 30%, ${t.border} 70%, transparent)`, marginBottom: '16px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Bucket t={t} icon={<span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}><Trophy size={13} /><Scale size={13} /><Smartphone size={13} /></span>} title="Classements" lines={classementsLines} />
            <Bucket t={t} icon={<Award size={13} />} title="Bonus & paris" lines={bonusLines} />
            {persoLines.length > 0 && <Bucket t={t} icon={<List size={13} />} title="Classement perso" lines={persoLines} />}
          </div>
        </div>
      </div>
    </>
  );
};

export default ScoreModal;