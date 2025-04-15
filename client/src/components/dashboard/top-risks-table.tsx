import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { getColorBySeverity, getColorByCategory, getColorByStatus } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RiskForm } from "@/components/risks/risk-form";
import { useAuth } from "@/contexts/auth-context";

// Table column headers
const columns = [
  { key: "reference_id", label: "ID" },
  { key: "title", label: "Risk" },
  { key: "category", label: "Category" },
  { key: "severity", label: "Severity" },
  { key: "owner", label: "Owner" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

interface TopRisksTableProps {
  risks: any[];
  onRefresh?: () => void;
}

export function TopRisksTable({ risks, onRefresh }: TopRisksTableProps) {
  const [selectedRisk, setSelectedRisk] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { hasEditPermission } = useAuth();

  const handleEditClick = (risk: any) => {
    setSelectedRisk(risk);
    setIsEditDialogOpen(true);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium text-gray-900">
          Top Risks Requiring Attention
        </CardTitle>
        <div>
          <Link href="/risks">
            <Button variant="link" className="text-blue-600 hover:text-blue-700">
              View all risks
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {risks && risks.length > 0 ? (
                risks.map((risk) => (
                  <tr key={risk.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {risk.reference_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {risk.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <CategoryBadge category={risk.category} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SeverityBadge severity={risk.severity} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {risk.owner?.name || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={risk.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {hasEditPermission && (
                        <Button
                          variant="link"
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => handleEditClick(risk)}
                        >
                          Edit
                        </Button>
                      )}
                      <Link href={`/risks/${risk.id}`}>
                        <Button variant="link" className="text-gray-500 hover:text-gray-700">
                          Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No risks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

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
    </Card>
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
