// P3-07: 접근성 정보 데이터 fetch 유틸 함수

import { createClient } from "@/lib/supabase/server"

interface AccessibilityInfo {
  id: string
  destination_id: string
  pet_possible: boolean | null
  wheelchair: boolean | null
  foreign_friendly: boolean | null
  pet_info: string | null
  cached_at: string
}

export async function getAccessibilityInfo(
  destinationId: string
): Promise<AccessibilityInfo | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("accessibility_info")
    .select("id, destination_id, pet_possible, wheelchair, foreign_friendly, pet_info, cached_at")
    .eq("destination_id", destinationId)
    .single()

  if (error || !data) return null

  return data as AccessibilityInfo
}

export async function getAccessibilityByDestinations(
  destinationIds: string[]
): Promise<Record<string, AccessibilityInfo>> {
  if (destinationIds.length === 0) return {}

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("accessibility_info")
    .select("id, destination_id, pet_possible, wheelchair, foreign_friendly, pet_info, cached_at")
    .in("destination_id", destinationIds)

  if (error || !data) return {}

  const result: Record<string, AccessibilityInfo> = {}
  for (const row of data as AccessibilityInfo[]) {
    result[row.destination_id] = row
  }
  return result
}
