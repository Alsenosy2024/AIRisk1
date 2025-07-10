import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, FileText, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getColorBySeverity, getColorByCategory, getColorByStatus } from "@/lib/utils";
import { RiskForm } from "./risk-form";
// Authentication removed - full access granted
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RiskTableProps {
  risks: any[];
  onRefresh?: () => void;
}

export function RiskTable({ risks, onRefresh }: RiskTableProps) {
  const [selectedRisk, setSelectedRisk] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // Full access granted - authentication removed
  const hasEditPermission = true;
  const hasDeletePermission = true;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleEditClick = (risk: any) => {
    setSelectedRisk(risk);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (risk: any) => {
    setSelectedRisk(risk);
    setIsDeleteDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (riskId: number) => {
      await apiRequest("DELETE", `/api/risks/${riskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Risk Deleted",
        description: "The risk has been deleted successfully.",
      });
      if (onRefresh) onRefresh();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: `Failed to delete risk: ${error.message}`,
      });
    },
  });

  const confirmDelete = () => {
    if (selectedRisk) {
      deleteMutation.mutate(selectedRisk.id);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[100px]">Severity</TableHead>
              <TableHead className="w-[120px]">Owner</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[150px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {risks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No risks found.
                </TableCell>
              </TableRow>
            ) : (
              risks.map((risk) => (
                <TableRow key={risk.id}>
                  <TableCell className="font-medium">{risk.reference_id}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{risk.title}</TableCell>
                  <TableCell>
                    <CategoryBadge category={risk.category} />
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={risk.severity} />
                  </TableCell>
                  <TableCell>
                    {risk.owner?.name || "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={risk.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {hasEditPermission && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(risk)}
                          title="Edit Risk"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Link href={`/risks/${risk.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Details"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                      {hasDeletePermission && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(risk)}
                          title="Delete Risk"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Risk Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Risk</DialogTitle>
          </DialogHeader>
          <RiskForm
            risk={selectedRisk}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              if (onRefresh) onRefresh();
            }}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Risk</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this risk?{" "}
              {selectedRisk && (
                <span className="font-medium">
                  {selectedRisk.reference_id}: {selectedRisk.title}
                </span>
              )}
              <br />
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const { bg, text } = getColorByCategory(category);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {category}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const { bg, text } = getColorBySeverity(severity);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { bg, text } = getColorByStatus(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {status}
    </span>
  );
}
