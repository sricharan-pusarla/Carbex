import { RiskLevel } from "@prisma/client";

export interface TrustScoreInput {
  verificationScore: number;
  documentationScore: number;
  additionalityScore: number;
  historyScore: number;
  provenanceScore: number;
  doubleCountingScore: number;
}

export interface TrustScoreResult extends TrustScoreInput {
  overallScore: number;
  riskLevel: RiskLevel;
  explanation: string;
}

/**
 * Weights for the deterministic Carbon Trust Score engine.
 * Total must equal 1.0 (100%)
 */
const SCORE_WEIGHTS = {
  verification: 0.25,
  documentation: 0.20,
  additionality: 0.20,
  history: 0.15,
  provenance: 0.10,
  doubleCounting: 0.10,
};

/**
 * Calculates the overall Carbon Trust Score using a deterministic weighted formula.
 */
export function calculateTrustScore(input: TrustScoreInput): number {
  const score = (
    input.verificationScore * SCORE_WEIGHTS.verification +
    input.documentationScore * SCORE_WEIGHTS.documentation +
    input.additionalityScore * SCORE_WEIGHTS.additionality +
    input.historyScore * SCORE_WEIGHTS.history +
    input.provenanceScore * SCORE_WEIGHTS.provenance +
    input.doubleCountingScore * SCORE_WEIGHTS.doubleCounting
  );
  
  return Math.round(score);
}

/**
 * Maps an overall 0-100 score to a standardized RiskLevel.
 */
export function calculateRiskLevel(overallScore: number): RiskLevel {
  if (overallScore >= 90) return "VERY_LOW";
  if (overallScore >= 80) return "LOW";
  if (overallScore >= 70) return "MODERATE";
  if (overallScore >= 60) return "HIGH";
  return "VERY_HIGH";
}

/**
 * Generates a human-readable explanation of why a project received its specific score.
 */
export function generateTrustExplanation(input: TrustScoreInput, overallScore: number, riskLevel: RiskLevel): string {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Analyze specific factors to build a dynamic explanation
  if (input.verificationScore >= 90) strengths.push("exceptional verification standards");
  else if (input.verificationScore <= 65) weaknesses.push("weak verification backing");

  if (input.additionalityScore >= 90) strengths.push("strong proof of additionality");
  else if (input.additionalityScore <= 65) weaknesses.push("questionable baseline scenarios (additionality)");

  if (input.provenanceScore >= 90) strengths.push("transparent chain of custody");
  else if (input.provenanceScore <= 65) weaknesses.push("opaque provenance tracking");

  if (input.doubleCountingScore >= 90) strengths.push("negligible double-counting risk");
  else if (input.doubleCountingScore <= 65) weaknesses.push("high risk of double-counting overlap");

  let baseExplanation = "";
  
  if (riskLevel === "VERY_LOW") {
    baseExplanation = "This project demonstrates an elite risk profile. ";
  } else if (riskLevel === "LOW") {
    baseExplanation = "This project presents a solid, low-risk opportunity. ";
  } else if (riskLevel === "MODERATE") {
    baseExplanation = "This project is generally acceptable but carries some standard market risks. ";
  } else if (riskLevel === "HIGH") {
    baseExplanation = "This project carries significant risk factors and should be approached with caution. ";
  } else {
    baseExplanation = "This project exhibits severe risk factors across multiple core carbon vectors. ";
  }

  let detail = "";
  if (strengths.length > 0 && weaknesses.length === 0) {
    detail = `It is highlighted by ${strengths.join(" and ")}.`;
  } else if (strengths.length > 0 && weaknesses.length > 0) {
    detail = `While it benefits from ${strengths[0]}, it is held back by ${weaknesses[0]}.`;
  } else if (weaknesses.length > 0) {
    detail = `Its score is primarily impacted by ${weaknesses.join(" and ")}.`;
  } else {
    detail = "It performs averagely across all tracked market metrics.";
  }

  return baseExplanation + detail;
}

/**
 * Convenience function to process a raw input into a full TrustScore entity.
 */
export function evaluateProjectTrust(input: TrustScoreInput): TrustScoreResult {
  const overallScore = calculateTrustScore(input);
  const riskLevel = calculateRiskLevel(overallScore);
  const explanation = generateTrustExplanation(input, overallScore, riskLevel);

  return {
    ...input,
    overallScore,
    riskLevel,
    explanation
  };
}
