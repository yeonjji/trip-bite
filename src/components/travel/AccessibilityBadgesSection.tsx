import { getAccessibilityInfo } from "@/lib/data/accessibility"
import AccessibilityBadge from "@/components/shared/AccessibilityBadge"

interface AccessibilityBadgesSectionProps {
  destinationId: string
}

export default async function AccessibilityBadgesSection({
  destinationId,
}: AccessibilityBadgesSectionProps) {
  const accessibility = await getAccessibilityInfo(destinationId)

  if (!accessibility) return null
  if (
    !accessibility.pet_possible &&
    !accessibility.wheelchair &&
    !accessibility.foreign_friendly
  ) {
    return null
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {accessibility.pet_possible && <AccessibilityBadge type="pet" />}
      {accessibility.wheelchair && <AccessibilityBadge type="wheelchair" />}
      {accessibility.foreign_friendly && <AccessibilityBadge type="foreign" />}
    </div>
  )
}
