export type HeatmapCell = {
  impact: number;
  probability: number;
  count: number;
  severity: string;
  color: string;
};

// Get the severity category based on probability and impact
export function getSeverity(probability: number, impact: number): string {
  const score = probability * impact;
  
  if (score >= 20) return "Critical";
  if (score >= 12) return "High";
  if (score >= 6) return "Medium";
  if (score >= 3) return "Low";
  return "Very Low";
}

// Get the color for the heatmap cell based on probability and impact
export function getHeatmapCellColor(probability: number, impact: number): string {
  const severity = getSeverity(probability, impact);
  
  switch (severity) {
    case "Critical":
      return "bg-red-600 hover:bg-red-700";
    case "High":
      return "bg-red-400 hover:bg-red-500";
    case "Medium":
      return "bg-orange-300 hover:bg-orange-400";
    case "Low":
      return "bg-yellow-300 hover:bg-yellow-400";
    case "Very Low":
      return "bg-green-100 hover:bg-green-200";
    default:
      return "bg-gray-100 hover:bg-gray-200";
  }
}

// Generate heatmap data for rendering the risk heatmap
export function generateHeatmapData(riskData: any[]): HeatmapCell[] {
  const heatmapData: HeatmapCell[] = [];
  
  // Initialize with empty cells
  for (let impact = 5; impact >= 1; impact--) {
    for (let probability = 1; probability <= 5; probability++) {
      const severity = getSeverity(probability, impact);
      const color = getHeatmapCellColor(probability, impact);
      
      heatmapData.push({
        impact,
        probability,
        count: 0,
        severity,
        color
      });
    }
  }
  
  // Fill in counts from actual risk data
  if (riskData && riskData.length > 0) {
    riskData.forEach(item => {
      const cell = heatmapData.find(
        cell => cell.impact === item.impact && cell.probability === item.probability
      );
      
      if (cell) {
        cell.count = item.count;
      }
    });
  }
  
  return heatmapData;
}

// Format risk data for the category chart
export function formatCategoryChartData(categories: { category: string; count: number }[]) {
  if (!categories || categories.length === 0) {
    return {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
        },
      ],
    };
  }
  
  const categoryColors = {
    Technical: "#3B82F6", // primary/blue
    Financial: "#10B981", // success/green
    Operational: "#6366F1", // info/indigo
    Security: "#EF4444", // danger/red
    Organizational: "#8B5CF6", // purple
    External: "#F59E0B", // warning/amber
  };
  
  return {
    labels: categories.map(item => item.category),
    datasets: [
      {
        data: categories.map(item => item.count),
        backgroundColor: categories.map(item => categoryColors[item.category] || "#9CA3AF"),
      },
    ],
  };
}

// Format risk data for the trend chart
export function formatTrendChartData(trendData: { month: string; critical: number; high: number; medium: number }[]) {
  if (!trendData || trendData.length === 0) {
    return {
      labels: [],
      datasets: [],
    };
  }
  
  return {
    labels: trendData.map(item => item.month),
    datasets: [
      {
        label: "Critical Risks",
        data: trendData.map(item => item.critical),
        borderColor: "#EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
      },
      {
        label: "High Risks",
        data: trendData.map(item => item.high),
        borderColor: "#F59E0B",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.4,
      },
      {
        label: "Medium Risks",
        data: trendData.map(item => item.medium),
        borderColor: "#6366F1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
      },
    ],
  };
}

// Generate random IDs for demo purposes
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
