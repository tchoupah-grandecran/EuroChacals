import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { BINGO_ITEMS } from '../data/bingoItems';
import { useTheme } from '../ThemeContext';
import { ArrowLeft, Calculator, Award, Lock, Unlock, Globe, RefreshCw, Plus, Minus, Settings2, Dices, ChevronDown, AlertTriangle, X } from 'lucide-react';

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

const CATEGORIES = [
  { id: 'perf',    label: 'Performance',  color: '#63b3ed' },
  { id: 'costume', label: 'Costumes',     color: '#f6ad55' },
  { id: 'scene',   label: 'Scénographie', color: '#68d391' },
  { id: 'vote',    label: 'Vote',         color: '#fc8181' },
];

// ── CustomSelect ──────────────────────────────────────────────────────────────
const CustomSelect = ({ value, onChange, options, placeholder, disabled, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button type="button" onClick={() => !disabled && setIsOpen(p => !p)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '11px 14px', background: t.bgInput, border: `1px solid ${t.borderLight}`, borderRadius: '8px', color: '#fff', fontFamily: t.fontBody, fontSize: '0.95rem', textAlign: 'left', boxSizing: 'border-box', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? `${selected.flag} ${selected.label}` : placeholder}
        </span>
        <ChevronDown size={16} color={t.accent} style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setIsOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: '10px', zIndex: 999, maxHeight: '220px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', padding: '4px' }}>
            {options.map(opt => (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setIsOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: t.fontBody, fontSize: '0.9rem', textAlign: 'left', background: opt.value === value ? t.accentSoft : 'transparent', color: opt.value === value ? t.accent : '#fff' }}>
                <span>{opt.flag}</span><span>{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── ConfirmModal ──────────────────────────────────────────────────────────────
const ConfirmModal = ({ isOpen, onConfirm, onCancel, t }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(10,8,22,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onCancel}>
      <div style={{ background: t.bgModal, border: '1px solid rgba(246,173,85,0.25)', borderRadius: '16px', padding: '28px 24px 20px', width: '100%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 15px 35px rgba(0,0,0,0.6)', fontFamily: t.fontBody }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}><AlertTriangle size={28} color="#f6ad55" /></div>
        <h3 style={{ fontFamily: t.fontDisplay, margin: '0 0 10px 0', fontSize: '1.2rem', color: '#fff', fontWeight: 500 }}>Réinitialiser le Bingo ?</h3>
        <p style={{ fontSize: '0.85rem', color: '#a0aec0', lineHeight: '1.5', margin: '0 0 20px 0' }}>
          Toutes les validations seront effacées et les grilles des joueurs déverrouillées. Cette action est irréversible.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${t.border}`, borderRadius: '8px', color: '#cbd5e0', fontFamily: t.fontBody, fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}>
            <X size={15} style={{ marginRight: '6px' }} /> Annuler
          </button>
          <button onClick={onConfirm} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', background: 'rgba(229,62,62,0.15)', border: '1px solid rgba(229,62,62,0.4)', borderRadius: '8px', color: '#fc8181', fontFamily: t.fontBody, fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>
            <RefreshCw size={15} style={{ marginRight: '6px' }} /> Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};

// ── AdminPanel ────────────────────────────────────────────────────────────────
const AdminPanel = ({ onBack }) => {
  const { theme: t } = useTheme();
  const isJunior = t.id === 'junior';
  const [activeAdminTab, setActiveAdminTab] = useState('general');
  const [countryScores, setCountryScores]   = useState(MASTER_COUNTRIES.map(c => ({ ...c, jury: 0, public: 0, total: 0 })));
  const [activeFinalistIds, setActiveFinalistIds] = useState([]);
  const [mostTwelvePoints, setMostTwelvePoints]   = useState('');
  const [isVotesLocked, setIsVotesLocked]   = useState(false);
  const [calculating, setCalculating]       = useState(false);
  const [syncingCountries, setSyncingCountries] = useState(false);
  const [statusMessage, setStatusMessage]   = useState('');
  const [validated, setValidated]           = useState({});
  const [resetting, setResetting]           = useState(false);
  const [activeCategory, setActiveCategory] = useState('perf');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const countriesSnap = await getDocs(collection(db, 'countries'));
        setActiveFinalistIds(countriesSnap.docs.map(d => d.id));
        const docSnap = await getDoc(doc(db, 'results', 'officialRawScores'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.scores) setCountryScores(data.scores);
          if (data.mostTwelvePoints) setMostTwelvePoints(data.mostTwelvePoints);
        }
        const liveSnap = await getDoc(doc(db, 'results', 'live'));
        if (liveSnap.exists() && liveSnap.data().isVotesLocked !== undefined) setIsVotesLocked(liveSnap.data().isVotesLocked);
      } catch (err) { console.error("Erreur init admin", err); }
    };
    loadAdminData();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'bingo_state', 'global'), (snap) => {
      setValidated(snap.exists() ? (snap.data().validated || {}) : {});
    });
    return () => unsub();
  }, []);

  useEffect(() => {
  if (isJunior && activeAdminTab === 'bingo') setActiveAdminTab('general');
}, [isJunior]);

  const handleToggleFinalist = (id) => setActiveFinalistIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleSyncCountriesToFirebase = async () => {
    if (activeFinalistIds.length === 0) { setStatusMessage("Impossible de synchroniser sans aucun pays !"); return; }
    setSyncingCountries(true);
    setStatusMessage("Déploiement de la liste des finalistes...");
    try {
      const snap = await getDocs(collection(db, 'countries'));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      const selectedList = MASTER_COUNTRIES.filter(c => activeFinalistIds.includes(c.id));
      await Promise.all(selectedList.map((country, index) => setDoc(doc(db, 'countries', country.id), { name: country.name, flag: country.flag, runningOrder: index + 1 })));
      setCountryScores(prev => {
        const cur = [...prev];
        selectedList.forEach(sm => { if (!cur.some(cs => cs.id === sm.id)) cur.push({ ...sm, jury: 0, public: 0, total: 0 }); });
        return cur;
      });
      setStatusMessage("Liste synchronisée !");
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) { setStatusMessage("Erreur lors de la synchronisation."); }
    finally { setSyncingCountries(false); }
  };

  const handleToggleLock = async () => {
    const next = !isVotesLocked;
    try {
      await setDoc(doc(db, 'results', 'live'), { isVotesLocked: next }, { merge: true });
      setIsVotesLocked(next);
      setStatusMessage(next ? "Pronostics désormais CLOS !" : "Pronostics OUVERTS !");
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) { setStatusMessage("Erreur lors du verrouillage."); }
  };

  const handleScoreChange = (id, field, value) => {
    const numericValue = parseInt(value, 10) || 0;
    setCountryScores(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: numericValue };
      updated.total = updated.jury + updated.public;
      return updated;
    }));
  };

  const handleCalculateScores = async () => {
    if (!mostTwelvePoints) { setStatusMessage("Sélectionne d'abord le pays avec le plus de 12 points."); return; }
    setCalculating(true);
    setStatusMessage('Calcul des scores...');
    try {
      const activeScores    = countryScores.filter(c => activeFinalistIds.includes(c.id));
      const sortedCountries = [...activeScores].sort((a, b) => b.total - a.total);
      const officialIds     = sortedCountries.map(c => c.id);
      const officialJuryIds   = [...activeScores].sort((a, b) => b.jury   - a.jury).map(c => c.id);
      const officialPublicIds = [...activeScores].sort((a, b) => b.public - a.public).map(c => c.id);
      await setDoc(doc(db, 'results', 'officialRawScores'), { scores: countryScores, mostTwelvePoints });
      await setDoc(doc(db, 'results', 'official'), { rank: officialIds });
      const officialTop5 = officialIds.slice(0, 5);
      const officialLastPlaceId = officialIds[officialIds.length - 1];
      const querySnapshot = await getDocs(collection(db, 'predictions'));
      await Promise.all(querySnapshot.docs.map(async (userDoc) => {
        const data = userDoc.data();
        const userId = userDoc.id;
        let score = 0;
        if (data.top5) data.top5.forEach((id, idx) => { if (!id) return; if (idx === 0 && id === officialIds[0]) score += 5; else if (officialTop5.includes(id)) score += 2; });
        if (data.top3Jury) { const top3J = officialJuryIds.slice(0,3); data.top3Jury.forEach((id, idx) => { if (!id) return; if (idx === 0 && id === officialJuryIds[0]) score += 3; else if (top3J.includes(id)) score += 1; }); }
        if (data.top3Public) { const top3P = officialPublicIds.slice(0,3); data.top3Public.forEach((id, idx) => { if (!id) return; if (idx === 0 && id === officialPublicIds[0]) score += 3; else if (top3P.includes(id)) score += 1; }); }
        if (data.mostTwelvePoints === mostTwelvePoints) score += 5;
        if (data.lastPlace === officialLastPlaceId) score += 7;
        if (data.zeroPoints) data.zeroPoints.forEach(cid => { const a = activeScores.find(c => c.id === cid); if (a) { if (a.total === 0) score += 15; else score -= 5; } });
        const winner = activeScores.find(c => c.id === officialIds[0]);
        if (winner && data.winnerPublicPoints !== undefined) { const delta = Math.abs(data.winnerPublicPoints - winner.public); if (delta === 0) score += 100; else if (delta <= 20) score += 50; else if (delta <= 50) score += 20; else if (delta <= 75) score += 10; else if (delta <= 150) score += 5; else if (delta <= 200) score += 1; }
        if (data.myPersonalRank) {
          const userBottom5 = data.myPersonalRank.slice(-5);
          data.myPersonalRank.forEach((cid, idx) => { if (idx < officialIds.length && cid === officialIds[idx]) score += 2; });
          officialTop5.forEach(fav => { if (userBottom5.includes(fav)) score -= 2; });
        }
        await setDoc(doc(db, 'leaderboard', userId), { displayName: data.userName || data.userDisplayName || "Anonyme", score, updatedAt: new Date(), predictions: { top5: data.top5||[], top3Jury: data.top3Jury||[], top3Public: data.top3Public||[], mostTwelvePoints: data.mostTwelvePoints||'', lastPlace: data.lastPlace||'', winnerPublicPoints: data.winnerPublicPoints ?? null, zeroPoints: data.zeroPoints||[], myPersonalRank: data.myPersonalRank||[] } });
      }));
      setStatusMessage("Scores publiés avec succès !");
    } catch (err) { console.error(err); setStatusMessage('Erreur critique durant le calcul.'); }
    finally { setCalculating(false); }
  };

  const handleBingoIncrement = async (itemId) => {
    const next = (validated[itemId] || 0) + 1;
    const newV = { ...validated, [itemId]: next };
    setValidated(newV);
    await setDoc(doc(db, 'bingo_state', 'global'), { validated: newV, updatedAt: new Date() }, { merge: true });
    try {
      const gridsSnap = await getDocs(collection(db, 'bingo_grids'));
      const batch = writeBatch(db);
      let hasWrites = false;
      gridsSnap.docs.forEach(gridDoc => {
        const d = gridDoc.data();
        if (!d.locked || d.completedAt) return;
        if (d.grid.every(id => (newV[id] || 0) >= 1)) { batch.set(gridDoc.ref, { completedAt: new Date() }, { merge: true }); hasWrites = true; }
      });
      if (hasWrites) await batch.commit();
    } catch (e) { console.error(e); }
  };

  const handleBingoDecrement = async (itemId) => {
    const current = validated[itemId] || 0;
    if (current <= 0) return;
    const newV = { ...validated, [itemId]: current - 1 };
    setValidated(newV);
    await setDoc(doc(db, 'bingo_state', 'global'), { validated: newV, updatedAt: new Date() }, { merge: true });
  };

  const handleBingoResetConfirmed = async () => {
    setShowResetConfirm(false);
    setResetting(true);
    try {
      await setDoc(doc(db, 'bingo_state', 'global'), { validated: {}, updatedAt: new Date() });
      const snap = await getDocs(collection(db, 'bingo_grids'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.set(d.ref, { locked: false, completedAt: null, grid: d.data().grid }, { merge: true }));
      await batch.commit();
      setValidated({});
    } catch (e) { console.error(e); } finally { setResetting(false); }
  };

  const visibleCountryScores = countryScores.filter(c => activeFinalistIds.includes(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  const filteredBingoItems   = BINGO_ITEMS.filter(i => i.category === activeCategory);
  const totalBingoValidated  = Object.values(validated).filter(v => v > 0).length;
  const totalBingoOccurrences = Object.values(validated).reduce((a, b) => a + b, 0);
  const twelvePointsOptions  = MASTER_COUNTRIES.filter(c => activeFinalistIds.includes(c.id)).map(c => ({ value: c.id, label: c.name, flag: c.flag }));

  const subTabActive = { flex: 1, padding: '10px 0', background: t.accent, border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: t.fontBody, boxShadow: `0 2px 10px ${t.accentGlow}`, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const subTab       = { flex: 1, padding: '10px 0', background: 'transparent', border: 'none', color: t.textMuted, borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, fontFamily: t.fontBody, display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <div style={{ padding: '10px 0 20px', color: '#fff', fontFamily: t.fontBody, boxSizing: 'border-box' }}>
      <style>{`input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}input[type=number]{-moz-appearance:textfield;}`}</style>

      <ConfirmModal isOpen={showResetConfirm} onConfirm={handleBingoResetConfirmed} onCancel={() => setShowResetConfirm(false)} t={t} />

      <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', padding: '0 10px' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${t.border}`, color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: t.fontBody }}>
          <ArrowLeft size={16} /> Retour
        </button>
        <h2 style={{ fontFamily: t.fontDisplay, margin: 0, fontSize: '1.3rem', color: t.accent }}>Console Admin</h2>
      </header>

      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', padding: '4px', borderRadius: '10px', marginBottom: '20px', border: `1px solid ${t.border}`, margin: '0 10px 20px 10px' }}>
        <button onClick={() => setActiveAdminTab('general')} style={activeAdminTab === 'general' ? subTabActive : subTab}>
          <Settings2 size={14} style={{ marginRight: '6px' }} /> Mode classement
        </button>
        {!isJunior && (
  <button onClick={() => setActiveAdminTab('bingo')} style={activeAdminTab === 'bingo' ? subTabActive : subTab}>
    <Dices size={14} style={{ marginRight: '6px' }} /> Mode bingo
  </button>
)}
      </div>

      {activeAdminTab === 'general' && (
        <div>
          {/* Lock card */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: '1px solid', marginBottom: '20px', margin: '0 10px 20px 10px', boxSizing: 'border-box', backgroundColor: isVotesLocked ? 'rgba(229,62,62,0.1)' : 'rgba(72,187,120,0.1)', borderColor: isVotesLocked ? 'rgba(229,62,62,0.3)' : 'rgba(72,187,120,0.3)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#cbd5e0', letterSpacing: '0.04em' }}>Statut de la session</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isVotesLocked ? '#fc8181' : '#68d391' }}>{isVotesLocked ? 'Fermée' : 'Ouverte'}</span>
            </div>
            <button onClick={handleToggleLock} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontFamily: t.fontBody, fontWeight: 600, fontSize: '0.85rem', backgroundColor: isVotesLocked ? '#48bb78' : '#e53e3e' }}>
              {isVotesLocked ? <><Unlock size={16} /> Ouvrir</> : <><Lock size={16} /> Clôturer</>}
            </button>
          </div>

          {/* Countries config */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px', margin: '0 10px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Globe size={18} color="#4fd1c5" />
              <h3 style={{ fontFamily: t.fontDisplay, margin: 0, fontSize: '1.1rem' }}>Configuration des Pays Finalistes</h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: t.textMuted }}>Coche les pays qualifiés pour la finale, puis synchronise.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
              {MASTER_COUNTRIES.map(c => {
                const isChecked = activeFinalistIds.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => handleToggleFinalist(c.id)}
                    style={isChecked ? { background: t.accent, color: '#fff', border: `1px solid ${t.accent}`, padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: t.fontBody, fontWeight: 700, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', boxShadow: `0 0 8px ${t.accentGlow}` } : { background: t.bgInput, color: t.textMuted, border: `1px solid ${t.border}`, padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: t.fontBody, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.flag} {c.name}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <p style={{ fontSize: '0.85rem', color: '#4fd1c5', margin: 0, fontWeight: 500 }}>Sélectionnés : {activeFinalistIds.length} pays</p>
              <button onClick={handleSyncCountriesToFirebase} disabled={syncingCountries} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#4fd1c5', color: '#1a1635', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, fontFamily: t.fontBody, cursor: 'pointer' }}>
                <RefreshCw size={14} />{syncingCountries ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </div>
          </div>

          <div style={{ margin: '20px 0' }} />

          {/* Scores */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px', margin: '0 10px', boxSizing: 'border-box' }}>
            <h3 style={{ fontFamily: t.fontDisplay, margin: '0 0 4px', fontSize: '1.1rem' }}>Entrée des points Eurovision</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: t.textMuted }}>Saisis les points Jury et Télévote issus des résultats officiels.</p>

            <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${t.border}`, marginBottom: '20px' }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', padding: '10px', fontSize: '0.85rem', color: t.textMuted, fontWeight: 600 }}>
                <div style={{ flex: 2, minWidth: 0, fontSize: '0.9rem' }}>Pays</div>
                <div style={{ flex: 1, minWidth: 0, fontSize: '0.9rem' }}>Jury</div>
                <div style={{ flex: 1, minWidth: 0, fontSize: '0.9rem' }}>Public</div>
                <div style={{ flex: 1, minWidth: 0, fontSize: '0.9rem', textAlign: 'right', fontWeight: 600 }}>Total</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '350px', overflowY: 'auto' }}>
                {visibleCountryScores.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: t.textMuted, fontSize: '0.9rem' }}>Aucun pays finaliste déployé.</div>
                ) : (
                  visibleCountryScores.map(country => (
                    <div key={country.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: `1px solid ${t.border}`, background: 'rgba(15,12,32,0.2)' }}>
                      <div style={{ flex: 2, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{country.flag}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>{country.name}</span>
                      </div>
                      {['jury', 'public'].map(field => (
                        <div key={field} style={{ flex: 1, minWidth: 0 }}>
                          <input type="number" value={country[field] || ''} placeholder="0"
                            onChange={(e) => handleScoreChange(country.id, field, e.target.value)}
                            style={{ width: '80%', maxWidth: '70px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${t.border}`, borderRadius: '6px', color: '#fff', padding: '8px', fontSize: '0.9rem', fontFamily: t.fontBody, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'right', fontWeight: 700, color: country.total > 0 ? t.accent : t.textMuted, fontSize: '0.9rem' }}>
                        {country.total} pts
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`, padding: '14px', borderRadius: '8px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Award size={18} color="#ffd700" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: '#fff' }}>Maximum de "12 Points"</h4>
              </div>
              <CustomSelect t={t} value={mostTwelvePoints} onChange={setMostTwelvePoints} options={twelvePointsOptions} placeholder="Choisir parmi les pays de la finale" disabled={twelvePointsOptions.length === 0} />
            </div>
          </div>

          <div style={{ marginTop: '24px', padding: '0 10px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {statusMessage && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, padding: '10px 14px', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#fff', textAlign: 'center' }}>{statusMessage}</span>
              </div>
            )}
            <button onClick={handleCalculateScores} disabled={calculating} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', background: t.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, fontFamily: t.fontBody, cursor: 'pointer', boxShadow: `0 0 15px ${t.accentGlow}` }}>
              <Calculator size={18} style={{ marginRight: '8px' }} />
              {calculating ? 'Calcul des résultats...' : 'Publier les résultats'}
            </button>
          </div>
        </div>
      )}

      {activeAdminTab === 'bingo' && !isJunior && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px', margin: '0 10px', boxSizing: 'border-box' }}>
          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[['événements', totalBingoValidated], ['occurrences', totalBingoOccurrences]].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`, borderRadius: '8px', padding: '8px 14px', minWidth: '70px' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: t.accent, fontFamily: t.fontDisplay }}>{val}</span>
                <span style={{ fontSize: '0.7rem', color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
              </div>
            ))}
            <button onClick={() => setShowResetConfirm(true)} disabled={resetting} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.3)', color: '#fc8181', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: t.fontBody, fontSize: '0.8rem', fontWeight: 600 }}>
              <RefreshCw size={13} />{resetting ? 'Reset...' : 'Reset Bingo'}
            </button>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                style={{ padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: t.fontBody, fontSize: '0.75rem', transition: 'all 0.2s', background: activeCategory === cat.id ? cat.color : 'rgba(255,255,255,0.04)', color: activeCategory === cat.id ? '#0f0c20' : cat.color, border: `1px solid ${activeCategory === cat.id ? cat.color : 'rgba(255,255,255,0.08)'}`, fontWeight: activeCategory === cat.id ? 700 : 500 }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Items list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredBingoItems.map(item => {
              const count = validated[item.id] || 0;
              const isActive = count > 0;
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', border: '1px solid', transition: 'all 0.2s', background: isActive ? t.accentSoft : 'rgba(255,255,255,0.02)', borderColor: isActive ? t.accentBorder : 'rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.emoji}</span>
                    <span style={{ fontSize: '0.85rem', lineHeight: '1.2', color: isActive ? '#fff' : t.textMuted }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => handleBingoDecrement(item.id)} disabled={count === 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${t.border}`, color: t.textMuted, cursor: 'pointer' }}>
                      <Minus size={14} />
                    </button>
                    <span style={{ fontSize: '1rem', minWidth: '24px', textAlign: 'center', fontFamily: t.fontDisplay, color: isActive ? t.accent : '#4a5568', fontWeight: isActive ? 700 : 400 }}>{count}</span>
                    <button onClick={() => handleBingoIncrement(item.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: t.accent, border: 'none', color: '#fff', cursor: 'pointer', boxShadow: `0 0 8px ${t.accentGlow}` }}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;