import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FacilityCategoryCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  available?: boolean;
}

export default function FacilityCategoryCard({
  href,
  icon: Icon,
  title,
  available = false,
}: FacilityCategoryCardProps) {
  const inner = (
    <div className={cn(
      "flex items-center gap-3 rounded-2xl bg-[#F4F1E9] p-5 transition-all duration-200",
      available
        ? "cursor-pointer hover:bg-[#EBE7DC] hover:-translate-y-0.5 active:scale-[0.98]"
        : "opacity-60 cursor-default"
    )}>
      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
        <Icon className="w-7 h-7 text-[#D84315]" />
      </div>
      <span className="flex-1 font-bold text-[15px] text-[#1B1C1A] leading-snug">
        {title}
      </span>
      {available && (
        <ChevronRight className="w-5 h-5 text-[#D84315] flex-shrink-0" />
      )}
    </div>
  );

  if (available) {
    return <Link href={href}>{inner}</Link>;
  }

  return inner;
}
