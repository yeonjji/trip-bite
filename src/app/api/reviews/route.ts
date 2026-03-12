import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/utils/rate-limit"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetType = searchParams.get("targetType")
  const targetId = searchParams.get("targetId")

  if (!targetType || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId are required" },
      { status: 400 }
    )
  }

  if (targetType !== "destination" && targetType !== "camping") {
    return NextResponse.json(
      { error: "targetType must be destination or camping" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reviews: data })
}

export async function POST(request: NextRequest) {
  const identifier =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"

  const rateLimit = checkRateLimit(identifier)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimit.resetAt),
        },
      }
    )
  }

  const body = await request.json()
  const { targetType, targetId, rating, content } = body

  if (!targetType || !targetId || rating === undefined) {
    return NextResponse.json(
      { error: "targetType, targetId, and rating are required" },
      { status: 400 }
    )
  }

  if (targetType !== "destination" && targetType !== "camping") {
    return NextResponse.json(
      { error: "targetType must be destination or camping" },
      { status: 400 }
    )
  }

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "rating must be a number between 1 and 5" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id ?? "anonymous"

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: userId,
      target_type: targetType,
      target_id: targetId,
      rating,
      content: content ?? null,
      is_deleted: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ review: data }, { status: 201 })
}
