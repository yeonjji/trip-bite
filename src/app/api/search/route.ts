import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { CampingSite, Destination } from "@/types/database"

const PAGE_SIZE = 10

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""
  const type = searchParams.get("type") ?? "all"
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const offset = (page - 1) * PAGE_SIZE

  if (!q.trim()) {
    return NextResponse.json(
      { destinations: [], camping: [], totalCount: 0 },
      { status: 200 }
    )
  }

  const supabase = await createClient()

  let destinations: Destination[] = []
  let camping: CampingSite[] = []

  if (type === "all" || type === "destination") {
    const { data, error } = await supabase
      .from("destinations")
      .select("*")
      .ilike("title", `%${q}%`)
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    destinations = data ?? []
  }

  if (type === "all" || type === "camping") {
    const { data, error } = await supabase
      .from("camping_sites")
      .select("*")
      .ilike("faclt_nm", `%${q}%`)
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    camping = data ?? []
  }

  const totalCount = destinations.length + camping.length

  return NextResponse.json({ destinations, camping, totalCount })
}
