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
    <div className="mb-10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
              Risk Management Dashboard
            </h1>
          </div>
          <p className="text-gray-600 text-lg flex items-center ml-7">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse"></span>
              AI-powered overview of project risks and current status
            </span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedProject}
            onValueChange={setSelectedProject}
          >
            <SelectTrigger className="w-[200px] h-11 rounded-xl bg-white/80 backdrop-blur-sm border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent className="rounded-xl backdrop-blur-md border-gray-200 shadow-lg">
              <SelectItem value="all" className="rounded-lg">All Projects</SelectItem>
              {projects.map((project: Project) => (
                <SelectItem key={project.id} value={String(project.id)} className="rounded-lg">
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export Dashboard
          </Button>
          
          <Button 
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            onClick={() => setIsDialogOpen(true)}
          >
            <FilePlus className="mr-2 h-4 w-4" />
            New Risk
          </Button>
        </div>
      </div>

      {/* Enhanced New Risk Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl rounded-2xl border-gray-100 backdrop-blur-xl bg-white/98 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <FilePlus className="h-5 w-5" />
              </div>
              Create New Risk
            </DialogTitle>
            <p className="text-gray-600 text-sm mt-2 ml-12">
              Add a comprehensive risk entry with AI-powered suggestions and intelligent categorization
            </p>
          </DialogHeader>
          <div className="pt-4">
            <RiskForm
              onSuccess={() => {
                setIsDialogOpen(false);
                if (onCreateRisk) onCreateRisk();
              }}
              onCancel={() => setIsDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
