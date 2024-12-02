// http://192.168.1.5/cgi-bin/qgis_mapserv.fcgi?map=/usr/local/share/qgis/tpi-grupo5.qgz&REQUEST=GetFeature&SERVICE=WFS&TYPENAME=ejido

import { NextRequest } from "next/server"

const HOST = process.env.DATABASE_HOST || "localhost"

const BASE_URL =
  "http://" +
  HOST +
  "/cgi-bin/qgis_mapserv.fcgi?map=/usr/local/share/qgis/tpi-grupo5.qgz"

/**
 *
 * @param {NextRequest} request
 */
export async function GET(request) {
  console.log("request params: ")
  console.log(request.nextUrl.searchParams.toString())
  const searchParams = new URLSearchParams(request.nextUrl.searchParams)
  const url = `${BASE_URL}&${searchParams.toString()}`
  console.log("encoded url: ", url)
  const response = await fetch(url)
  return response
}
