import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useLocation } from "wouter";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { RiskFilters } from "@/components/risks/risk-filters";
import { RiskTable } from "@/components/risks/risk-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FilePlus, FileDown, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RiskForm } from "@/components/risks/risk-form";
import { Risk } from "@shared/schema";

export default function RiskRegister() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  // Parse URL for projectId
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const projectId = searchParams.get('projectId');
    
    if (projectId) {
      setFilters(prev => ({ ...prev, project_id: parseInt(projectId, 10) }));
    } else {
      // Reset to empty filters if no projectId is specified
      setFilters({});
    }
  }, [location]);

  // Construct the query key with filters
  const queryKey = ["/api/risks", filters];

  // Fetch risks with filters
  const { data: risks = [], isLoading, refetch } = useQuery<Risk[]>({
    queryKey,
    staleTime: 1000 * 60, // 1 minute
  });

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleCreateRisk = () => {
    setIsCreateDialogOpen(true);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text("Risk Register", 14, 22);
      
      // Add date
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Format data for the table
      const tableData = risks.map((risk: any) => [
        risk.reference_id,
        risk.title,
        risk.category,
        risk.severity,
        risk.status,
        risk.owner?.name || "Unassigned",
      ]);
      
      // Add the table
      (doc as any).autoTable({
        startY: 40,
        head: [["ID", "Risk", "Category", "Severity", "Status", "Owner"]],
        body: tableData,
        headStyles: { fillColor: [59, 130, 246] }, // Blue header
      });
      
      // Save the PDF
      doc.save("risk-register.pdf");
      
      toast({
        title: "PDF Exported",
        description: "Risk register has been exported as PDF",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export PDF",
      });
    }
  };

  const handleExportExcel = () => {
    try {
      // Format data for Excel
      const excelData = risks.map((risk: any) => ({
        ID: risk.reference_id,
        Title: risk.title,
        Description: risk.description,
        Category: risk.category,
        Probability: risk.probability,
        Impact: risk.impact,
        Severity: risk.severity,
        Status: risk.status,
        Owner: risk.owner?.name || "Unassigned",
        "Mitigation Plan": risk.mitigation_plan,
        Project: risk.project?.name || "None",
        "Created Date": new Date(risk.created_at).toLocaleDateString(),
      }));
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Risks");
      
      // Generate Excel file
      XLSX.writeFile(workbook, "risk-register.xlsx");
      
      toast({
        title: "Excel Exported",
        description: "Risk register has been exported as Excel",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export Excel",
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
                <h2 className="text-2xl font-bold text-gray-800">Risk Register</h2>
                <p className="text-gray-600 mt-1">Manage and monitor all project risks</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleExportExcel}
                  className="bg-white"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleExportPDF}
                  className="bg-white"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleCreateRisk}
                >
                  <FilePlus className="mr-2 h-4 w-4" />
                  New Risk
                </Button>
              </div>
            </div>
          </div>

          {/* Risk Filters */}
          <RiskFilters onFilterChange={handleFilterChange} />

          {/* Risk Table */}
          {isLoading ? (
            <div className="bg-white rounded-md shadow p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading risks...</p>
            </div>
          ) : (
            <RiskTable risks={risks} onRefresh={() => refetch()} />
          )}

          {/* Create Risk Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Risk</DialogTitle>
              </DialogHeader>
              <RiskForm
                initialProjectId={filters.project_id as number | undefined}
                onSuccess={() => {
                  setIsCreateDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
                }}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
