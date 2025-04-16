import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { FilePlus, FileDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { RiskForm } from "@/components/risks/risk-form";
import { Project } from "@shared/schema";

interface DashboardHeaderProps {
  onCreateRisk?: () => void;
  onExport?: () => void;
}

export function DashboardHeader({ onCreateRisk, onExport }: DashboardHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("all");

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Default export logic if no callback provided
      console.log("Exporting dashboard data...");
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Risk Management Dashboard</h2>
          <p className="text-gray-600 mt-2 flex items-center">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></span>
            Overview of project risks and current status
          </p>
        </div>
        <div className="mt-5 md:mt-0 flex flex-wrap gap-3">
          <Select
            value={selectedProject}
            onValueChange={setSelectedProject}
          >
            <SelectTrigger className="w-[180px] rounded-xl backdrop-blur-sm bg-white/70 border-gray-200/70 shadow-sm">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent className="rounded-xl backdrop-blur-md border-gray-200/70">
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project: Project) => (
                <SelectItem key={project.id} value={String(project.id)}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="default" 
            onClick={handleExport}
            className="button-modern bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200/30"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Button 
            className="button-modern bg-green-50 text-green-600 hover:bg-green-100 border-green-200/30"
            onClick={() => setIsDialogOpen(true)}
          >
            <FilePlus className="mr-2 h-4 w-4" />
            New Risk
          </Button>
        </div>
      </div>

      {/* New Risk Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl rounded-2xl border-gray-100/70 backdrop-blur-xl bg-white/95 shadow-xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center">
              <FilePlus className="mr-2 h-5 w-5 text-blue-500" />
              Add New Risk
            </DialogTitle>
            <p className="text-gray-500 text-sm mt-1">Create a new risk entry to track and manage</p>
          </DialogHeader>
          <RiskForm
            onSuccess={() => {
              setIsDialogOpen(false);
              if (onCreateRisk) onCreateRisk();
            }}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
