import { NextResponse } from "next/server"
import {
  getLayerFeaturesByBounds,
  getLayerFeaturesCountByBounds
} from "../../../lib/db"

/**
 * Ejecuta una consulta de features de capas en una región específica
 */
export async function GET(request) {
  const searchParams = new URLSearchParams(request.nextUrl.searchParams)
  const layer = searchParams.get("layer")
  const polygon = searchParams.get("polygon")
  const page = searchParams.get("page") || 1
  const count = searchParams.get("count") || 5
  const results = await getLayerFeaturesByBounds(layer, polygon, page, count)
  let total = 0
  console.log("Page:", page)
  if (Number(page) === 1) {
    const countResults = await getLayerFeaturesCountByBounds(layer, polygon)
    total = Number(countResults[0].count)
    console.log("Total:", countResults)
  }
  return NextResponse.json({ results, total })
}
