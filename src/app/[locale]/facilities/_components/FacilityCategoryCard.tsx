import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FacilityCategoryCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  featured?: boolean;
  comingSoon?: boolean;
}

export default function FacilityCategoryCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
  featured = false,
  comingSoon = false,
}: FacilityCategoryCardProps) {
  const Wrapper = comingSoon ? "div" : Link;

  if (featured) {
    return (
      <Link
        href={href}
        className="block rounded-2xl bg-gradient-to-br from-[#14b8a6] to-[#0d9488] text-white p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block" />
              {badge ?? "Available"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2 leading-tight">{title}</h2>
        <p className="text-white/80 text-sm mb-4">{description}</p>
        <div className="flex items-center gap-1 text-sm font-semibold text-white/90">
          <span>찾아보기</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </Link>
    );
  }

  return (
    <Wrapper
      {...(comingSoon ? {} : { href })}
      className={cn(
        "block rounded-2xl border border-border bg-white p-5 transition-all duration-200",
        comingSoon
          ? "opacity-60 cursor-default"
          : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#0d9488]" />
        </div>
        {badge && (
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            comingSoon
              ? "bg-stone-100 text-stone-500"
              : "bg-[#14b8a6]/10 text-[#0d9488]"
          )}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-bold text-base mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </Wrapper>
  );
}
