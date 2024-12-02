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

/**
 * @param {string} layerName
 * @param {string} stringifiedPolygon
 */
export async function getLayerBounds(layerName, stringifiedPolygon) {
  const text = `SELECT * FROM ${layerName} WHERE ST_Intersects(ST_geomfromtext('POLYGON((${stringifiedPolygon}))',4326), geom)`
  console.log("Query:", text)
  return await query(text)
}

/**
 *
 * @param {string} layerName
 * @param {{ nombre: string, detalle: string, autor: string }} data
 * @param {number[][]} coordinates
 * @returns
 */
export async function addPointToLayer(layerName, data, coordinates) {
  const firstPoint = coordinates[0].join(",")
  const point = `ST_MakePoint(${firstPoint})`
  const sql = layerName.startsWith("custom_")
    ? `INSERT INTO ${layerName} (NOMBRE, DETALLE, AUTOR, GEOM) VALUES ('${
        data.nombre ?? ""
      }', '${data.detalle ?? ""}', '${data.autor ?? ""}', ${point})`
    : `INSERT INTO ${layerName} (NOMBRE, FUENTE, RESPONSABL, GEOM) VALUES ('${
        data.nombre ?? ""
      }', 'USER INPUT', '${data.autor ?? ""}', ${point})`
  console.log("Query:", sql)
  return await query(sql)
}

/**
 *
 * @param {string} layerName
 * @param {{ nombre: string, detalle: string, autor: string }} data
 * @param {number[][]} coordinates
 * @returns
 */
export async function addLineToLayer(layerName, data, coordinates) {
  const formatCoordinates =
    "(" + coordinates.map((coord) => coord.join(" ")).join(",") + ")"
  const multiline = `'MULTILINESTRING(${formatCoordinates})'`
  const sql = layerName.startsWith("custom_")
    ? `INSERT INTO ${layerName} (NOMBRE, DETALLE, AUTOR, GEOM) VALUES ('${
        data.nombre ?? ""
      }', '${data.detalle ?? ""}', '${data.autor ?? ""}', ${multiline})`
    : `INSERT INTO ${layerName} (NOMBRE, FUENTE, RESPONSABL, GEOM) VALUES ('${
        data.nombre ?? ""
      }', 'USER INPUT', '${data.autor ?? ""}', ${multiline})`
  console.log("Query:", sql)
  return await query(sql)
}
