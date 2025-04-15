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

interface DashboardHeaderProps {
  onCreateRisk?: () => void;
  onExport?: () => void;
}

export function DashboardHeader({ onCreateRisk, onExport }: DashboardHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("all");

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery({
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
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Risk Management Dashboard</h2>
          <p className="text-gray-600 mt-1">Overview of project risks and current status</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
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
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="default" 
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setIsDialogOpen(true)}
          >
            <FilePlus className="mr-2 h-4 w-4" />
            New Risk
          </Button>
        </div>
      </div>

      {/* New Risk Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Risk</DialogTitle>
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
