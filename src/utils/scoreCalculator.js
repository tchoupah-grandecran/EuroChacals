/**
 * Calcule les points d'un joueur en fonction de ses prédictions et des résultats officiels
 */
export const calculateUserScore = (prediction, officialResults) => {
  if (!prediction || !officialResults) return 0;

  let points = 0;

  // --- 1. TOP 5 GÉNÉRAL (Existant) ---
  const predTop5 = prediction.top5 || [];
  const offTop5 = officialResults.top5 || [];
  predTop5.forEach((countryId, index) => {
    if (!countryId) return;
    if (offTop5[index] === countryId) points += 10; // Rang exact
    else if (offTop5.includes(countryId)) points += 5; // Dans le Top 5
  });

  // --- 2. CUILLÈRE DE BOIS / DERNIER (Existant) ---
  if (prediction.lastPlace && officialResults.lastPlace && prediction.lastPlace === officialResults.lastPlace) {
    points += 15;
  }

  // --- 3. BONUS POINTS PUBLIC DU GAGNANT (Existant) ---
  if (officialResults.winnerPublicPoints > 0 && prediction.winnerPublicPoints > 0) {
    const difference = Math.abs(prediction.winnerPublicPoints - officialResults.winnerPublicPoints);
    if (difference === 0) points += 20;
    else if (difference <= 20) points += 10;
  }

  // --- 4. TOP 3 JURY (Nouveau) ---
  const predTop3Jury = prediction.top3Jury || [];
  const offTop3Jury = officialResults.top3Jury || [];
  predTop3Jury.forEach((countryId, index) => {
    if (!countryId) return;
    if (offTop3Jury[index] === countryId) points += 8; // Rang exact
    else if (offTop3Jury.includes(countryId)) points += 4; // Dans le Top 3
  });

  // --- 5. TOP 3 PUBLIC (Nouveau) ---
  const predTop3Public = prediction.top3Public || [];
  const offTop3Public = officialResults.top3Public || [];
  predTop3Public.forEach((countryId, index) => {
    if (!countryId) return;
    if (offTop3Public[index] === countryId) points += 8; // Rang exact
    else if (offTop3Public.includes(countryId)) points += 4; // Dans le Top 3
  });

  // --- 6. LE ROI DES 12 POINTS JURY (Nouveau) ---
  if (prediction.mostTwelvePoints && officialResults.mostTwelvePoints && prediction.mostTwelvePoints === officialResults.mostTwelvePoints) {
    points += 10;
  }

  // --- 7. MÉCANIQUE PARI RISQUÉ : LES ZÉRO POINTS (Nouveau) ---
  const predZeroPoints = prediction.zeroPoints || [];
  const offZeroPoints = officialResults.zeroPoints || []; // Liste des pays qui ont VRAIMENT eu un 0 (Jury ou Télévote)

  if (predZeroPoints.length > 0 && officialResults.hasZeroPointsResultsPublished) {
    predZeroPoints.forEach((countryId) => {
      if (!countryId) return;
      if (offZeroPoints.includes(countryId)) {
        points += 15; // Énorme boost si validé !
      } else {
        points -= 5; // Malus vicieux si le pays a gratté des points !
      }
    });
  }

  return points;
};