import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RISK_CATEGORIES, RISK_SEVERITY, RISK_STATUS } from "@shared/schema";
import { Search, FilterX } from "lucide-react";

type FilterType = {
  project_id?: number;
  category?: string;
  severity?: string;
  status?: string;
  owner_id?: number;
};

interface RiskFiltersProps {
  onFilterChange: (filters: FilterType) => void;
  initialFilters?: FilterType;
}

export function RiskFilters({ onFilterChange, initialFilters }: RiskFiltersProps) {
  const [filters, setFilters] = useState({
    search: "",
    project_id: initialFilters?.project_id ? initialFilters.project_id.toString() : "",
    owner_id: initialFilters?.owner_id ? initialFilters.owner_id.toString() : "",
    category: initialFilters?.category || "",
    severity: initialFilters?.severity || "",
    status: initialFilters?.status || "",
  });

  // Fetch projects for filter dropdown
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch users for owner filter dropdown
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update filters when initialFilters changes
  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({
        ...prev,
        project_id: initialFilters.project_id ? initialFilters.project_id.toString() : "",
        owner_id: initialFilters.owner_id ? initialFilters.owner_id.toString() : "",
        category: initialFilters.category || "",
        severity: initialFilters.severity || "",
        status: initialFilters.status || "",
      }));
    }
  }, [initialFilters]);

  // Update parent component when filters change
  useEffect(() => {
    // Remove empty filters and handle "all" value
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value !== "all") {
        acc[key] = key === 'project_id' || key === 'owner_id' 
          ? parseInt(value, 10) 
          : value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    onFilterChange(activeFilters);
  }, [filters, onFilterChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      // Preserve project_id from initialFilters if available
      project_id: initialFilters?.project_id ? initialFilters.project_id.toString() : "",
      owner_id: "",
      category: "",
      severity: "",
      status: "",
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                name="search"
                placeholder="Search risks..."
                className="pl-9"
                value={filters.search}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Project Filter */}
          <div>
            <Select
              value={filters.project_id}
              onValueChange={(value) => handleSelectChange("project_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Owner Filter */}
          <div>
            <Select
              value={filters.owner_id}
              onValueChange={(value) => handleSelectChange("owner_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div>
            <Select
              value={filters.category}
              onValueChange={(value) => handleSelectChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {RISK_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity Filter */}
          <div>
            <Select
              value={filters.severity}
              onValueChange={(value) => handleSelectChange("severity", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {RISK_SEVERITY.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    {severity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2 flex space-x-4">
            <div className="flex-1">
              <Select
                value={filters.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {RISK_STATUS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters */}
            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex items-center space-x-1"
            >
              <FilterX className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
