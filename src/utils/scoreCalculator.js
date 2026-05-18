/**
 * Calcule les points d'un joueur en fonction de ses prédictions et des résultats officiels
 * Aligné à 100% sur la logique visuelle de la ScoreModal
 */
export const calculateUserScore = (prediction, officialResults) => {
  if (!prediction || !officialResults) return 0;

  // ── 1. EXTRACTION DES SCORES OFFICIELS (Miroir de la Modale) ──
  const officialScores = officialResults.scores || [];
  const activeScores = officialScores.filter(c => typeof c.total === 'number');
  
  // Si l'admin n'a encore entré aucun score, le score est de 0
  if (activeScores.length === 0) return 0;

  // Tri des classements officiels en temps réel
  const sortedByTotal  = [...activeScores].sort((a, b) => b.total  - a.total);
  const sortedByJury   = [...activeScores].sort((a, b) => b.jury   - a.jury);
  const sortedByPublic = [...activeScores].sort((a, b) => b.public - a.public);

  const officialIds       = sortedByTotal.map(c => c.id);
  const officialTop5      = officialIds.slice(0, 5);
  const officialLastId    = officialIds[officialIds.length - 1];
  const officialJuryIds   = sortedByJury.map(c => c.id);
  const officialPublicIds = sortedByPublic.map(c => c.id);
  const officialMost12    = officialResults.mostTwelvePoints || '';
  const officialWinner    = sortedByTotal[0];

  let points = 0;

  // ── 2. CALCUL DES CATÉGORIES ──

  // --- Top 5 Général ---
  const predTop5 = prediction.top5 || [];
  predTop5.forEach((countryId, idx) => {
    if (!countryId) return;
    if (idx === 0 && countryId === officialIds[0]) {
      points += 5; // Vainqueur exact !
    } else if (officialTop5.includes(countryId)) {
      points += 2; // Dans le Top 5
    }
  });

  // --- Top 3 Jury ---
  const predTop3Jury = prediction.top3Jury || [];
  predTop3Jury.forEach((countryId, idx) => {
    if (!countryId) return;
    if (idx === 0 && countryId === officialJuryIds[0]) {
      points += 3; // 1er Jury exact !
    } else if (officialJuryIds.slice(0, 3).includes(countryId)) {
      points += 1; // Dans le Top 3 Jury
    }
  });

  // --- Top 3 Public ---
  const predTop3Public = prediction.top3Public || [];
  predTop3Public.forEach((countryId, idx) => {
    if (!countryId) return;
    if (idx === 0 && countryId === officialPublicIds[0]) {
      points += 3; // 1er Télévote exact !
    } else if (officialPublicIds.slice(0, 3).includes(countryId)) {
      points += 1; // Dans le Top 3 Public
    }
  });

  // --- Most 12 points ---
  if (prediction.mostTwelvePoints && prediction.mostTwelvePoints === officialMost12) {
    points += 5;
  }

  // --- Dernier (Last place) ---
  if (prediction.lastPlace && prediction.lastPlace === officialLastId) {
    points += 7;
  }

  // --- Points public du vainqueur ---
  if (officialWinner && prediction.winnerPublicPoints !== undefined && prediction.winnerPublicPoints !== null) {
    const targetPublic = officialWinner.public;
    const delta = Math.abs(Number(prediction.winnerPublicPoints) - targetPublic);
    
    if (delta === 0)       points += 100;
    else if (delta <= 20)  points += 50;
    else if (delta <= 50)  points += 20;
    else if (delta <= 75)  points += 10;
    else if (delta <= 150) points += 5;
    else if (delta <= 200) points += 1;
  }

  // --- Pari Zéro Point ---
  const predZeroPoints = prediction.zeroPoints || [];
  predZeroPoints.forEach((countryId) => {
    if (!countryId) return;
    const actual = activeScores.find(c => c.id === countryId);
    if (actual) {
      if (actual.total === 0) {
        points += 15;
      } else {
        points -= 5;
      }
    }
  });

  // --- Bonus Grille Perso (myPersonalRank) ---
  const myPersonalRank = prediction.myPersonalRank || [];
  if (myPersonalRank.length > 0) {
    const userBottom5 = myPersonalRank.slice(-5);

    myPersonalRank.forEach((countryId, userIdx) => {
      if (userIdx < officialIds.length && countryId === officialIds[userIdx]) {
        points += 2; // Rang exact
      }
    });

    officialTop5.forEach((favId) => {
      if (userBottom5.includes(favId)) {
        points -= 2; // Pénalité favori dans le bottom 5
      }
    });
  }

  return points;
};