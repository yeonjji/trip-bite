import { getDestinationIntro } from "@/lib/data/destinations"

interface Props {
  contentId: string
  isKo: boolean
}

export default async function IntroSection({ contentId, isKo }: Props) {
  let intro
  try {
    intro = await getDestinationIntro(contentId)
  } catch (err) {
    console.error("[IntroSection] failed:", err)
    return null
  }

  if (!intro) return null

  const isWorldHeritage =
    intro.heritage1 === "1" || intro.heritage2 === "1" || intro.heritage3 === "1"

  const heritageLabels: string[] = []
  if (intro.heritage1 === "1") heritageLabels.push(isKo ? "세계문화유산" : "World Cultural Heritage")
  if (intro.heritage2 === "1") heritageLabels.push(isKo ? "세계자연유산" : "World Natural Heritage")
  if (intro.heritage3 === "1") heritageLabels.push(isKo ? "세계기록유산" : "World Documentary Heritage")

  const hasInfoRow = !!(
    intro.infocenter ||
    intro.usetime ||
    intro.restdate ||
    intro.useseason ||
    intro.parking ||
    intro.accomcount ||
    intro.chkpet ||
    intro.chkbabycarriage ||
    intro.chkcreditcard
  )

  const hasExperience = !!(intro.expguide || intro.expagerange)

  if (!hasInfoRow && !hasExperience && !isWorldHeritage) return null

  return (
    <>
      {isWorldHeritage && (
        <div className="mb-4 flex flex-wrap gap-2">
          {heritageLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800"
            >
              🏛 {label}
            </span>
          ))}
        </div>
      )}

      {hasInfoRow && (
        <div className="mb-6 space-y-3 rounded-xl bg-[#F9F7EF] p-4 soft-card-shadow">
          {intro.infocenter && (
            <Row label={isKo ? "문의/안내" : "Info"}>{intro.infocenter}</Row>
          )}
          {intro.usetime && (
            <Row label={isKo ? "이용시간" : "Hours"}>
              <span className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: intro.usetime }} />
            </Row>
          )}
          {intro.restdate && (
            <Row label={isKo ? "쉬는날" : "Closed"}>
              <span dangerouslySetInnerHTML={{ __html: intro.restdate }} />
            </Row>
          )}
          {intro.useseason && <Row label={isKo ? "이용시기" : "Season"}>{intro.useseason}</Row>}
          {intro.parking && <Row label={isKo ? "주차시설" : "Parking"}>{intro.parking}</Row>}
          {intro.accomcount && <Row label={isKo ? "수용인원" : "Capacity"}>{intro.accomcount}</Row>}
          {intro.chkpet && <Row label={isKo ? "반려동물" : "Pets"}>{intro.chkpet}</Row>}
          {intro.chkbabycarriage && (
            <Row label={isKo ? "유모차 대여" : "Stroller"}>{intro.chkbabycarriage}</Row>
          )}
          {intro.chkcreditcard && (
            <Row label={isKo ? "신용카드" : "Credit Card"}>{intro.chkcreditcard}</Row>
          )}
        </div>
      )}

      {hasExperience && (
        <div className="mb-6 rounded-xl bg-[#F9F7EF] p-4 soft-card-shadow">
          <h2 className="mb-3 font-headline text-base font-bold text-[#1B1C1A]">
            {isKo ? "체험 안내" : "Experience Guide"}
          </h2>
          <div className="space-y-2">
            {intro.expagerange && (
              <Row label={isKo ? "체험 연령" : "Age Range"}>{intro.expagerange}</Row>
            )}
            {intro.expguide && (
              <Row label={isKo ? "체험 안내" : "Guide"}>
                <span className="whitespace-pre-line">{intro.expguide}</span>
              </Row>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-24 shrink-0 font-medium text-muted-foreground">{label}</span>
      <span className="text-foreground">{children}</span>
    </div>
  )
}
