const HOST = process.env.DATABASE_HOST || "localhost"

const BASE_URL =
  "http://" +
  HOST +
  "/cgi-bin/qgis_mapserv.fcgi?map=/usr/local/share/qgis/tpi-grupo5.qgz"
export async function GET(request) {
  const searchParams = new URLSearchParams(request.nextUrl.searchParams)
  const url = `${BASE_URL}&${searchParams.toString()}`
  console.log("encoded url: ", url)
  const response = await fetch(url)
  return response
}