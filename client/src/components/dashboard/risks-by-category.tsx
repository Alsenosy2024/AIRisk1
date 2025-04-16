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
import { formatCategoryChartData } from "@/lib/risk-utils";
// Import Chart.js components
import { 
  Chart, 
  ArcElement, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register the required components
Chart.register(ArcElement, Tooltip, Legend);

interface RisksByCategoryProps {
  categories: { category: string; count: number }[];
}

export function RisksByCategory({ categories }: RisksByCategoryProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !categories || categories.length === 0) return;

    // Cleanup previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    const chartData = formatCategoryChartData(categories);

    chartInstance.current = new Chart(ctx, {
      type: "pie",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: {
                size: 12
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [categories]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Risks by Category</CardTitle>
        <CardDescription>Distribution across risk categories</CardDescription>
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
            onClick={() => window.location.href = "/risks"}
          >
            Filter by category
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
