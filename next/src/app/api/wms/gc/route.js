// http://192.168.1.5/cgi-bin/qgis_mapserv.fcgi?map=/usr/local/share/qgis/tpi-grupo5.qgz&REQUEST=GetCapabilities&SERVICE=WMS
const HOST = process.env.DATABASE_HOST || "localhost"

const URL =
  "http://" +
  HOST +
  "/cgi-bin/qgis_mapserv.fcgi?map=/usr/local/share/qgis/tpi-grupo5.qgz&REQUEST=GetCapabilities&SERVICE=WMS"

export async function GET(request) {
  const response = await fetch(URL)
  const text = await response.text()
  return new Response(text, {
    headers: {
      "Content-Type": "text/xml"
    }
  })
}
