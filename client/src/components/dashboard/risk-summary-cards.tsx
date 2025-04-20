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
        iconClassName="bg-gradient-blue text-white"
        icon={<ClipboardList size={20} />}
        title="Total Risks"
        value={totalRisks}
        link="/risks"
        linkText="View all"
        cardClass="border-blue-100/60"
      />

      {/* Critical Risks Card */}
      <SummaryCard
        iconClassName="bg-gradient-to-br from-red-500 to-rose-600 text-white"
        icon={<AlertTriangle size={20} />}
        title="Critical Risks"
        value={criticalRisks}
        link="/risks?severity=Critical"
        linkText="Needs attention"
        linkClassName="text-red-600 hover:text-red-700"
        cardClass="border-red-100/60"
      />

      {/* High Risks Card */}
      <SummaryCard
        iconClassName="bg-gradient-to-br from-amber-500 to-orange-600 text-white"
        icon={<ArrowUp size={20} />}
        title="High Risks"
        value={highRisks}
        link="/risks?severity=High"
        linkText="Monitor closely"
        linkClassName="text-amber-600 hover:text-amber-700"
        cardClass="border-amber-100/60"
      />

      {/* Mitigation Progress Card */}
      <SummaryCard
        iconClassName="bg-gradient-green text-white"
        icon={<CheckCircle size={20} />}
        title="Mitigation Progress"
        value={`${mitigationProgress}%`}
        link="/risks?status=In Progress"
        linkText="View details"
        linkClassName="text-green-600 hover:text-green-700"
        cardClass="border-green-100/60"
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
    <Card className="glass-card backdrop-blur-md border border-white/50 shadow-lg overflow-hidden rounded-xl transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 z-0"></div>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-xl p-3 ${iconClassName} shadow-md`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd>
              <div className="text-3xl font-bold text-gray-900 mt-1">{value}</div>
            </dd>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50/70 backdrop-blur-sm px-6 py-3 border-t border-gray-100/50 relative z-10">
        <div className="text-sm">
          <Link to={link}>
            <div
              className={`font-medium ${linkClassName} inline-flex items-center transition-colors hover:underline`}
            >
              {linkText}
              <ExternalLink className="ml-1 h-3 w-3" />
            </div>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}


