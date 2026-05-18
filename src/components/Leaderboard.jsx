import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, getDoc, doc } from 'firebase/firestore';
import ScoreModal from './ScoreModal';

// 📊 Import des icônes Lucide
import { BarChart3, Trophy, Medal, User } from 'lucide-react';

const Leaderboard = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [liveResults, setLiveResults] = useState(null);

  // 🏆 Fetch the official results once so ScoreModal can display real calculations
  useEffect(() => {
    const fetchOfficialResults = async () => {
      try {
        const snap = await getDoc(doc(db, 'results', 'officialRawScores'));
        if (snap.exists()) {
          setLiveResults(snap.data());
        }
      } catch (error) {
        console.error("Erreur chargement résultats officiels:", error);
      }
    };
    fetchOfficialResults();
  }, []);

  useEffect(() => {
    // Écoute en temps réel de la collection leaderboard triée par score décroissant
    const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const playersList = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      
      setRankings(playersList);
      setLoading(false);
    }, (error) => {
      console.error("Erreur écoute leaderboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fonction pour distribuer les icônes de rang sans émojis bruts
  const renderRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Trophy size={20} color="#ffd700" style={styles.iconGlow} />;
      case 1:
        return <Medal size={20} color="#c0c0c0" />;
      case 2:
        return <Medal size={20} color="#cd7f32" />;
      default:
        return <User size={18} color="#a0aec0" />;
    }
  };

  if (loading) {
    return (
      <p style={{ textAlign: 'center', color: '#aaa', fontFamily: "'Outfit', sans-serif", marginTop: '20px' }}>
        Calcul du classement en direct...
      </p>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        <BarChart3 size={22} color="#ff007f" style={{ marginRight: '10px' }} />
        Classement des chacaux
      </h2>
      <p style={styles.subtitle}>Mis à jour en direct selon les résultats officiels</p>

      <div style={styles.list}>
        {rankings.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#a0aec0', fontSize: '0.9rem' }}>
            Aucun pronostic validé pour le moment.
          </p>
        ) : (
          rankings.map((player, index) => {
            const isFirst = index === 0;
            return (
              <div 
                key={player.id} 
                onClick={() => setSelectedPlayer(player)}
                style={{ ...(isFirst ? styles.rowWinner : styles.row), cursor: 'pointer' }}
              >
                <div style={styles.playerInfo}>
                  <div style={styles.rankIconContainer}>
                    {renderRankIcon(index)}
                  </div>
                  <span style={styles.name}>{player.displayName || "Anonyme"}</span>
                </div>
                <div style={styles.scoreBadge}>
                  {player.score} pts
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pass liveResults so ScoreModal can display the real breakdown */}
      <ScoreModal 
        isOpen={Boolean(selectedPlayer)} 
        onClose={() => setSelectedPlayer(null)} 
        player={selectedPlayer}
        liveResults={liveResults}
      />
    </div>
  );
};

const styles = {
  container: { 
    background: 'rgba(255, 255, 255, 0.04)', 
    padding: '25px', 
    borderRadius: '16px', 
    border: '1px solid rgba(255, 255, 255, 0.08)', 
    marginTop: '20px',
    fontFamily: "'Outfit', sans-serif"
  },
  title: { 
    margin: '0 0 5px 0', 
    color: '#ff007f',
    fontFamily: "'Fredoka', sans-serif", 
    fontSize: '1.4rem',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 500,
    letterSpacing: '0.04em'
  },
  subtitle: { color: '#a0aec0', margin: '0 0 25px 0', fontSize: '0.85rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  row: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '14px 18px', 
    background: 'rgba(0, 0, 0, 0.25)', 
    borderRadius: '12px', 
    border: '1px solid rgba(255, 255, 255, 0.04)',
    transition: 'transform 0.15s, border-color 0.15s'
  },
  rowWinner: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '14px 18px', 
    background: 'linear-gradient(90deg, rgba(255, 0, 127, 0.12) 0%, rgba(0, 0, 0, 0.3) 100%)', 
    borderRadius: '12px', 
    border: '1px solid rgba(255, 0, 127, 0.35)',
    boxShadow: '0 4px 20px rgba(255, 0, 127, 0.05)'
  },
  playerInfo: { display: 'flex', alignItems: 'center', gap: '14px' },
  rankIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px'
  },
  iconGlow: {
    filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.4))'
  },
  name: { fontWeight: 500, fontSize: '1.05rem', color: '#fff' },
  scoreBadge: { 
    background: '#ff007f', 
    color: '#fff', 
    padding: '6px 14px', 
    borderRadius: '20px', 
    fontWeight: 700, 
    fontSize: '0.95rem', 
    boxShadow: '0 0 12px rgba(255,0,127,0.35)' 
  }
};

export default Leaderboard;