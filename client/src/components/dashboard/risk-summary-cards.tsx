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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Risks Card */}
      <SummaryCard
        iconClassName="bg-gradient-to-br from-blue-500 to-blue-600"
        icon={<ClipboardList size={22} />}
        title="Total Risks"
        subtitle="Active risks tracked"
        value={totalRisks}
        link="/risks"
        linkText="View all risks"
        cardClass="group hover:shadow-blue-500/10"
        gradientOverlay="from-blue-50/80 to-indigo-50/40"
      />

      {/* Critical Risks Card */}
      <SummaryCard
        iconClassName="bg-gradient-to-br from-red-500 to-rose-600"
        icon={<AlertTriangle size={22} />}
        title="Critical Risks"
        subtitle="Immediate attention required"
        value={criticalRisks}
        link="/risks?severity=Critical"
        linkText="Urgent review"
        linkClassName="text-red-600 hover:text-red-700"
        cardClass="group hover:shadow-red-500/10"
        gradientOverlay="from-red-50/80 to-rose-50/40"
      />

      {/* High Risks Card */}
      <SummaryCard
        iconClassName="bg-gradient-to-br from-amber-500 to-orange-600"
        icon={<ArrowUp size={22} />}
        title="High Risks"
        subtitle="Close monitoring needed"
        value={highRisks}
        link="/risks?severity=High"
        linkText="Monitor progress"
        linkClassName="text-amber-600 hover:text-amber-700"
        cardClass="group hover:shadow-amber-500/10"
        gradientOverlay="from-amber-50/80 to-orange-50/40"
      />

      {/* Mitigation Progress Card */}
      <SummaryCard
        iconClassName="bg-gradient-to-br from-emerald-500 to-teal-600"
        icon={<CheckCircle size={22} />}
        title="Mitigation Progress"
        subtitle="Overall completion rate"
        value={`${mitigationProgress}%`}
        link="/risks?status=In Progress"
        linkText="View progress"
        linkClassName="text-emerald-600 hover:text-emerald-700"
        cardClass="group hover:shadow-emerald-500/10"
        gradientOverlay="from-emerald-50/80 to-teal-50/40"
      />
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  subtitle?: string;
  value: number | string;
  link: string;
  linkText: string;
  linkClassName?: string;
  cardClass?: string;
  gradientOverlay?: string;
}

function SummaryCard({
  icon,
  iconClassName,
  title,
  subtitle,
  value,
  link,
  linkText,
  linkClassName = "text-blue-600 hover:text-blue-700",
  cardClass = "",
  gradientOverlay = "from-gray-50/80 to-white/40"
}: SummaryCardProps) {
  return (
    <Card className={`relative overflow-hidden rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500 ${cardClass} backdrop-blur-sm`}>
      {/* Enhanced gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientOverlay} opacity-60`}></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-transparent"></div>
      
      {/* Subtle animated border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <CardContent className="p-7 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex-shrink-0 rounded-2xl p-4 ${iconClassName} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{title}</h3>
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-1 truncate">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-gray-900 tracking-tight">{value}</div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-white/40 backdrop-blur-sm px-7 py-4 border-t border-gray-100/60 relative z-10">
        <Link to={link} className="w-full">
          <div className={`font-semibold ${linkClassName} inline-flex items-center justify-between w-full group-hover:translate-x-1 transition-all duration-300`}>
            <span>{linkText}</span>
            <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      </CardFooter>
    </Card>
  );
}


