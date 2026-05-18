import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Icônes Lucide
import { ArrowLeft, Calculator, Award, Lock, Unlock, Globe, RefreshCw } from 'lucide-react';

// 🌍 Le Master de tous les pays susceptibles de participer aux demi-finales / finales
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

const AdminPanel = ({ onBack }) => {
  const [countryScores, setCountryScores] = useState(
    MASTER_COUNTRIES.map(c => ({ ...c, jury: 0, public: 0, total: 0 }))
  );
  
  const [activeFinalistIds, setActiveFinalistIds] = useState([]);
  const [mostTwelvePoints, setMostTwelvePoints] = useState('');
  const [isVotesLocked, setIsVotesLocked] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [syncingCountries, setSyncingCountries] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const countriesSnap = await getDocs(collection(db, 'countries'));
        const activeIds = countriesSnap.docs.map(d => d.id);
        setActiveFinalistIds(activeIds);

        const docSnap = await getDoc(doc(db, 'results', 'officialRawScores'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.scores) setCountryScores(data.scores);
          if (data.mostTwelvePoints) setMostTwelvePoints(data.mostTwelvePoints);
        }

        const liveSnap = await getDoc(doc(db, 'results', 'live'));
        if (liveSnap.exists() && liveSnap.data().isVotesLocked !== undefined) {
          setIsVotesLocked(liveSnap.data().isVotesLocked);
        }
      } catch (err) {
        console.error("Erreur d'initialisation des données admin", err);
      }
    };
    loadAdminData();
  }, []);

  const handleToggleFinalist = (id) => {
    setActiveFinalistIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSyncCountriesToFirebase = async () => {
    if (activeFinalistIds.length === 0) {
      setStatusMessage("⚠️ Impossible de synchroniser une finale sans aucun pays !");
      return;
    }
    setSyncingCountries(true);
    setStatusMessage("Nettoyage et déploiement de la liste des finalistes...");

    try {
      const countriesSnap = await getDocs(collection(db, 'countries'));
      const deletePromises = countriesSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      const selectedMasterList = MASTER_COUNTRIES.filter(c => activeFinalistIds.includes(c.id));
      
      const writePromises = selectedMasterList.map((country, index) => {
        return setDoc(doc(db, 'countries', country.id), {
          name: country.name,
          flag: country.flag,
          runningOrder: index + 1
        });
      });
      await Promise.all(writePromises);

      setCountryScores(prev => {
        const currentScores = [...prev];
        selectedMasterList.forEach(sm => {
          if (!currentScores.some(cs => cs.id === sm.id)) {
            currentScores.push({ ...sm, jury: 0, public: 0, total: 0 });
          }
        });
        return currentScores;
      });

      setStatusMessage("🚀 Liste des finalistes synchronisée et déployée pour les joueurs !");
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setStatusMessage("❌ Erreur lors de la synchronisation de la liste.");
    } finally {
      setSyncingCountries(false);
    }
  };

  const handleToggleLock = async () => {
    const nextLockState = !isVotesLocked;
    try {
      await setDoc(doc(db, 'results', 'live'), { isVotesLocked: nextLockState }, { merge: true });
      setIsVotesLocked(nextLockState);
      setStatusMessage(nextLockState ? "🔒 Pronostics et classements persos désormais CLOS !" : "🔓 Pronostics et classements persos OUVERTS !");
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setStatusMessage("❌ Erreur lors de la modification du verrouillage.");
    }
  };

  const handleScoreChange = (id, field, value) => {
    const numericValue = parseInt(value, 10) || 0;
    setCountryScores(prev => 
      prev.map(c => {
        if (c.id === id) {
          const updatedCountry = { ...c, [field]: numericValue };
          updatedCountry.total = updatedCountry.jury + updatedCountry.public;
          return updatedCountry;
        }
        return c;
      })
    );
  };

  const handleCalculateScores = async () => {
    if (!mostTwelvePoints) {
      setStatusMessage("⚠️ Sélectionne d'abord le pays qui a obtenu le plus de 12 points.");
      return;
    }

    setCalculating(true);
    setStatusMessage('Génération de la matrice et calcul des scores...');

    try {
      const activeScores = countryScores.filter(c => activeFinalistIds.includes(c.id));
      const sortedCountries = [...activeScores].sort((a, b) => b.total - a.total);
      const officialIds = sortedCountries.map(c => c.id);

      const officialJuryIds = [...activeScores].sort((a, b) => b.jury - a.jury).map(c => c.id);
      const officialPublicIds = [...activeScores].sort((a, b) => b.public - a.public).map(c => c.id);
      
      await setDoc(doc(db, 'results', 'officialRawScores'), { scores: countryScores, mostTwelvePoints });
      await setDoc(doc(db, 'results', 'official'), { rank: officialIds });

      const officialTop5 = officialIds.slice(0, 5);
      const officialLastPlaceId = officialIds[officialIds.length - 1];

      const querySnapshot = await getDocs(collection(db, 'predictions'));
      
      const updatePromises = querySnapshot.docs.map(async (userDoc) => {
        const data = userDoc.data();
        const userId = userDoc.id;
        let userFinalScore = 0;

        // ── TOP 5 GÉNÉRAL ──────────────────────────────────────────────
        // +5 vainqueur exact, +2 si dans le reste du Top 5
        // BUG FIX: use if/else if so the winner slot doesn't also get +2
        if (data.top5 && Array.isArray(data.top5)) {
          data.top5.forEach((id, idx) => {
            if (!id) return;
            if (idx === 0) {
              // 1ère place
              if (id === officialIds[0]) {
                userFinalScore += 5; // vainqueur exact
              } else if (officialTop5.includes(id)) {
                userFinalScore += 2; // dans le top5 mais pas 1er
              }
            } else {
              // Places 2-5
              if (officialTop5.includes(id)) {
                userFinalScore += 2;
              }
            }
          });
        }

        // ── TOP 3 JURY ─────────────────────────────────────────────────
        // +3 rang exact du 1er, +1 si présent dans le top3
        // BUG FIX: use if/else if to avoid giving both +3 and +1 to the same pick
        if (data.top3Jury && Array.isArray(data.top3Jury)) {
          data.top3Jury.forEach((id, idx) => {
            if (!id) return;
            if (idx === 0 && id === officialJuryIds[0]) {
              userFinalScore += 3; // 1er exact
            } else if (officialJuryIds.slice(0, 3).includes(id)) {
              userFinalScore += 1; // présent dans le top3
            }
          });
        }

        // ── TOP 3 PUBLIC ───────────────────────────────────────────────
        // +3 rang exact du 1er, +1 si présent dans le top3
        // BUG FIX: use if/else if to avoid giving both +3 and +1 to the same pick
        if (data.top3Public && Array.isArray(data.top3Public)) {
          data.top3Public.forEach((id, idx) => {
            if (!id) return;
            if (idx === 0 && id === officialPublicIds[0]) {
              userFinalScore += 3; // 1er exact
            } else if (officialPublicIds.slice(0, 3).includes(id)) {
              userFinalScore += 1; // présent dans le top3
            }
          });
        }

        // ── STATISTIQUES ───────────────────────────────────────────────
        if (data.mostTwelvePoints && data.mostTwelvePoints === mostTwelvePoints) userFinalScore += 5;
        if (data.lastPlace && data.lastPlace === officialLastPlaceId) userFinalScore += 7;

        // ── PARI ZÉRO POINT ────────────────────────────────────────────
        if (data.zeroPoints && Array.isArray(data.zeroPoints)) {
          data.zeroPoints.forEach(countryId => {
            const actualData = activeScores.find(c => c.id === countryId);
            if (actualData) {
              if (actualData.total === 0) userFinalScore += 15;
              else userFinalScore -= 5;
            }
          });
        }

        // ── POINTS PUBLIC DU VAINQUEUR ─────────────────────────────────
        const absoluteWinner = activeScores.find(c => c.id === officialIds[0]);
        if (absoluteWinner && data.winnerPublicPoints !== undefined) {
          const delta = Math.abs(data.winnerPublicPoints - absoluteWinner.public);
          if (delta === 0) userFinalScore += 100;
          else if (delta <= 20) userFinalScore += 50;
          else if (delta <= 50) userFinalScore += 20;
          else if (delta <= 75) userFinalScore += 10;
          else if (delta <= 150) userFinalScore += 5;
          else if (delta <= 200) userFinalScore += 1;
        }

        // ── GRILLE PERSO ───────────────────────────────────────────────
        // +2 par rang exact, -2 par favori officiel (top5) relégué dans le bottom5 du joueur
        if (data.myPersonalRank && Array.isArray(data.myPersonalRank) && data.myPersonalRank.length === officialIds.length) {
          data.myPersonalRank.forEach((countryId, index) => {
            if (countryId === officialIds[index]) userFinalScore += 2;
          });

          const userBottom5 = data.myPersonalRank.slice(-5);
          officialTop5.forEach((favId) => {
            if (userBottom5.includes(favId)) userFinalScore -= 2;
          });
        }

        await setDoc(doc(db, 'leaderboard', userId), {
          displayName: data.userName || data.userDisplayName || "Anonyme",
          score: userFinalScore,
          updatedAt: new Date(),
          predictions: {
            top5: data.top5 || [],
            top3Jury: data.top3Jury || [],
            top3Public: data.top3Public || [],
            mostTwelvePoints: data.mostTwelvePoints || '',
            lastPlace: data.lastPlace || '',
            winnerPublicPoints: data.winnerPublicPoints !== undefined ? data.winnerPublicPoints : null,
            zeroPoints: data.zeroPoints || []
          }
        });
      });

      await Promise.all(updatePromises);
      setStatusMessage("Tous les scores de l'arène ont été mis à jour avec succès ! 🏆");
    } catch (err) {
      console.error(err);
      setStatusMessage('Erreur critique durant le processus de calcul.');
    } finally {
      setCalculating(false);
    }
  };

  const visibleCountryScores = countryScores
    .filter(c => activeFinalistIds.includes(c.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={styles.container}>
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <header style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={16} /> Retour
        </button>
        <h2 style={styles.title}>Console Admin</h2>
      </header>

      <div style={{
        ...styles.lockCard,
        backgroundColor: isVotesLocked ? 'rgba(229, 62, 62, 0.1)' : 'rgba(72, 187, 120, 0.1)',
        borderColor: isVotesLocked ? 'rgba(229, 62, 62, 0.3)' : 'rgba(72, 187, 120, 0.3)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={styles.lockCardTitle}>Statut de la session</span>
          <span style={{ ...styles.lockCardStatus, color: isVotesLocked ? '#fc8181' : '#68d391' }}>
            {isVotesLocked ? 'Fermée' : 'Ouverte'}
          </span>
        </div>
        <button onClick={handleToggleLock} style={{ ...styles.lockBtn, backgroundColor: isVotesLocked ? '#48bb78' : '#e53e3e' }}>
          {isVotesLocked ? <><Unlock size={16} /> Ouvrir</> : <><Lock size={16} /> Clôturer</>}
        </button>
      </div>

      <div style={styles.adminCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Globe size={18} color="#4fd1c5" />
          <h3 style={styles.sectionTitle}>Configuration des Pays Finalistes</h3>
        </div>
        <p style={styles.subtitle}>Coche les pays qualifiés pour la finale de cette édition, puis synchronise la base de données.</p>
        
        <div style={styles.gridCheckbox}>
          {MASTER_COUNTRIES.map(c => {
            const isChecked = activeFinalistIds.includes(c.id);
            return (
              <button 
                type="button" 
                key={c.id} 
                onClick={() => handleToggleFinalist(c.id)} 
                style={isChecked ? styles.checkedBtn : styles.uncheckedBtn}
              >
                {c.flag} {c.name}
              </button>
            );
          })}
        </div>
        
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <p style={{ fontSize: '0.85rem', color: '#4fd1c5', margin: 0, fontWeight: 500 }}>
            Sélectionnés : {activeFinalistIds.length} pays finalistes
          </p>
          <button 
            onClick={handleSyncCountriesToFirebase} 
            disabled={syncingCountries} 
            style={styles.syncBtn}
          >
            <RefreshCw size={14} className={syncingCountries ? 'animate-spin' : ''} />
            {syncingCountries ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </div>

      <div style={{ margin: '20px 0' }} />

      <div style={styles.adminCard}>
        <h3 style={styles.sectionTitle}>Entrée des points Eurovision</h3>
        <p style={styles.subtitle}>Saisis les points du Jury puis du Télévote. L'affichage s'adapte automatiquement à tes finalistes configurés ci-dessus.</p>

        <div style={styles.tableWrapper}>
          <div style={styles.tableHeader}>
            <div style={{ ...styles.cell, flex: 2 }}>Pays</div>
            <div style={styles.cell}>Jury</div>
            <div style={styles.cell}>Public</div>
            <div style={{ ...styles.cell, textAlign: 'right', fontWeight: 600 }}>Total</div>
          </div>

          <div style={styles.tableBody}>
            {visibleCountryScores.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#a0aec0', fontSize: '0.9rem' }}>
                Aucun pays finaliste déployé pour le moment.
              </div>
            ) : (
              visibleCountryScores.map((country) => (
                <div key={country.id} style={styles.tableRow}>
                  <div style={{ ...styles.cell, flex: 2, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={styles.flag}>{country.flag}</span>
                    <span style={styles.countryName}>{country.name}</span>
                  </div>
                  <div style={styles.cell}>
                    <input
                      type="number"
                      value={country.jury || ''}
                      placeholder="0"
                      onChange={(e) => handleScoreChange(country.id, 'jury', e.target.value)}
                      style={styles.scoreInput}
                    />
                  </div>
                  <div style={styles.cell}>
                    <input
                      type="number"
                      value={country.public || ''}
                      placeholder="0"
                      onChange={(e) => handleScoreChange(country.id, 'public', e.target.value)}
                      style={styles.scoreInput}
                    />
                  </div>
                  <div style={{ ...styles.cell, textAlign: 'right', fontWeight: 700, color: country.total > 0 ? '#ff007f' : '#a0aec0' }}>
                    {country.total} pts
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.bonusSelectorCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Award size={18} color="#ffd700" />
            <h4 style={styles.bonusSelectorTitle}>Statistique : Maximum de "12 Points"</h4>
          </div>
          <select 
            value={mostTwelvePoints} 
            onChange={(e) => setMostTwelvePoints(e.target.value)}
            style={styles.bonusSelect}
          >
            <option value="">-- Choisir parmi les pays de la finale --</option>
            {MASTER_COUNTRIES.filter(c => activeFinalistIds.includes(c.id)).map(c => (
              <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.triggerZone}>
        {statusMessage && (
          <div style={styles.alertBox}>
            <span style={styles.alertText}>{statusMessage}</span>
          </div>
        )}
        
        <button onClick={handleCalculateScores} disabled={calculating} style={styles.calcBtn}>
          <Calculator size={18} style={{ marginRight: '8px' }} />
          {calculating ? 'Calcul des résultats...' : 'Valider & Calculer les Scores'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '10px 0', paddingBottom: '20px', color: '#fff', fontFamily: "'Outfit', sans-serif", boxSizing: 'border-box' },
  header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', padding: '0 10px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" },
  title: { fontFamily: "'Fredoka', sans-serif", margin: 0, fontSize: '1.3rem', color: '#ff007f' },
  lockCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: '1px solid', marginBottom: '20px', boxSizing: 'border-box' },
  lockCardTitle: { fontSize: '0.75rem', textTransform: 'uppercase', color: '#cbd5e0', letterSpacing: '0.04em' },
  lockCardStatus: { fontSize: '0.9rem', fontWeight: 600 },
  lockBtn: { display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.85rem' },
  adminCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', boxSizing: 'border-box' },
  sectionTitle: { fontFamily: "'Fredoka', sans-serif", margin: '0 0 4px 0', fontSize: '1.1rem' },
  subtitle: { margin: '0 0 16px 0', fontSize: '0.8rem', color: '#a0aec0', lineHeight: '1.4' },
  gridCheckbox: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' },
  uncheckedBtn: { background: '#1a1635', color: '#a0aec0', border: '1px solid rgba(255,255,255,0.08)', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif", textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  checkedBtn: { background: '#ff007f', color: '#fff', border: '1px solid #ff007f', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif", fontWeight: 700, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', boxShadow: '0 0 8px rgba(255,0,127,0.4)' },
  syncBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#4fd1c5', color: '#1a1635', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' },
  tableWrapper: { display: 'flex', flexDirection: 'column', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' },
  tableHeader: { display: 'flex', background: 'rgba(255,255,255,0.06)', padding: '10px', fontSize: '0.85rem', color: '#a0aec0', fontWeight: 600 },
  tableBody: { display: 'flex', flexDirection: 'column', maxHeight: '350px', overflowY: 'auto' },
  tableRow: { display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(15, 12, 32, 0.2)' },
  cell: { flex: 1, minWidth: 0, fontSize: '0.9rem' },
  flag: { fontSize: '1.2rem', flexShrink: 0 },
  countryName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff', fontWeight: 500 },
  scoreInput: { width: '80%', maxWidth: '70px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '8px', fontSize: '0.9rem', fontFamily: "'Outfit', sans-serif", textAlign: 'center', outline: 'none', boxSizing: 'border-box' },
  bonusSelectorCard: { background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '14px', borderRadius: '8px', boxSizing: 'border-box' },
  bonusSelectorTitle: { margin: 0, fontSize: '0.95rem', fontWeight: 500, color: '#fff' },
  bonusSelect: { width: '100%', padding: '10px', background: '#15102a', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', color: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: '1rem', outline: 'none', marginTop: '4px' },
  triggerZone: { marginTop: '24px', padding: '0 4px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '10px' },
  calcBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', background: '#ff007f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', boxShadow: '0 0 15px rgba(255,0,127,0.3)', transition: 'background 0.2s' },
  alertBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '8px', width: '100%', boxSizing: 'border-box' },
  alertText: { fontSize: '0.85rem', fontWeight: 500, color: '#fff', textAlign: 'center' }
};

export default AdminPanel;