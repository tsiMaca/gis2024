import { Pool } from "pg"

const DATABASE_HOST = process.env.DATABASE_HOST
const DATABASE_PORT = process.env.DATABASE_PORT
const DATABASE_NAME = process.env.DATABASE_NAME
const DATABASE_USER = process.env.DATABASE_USER
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD

const pool = new Pool({
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  database: DATABASE_NAME,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD
})

async function query(text, params) {
  const client = await pool.connect()
  try {
    const res = await client.query(text, params)
    return res.rows
  } finally {
    client.release()
  }
}

export async function testConnection() {
  const text = "SELECT NOW()"
  return await query(text)
}

// SELECT * FROM red_vial WHERE st_intersects( ST_geomfromtext('POLYGON((-59.87890625 -26.544189453125004,-59.87890625 -27.071533203125004,-59.263671875 -27.071533203125004,-59.263671875 -26.544189453125004,-59.87890625 -26.544189453125004))',4326), geom )

/**
 * @param {string} layerName
 * @param {string} stringifiedPolygon
 */
export async function getLayerBounds(layerName, stringifiedPolygon) {
  const text = `SELECT * FROM ${layerName} WHERE ST_Intersects(ST_geomfromtext('POLYGON((${stringifiedPolygon}))',4326), geom)`
  console.log("Query:", text)
  return await query(text)
}
