import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Link } from "wouter";
import { generateHeatmapData, type HeatmapCell } from "@/lib/risk-utils";
import { useMemo } from "react";

interface RiskHeatmapProps {
  heatmapData: { impact: number; probability: number; count: number }[];
}

export function RiskHeatmap({ heatmapData }: RiskHeatmapProps) {
  // Process the heatmap data
  const processedData = useMemo(() => {
    return generateHeatmapData(heatmapData || []);
  }, [heatmapData]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Risk Heatmap</CardTitle>
        <CardDescription>Distribution by impact and probability</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="aspect-square w-full">
          <div className="w-full h-full">
            {/* Risk Heatmap Grid */}
            <div className="grid grid-cols-5 grid-rows-5 gap-1 h-full">
              {processedData.map((cell, index) => (
                <HeatmapCell key={index} cell={cell} />
              ))}
            </div>
            
            {/* Heatmap Labels */}
            <div className="grid grid-cols-2 mt-2">
              <div className="text-xs text-gray-500">
                <span className="font-medium">X-axis:</span> Probability
              </div>
              <div className="text-xs text-gray-500 text-right">
                <span className="font-medium">Y-axis:</span> Impact
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <div className="text-sm">
          <div
            className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
            onClick={() => window.location.href = "/risks"}
          >
            View detailed analysis
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

interface HeatmapCellProps {
  cell: HeatmapCell;
}

function HeatmapCell({ cell }: HeatmapCellProps) {
  const { impact, probability, count, color } = cell;
  const title = `${getImpactText(impact)} Impact, ${getProbabilityText(probability)} Probability - ${count} risks`;
  
  return (
    <div 
      className={`${color} flex items-center justify-center cursor-pointer rounded text-xs`}
      title={title}
    >
      {count}
    </div>
  );
}

// Helper functions to get text descriptions for the heatmap
function getImpactText(impact: number): string {
  switch (impact) {
    case 5: return "Very High";
    case 4: return "High";
    case 3: return "Medium";
    case 2: return "Low";
    case 1: return "Very Low";
    default: return "Unknown";
  }
}

function getProbabilityText(probability: number): string {
  switch (probability) {
    case 5: return "Very High";
    case 4: return "High";
    case 3: return "Medium";
    case 2: return "Low";
    case 1: return "Very Low";
    default: return "Unknown";
  }
}
