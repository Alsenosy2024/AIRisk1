import { cn } from "@/lib/utils";

const brandStyles = {
  visa: {
    bg: "bg-gradient-to-r from-blue-700 to-blue-500",
    text: "VISA",
  },
  mastercard: {
    bg: "bg-gradient-to-r from-orange-500 to-red-600",
    text: "Mastercard",
  },
  amex: {
    bg: "bg-gradient-to-r from-cyan-600 to-blue-500",
    text: "AmEx",
  },
} as const;

const BrandBadge = ({
  name,
  className,
}: {
  name: keyof typeof brandStyles;
  className?: string;
}) => {
  const style = brandStyles[name];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1 text-sm font-semibold text-white shadow-sm",
        style.bg,
        className,
      )}
    >
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-white/80" aria-hidden />
      <span>{style.text}</span>
    </div>
  );
};

export function PaymentBrandStrip({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <BrandBadge name="visa" />
      <BrandBadge name="mastercard" />
      <BrandBadge name="amex" />
    </div>
  );
}
