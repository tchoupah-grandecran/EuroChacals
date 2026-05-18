import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

// Import des icônes Lucide (avec l'ajout de Lock)
import { Trophy, Scale, Smartphone, Zap, Skull, Binary, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

const PredictionForm = ({ user, onOpenLeaderboard }) => {
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
      setMessage("❌ Remplis l'ensemble des classements et bonus avant d'envoyer !");
      return;
    }
    if (zeroPoints.length < 1) {
      setMessage("❌ Choisis au moins 1 pays (et max 5) pour le pari 'Zéro Points'.");
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      await setDoc(doc(db, 'predictions', user.uid), {
        userId: user.uid,
        userName: user.displayName || "Anonyme",
        top5,
        lastPlace,
        winnerPublicPoints: parseInt(publicPoints, 10) || 0,
        top3Jury,
        top3Public,
        mostTwelvePoints,
        zeroPoints,
        updatedAt: new Date()
      });
      setMessage("Pronostics complets enregistrés ! Que la bataille commence !");
    } catch (error) {
      setMessage("❌ Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', color: '#aaa', marginTop: '20px', fontFamily: "'Outfit', sans-serif" }}>Chargement de l'arène...</p>;

  return (
    <div style={styles.container}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        select option {
          background-color: #1a1635;
          color: #fff;
        }
      `}</style>

      <h2 style={styles.title}>Tes Pronostics</h2>
      
      {isLocked && (
        <div style={styles.lockBanner}>
          <Lock size={16} style={{ marginRight: '8px' }} />
          Les pronostics sont clos pour cette édition. Déroulement de la soirée en cours !
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* TOP 3 JURY */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <Scale size={18} color="#63b3ed" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Top 3 du Jury
          </h3>
          {top3Jury.map((current, idx) => (
            <div key={idx} style={styles.row}>
              <span style={styles.rankNumber}>#{idx + 1}</span>
              <select value={current || ''} onChange={(e) => handleNestedChange(top3Jury, setTop3Jury, idx, e.target.value)} style={styles.select} disabled={isLocked}>
                <option value="">Sélectionne le pays n°{idx + 1}</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.flag} &nbsp; {c.name}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* TOP 3 PUBLIC */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <Smartphone size={18} color="#f6ad55" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Top 3 du Public
          </h3>
          {top3Public.map((current, idx) => (
            <div key={idx} style={styles.row}>
              <span style={styles.rankNumber}>#{idx + 1}</span>
              <select value={current || ''} onChange={(e) => handleNestedChange(top3Public, setTop3Public, idx, e.target.value)} style={styles.select} disabled={isLocked}>
                <option value="">Sélectionne le pays n°{idx + 1}</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.flag} &nbsp; {c.name}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* TOP 5 GENERAL */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <Trophy size={18} color="#ff007f" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Top 5 Général
          </h3>
          {top5.map((current, idx) => (
            <div key={idx} style={styles.row}>
              <span style={styles.rankNumber}>#{idx + 1}</span>
              <select value={current || ''} onChange={(e) => handleTop5Change(idx, e.target.value)} style={styles.select} disabled={isLocked}>
                <option value="">Sélectionne le pays n°{idx + 1}</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.flag} &nbsp; {c.name}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* BONUS : MOST 12 POINTS & DERNIER */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <Zap size={18} color="#ecc94b" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Bonus & Spécialités
          </h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={styles.label}>Quel pays obtiendra le plus de "12 points" des jurys ?</label>
            <select value={mostTwelvePoints} onChange={(e) => setMostTwelvePoints(e.target.value)} style={styles.select} disabled={isLocked}>
              <option value="">Choisis le favori des jurys</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.flag} &nbsp; {c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.label}>Dernier du classement général</label>
            <select value={lastPlace} onChange={(e) => setLastPlace(e.target.value)} style={styles.select} disabled={isLocked}>
              <option value="">Qui héritera de la lanterne rouge ?</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.flag} &nbsp; {c.name}</option>)}
            </select>
          </div>
        </div>

        {/* PARI RISQUÉ : LES ZERO POINTS */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <Skull size={18} color="#e53e3e" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Qui aura 0 point ?
          </h3>
          <p style={styles.inputDesc}>Gagne +15 pts par bon choix, mais perds -5 pts si le pays récolte le moindre point !</p>
          <div style={styles.gridCheckbox}>
            {countries.map(c => {
              const isChecked = zeroPoints.includes(c.id);
              return (
                <button type="button" key={c.id} onClick={() => handleZeroPointsToggle(c.id)} style={isChecked ? styles.checkedBtn : styles.uncheckedBtn} disabled={isLocked}>
                  {c.flag} &nbsp; {c.name}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '0.85rem', color: '#ff007f', marginTop: '10px', fontWeight: 500 }}>Sélectionnés : {zeroPoints.length}/5</p>
        </div>

        {/* POINTS PUBLIC DU GAGNANT */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <Binary size={18} color="#4fd1c5" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Points Public du vainqueur
          </h3>
          <label style={styles.label}>Devine le score exact envoyé par le télévote au grand gagnant :</label>
          <input type="number" placeholder="Ex: 350" value={publicPoints} onChange={(e) => setPublicPoints(e.target.value)} style={styles.input} required disabled={isLocked} />
        </div>

        {/* 👑 ZONE ACTIONS FLOTTANTE EN BAS (BOUTONS CÔTE À CÔTE) */}
        <div style={styles.actionZone}>
          {message && (
            <p style={{ ...styles.message, color: message.startsWith('❌') ? '#fc8181' : '#68d391' }}>
              {message.startsWith('❌') ? <AlertTriangle size={16} style={{ marginRight: '6px' }} /> : <CheckCircle size={16} style={{ marginRight: '6px' }} />}
              {message}
            </p>
          )}

          <div style={styles.btnGroup}>
            {/* 1. Bouton ou Notice principale à gauche */}
            {isLocked ? (
              <div style={styles.lockedNotice}>
                <Lock size={16} style={{ marginRight: '6px' }} />
                <span>Grilles figées et closes.</span>
              </div>
            ) : (
              <button type="submit" disabled={saving} style={saving ? styles.btnDisabled : styles.btn}>
                {saving ? 'Enregistrement...' : 'Valider mes pronostics'}
              </button>
            )}

            {/* 2. Bouton Leaderboard à droite */}
            <button 
              type="button"
              onClick={onOpenLeaderboard} 
              style={styles.leaderboardBtn}
              title="Classement Général"
            >
              <Trophy size={20} color="#ffd700" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: { background: 'rgba(255, 255, 255, 0.04)', padding: '25px', paddingBottom: '160px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '20px', fontFamily: "'Outfit', sans-serif" },
  title: { fontFamily: "'Fredoka', sans-serif", fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '1.4rem', margin: '0 0 20px 0', color: '#ff007f', textAlign: 'center' },
  lockBanner: { display: 'flex', alignItems: 'center', center: 'center', justifyContent: 'center', background: 'rgba(246, 173, 85, 0.1)', color: '#f6ad55', border: '1px solid rgba(246, 173, 85, 0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 500, marginBottom: '20px', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  section: { background: 'rgba(0, 0, 0, 0.25)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' },
  sectionTitle: { display: 'flex', alignItems: 'center', fontFamily: "'Fredoka', sans-serif", fontWeight: 400, letterSpacing: '0.04em', margin: '0 0 15px 0', fontSize: '1.05rem', color: '#cbd5e0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' },
  row: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' },
  rankNumber: { fontFamily: "'Fredoka', sans-serif", fontWeight: 500, color: '#ff007f', minWidth: '30px' },
  label: { display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: '#a0aec0', fontWeight: 400 },
  
  select: { 
    flex: 1, 
    width: '100%', 
    padding: '12px 40px 12px 14px', 
    borderRadius: '10px', 
    background: '#1a1635', 
    color: '#fff', 
    border: '1px solid rgba(255, 255, 255, 0.12)', 
    outline: 'none', 
    fontFamily: "'Outfit', sans-serif", 
    fontSize: '0.95rem',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ff007f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  
  input: { width: '100%', padding: '12px 14px', borderRadius: '10px', background: '#1a1635', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.12)', boxSizing: 'border-box', fontFamily: "'Outfit', sans-serif", fontSize: '0.95rem', outline: 'none' },
  inputDesc: { fontSize: '0.8rem', color: '#a0aec0', margin: '-8px 0 15px 0', lineHeight: '1.4' },
  gridCheckbox: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' },
  uncheckedBtn: { background: '#1a1635', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif", textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  checkedBtn: { background: '#ff007f', color: '#fff', border: '1px solid #ff007f', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif", fontWeight: 700, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', boxShadow: '0 0 8px rgba(255,0,127,0.4)' },
  
  actionZone: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '1126px',
    background: 'rgba(22, 23, 29, 0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    padding: '16px 20px',
    paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    boxSizing: 'border-box',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    zIndex: 100,
    boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column'
  },
  btnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%'
  },
  btn: { flex: 1, height: '50px', background: '#ff007f', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', fontSize: '1rem', boxShadow: '0 0 15px rgba(255,0,127,0.3)', transition: 'background 0.2s', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { flex: 1, height: '50px', background: '#4a5568', color: '#a0aec0', border: 'none', padding: '14px', borderRadius: '10px', cursor: 'not-allowed', fontFamily: "'Outfit', sans-serif", boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  lockedNotice: { flex: 1, height: '50px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.05)', color: '#718096', border: 'none', padding: '14px', borderRadius: '10px', textAlign: 'center', fontWeight: 600, fontSize: '1rem', fontFamily: "'Outfit', sans-serif" },
  leaderboardBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', width: '50px', height: '50px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box' },
  message: { textAlign: 'center', fontWeight: 500, margin: '0 0 12px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: "'Outfit', sans-serif" }
};

export default PredictionForm;