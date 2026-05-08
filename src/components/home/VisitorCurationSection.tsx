import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { getVisitorCuration, type CurationDestination } from "@/lib/data/visitor-stats";

interface SectionMeta {
  key: keyof Awaited<ReturnType<typeof getVisitorCuration>>;
  label: string;
  title: string;
  sub: string;
  tag: string;
  tagColor: string;
}

const SECTIONS: SectionMeta[] = [
  {
    key: "quiet",
    label: "한산한 여행지",
    title: "이번 주 비교적 한산한 여행지",
    sub: "방문객이 적어 여유롭게 즐길 수 있는 곳을 골랐어요",
    tag: "한산해요",
    tagColor: "bg-teal-50 text-teal-700",
  },
  {
    key: "localFav",
    label: "현지인 추천",
    title: "현지인이 많이 찾는 여행지",
    sub: "현지인이 즐겨 찾는 로컬 감성 장소예요",
    tag: "현지인 추천",
    tagColor: "bg-amber-50 text-amber-700",
  },
  {
    key: "trending",
    label: "방문량 증가",
    title: "최근 방문량이 늘어난 지역",
    sub: "요즘 주목받고 있는 여행지를 만나보세요",
    tag: "요즘 뜨는 곳",
    tagColor: "bg-rose-50 text-rose-600",
  },
  {
    key: "foreignFav",
    label: "외국인 인기",
    title: "외국인이 많이 찾는 인기 지역",
    sub: "외국인 여행자도 즐겨 찾는 국제적인 여행지예요",
    tag: "외국인 인기",
    tagColor: "bg-blue-50 text-blue-600",
  },
];

function DestCard({
  dest,
  locale,
  tag,
  tagColor,
}: {
  dest: CurationDestination;
  locale: string;
  tag: string;
  tagColor: string;
}) {
  return (
    <Link
      href={`/${locale}/travel/${dest.contentId}`}
      className="group flex-shrink-0 w-[160px]"
    >
      <div className="relative h-[120px] w-full overflow-hidden rounded-2xl bg-[#F4F1E9]">
        {dest.firstImage ? (
          <Image
            src={dest.firstImage}
            alt={dest.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="160px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">🗺️</div>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${tagColor} backdrop-blur-sm`}
        >
          {tag}
        </span>
      </div>
      <div className="mt-2 px-0.5">
        <p className="flex items-center gap-0.5 text-[11px] font-medium text-[#D84315]">
          <MapPin className="h-2.5 w-2.5" />
          {dest.areaNm}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-[#1B1C1A]">
          {dest.title}
        </p>
      </div>
    </Link>
  );
}

function CurationRow({
  meta,
  items,
  locale,
}: {
  meta: SectionMeta;
  items: CurationDestination[];
  locale: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-10 last:mb-0">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#D84315]">
            {meta.label}
          </p>
          <h3 className="font-headline text-lg font-bold text-[#1B1C1A]">{meta.title}</h3>
          <p className="mt-0.5 text-xs text-gray-400">{meta.sub}</p>
        </div>
        <Link
          href={`/${locale}/travel`}
          className="hidden items-center gap-1 text-xs font-medium text-[#D84315] hover:underline sm:flex"
        >
          더 보기 <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((dest) => (
          <DestCard
            key={dest.contentId}
            dest={dest}
            locale={locale}
            tag={meta.tag}
            tagColor={meta.tagColor}
          />
        ))}
      </div>
    </div>
  );
}

export default async function VisitorCurationSection({ locale }: { locale: string }) {
  const curation = await getVisitorCuration();

  const hasAny = SECTIONS.some((s) => curation[s.key].length > 0);
  if (!hasAny) return null;

  return (
    <section className="bg-[#F9F7EF] py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#D84315]">
            빅데이터 큐레이션
          </p>
          <h2 className="font-headline text-2xl font-bold text-[#1B1C1A]">
            데이터로 찾아본 여행지
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            관광 빅데이터를 분석해 지금 이 순간 어울리는 여행지를 골랐어요.
          </p>
        </div>

        {SECTIONS.map((meta) => (
          <CurationRow
            key={meta.key}
            meta={meta}
            items={curation[meta.key]}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}
