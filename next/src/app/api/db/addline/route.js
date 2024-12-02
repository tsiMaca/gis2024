import { NextRequest, NextResponse } from "next/server"
import { addCustomLine } from "../../../../lib/db"

/**
 *
 * @param {NextRequest} request
 * @returns {NextResponse}
 */
export async function POST(request) {
  const body = await request.json()
  const { layerName, data, coordinates } = body
  const response = await addCustomLine(layerName, data, coordinates)
  return NextResponse.json(response)
}
