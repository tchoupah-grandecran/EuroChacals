import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { useTheme } from '../ThemeContext';
import { Trophy, Scale, Smartphone, Zap, Skull, Binary, Lock, AlertTriangle, CheckCircle, Send } from 'lucide-react';

const PredictionForm = ({ user, onOpenLeaderboard }) => {
  const { theme: t } = useTheme();

  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const [top5, setTop5] = useState([null, null, null, null, null]);
  const [lastPlace, setLastPlace] = useState('');
  const [publicPoints, setPublicPoints] = useState('');
  const [top3Jury, setTop3Jury] = useState([null, null, null]);
  const [top3Public, setTop3Public] = useState([null, null, null]);
  const [mostTwelvePoints, setMostTwelvePoints] = useState('');
  const [zeroPoints, setZeroPoints] = useState([]);

  useEffect(() => {
    const fetchCountriesAndPredictions = async () => {
      if (!user || !user.uid) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'countries'));
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => a.runningOrder - b.runningOrder);
        setCountries(list);

        const resSnap = await getDoc(doc(db, 'results', 'live'));
        if (resSnap.exists() && resSnap.data().isVotesLocked !== undefined) {
          setIsLocked(resSnap.data().isVotesLocked);
        }

        const predRef = doc(db, 'predictions', user.uid);
        const predSnap = await getDoc(predRef);
        if (predSnap.exists()) {
          const data = predSnap.data();
          if (data.top5) setTop5(data.top5);
          if (data.lastPlace) setLastPlace(data.lastPlace);
          if (data.winnerPublicPoints) setPublicPoints(data.winnerPublicPoints);
          if (data.top3Jury) setTop3Jury(data.top3Jury);
          if (data.top3Public) setTop3Public(data.top3Public);
          if (data.mostTwelvePoints) setMostTwelvePoints(data.mostTwelvePoints);
          if (data.zeroPoints) setZeroPoints(data.zeroPoints);
        }
      } catch (error) {
        console.error("Erreur chargement:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCountriesAndPredictions();
  }, [user]);

  const handleTop5Change = (index, countryId) => {
    if (isLocked) return;
    const newTop5 = [...top5];
    newTop5[index] = countryId || null;
    setTop5(newTop5);
  };

  const handleNestedChange = (state, setState, index, countryId) => {
    if (isLocked) return;
    const newState = [...state];
    newState[index] = countryId || null;
    setState(newState);
  };

  const handleZeroPointsToggle = (countryId) => {
    if (isLocked) return;
    if (zeroPoints.includes(countryId)) {
      setZeroPoints(zeroPoints.filter(id => id !== countryId));
    } else {
      if (zeroPoints.length >= 5) {
        alert("Maximum 5 pays pour le pari 'Zéro Points' !");
        return;
      }
      setZeroPoints([...zeroPoints, countryId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.uid) return;
    if (isLocked) return;

    if (top5.includes(null) || top3Jury.includes(null) || top3Public.includes(null) || !lastPlace || !mostTwelvePoints) {
      setMessage("Remplis l'ensemble des classements et bonus avant d'envoyer !");
      return;
    }
    if (zeroPoints.length < 1) {
      setMessage("Choisis au moins 1 pays (et max 5) pour le pari 'Zéro Points'.");
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      await setDoc(doc(db, 'predictions', user.uid), {
        userId: user.uid,
        userName: user.displayName || "Anonyme",
        top5, lastPlace,
        winnerPublicPoints: parseInt(publicPoints, 10) || 0,
        top3Jury, top3Public, mostTwelvePoints, zeroPoints,
        updatedAt: new Date()
      }, { merge: true });
      setMessage("ok");
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      setMessage("err");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <p style={{ textAlign: 'center', color: t.textMuted, marginTop: '20px', fontFamily: t.fontBody }}>
      Chargement de l'arène...
    </p>
  );

  // ── Dynamic style helpers ──
  const selectStyle = {
    flex: 1, width: '100%',
    padding: '12px 40px 12px 14px',
    borderRadius: '10px',
    background: t.bgInput,
    color: t.textPrimary,
    border: `1px solid ${t.borderLight}`,
    outline: 'none',
    fontFamily: t.fontBody,
    fontSize: '0.95rem',
    appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(t.accent)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  };

  const isError = message === 'err' || (message && message !== 'ok');
  const isSuccess = message === 'ok';

  return (
    <div style={{ background: t.bgCard, padding: '25px', paddingBottom: '160px', borderRadius: '16px', border: `1px solid ${t.border}`, marginTop: '20px', fontFamily: t.fontBody }}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        select option { background-color: ${t.bgInput}; color: #fff; }
      `}</style>

      <h2 style={{ fontFamily: t.fontDisplay, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '1.4rem', margin: '0 0 20px 0', color: t.accent, textAlign: 'center' }}>
        Tes Pronostics
      </h2>

      {isLocked && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(246,173,85,0.1)', color: '#f6ad55', border: '1px solid rgba(246,173,85,0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 500, marginBottom: '20px', fontSize: '0.9rem' }}>
          <Lock size={16} style={{ marginRight: '8px' }} />
          Les pronostics sont clos pour cette édition. Déroulement de la soirée en cours !
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* TOP 3 JURY */}
        <Section t={t}>
          <SectionTitle t={t} icon={<Scale size={18} color="#63b3ed" />} label="Top 3 du Jury" />
          {top3Jury.map((current, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <span style={{ fontFamily: t.fontDisplay, fontWeight: 500, color: t.accent, minWidth: '30px' }}>#{idx + 1}</span>
              <select value={current || ''} onChange={(e) => handleNestedChange(top3Jury, setTop3Jury, idx, e.target.value)} style={selectStyle} disabled={isLocked}>
                <option value="">Sélectionne le pays n°{idx + 1}</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.flag}  {c.name}</option>)}
              </select>
            </div>
          ))}
        </Section>

        {/* TOP 3 PUBLIC */}
        <Section t={t}>
          <SectionTitle t={t} icon={<Smartphone size={18} color="#f6ad55" />} label="Top 3 du Public" />
          {top3Public.map((current, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <span style={{ fontFamily: t.fontDisplay, fontWeight: 500, color: t.accent, minWidth: '30px' }}>#{idx + 1}</span>
              <select value={current || ''} onChange={(e) => handleNestedChange(top3Public, setTop3Public, idx, e.target.value)} style={selectStyle} disabled={isLocked}>
                <option value="">Sélectionne le pays n°{idx + 1}</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.flag}  {c.name}</option>)}
              </select>
            </div>
          ))}
        </Section>

        {/* TOP 5 GENERAL */}
        <Section t={t}>
          <SectionTitle t={t} icon={<Trophy size={18} color={t.accent} />} label="Top 5 Général" />
          {top5.map((current, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <span style={{ fontFamily: t.fontDisplay, fontWeight: 500, color: t.accent, minWidth: '30px' }}>#{idx + 1}</span>
              <select value={current || ''} onChange={(e) => handleTop5Change(idx, e.target.value)} style={selectStyle} disabled={isLocked}>
                <option value="">Sélectionne le pays n°{idx + 1}</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.flag}  {c.name}</option>)}
              </select>
            </div>
          ))}
        </Section>

        {/* BONUS */}
        <Section t={t}>
          <SectionTitle t={t} icon={<Zap size={18} color="#ecc94b" />} label="Bonus & Spécialités" />
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: t.textMuted }}>
              Quel pays obtiendra le plus de "12 points" des jurys ?
            </label>
            <select value={mostTwelvePoints} onChange={(e) => setMostTwelvePoints(e.target.value)} style={selectStyle} disabled={isLocked}>
              <option value="">Choisis le favori des jurys</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.flag}  {c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: t.textMuted }}>
              Dernier du classement général
            </label>
            <select value={lastPlace} onChange={(e) => setLastPlace(e.target.value)} style={selectStyle} disabled={isLocked}>
              <option value="">Qui héritera de la lanterne rouge ?</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.flag}  {c.name}</option>)}
            </select>
          </div>
        </Section>

        {/* ZERO POINTS */}
        <Section t={t}>
          <SectionTitle t={t} icon={<Skull size={18} color="#e53e3e" />} label="Qui aura 0 point ?" />
          <p style={{ fontSize: '0.8rem', color: t.textMuted, margin: '-8px 0 15px 0', lineHeight: '1.4' }}>
            Gagne +15 pts par bon choix, mais perds -5 pts si le pays récolte le moindre point !
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
            {countries.map(c => {
              const isChecked = zeroPoints.includes(c.id);
              return (
                <button type="button" key={c.id} onClick={() => handleZeroPointsToggle(c.id)} disabled={isLocked}
                  style={isChecked
                    ? { background: t.accent, color: '#fff', border: `1px solid ${t.accent}`, padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: t.fontBody, fontWeight: 700, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', boxShadow: `0 0 8px ${t.accentGlow}` }
                    : { background: t.bgInput, color: '#fff', border: `1px solid ${t.border}`, padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: t.fontBody, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                  }>
                  {c.flag}  {c.name}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '0.85rem', color: t.accent, marginTop: '10px', fontWeight: 500 }}>
            Sélectionnés : {zeroPoints.length}/5
          </p>
        </Section>

        {/* POINTS PUBLIC VAINQUEUR */}
        <Section t={t}>
          <SectionTitle t={t} icon={<Binary size={18} color="#4fd1c5" />} label="Points Public du vainqueur" />
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: t.textMuted }}>
            Devine le score exact envoyé par le télévote au grand gagnant :
          </label>
          <input type="number" placeholder="Ex: 350" value={publicPoints}
            onChange={(e) => setPublicPoints(e.target.value)}
            required disabled={isLocked}
            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: t.bgInput, color: t.textPrimary, border: `1px solid ${t.borderLight}`, boxSizing: 'border-box', fontFamily: t.fontBody, fontSize: '0.95rem', outline: 'none' }}
          />
        </Section>

        {/* ACTION ZONE */}
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '1126px', background: 'rgba(22,23,29,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', boxSizing: 'border-box', borderTop: `1px solid ${t.border}`, zIndex: 100, boxShadow: '0 -10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
          {message && message !== 'ok' && message !== 'err' && (
            <p style={{ textAlign: 'center', fontWeight: 500, margin: '0 0 12px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: t.fontBody, color: '#fc8181' }}>
              <AlertTriangle size={16} /> {message}
            </p>
          )}
          {isSuccess && (
            <p style={{ textAlign: 'center', fontWeight: 500, margin: '0 0 12px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: t.fontBody, color: '#68d391' }}>
              <CheckCircle size={16} /> Pronostics enregistrés ! Que la bataille commence !
            </p>
          )}
          {isError && message === 'err' && (
            <p style={{ textAlign: 'center', fontWeight: 500, margin: '0 0 12px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: t.fontBody, color: '#fc8181' }}>
              <AlertTriangle size={16} /> Erreur lors de la sauvegarde.
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            {isLocked ? (
              <div style={{ flex: 1, height: '50px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: '#718096', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, fontSize: '1rem', fontFamily: t.fontBody }}>
                <Lock size={16} style={{ marginRight: '6px' }} /> Grilles figées et closes.
              </div>
            ) : (
              <button type="submit" disabled={saving}
                style={{ flex: 1, height: '50px', background: saving ? '#4a5568' : t.accent, color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, fontFamily: t.fontBody, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1rem', boxShadow: saving ? 'none' : `0 0 15px ${t.accentGlow}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {saving ? 'Enregistrement...' : <><Send size={16} style={{ marginRight: '8px' }} />Valider mes pronostics</>}
              </button>
            )}
            <button type="button" onClick={onOpenLeaderboard} title="Classement Général"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', width: '50px', height: '50px', background: t.bgCard, border: `1px solid ${t.borderLight}`, borderRadius: '10px', cursor: 'pointer', boxSizing: 'border-box' }}>
              <Trophy size={20} color="#ffd700" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const Section = ({ t, children }) => (
  <div style={{ background: t.bgSection, padding: '18px', borderRadius: '12px', border: `1px solid ${t.border}` }}>
    {children}
  </div>
);

const SectionTitle = ({ t, icon, label }) => (
  <h3 style={{ display: 'flex', alignItems: 'center', fontFamily: t.fontDisplay, fontWeight: 400, letterSpacing: '0.04em', margin: '0 0 15px 0', fontSize: '1.05rem', color: '#cbd5e0', borderBottom: `1px solid ${t.border}`, paddingBottom: '8px' }}>
    <span style={{ marginRight: '8px', display: 'flex' }}>{icon}</span>
    {label}
  </h3>
);

export default PredictionForm;