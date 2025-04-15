import { 
  Card, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
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
        icon={<ClipboardListIcon />}
        title="Total Risks"
        value={totalRisks}
        link="/risks"
        linkText="View all"
      />

      {/* Critical Risks Card */}
      <SummaryCard
        iconClassName="bg-red-100 text-red-600"
        icon={<AlertTriangleIcon />}
        title="Critical Risks"
        value={criticalRisks}
        link="/risks?severity=Critical"
        linkText="Needs attention"
        linkClassName="text-red-600 hover:text-red-700"
      />

      {/* High Risks Card */}
      <SummaryCard
        iconClassName="bg-amber-100 text-amber-600"
        icon={<ArrowUpIcon />}
        title="High Risks"
        value={highRisks}
        link="/risks?severity=High"
        linkText="Monitor closely"
        linkClassName="text-amber-600 hover:text-amber-700"
      />

      {/* Mitigation Progress Card */}
      <SummaryCard
        iconClassName="bg-green-100 text-green-600"
        icon={<CheckCircleIcon />}
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
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${iconClassName}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd>
              <div className="text-lg font-semibold text-gray-900">{value}</div>
            </dd>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <Link href={link}>
            <a className={`font-medium ${linkClassName} inline-flex items-center`}>
              {linkText}
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

// Icons
const ClipboardListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
