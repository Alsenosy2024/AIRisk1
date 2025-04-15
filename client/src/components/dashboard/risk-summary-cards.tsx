import { 
  Card, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { 
  ExternalLink, 
  ClipboardList, 
  AlertTriangle, 
  ArrowUp, 
  CheckCircle 
} from "lucide-react";
import { Link } from "wouter";

interface RiskSummaryCardsProps {
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  mitigationProgress: number;
}

export function RiskSummaryCards({ 
  totalRisks, 
  criticalRisks, 
  highRisks, 
  mitigationProgress 
}: RiskSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Risks Card */}
      <SummaryCard
        iconClassName="bg-blue-100 text-blue-600"
        icon={<ClipboardList size={20} />}
        title="Total Risks"
        value={totalRisks}
        link="/risks"
        linkText="View all"
      />

      {/* Critical Risks Card */}
      <SummaryCard
        iconClassName="bg-red-100 text-red-600"
        icon={<AlertTriangle size={20} />}
        title="Critical Risks"
        value={criticalRisks}
        link="/risks?severity=Critical"
        linkText="Needs attention"
        linkClassName="text-red-600 hover:text-red-700"
      />

      {/* High Risks Card */}
      <SummaryCard
        iconClassName="bg-amber-100 text-amber-600"
        icon={<ArrowUp size={20} />}
        title="High Risks"
        value={highRisks}
        link="/risks?severity=High"
        linkText="Monitor closely"
        linkClassName="text-amber-600 hover:text-amber-700"
      />

      {/* Mitigation Progress Card */}
      <SummaryCard
        iconClassName="bg-green-100 text-green-600"
        icon={<CheckCircle size={20} />}
        title="Mitigation Progress"
        value={`${mitigationProgress}%`}
        link="/risks?status=In Progress"
        linkText="View details"
        linkClassName="text-green-600 hover:text-green-700"
      />
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  value: number | string;
  link: string;
  linkText: string;
  linkClassName?: string;
}

function SummaryCard({
  icon,
  iconClassName,
  title,
  value,
  link,
  linkText,
  linkClassName = "text-blue-600 hover:text-blue-700"
}: SummaryCardProps) {
  return (
    <Card className="card-hover border-0 shadow-md overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-lg p-3 ${iconClassName}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
            </dd>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <div className="text-sm">
          <div
            className={`font-medium ${linkClassName} inline-flex items-center transition-colors cursor-pointer`}
            onClick={() => window.location.href = link}
          >
            {linkText}
            <ExternalLink className="ml-1 h-3 w-3" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}


