// http://192.168.1.5/cgi-bin/qgis_mapserv.fcgi?map=/usr/local/share/qgis/tpi-grupo5.qgz&REQUEST=DescribeFeatureType&SERVICE=WFS&TYPENAME=localidades

import { XMLParser } from "fast-xml-parser"
import { NextRequest, NextResponse } from "next/server"
import {
  TYPE_MULTILINESTRING,
  TYPE_MULTIPOLYGON,
  TYPE_POINT
} from "../../../../constants/geometry-types"

const HOST = process.env.DATABASE_HOST || "localhost"

const BASE_URL =
  "http://" +
  HOST +
  "/cgi-bin/qgis_mapserv.fcgi?map=/usr/local/share/qgis/tpi-grupo5.qgz"

function parseQGISFeatureTypes(xmlString) {
  // Configuraciones del parser
  const parserOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
    allowBooleanAttributes: true
  }

  const parser = new XMLParser(parserOptions)
  const jsonObj = parser.parse(xmlString)

  // Mapeo de tipos de geometría de GML a tipos más simples
  const geometryTypeMap = {
    "gml:PointPropertyType": TYPE_POINT,
    "gml:MultiLineStringPropertyType": TYPE_MULTILINESTRING,
    "gml:MultiCurvePropertyType": TYPE_MULTILINESTRING,
    "gml:MultiPolygonPropertyType": TYPE_MULTIPOLYGON,
    "gml:MultiSurfacePropertyType": TYPE_MULTIPOLYGON
  }

  // Extraer features del esquema XML
  const features = []

  // Buscar elementos de feature
  const complexTypes = Array.isArray(jsonObj.schema.complexType)
    ? jsonObj.schema.complexType
    : [jsonObj.schema.complexType]

  complexTypes.forEach((type) => {
    if (type && type["@_name"] && type["@_name"].endsWith("Type")) {
      const featureName = type["@_name"].replace("Type", "")

      // Encontrar el elemento de geometría
      const geometryElement =
        type.complexContent?.extension?.sequence?.element?.find(
          (el) => el["@_name"] === "geometry"
        )

      const geometryType = geometryElement
        ? geometryTypeMap[geometryElement["@_type"]] || "Unknown"
        : "Unknown"

      features.push({
        title: featureName,
        type: geometryType
        // originalType: geometryElement ? geometryElement["@_type"] : "Unknown"
      })
    }
  })

  return features
}

async function getLayersAndGeometryTypes(baseUrl, batchSize = 10) {
  const parser = new XMLParser()
  const layersInfo = []

  try {
    // Realiza la solicitud GetCapabilities
    const url1 = `${baseUrl}&SERVICE=WFS&VERSION=1.3.0&REQUEST=GetCapabilities`
    console.log("url1: ", url1)
    const capabilitiesResponse = await fetch(url1)
    const capabilitiesText = await capabilitiesResponse.text()
    const capabilitiesJson = parser.parse(capabilitiesText)

    // Obtiene todas las capas de <FeatureTypeList>
    const featureTypes =
      capabilitiesJson["WFS_Capabilities"]["FeatureTypeList"]["FeatureType"]
    const layerNames = Array.isArray(featureTypes)
      ? featureTypes.map((ft) => ft["Name"])
      : [featureTypes["Name"]]

    // Divide las capas en bloques de batchSize
    const batches = []
    for (let i = 0; i < layerNames.length; i += batchSize) {
      batches.push(layerNames.slice(i, i + batchSize))
    }

    // Procesa cada bloque de capas
    for (const batch of batches) {
      const url2 = `${baseUrl}&SERVICE=WFS&VERSION=1.3.0&REQUEST=DescribeFeatureType&TYPENAME=${batch.join(
        ","
      )}`
      const describeResponse = await fetch(url2)
      const describeText = await describeResponse.text()
      const features = parseQGISFeatureTypes(describeText)
      layersInfo.push(...features)
    }
    return layersInfo
  } catch (error) {
    console.error("Error obteniendo capas y tipos de geometría:", error)
    return []
  }
}

/**
 *
 * @param {NextRequest} request
 */
export async function GET(request) {
  const data = await getLayersAndGeometryTypes(BASE_URL)
  return NextResponse.json(data)
}
