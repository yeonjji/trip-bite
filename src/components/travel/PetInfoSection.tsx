import type { PetFriendlyPlace } from "@/types/pet-friendly"
import type { TourPetInfo } from "@/types/tour-api"

interface Props {
  petPlace: PetFriendlyPlace
  petTourInfo: TourPetInfo | null
  isKo: boolean
}

const PET_CL_LABEL: Record<string, { ko: string; en: string }> = {
  "1": { ko: "실내 동반 가능", en: "Indoor allowed" },
  "2": { ko: "야외 동반 가능", en: "Outdoor allowed" },
  "3": { ko: "실내외 동반 가능", en: "Indoor & outdoor" },
}

function isBlank(v: string | undefined | null): boolean {
  return !v || v.trim() === "" || v.includes("정보없음") || v === "-"
}

function Chip({ label, color = "amber" }: { label: string; color?: "amber" | "teal" | "sky" | "slate" }) {
  const cls = {
    amber: "bg-amber-100 text-amber-800",
    teal: "bg-teal-100 text-teal-800",
    sky: "bg-sky-100 text-sky-800",
    slate: "bg-slate-100 text-slate-600",
  }[color]
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-32 shrink-0 font-medium text-muted-foreground">{label}</span>
      <span className="text-foreground leading-relaxed">{value}</span>
    </div>
  )
}

export default function PetInfoSection({ petPlace, petTourInfo, isKo }: Props) {
  const cl = petPlace.pet_acmpny_cl
  const clLabel = cl ? (isKo ? PET_CL_LABEL[cl]?.ko : PET_CL_LABEL[cl]?.en) : null

  // 동반 가능 크기
  const sizeRange = petTourInfo?.acmpanypetsizerange
  const sizeLabel = !isBlank(sizeRange) ? sizeRange! : null

  // 추가 요금
  const fee = petTourInfo?.relaacmpanypetfee
  const feeLabel = !isBlank(fee) ? fee! : null
  const isFree = feeLabel?.includes("무료") || feeLabel?.includes("없음") || feeLabel === "0"

  // 동반 마릿수
  const count = petTourInfo?.acmpanypetcount
  const countLabel = !isBlank(count) ? count! : null

  // 동반 가능 동물
  const typeCd = petPlace.acmpny_type_cd
  const typeLabel = !isBlank(typeCd) ? typeCd! : null

  // 상세 안내 (petinfo > rel_pet_info 순)
  const petInfo = !isBlank(petTourInfo?.petinfo)
    ? petTourInfo!.petinfo!
    : !isBlank(petPlace.rel_pet_info)
      ? petPlace.rel_pet_info!
      : null

  // 야외 허용 구분
  const exprd = petTourInfo?.exprdpetaceptdivision
  const exprdLabel = !isBlank(exprd) ? exprd! : null

  const hasDetails = sizeLabel || feeLabel || countLabel || typeLabel || petInfo || exprdLabel

  // 정보가 불확실한지 판단 (주요 필드가 없으면)
  const isUncertain = !cl && !sizeLabel && !feeLabel

  return (
    <section className="mb-6 rounded-xl bg-[#F9F7EF] p-5 soft-card-shadow">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🐾</span>
        <h2 className="font-headline text-base font-bold text-[#1B1C1A]">
          {isKo ? "반려동물 동반 정보" : "Pet-Friendly Info"}
        </h2>
      </div>

      <p className="text-sm text-[#5A413A] mb-4 leading-relaxed">
        {isKo
          ? "이곳은 반려동물과 함께 방문할 수 있는 여행지입니다."
          : "This destination welcomes visitors with their pets."}
      </p>

      {/* 핵심 배지 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {clLabel && <Chip label={clLabel} color="amber" />}
        {sizeLabel && (
          <Chip
            label={isKo ? `${sizeLabel} 가능` : `${sizeLabel} size`}
            color="teal"
          />
        )}
        {isFree && <Chip label={isKo ? "추가 요금 없음" : "No extra fee"} color="teal" />}
        {!isFree && feeLabel && <Chip label={isKo ? `요금: ${feeLabel}` : `Fee: ${feeLabel}`} color="slate" />}
        {exprdLabel && <Chip label={exprdLabel} color="sky" />}
      </div>

      {/* 세부 정보 */}
      {hasDetails && (
        <div className="space-y-2 border-t border-[#E8E4D8] pt-4">
          {typeLabel && (
            <InfoRow
              label={isKo ? "동반 가능 동물" : "Pet types"}
              value={typeLabel}
            />
          )}
          {sizeLabel && (
            <InfoRow
              label={isKo ? "동반 가능 크기" : "Size limit"}
              value={sizeLabel}
            />
          )}
          {countLabel && (
            <InfoRow
              label={isKo ? "동반 가능 마릿수" : "Max pets"}
              value={countLabel}
            />
          )}
          {feeLabel && (
            <InfoRow
              label={isKo ? "추가 요금" : "Extra fee"}
              value={feeLabel}
            />
          )}
          {petInfo && (
            <InfoRow
              label={isKo ? "안내 사항" : "Notes"}
              value={petInfo}
            />
          )}
        </div>
      )}

      {isUncertain && (
        <p className="mt-3 text-xs text-slate-500">
          {isKo
            ? "* 세부 조건은 방문 전 시설에 직접 확인을 권장합니다."
            : "* Please confirm pet policies directly with the venue before visiting."}
        </p>
      )}
    </section>
  )
}
