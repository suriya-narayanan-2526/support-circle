/**
 * AI Priority Scorer
 *
 * Implements the domain formula:
 * Priority Score = (Urgency × 0.4) + (Beneficiaries_Normalized × 0.35) + (Inventory_Deficit × 0.25)
 */

const MAX_BENEFICIARIES = 500; // Cap for normalization
const AVG_STOCK = 100;         // Target stock level for deficit

export const calculatePriorityScore = ({ urgency, beneficiaries, currentStock }) => {
  // 1. Urgency (Normalized: 1 to 5 maps to 0.2 to 1.0)
  const urgencyWeight = 0.40;
  const urgencyNormalized = Math.min(Math.max(urgency, 1), 5) / 5;
  const urgencyScore = urgencyNormalized * urgencyWeight;

  // 2. Beneficiaries (Normalized against MAX)
  const beneficiariesWeight = 0.35;
  const bensNormalized = Math.min(beneficiaries, MAX_BENEFICIARIES) / MAX_BENEFICIARIES;
  const bensScore = bensNormalized * beneficiariesWeight;

  // 3. Inventory Deficit
  // If stock >= AVG_STOCK, deficit is 0. Else it's a ratio of how empty it is.
  const stockWeight = 0.25;
  let deficitRatio = 0;
  if (currentStock < AVG_STOCK) {
    deficitRatio = 1 - (currentStock / AVG_STOCK);
  }
  const stockScore = deficitRatio * stockWeight;

  // Output Score
  const rawScore = urgencyScore + bensScore + stockScore;

  // Clamp strictly between 0 and 1 just in case
  const finalScore = Math.min(Math.max(rawScore, 0), 1);
  
  // Return rounded to 4 decimal places
  return parseFloat(finalScore.toFixed(4));
};
