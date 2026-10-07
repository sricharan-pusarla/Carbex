"use server";

import { prisma } from "@/lib/prisma";

export async function getRecommendations(query: string) {
  // Extremely simple deterministic NLP for the MVP
  const lowerQuery = query.toLowerCase();
  
  // Extract quantity (first number found)
  const qtyMatch = lowerQuery.match(/(\d+)/);
  const requestedQty = qtyMatch ? parseInt(qtyMatch[1]) : 0;
  
  // Extract keywords
  const isIndia = lowerQuery.includes("india");
  const isBrazil = lowerQuery.includes("brazil");
  const isKenya = lowerQuery.includes("kenya");
  
  const isSolar = lowerQuery.includes("solar");
  const isWind = lowerQuery.includes("wind");
  const isForest = lowerQuery.includes("reforestation") || lowerQuery.includes("forest");
  const isRenewable = lowerQuery.includes("renewable") || isSolar || isWind;

  // Fetch all active listings/projects
  const projects = await prisma.carbonProject.findMany({
    where: {
      availableCredits: {
        gte: requestedQty > 0 ? requestedQty : 0
      }
    },
    include: {
      trustScore: true
    }
  });

  // Score them based on match
  const scoredProjects = projects.map(p => {
    let score = 0;
    const reasons: string[] = [];

    // Check quantity
    if (requestedQty > 0 && p.availableCredits >= requestedQty) {
      score += 10;
      reasons.push(`Meets required quantity (${requestedQty} credits)`);
    }

    // Check location
    if (isIndia && p.country.toLowerCase() === "india") {
      score += 20;
      reasons.push("Located in preferred region (India)");
    }
    if (isBrazil && p.country.toLowerCase() === "brazil") {
      score += 20;
      reasons.push("Located in preferred region (Brazil)");
    }
    if (isKenya && p.country.toLowerCase() === "kenya") {
      score += 20;
      reasons.push("Located in preferred region (Kenya)");
    }

    // Check type
    if (isRenewable && p.projectType.toLowerCase().includes("renewable")) {
      score += 20;
      reasons.push("Matches preferred type (Renewable Energy)");
    }
    if (isSolar && p.projectType.toLowerCase().includes("solar")) {
      score += 20;
      reasons.push("Matches preferred type (Solar)");
    }
    if (isWind && p.projectType.toLowerCase().includes("wind")) {
      score += 20;
      reasons.push("Matches preferred type (Wind)");
    }
    if (isForest && p.projectType.toLowerCase().includes("reforestation")) {
      score += 20;
      reasons.push("Matches preferred type (Reforestation)");
    }

    // High trust score bonus
    if (p.trustScore && p.trustScore.overallScore >= 90) {
      score += 15;
      reasons.push(`High trust score (${p.trustScore.overallScore}/100)`);
    }

    // Default reason if no specific query matches but it's a good project
    if (reasons.length === 0 && p.trustScore && p.trustScore.overallScore >= 80) {
      reasons.push("Recommended baseline project (High Trust)");
      score += 5;
    }

    return { project: p, score, reasons };
  });

  // Sort by score and return top 3
  return scoredProjects
    .filter(sp => sp.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
