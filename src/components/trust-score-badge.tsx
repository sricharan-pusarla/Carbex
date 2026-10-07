import { Badge } from "@/components/ui/badge";
import { RiskLevel } from "@prisma/client";

interface TrustScoreBadgeProps {
  score: number;
  riskLevel: RiskLevel;
}

export function TrustScoreBadge({ score, riskLevel }: TrustScoreBadgeProps) {
  let badgeColor = "";
  
  switch (riskLevel) {
    case "VERY_LOW":
      badgeColor = "bg-emerald-500 hover:bg-emerald-600 text-white";
      break;
    case "LOW":
      badgeColor = "bg-green-500 hover:bg-green-600 text-white";
      break;
    case "MODERATE":
      badgeColor = "bg-yellow-500 hover:bg-yellow-600 text-white";
      break;
    case "HIGH":
      badgeColor = "bg-orange-500 hover:bg-orange-600 text-white";
      break;
    case "VERY_HIGH":
      badgeColor = "bg-red-500 hover:bg-red-600 text-white";
      break;
    default:
      badgeColor = "bg-gray-500 hover:bg-gray-600 text-white";
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs shadow-sm ${badgeColor}`}>
        {score}
      </div>
      <Badge className={badgeColor} variant="outline">
        {riskLevel.replace("_", " ")} RISK
      </Badge>
    </div>
  );
}
