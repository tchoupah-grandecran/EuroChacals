import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Icônes de Lucide
import { GripVertical, Save, CheckCircle2, Award, AlertCircle, MessageSquare, X, Lock, Trophy } from 'lucide-react';

const PersonalRank = ({ user, onOpenLeaderboard }) => {
  const [countries, setCountries] = useState([]);
  const [notes, setNotes] = useState({});
  const [isVotesLocked, setIsVotesLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const [activeCountry, setActiveCountry] = useState(null);
  const [tempNote, setTempNote] = useState('');

  useEffect(() => {
    const fetchPersonalRank = async () => {
      if (!user?.uid) return;
      
      try {
        // 1. Récupérer le statut du verrouillage
        const liveSnap = await getDoc(doc(db, 'results', 'live'));
        if (liveSnap.exists() && liveSnap.data().isVotesLocked !== undefined) {
          setIsVotesLocked(liveSnap.data().isVotesLocked);
        }

        // 2. Récupérer les pays finalistes officiels
        const countriesSnap = await getDocs(collection(db, 'countries'));
        const officialFinalists = countriesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => (a.runningOrder || 0) - (b.runningOrder || 0));

        // 3. Récupérer les données de l'utilisateur
        const userDocRef = doc(db, 'predictions', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const docData = userDocSnap.data();
          
          // ⚠️ CORRECTION: On extrait les données du MAP 'predictions' vu dans la capture d'écran
          const userData = docData.predictions || {};
          
          if (userData.myPersonalNotes) {
            setNotes(userData.myPersonalNotes);
          } else if (docData.myPersonalNotes) { // Fallback si c'était à la racine
            setNotes(docData.myPersonalNotes);
          }

          // Lecture depuis le MAP 'predictions' ou fallback racine
          const savedOrderIds = userData.myPersonalRank || docData.myPersonalRank;
          
          if (savedOrderIds && Array.isArray(savedOrderIds)) {
            const orderedCountries = savedOrderIds
              .map(id => officialFinalists.find(c => c.id === id))
              .filter(Boolean);
            
            const missingCountries = officialFinalists.filter(c => !savedOrderIds.includes(c.id));
            setCountries([...orderedCountries, ...missingCountries]);
          } else {
            setCountries(officialFinalists);
          }
        } else {
          setCountries(officialFinalists);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données perso:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalRank();
  }, [user.uid]);

  const handleOnDragEnd = (result) => {
    if (!result.destination || isVotesLocked) return;

    const items = Array.from(countries);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCountries(items);
  };

  const openNotesModal = (country) => {
    if (isVotesLocked) return;
    setActiveCountry(country);
    setTempNote(notes[country.id] || '');
  };

  const saveNoteLocally = () => {
    if (isVotesLocked) return;
    setNotes(prev => ({
      ...prev,
      [activeCountry.id]: tempNote.trim()
    }));
    setActiveCountry(null);
  };

  const handleSave = async () => {
    if (isVotesLocked || !user?.uid) return;
    setSaving(true);
    setStatusMessage('');
    try {
      const docRef = doc(db, 'predictions', user.uid);
      const justIds = countries.map(c => c.id);

      // 1. On récupère le document existant pour ne surtout pas écraser les autres champs du map (top3Jury, etc.)
      const currentSnap = await getDoc(docRef);
      const currentData = currentSnap.exists() ? currentSnap.data() : {};
      const currentPredictionsMap = currentData.predictions || {};

      // 2. On fusionne nos données de classement à l'intérieur de l'objet de prédictions existant
      const updatedPredictionsMap = {
        ...currentPredictionsMap,
        myPersonalRank: justIds,
        myPersonalNotes: notes,
      };

      // 3. Sauvegarde propre dans Firestore
      await setDoc(docRef, { 
        predictions: updatedPredictionsMap,
        userDisplayName: user.displayName,
        userName: user.displayName,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setStatusMessage('Top et notes sauvegardés !');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du classement:", error);
      setStatusMessage('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.infoText}>Chargement de ton Top...</div>;

  if (countries.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <AlertCircle size={32} color="#a0aec0" />
        <p style={styles.emptyText}>La liste des pays n'est pas encore configurée.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {isVotesLocked ? (
        <div style={{ ...styles.infoCard, backgroundColor: 'rgba(229, 62, 62, 0.1)', borderColor: 'rgba(229, 62, 62, 0.3)' }}>
          <Lock size={18} color="#f56565" style={{ flexShrink: 0 }} />
          <p style={styles.infoCardText}>
            <strong>Classement verrouillé :</strong> La session est désormais close. Il n'est plus possible de modifier ton classement ou tes notes personnelles.
          </p>
        </div>
      ) : (
        <div style={styles.infoCard}>
          <Award size={18} color="#ff007f" style={{ flexShrink: 0 }} />
          <p style={styles.infoCardText}>
            <strong>Mon Classement Idéal :</strong> Glisse les cartes pour réordonner ton Top. 
            Clique sur un pays pour lui ajouter un commentaire !
          </p>
        </div>
      )}

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="countries-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} style={styles.listContainer}>
              {countries.map((country, index) => {
                const hasNote = Boolean(notes[country.id]);
                return (
                  <Draggable key={country.id} draggableId={country.id} index={index} isDragDisabled={isVotesLocked}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          ...styles.card,
                          backgroundColor: snapshot.isDragging ? 'rgba(255, 0, 127, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          borderColor: snapshot.isDragging ? '#ff007f' : 'rgba(255, 255, 255, 0.1)',
                          cursor: isVotesLocked ? 'not-allowed' : 'pointer',
                          ...provided.draggableProps.style
                        }}
                      >
                        <div style={styles.rankNumber}>#{index + 1}</div>

                        <div style={styles.countryInfo} onClick={() => openNotesModal(country)}>
                          <span style={styles.flag}>{country.flag}</span>
                          <div style={styles.countryTextWrapper}>
                            <span style={styles.countryName}>{country.name}</span>
                            {hasNote && (
                              <span style={styles.noteSnippet}>
                                <MessageSquare size={10} style={{ marginRight: '4px', display: 'inline' }} />
                                {notes[country.id].length > 35 ? `${notes[country.id].substring(0, 35)}...` : notes[country.id]}
                              </span>
                            )}
                          </div>
                        </div>

                        {!isVotesLocked && (
                          <div {...provided.dragHandleProps} style={styles.gripZone}>
                            <GripVertical size={18} color="#a0aec0" />
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div style={styles.actionZone}>
        {statusMessage && (
          <p style={statusMessage.includes('Erreur') ? styles.errorMsg : styles.successMsg}>
            <CheckCircle2 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {statusMessage}
          </p>
        )}
        
        <div style={styles.btnGroup}>
          <button 
            onClick={handleSave} 
            disabled={saving || isVotesLocked} 
            style={{
              ...styles.saveBtn,
              background: isVotesLocked ? 'rgba(255, 255, 255, 0.05)' : '#ff007f',
              color: isVotesLocked ? '#718096' : '#fff',
              boxShadow: isVotesLocked ? 'none' : '0 0 15px rgba(255,0,127,0.3)',
              cursor: isVotesLocked ? 'not-allowed' : 'pointer'
            }}
          >
            {isVotesLocked ? (
              <>
                <Lock size={18} style={{ marginRight: '8px' }} />
                Verrouillé
              </>
            ) : (
              <>
                <Save size={18} style={{ marginRight: '8px' }} />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </>
            )}
          </button>

          <button 
            onClick={onOpenLeaderboard} 
            style={styles.leaderboardBtn}
            title="Classement Général"
          >
            <Trophy size={20} color="#ffd700" />
          </button>
        </div>
      </div>

      {activeCountry && !isVotesLocked && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>{activeCountry.flag}</span>
                <h3 style={styles.modalTitle}> {activeCountry.name}</h3>
              </div>
              <button style={styles.closeBtn} onClick={() => setActiveCountry(null)}>
                <X size={18} />
              </button>
            </div>
            
            <textarea
              style={styles.textarea}
              placeholder="Avis sur la voix, la mise en scène, le costume, etc..."
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              rows={4}
              maxLength={300}
            />

            <div style={styles.modalActions}>
              <button style={styles.cancelModalBtn} onClick={() => setActiveCountry(null)}>Annuler</button>
              <button style={styles.submitModalBtn} onClick={saveNoteLocally}>Valider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { paddingBottom: '140px' },
  infoText: { textAlign: 'center', color: '#a0aec0', marginTop: '20px', fontFamily: "'Outfit', sans-serif" },
  emptyContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', marginTop: '20px' },
  emptyText: { margin: 0, fontSize: '0.95rem', color: '#a0aec0', lineHeight: '1.5', maxWidth: '300px', fontFamily: "'Outfit', sans-serif" },
  infoCard: { display: 'flex', gap: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', transition: 'all 0.2s ease' },
  infoCardText: { margin: 0, fontSize: '0.85rem', color: '#cbd5e0', lineHeight: '1.4', fontFamily: "'Outfit', sans-serif" },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
  card: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '10px', border: '1px solid', backdropFilter: 'blur(4px)', boxSizing: 'border-box', transition: 'background-color 0.1s ease, border-color 0.1s ease' },
  rankNumber: { fontFamily: "'Fredoka', sans-serif", fontSize: '1rem', fontWeight: 500, color: '#ff007f', width: '40px' },
  countryInfo: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 },
  countryTextWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, gap: '2px' },
  flag: { fontSize: '1.3rem' },
  countryName: { fontSize: '0.95rem', fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Outfit', sans-serif" },
  noteSnippet: { fontSize: '0.75rem', color: '#a0aec0', fontStyle: 'italic', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' },
  gripZone: { padding: '4px 8px', display: 'flex', alignItems: 'center', cursor: 'grab' },
  actionZone: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '1126px', background: 'rgba(22, 23, 29, 0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', boxSizing: 'border-box', borderTop: '1px solid rgba(255, 255, 255, 0.08)', zIndex: 100, boxShadow: '0 -10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' },
  btnGroup: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%' },
  saveBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s', height: '50px', boxSizing: 'border-box' },
  leaderboardBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', width: '50px', height: '50px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box' },
  successMsg: { color: '#48bb78', fontSize: '0.9rem', marginBottom: '12px', fontWeight: 500, fontFamily: "'Outfit', sans-serif" },
  errorMsg: { color: '#f56565', fontSize: '0.9rem', marginBottom: '12px', fontWeight: 500, fontFamily: "'Outfit', sans-serif" },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
  modalContent: { background: '#16171d', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontFamily: "'Outfit', sans-serif" },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  modalTitle: { margin: 0, fontSize: '1.2rem', fontFamily: "'Fredoka', sans-serif", color: '#fff' },
  closeBtn: { background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: '4px' },
  textarea: { width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '12px', fontSize: '0.9rem', fontFamily: "'Outfit', sans-serif", resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  cancelModalBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: '#cbd5e0', padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer' },
  submitModalBtn: { background: '#ff007f', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px 16px', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }
};

export default PersonalRank;