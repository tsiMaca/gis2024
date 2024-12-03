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

function logquery(sql) {
  // console.log("Query:", sql)
}

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
export async function getLayerFeaturesByBounds(
  layerName,
  stringifiedPolygon,
  page,
  count
) {
  const offset = (page - 1) * count
  const text = `SELECT * FROM ${layerName} WHERE ST_Intersects(ST_geomfromtext('POLYGON((${stringifiedPolygon}))',4326), geom) LIMIT ${count} OFFSET ${offset}`
  logquery("Query:", text)
  return await query(text)
}

export async function getLayerFeaturesCountByBounds(
  layerName,
  stringifiedPolygon
) {
  const text = `SELECT COUNT(*) FROM ${layerName} WHERE ST_Intersects(ST_geomfromtext('POLYGON((${stringifiedPolygon}))',4326), geom)`
  logquery("Query:", text)
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
  logquery("Query:", sql)
  return await query(sql)
}

/**
 *
 * @param {string} layerName
 * @param {*} data
 * @param {number[][]} coordinates
 * @returns
 */
export async function addLineToLayer(layerName, data, coordinates) {
  const formatCoordinates =
    "(" + coordinates.map((coord) => coord.join(" ")).join(",") + ")"
  const multiline = `'MULTILINESTRING(${formatCoordinates})'`
  const columns = Object.keys(data)
    .map((key) => `"${key}"`)
    .join(",")
  let sql = `INSERT INTO ${layerName} (${columns}, GEOM) VALUES (`
  for (const key in data) {
    sql += `'${data[key]}',`
  }
  sql += `${multiline})`
  logquery("Query:", sql)
  return await query(sql)
}

/**
 *
 * @param {string} layerName
 * @param {*} data
 * @param {number[][][]} coordinates
 * @returns
 */
export async function addPolygonToLayer(layerName, data, coordinates) {
  console.log("Coordinates:", coordinates)
  console.log("<", typeof coordinates, ">")
  const formatCoordinates =
    "(" + coordinates[0].map((coord) => coord.join(" ")).join(",") + ")"
  const multipolygon = `'MULTIPOLYGON(${formatCoordinates})'`
  const columns = Object.keys(data)
    .map((key) => `"${key}"`)
    .join(",")
  let sql = `INSERT INTO ${layerName} (${columns}, GEOM) VALUES (`
  for (const key in data) {
    sql += `'${data[key]}',`
  }
  sql += `${multipolygon})`
  logquery("Query:", sql)
  return await query(sql)
}
