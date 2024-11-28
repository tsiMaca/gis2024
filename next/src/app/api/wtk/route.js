import { NextResponse } from "next/server"
import { getLayerBounds } from "../../../lib/db"

export async function GET(request) {
  const searchParams = new URLSearchParams(request.nextUrl.searchParams)
  const layer = searchParams.get("layer")
  const polygon = searchParams.get("polygon")
  const results = await getLayerBounds(layer, polygon)
  console.log(results)
  return NextResponse.json({ results })
}
