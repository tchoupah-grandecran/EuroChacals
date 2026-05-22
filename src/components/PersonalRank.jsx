import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTheme } from '../ThemeContext';
import { GripVertical, Save, CheckCircle2, Award, AlertCircle, MessageSquare, X, Lock, Trophy } from 'lucide-react';

const PersonalRank = ({ user, onOpenLeaderboard }) => {
  const { theme: t } = useTheme();

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
        const liveSnap = await getDoc(doc(db, 'results', 'live'));
        if (liveSnap.exists() && liveSnap.data().isVotesLocked !== undefined) {
          setIsVotesLocked(liveSnap.data().isVotesLocked);
        }

        const countriesSnap = await getDocs(collection(db, 'countries'));
        const officialFinalists = countriesSnap.docs.map(doc => ({
          id: doc.id, ...doc.data()
        })).sort((a, b) => (a.runningOrder || 0) - (b.runningOrder || 0));

        const userDocRef = doc(db, 'predictions', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const docData = userDocSnap.data();
          const userData = docData.predictions || {};

          if (userData.myPersonalNotes) setNotes(userData.myPersonalNotes);
          else if (docData.myPersonalNotes) setNotes(docData.myPersonalNotes);

          const savedOrderIds = userData.myPersonalRank || docData.myPersonalRank;
          if (savedOrderIds && Array.isArray(savedOrderIds)) {
            const orderedCountries = savedOrderIds.map(id => officialFinalists.find(c => c.id === id)).filter(Boolean);
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
    setNotes(prev => ({ ...prev, [activeCountry.id]: tempNote.trim() }));
    setActiveCountry(null);
  };

  const handleSave = async () => {
    if (isVotesLocked || !user?.uid) return;
    setSaving(true);
    setStatusMessage('');
    try {
      const docRef = doc(db, 'predictions', user.uid);
      const justIds = countries.map(c => c.id);
      const currentSnap = await getDoc(docRef);
      const currentData = currentSnap.exists() ? currentSnap.data() : {};
      const currentPredictionsMap = currentData.predictions || {};
      const updatedPredictionsMap = { ...currentPredictionsMap, myPersonalRank: justIds, myPersonalNotes: notes };
      await setDoc(docRef, { predictions: updatedPredictionsMap, userDisplayName: user.displayName, userName: user.displayName, updatedAt: new Date().toISOString() }, { merge: true });
      setStatusMessage('ok');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setStatusMessage('err');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', color: t.textMuted, marginTop: '20px', fontFamily: t.fontBody }}>Chargement de ton Top...</div>;

  if (countries.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px 20px', textAlign: 'center', background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '12px', marginTop: '20px' }}>
        <AlertCircle size={32} color={t.textMuted} />
        <p style={{ margin: 0, fontSize: '0.95rem', color: t.textMuted, lineHeight: '1.5', maxWidth: '300px', fontFamily: t.fontBody }}>
          La liste des pays n'est pas encore configurée.
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '140px', fontFamily: t.fontBody }}>
      {isVotesLocked ? (
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.3)', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          <Lock size={18} color="#f56565" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e0', lineHeight: '1.4', fontFamily: t.fontBody }}>
            <strong>Classement verrouillé :</strong> La session est close. Il n'est plus possible de modifier ton classement ou tes notes.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px', background: t.bgCard, border: `1px solid ${t.border}`, padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          <Award size={18} color={t.accent} style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e0', lineHeight: '1.4', fontFamily: t.fontBody }}>
            <strong>Mon Classement Idéal :</strong> Glisse les cartes pour réordonner ton Top. Clique sur un pays pour lui ajouter un commentaire !
          </p>
        </div>
      )}

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="countries-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {countries.map((country, index) => {
                const hasNote = Boolean(notes[country.id]);
                return (
                  <Draggable key={country.id} draggableId={country.id} index={index} isDragDisabled={isVotesLocked}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px', borderRadius: '10px', border: '1px solid',
                          backdropFilter: 'blur(4px)', boxSizing: 'border-box',
                          backgroundColor: snapshot.isDragging ? t.accentSoft : t.bgCard,
                          borderColor: snapshot.isDragging ? t.accent : t.border,
                          cursor: isVotesLocked ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.1s ease, border-color 0.1s ease',
                          ...provided.draggableProps.style
                        }}
                      >
                        <div style={{ fontFamily: t.fontDisplay, fontSize: '1rem', fontWeight: 500, color: t.accent, width: '40px' }}>
                          #{index + 1}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }} onClick={() => openNotesModal(country)}>
                          <span style={{ fontSize: '1.3rem' }}>{country.flag}</span>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, gap: '2px' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: t.fontBody }}>
                              {country.name}
                            </span>
                            {hasNote && (
                              <span style={{ fontSize: '0.75rem', color: t.textMuted, fontStyle: 'italic', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                <MessageSquare size={10} style={{ marginRight: '4px', display: 'inline' }} />
                                {notes[country.id].length > 35 ? `${notes[country.id].substring(0, 35)}...` : notes[country.id]}
                              </span>
                            )}
                          </div>
                        </div>
                        {!isVotesLocked && (
                          <div {...provided.dragHandleProps} style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', cursor: 'grab' }}>
                            <GripVertical size={18} color={t.textMuted} />
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

      {/* ACTION ZONE */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '1126px', background: 'rgba(22,23,29,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', boxSizing: 'border-box', borderTop: `1px solid ${t.border}`, zIndex: 100, boxShadow: '0 -10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
        {statusMessage === 'ok' && (
          <p style={{ color: '#48bb78', fontSize: '0.9rem', marginBottom: '12px', fontWeight: 500, fontFamily: t.fontBody, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} /> Top et notes sauvegardés !
          </p>
        )}
        {statusMessage === 'err' && (
          <p style={{ color: '#f56565', fontSize: '0.9rem', marginBottom: '12px', fontWeight: 500, fontFamily: t.fontBody }}>
            Erreur lors de la sauvegarde.
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <button onClick={handleSave} disabled={saving || isVotesLocked}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 600, fontFamily: t.fontBody, height: '50px', boxSizing: 'border-box', transition: 'all 0.2s', background: isVotesLocked ? 'rgba(255,255,255,0.05)' : t.accent, color: isVotesLocked ? '#718096' : '#fff', boxShadow: isVotesLocked ? 'none' : `0 0 15px ${t.accentGlow}`, cursor: isVotesLocked ? 'not-allowed' : 'pointer' }}>
            {isVotesLocked ? <><Lock size={18} style={{ marginRight: '8px' }} />Verrouillé</> : <><Save size={18} style={{ marginRight: '8px' }} />{saving ? 'Sauvegarde...' : 'Sauvegarder'}</>}
          </button>
          <button onClick={onOpenLeaderboard} title="Classement Général"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', width: '50px', height: '50px', background: t.bgCard, border: `1px solid ${t.borderLight}`, borderRadius: '10px', cursor: 'pointer', boxSizing: 'border-box' }}>
            <Trophy size={20} color="#ffd700" />
          </button>
        </div>
      </div>

      {/* NOTES MODAL */}
      {activeCountry && !isVotesLocked && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: t.bgModal, border: `1px solid ${t.border}`, borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontFamily: t.fontBody }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>{activeCountry.flag}</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: t.fontDisplay, color: '#fff' }}>{activeCountry.name}</h3>
              </div>
              <button style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '4px' }} onClick={() => setActiveCountry(null)}>
                <X size={18} />
              </button>
            </div>
            <textarea
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: `1px solid ${t.border}`, borderRadius: '8px', color: '#fff', padding: '12px', fontSize: '0.9rem', fontFamily: t.fontBody, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
              placeholder="Avis sur la voix, la mise en scène, le costume, etc..."
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              rows={4} maxLength={300}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: '#cbd5e0', padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => setActiveCountry(null)}>
                Annuler
              </button>
              <button style={{ background: t.accent, border: 'none', borderRadius: '6px', color: '#fff', padding: '8px 16px', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }} onClick={saveNoteLocally}>
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalRank;