import { useEffect, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Link } from "wouter";
import { formatTrendChartData } from "@/lib/risk-utils";
// Import Chart.js components
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register the required components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface RiskTrendProps {
  trendData: { month: string; critical: number; high: number; medium: number }[];
}

export function RiskTrend({ trendData }: RiskTrendProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !trendData || trendData.length === 0) return;

    // Cleanup previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    const chartData = formatTrendChartData(trendData);

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Risks"
            }
          },
          x: {
            title: {
              display: true,
              text: "Month"
            }
          }
        },
        plugins: {
          legend: {
            position: "bottom"
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [trendData]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Risk Trend</CardTitle>
        <CardDescription>Risk severity over time</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="h-64 w-full">
          <div className="w-full h-full flex items-center justify-center">
            <canvas ref={chartRef} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <div className="text-sm">
          <div
            className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
            onClick={() => window.location.href = "/reports"}
          >
            View historical data
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
