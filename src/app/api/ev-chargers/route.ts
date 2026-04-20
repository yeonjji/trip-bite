import { getEvChargers } from "@/lib/data/ev-charging";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await getEvChargers({
    zcode: searchParams.get("zcode") ?? undefined,
    kind: searchParams.get("kind") ?? undefined,
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 50),
  });
  return Response.json(result, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
  });
}
