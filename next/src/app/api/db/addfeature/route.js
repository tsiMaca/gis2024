import { NextRequest, NextResponse } from "next/server"
import {
  TYPE_MULTILINESTRING,
  TYPE_MULTIPOLYGON,
  TYPE_POINT
} from "../../../../constants/geometry-types"
import {
  addLineToLayer,
  addPointToLayer,
  addPolygonToLayer
} from "../../../../lib/db"

/**
 *
 * @param {NextRequest} request
 * @returns {NextResponse}
 */
export async function POST(request) {
  const body = await request.json()
  const { layerName, data, type, coordinates } = body
  if (type === TYPE_POINT) {
    const response = await addPointToLayer(layerName, data, coordinates)
    return NextResponse.json(response)
  }
  if (type === TYPE_MULTILINESTRING) {
    const response = await addLineToLayer(layerName, data, coordinates)
    return NextResponse.json(response)
  }
  if (type === TYPE_MULTIPOLYGON) {
    const response = await addPolygonToLayer(layerName, data, coordinates)
    return NextResponse.json(response)
  }
  return NextResponse.json({ error: "Invalid geometry type" }, { status: 400 })
}
