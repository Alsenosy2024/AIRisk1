import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Download, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getColorBySeverity, getColorByStatus } from "@/lib/utils";
import Chart from "chart.js/auto";
import { formatCategoryChartData, formatTrendChartData } from "@/lib/risk-utils";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

export default function Reports() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [selectedProject, setSelectedProject] = useState("all");
  const { toast } = useToast();
  
  // Chart refs
  const categoryChartRef = useRef<HTMLCanvasElement | null>(null);
  const trendChartRef = useRef<HTMLCanvasElement | null>(null);
  const statusChartRef = useRef<HTMLCanvasElement | null>(null);
  
  const categoryChartInstance = useRef<Chart | null>(null);
  const trendChartInstance = useRef<Chart | null>(null);
  const statusChartInstance = useRef<Chart | null>(null);

  // Fetch dashboard data
  const { data: dashboardData } = useQuery({
    queryKey: ["/api/dashboard"],
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch projects for filter dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Initialize and update charts when data changes
  useEffect(() => {
    if (!dashboardData) return;

    // Update category chart
    if (categoryChartRef.current) {
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }

      const ctx = categoryChartRef.current.getContext("2d");
      if (ctx) {
        const chartData = formatCategoryChartData(dashboardData.risksByCategory);
        categoryChartInstance.current = new Chart(ctx, {
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
      }
    }

    // Update trend chart
    if (trendChartRef.current) {
      if (trendChartInstance.current) {
        trendChartInstance.current.destroy();
      }

      const ctx = trendChartRef.current.getContext("2d");
      if (ctx) {
        const chartData = formatTrendChartData(dashboardData.riskTrend);
        trendChartInstance.current = new Chart(ctx, {
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
      }
    }

    // Update status chart
    if (statusChartRef.current) {
      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
      }

      const ctx = statusChartRef.current.getContext("2d");
      if (ctx) {
        const statusData = {
          labels: dashboardData.risksByStatus.map((item: any) => item.status),
          datasets: [
            {
              data: dashboardData.risksByStatus.map((item: any) => item.count),
              backgroundColor: dashboardData.risksByStatus.map((item: any) => {
                const { color } = getColorByStatus(item.status);
                return color || "#9CA3AF";
              }),
            },
          ],
        };

        statusChartInstance.current = new Chart(ctx, {
          type: "bar",
          data: statusData,
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
                  text: "Status"
                }
              }
            },
            plugins: {
              legend: {
                display: false
              }
            }
          }
        });
      }
    }

    return () => {
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }
      if (trendChartInstance.current) {
        trendChartInstance.current.destroy();
      }
      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
      }
    };
  }, [dashboardData]);

  const generateReport = () => {
    try {
      const doc = new jsPDF();
      
      // Add title and date
      doc.setFontSize(20);
      doc.text("Risk Management Report", 105, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 30, { align: "center" });
      doc.text(`Project: ${selectedProject === "all" ? "All Projects" : 
        projects.find((p) => p.id.toString() === selectedProject)?.name || selectedProject}`, 
        105, 40, { align: "center" });
      
      // Summary section
      doc.setFontSize(16);
      doc.text("Risk Summary", 14, 60);
      
      doc.setFontSize(12);
      doc.text(`Total Risks: ${dashboardData?.totalRisks || 0}`, 14, 70);
      doc.text(`Critical Risks: ${dashboardData?.criticalRisks || 0}`, 14, 80);
      doc.text(`High Risks: ${dashboardData?.highRisks || 0}`, 14, 90);
      doc.text(`Mitigation Progress: ${dashboardData?.mitigationProgress || 0}%`, 14, 100);
      
      // Add risks table
      doc.setFontSize(16);
      doc.text("Top Risks", 14, 120);
      
      const tableData = dashboardData?.topRisks.map((risk: any) => [
        risk.reference_id,
        risk.title.substring(0, 30) + (risk.title.length > 30 ? "..." : ""),
        risk.category,
        risk.severity,
        risk.status,
        risk.owner?.name || "Unassigned",
      ]) || [];
      
      (doc as any).autoTable({
        startY: 130,
        head: [["ID", "Risk", "Category", "Severity", "Status", "Owner"]],
        body: tableData,
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      // Save the PDF
      doc.save("risk-management-report.pdf");
      
      toast({
        title: "Report Generated",
        description: "Your report has been generated and downloaded",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Report Generation Failed",
        description: "Failed to generate the report",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      {sidebarVisible && <Sidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
                <p className="text-gray-600 mt-1">Risk management reporting and analytics</p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center space-x-3">
                <Select
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline"
                  onClick={() => generateReport()}
                  className="bg-white"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </div>
          </div>

          {/* Report Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Summary Card */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Risk Overview</CardTitle>
                <CardDescription>Summary of risk management status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-500">Total Risks</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{dashboardData?.totalRisks || 0}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-red-500">Critical Risks</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{dashboardData?.criticalRisks || 0}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-amber-500">High Risks</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{dashboardData?.highRisks || 0}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-green-500">Mitigation Progress</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{dashboardData?.mitigationProgress || 0}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risks by Category Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Risks by Category</CardTitle>
                <CardDescription>Distribution across risk categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <canvas ref={categoryChartRef} />
                </div>
              </CardContent>
            </Card>

            {/* Risk Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Trend</CardTitle>
                <CardDescription>Risk severity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <canvas ref={trendChartRef} />
                </div>
              </CardContent>
            </Card>

            {/* Risks by Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Risks by Status</CardTitle>
                <CardDescription>Current status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <canvas ref={statusChartRef} />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
