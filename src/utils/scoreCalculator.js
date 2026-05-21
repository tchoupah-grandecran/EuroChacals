/**
 * Calcule les points d'un joueur en fonction de ses prédictions et des résultats officiels
 * Aligné à 100% sur la logique visuelle de la ScoreModal
 */
export const calculateUserScore = (playerDoc, officialResults) => {
  if (!playerDoc || !officialResults) return 0;

  // ── 0. SÉCURISATION DES CHEMINS (Basé sur la structure Firestore) ──
  // Les champs à la racine du document
  const lastPlace = playerDoc.lastPlace;
  const mostTwelvePoints = playerDoc.mostTwelvePoints;
  const zeroPoints = playerDoc.zeroPoints || [];
  
  // Les champs dans le sous-objet "predictions"
  const pronoData = playerDoc.predictions || {};
  const predTop5 = pronoData.top5 || [];
  const predTop3Jury = pronoData.top3Jury || [];
  const predTop3Public = pronoData.top3Public || [];
  const myPersonalRank = pronoData.myPersonalRank || [];
  const winnerPublicPoints = pronoData.winnerPublicPoints; // À adapter selon où tu le sauvegardes

  // ── 1. EXTRACTION DES SCORES OFFICIELS ──
  const officialScores = officialResults.scores || [];
  const activeScores = officialScores.filter(c => typeof c.total === 'number');
  
  if (activeScores.length === 0) return 0;

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
  predTop5.forEach((countryId, idx) => {
    if (!countryId) return;
    if (idx === 0 && countryId === officialIds[0]) {
      points += 5; // Vainqueur exact
    } else if (officialTop5.includes(countryId)) {
      points += 2; // Dans le Top 5 mais pas 1er
    }
  });

  // --- Top 3 Jury ---
  predTop3Jury.forEach((countryId, idx) => {
    if (!countryId) return;
    if (idx === 0 && countryId === officialJuryIds[0]) {
      points += 3; 
    } else if (officialJuryIds.slice(0, 3).includes(countryId)) {
      points += 1; 
    }
  });

  // --- Top 3 Public ---
  predTop3Public.forEach((countryId, idx) => {
    if (!countryId) return;
    if (idx === 0 && countryId === officialPublicIds[0]) {
      points += 3;
    } else if (officialPublicIds.slice(0, 3).includes(countryId)) {
      points += 1;
    }
  });

  // --- Most 12 points ---
  if (mostTwelvePoints && mostTwelvePoints === officialMost12) {
    points += 5;
  }

  // --- Dernier (Last place) ---
  if (lastPlace && lastPlace === officialLastId) {
    points += 7;
  }

  // --- Points public du vainqueur ---
  if (officialWinner && winnerPublicPoints !== undefined && winnerPublicPoints !== null) {
    const targetPublic = officialWinner.public;
    const delta = Math.abs(Number(winnerPublicPoints) - targetPublic);
    
    if (delta === 0)       points += 100;
    else if (delta <= 20)  points += 50;
    else if (delta <= 50)  points += 20;
    else if (delta <= 75)  points += 10;
    else if (delta <= 150) points += 5;
    else if (delta <= 200) points += 1;
  }

  // --- Pari Zéro Point ---
  zeroPoints.forEach((countryId) => {
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

  // --- Bonus Grille Perso (PLAFONNÉ) ---
  if (myPersonalRank.length > 0) {
    let persoBonus = 0;
    let persoMalus = 0;
    const userBottom5 = myPersonalRank.slice(-5);

    myPersonalRank.forEach((countryId, userIdx) => {
      // Bonus : Rangs exacts (ex: tu as mis la France 4ème, et la France finit 4ème)
      if (userIdx < officialIds.length && countryId === officialIds[userIdx]) {
        persoBonus += 2;
      }
    });

    officialTop5.forEach((favId) => {
      // Malus : Un pays du vrai Top 5 a été mis dans ton Bottom 5
      if (userBottom5.includes(favId)) {
        persoMalus -= 2; 
      }
    });

    // Application des plafonds (+10 max, -10 max)
    points += Math.min(persoBonus, 10);
    points += Math.max(persoMalus, -10); // persoMalus est déjà négatif, on s'assure qu'il ne descende pas sous -10
  }

  return points;
};