"use client"

import { Button } from "@nextui-org/react"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import ScaleLine from "ol/control/scaleline"
import Conditions from "ol/events/condition"
import Feature from "ol/feature"
import GeoJSON from "ol/format/geojson"
import WFS from "ol/format/wfs"
import LineString from "ol/geom/linestring"
import Point from "ol/geom/point"
import DragBox from "ol/interaction/dragbox"
import DragPan from "ol/interaction/dragpan"
import Draw from "ol/interaction/draw"
import MouseWheelZoom from "ol/interaction/mousewheelzoom"
import TileLayer from "ol/layer/Tile"
import ImageLayer from "ol/layer/image"
import VectorLayer from "ol/layer/vector"
import LoadStrategy from "ol/loadingstrategy"
import Map from "ol/map"
import "ol/ol.css"
import Overlay from "ol/overlay"
import proj from "ol/proj"
import ImageWMS from "ol/source/imagewms"
import TileWMS from "ol/source/tilewms"
import VectorSource from "ol/source/vector"
import sphere from "ol/sphere"
import CircleStyle from "ol/style/circle"
import Fill from "ol/style/fill"
import Stroke from "ol/style/stroke"
import Style from "ol/style/style"
import View from "ol/view"
import proj4 from "proj4"
import React, { useEffect, useRef, useState } from "react"
import AddFeature from "../components/AddFeature"
import AddLayer from "../components/AddLayer"
import LayerButton from "../components/LayerButton"
import MapEvents from "../components/MapEvents"
import SelectDrawTarget from "../components/SelectDrawTarget"
import SelectionResults from "../components/SelectionResults"
import { TYPE_MULTILINESTRING, TYPE_POINT } from "../constants/geometry-types"
import { LAYER_FLAGS } from "../data/layers"
import useKeyShortcut from "../hooks/useKeyShortcut"
import { getLayerFeature } from "../utils/layer-feature"
import { LAYER_COLORS, SPECIAL_LAYER_COLORS } from "../constants/layer-colors"

proj.setProj4(proj4)
/*
proj4.defs(
  "EPSG:22175",
  "+proj=tmerc +lat_0=0 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
)
*/
proj4.defs(
  "EPSG:22175",
  "+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
)

if (!proj.get("EPSG:22175")) {
  console.error("Failed to register projection in OpenLayers")
}
const projection = proj.get("EPSG:22175")
// projection.setExtent([5000000, 5800000, 6000000, 6500000])
projection.setExtent([4084837.56, 3444524.01, 6263746.78, 7592504.35])

let measureTooltipElement
let measureTooltip

const IGNTileWMS = new TileWMS({
  url: "https://wms.ign.gob.ar/geoserver/ows",
  params: {
    LAYERS: "capabaseargenmap",
    VERSION: "1.1.1"
  }
})

const BaseTileLayer = new TileLayer({
  title: "base_map",
  /*
  // source: new OSM()
  source: new XYZ({
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  })
  */
  source: IGNTileWMS
})

const CustomLinesLayer = new VectorLayer({
  title: "custom_lines",
  source: new VectorSource({ wrapX: false })
})

const DragBoxInteraction = new DragBox({
  condition: Conditions.always,
  className: "bg-green-500 bg-opacity-25 border-green-500 border-opacity-50"
})

const DrawLineInteraction = new Draw({
  source: new VectorSource(),
  type: "LineString",
  condition: Conditions.altShiftKeysOnly,
  style: (feature) => {
    const geometryType = feature.getGeometry().getType()
    if (geometryType === "LineString" || geometryType === "Point") {
      return new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.2)"
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          lineDash: [10, 10],
          width: 2
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.7)"
          }),
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)"
          })
        })
      })
    }
  }
})

const DrawPolygonInteraction = new Draw({
  source: new VectorSource(),
  type: "Polygon",
  condition: Conditions.altKeyOnly,
  style: (feature) => {
    const geometryType = feature.getGeometry().getType()
    if (geometryType === "Polygon") {
      return new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.2)"
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          lineDash: [10, 10],
          width: 2
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.7)"
          })
        })
      })
    }
  }
})

function createMeasureTooltip(map) {
  if (measureTooltipElement) {
    measureTooltipElement.remove()
  }
  measureTooltipElement = document.createElement("div")
  measureTooltipElement.className =
    "relative bg-gray-200 bg-opacity-50 rounded-md shadow text-slate-700 text-xs p-1"
  measureTooltip = new Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: "bottom-center",
    stopEvent: false,
    insertFirst: false
  })
  map.addOverlay(measureTooltip)
}

export default function OpenLayersMap() {
  const [layers, setLayers] = useState([])
  const [initializing, setInitializing] = useState(true)
  const [featureList, setFeatureList] = useState([])
  const [map, setMap] = useState(null)
  const [selectionPolygon, setSelectionPolygon] = useState(null)
  const [legendUrls, setLegendUrls] = useState([])
  const [layerColors, setLayerColors] = useState([]) // [{title, color}]
  const [drawInfo, setDrawInfo] = useState({
    layerName: null,
    type: null,
    coordinates: []
  })
  const [modals, setModals] = useState({
    addLayer: false,
    addFeature: false,
    selectionResults: false,
    drawTarget: false
  })
  const [showDebugOptions, setShowDebugOptions] = useState(false)
  const mapRef = useRef()
  const nextLayerColorRef = useRef(0)

  useKeyShortcut({
    key: "I",
    shift: true,
    callback: () => setModals({ ...modals, addLayer: true })
  })

  useKeyShortcut({
    key: "F12",
    shift: true,
    ctrl: true,
    alt: true,
    callback: () => setShowDebugOptions((current) => !current)
  })

  useEffect(() => {
    fetch("/api/wfs/df")
      .then((response) => response.json())
      .then((data) => {
        // console.log("Geometrías de capas:", data)
        setFeatureList(data)
      })
      .catch((error) => {
        console.error("Error al obtener geometrías de capas:", error)
      })
      .finally(() => setInitializing(false))
  }, [])

  // Actualizar las leyendas de las capas
  useEffect(() => {
    if (!map || layers.length === 0) return

    const updatedLegends = layers
      .map((layer) => {
        const source = layer.getSource()

        if (source instanceof ImageWMS) {
          const params = source.getParams()
          const url = source.getUrl() // Obtener la URL base del WMS

          if (!url) return null

          // Construir la URL para la leyenda
          const legendUrl = `${url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${params.LAYERS}&LAYERTITLE=false&TRANSPARENT=true&LAYERFONTSIZE=8&LAYERFONTFAMILY=Arial`

          return {
            title: layer.getProperties().title,
            url: legendUrl
          }
        }
        return null
      })
      .filter(Boolean)

    setLegendUrls(updatedLegends)
  }, [map, layers])

  useEffect(() => {
    const map = new Map({
      target: mapRef.current,
      layers: [BaseTileLayer],
      interactions: [
        new DragPan(),
        new MouseWheelZoom(),
        DragBoxInteraction,
        DrawLineInteraction,
        DrawPolygonInteraction
      ],
      view: new View({
        /*
        projection: "EPSG:22175",
        center: [5234771.06, 5557249.73],
        */
        // projection: "EPSG:4326",
        // center: [-50.06475055195127, -21.684262995069],
        center: [-6554016.553284153, -3188341.3238312723],
        minZoom: 2,
        maxZoom: 18,
        zoom: 5
      })
    })

    setMap(map)

    window.addEventListener(`contextmenu`, (e) => e.preventDefault())

    return () => {
      map.setTarget(null)
    }
  }, [])

  useEffect(() => {
    if (!map) return

    // Agregar las capas de formas del usuario
    agregarCapa("custom_points")
    agregarCapa("custom_lines")
    // agregarCapa("custom_polygons")

    map.addControl(
      new ScaleLine({
        units: "metric"
      })
    )
    createMeasureTooltip(map)

    DragBoxInteraction.on("boxend", (event) => {
      const extent = DragBoxInteraction.getGeometry().getExtent()
      const as4326 = proj.transformExtent(extent, "EPSG:3857", "EPSG:4326")
      const stringbbox = `${as4326[0]} ${as4326[1]},${as4326[2]} ${as4326[1]},${as4326[2]} ${as4326[3]},${as4326[0]} ${as4326[3]},${as4326[0]} ${as4326[1]}`
      setSelectionPolygon(stringbbox)
    })

    DrawLineInteraction.on("drawstart", (event) => {
      const sketch = event.feature
      const listener = sketch.getGeometry().on("change", function (evt) {
        const geom = evt.target
        const tooltipCoord = geom.getLastCoordinate()
        const length = sphere.getLength(geom)
        const lengthAsKm = Math.round((length / 1000) * 100) / 100 + " " + "km"
        measureTooltipElement.innerHTML = lengthAsKm
        measureTooltip.setPosition(tooltipCoord)
      })
    })

    DrawLineInteraction.on("drawend", (event) => {
      const geometry = event.feature.getGeometry()
      const coordinates = geometry.getCoordinates()
      const coordsAs4326 = coordinates.map((coord) =>
        proj.transform(coord, "EPSG:3857", "EPSG:4326")
      )
      /*
      setDrawInfo((current) => ({
        ...current,
        type: TYPE_MULTILINESTRING,
        coordinates
      }))
      setModals({ ...modals, drawTarget: true })
      createMeasureTooltip(map)
      */
    })

    DrawPolygonInteraction.on("drawend", (event) => {
      const geometry = event.feature.getGeometry()
      const coordinates = geometry.getCoordinates()
      const coordsAs4326 = coordinates.map((coord) =>
        proj.transform(coord, "EPSG:3857", "EPSG:4326")
      )
      /*
      setDrawInfo((current) => ({
        ...current,
        type: TYPE_MULTIPOLYGON,
        coordinates
      }))
      setModals({ ...modals, drawTarget: true })
      */
    })
  }, [map])

  useEffect(() => {
    if (!map) return

    const currentLayers = map.getLayers().getArray()

    // Agregar capas nuevas que no estén en el mapa
    layers.forEach((layer) => {
      if (!currentLayers.includes(layer)) {
        map.addLayer(layer)
      }
    })

    // Remover capas obsoletas que ya no están en el estado, excepto la capa base
    // y la capa de líneas personalizadas
    currentLayers.forEach((layer) => {
      if (
        !layers.includes(layer) &&
        layer !== BaseTileLayer &&
        layer !== CustomLinesLayer
      ) {
        map.removeLayer(layer)
      }
    })
  }, [map, layers])

  useEffect(() => {
    if (map && hasAnyVisibleLayer(layers) && selectionPolygon) {
      setModals({ ...modals, selectionResults: true })
    } else {
      setSelectionPolygon(null)
    }
  }, [selectionPolygon, layers, map])

  function agregarCapa(nombreCapa) {
    if (layerExists(map, nombreCapa)) return
    const layerFlags = LAYER_FLAGS.find((layer) => layer.title === nombreCapa)
    if (!layerFlags) return
    const newLayer = layerFlags.allowVector
      ? agregarCapaVectorial(nombreCapa)
      : agregarCapaImagen(nombreCapa)
    setLayers((current) => [...current, newLayer])
  }

  function agregarCapaImagen(nombreCapa) {
    const layer = new ImageLayer({
      title: nombreCapa,
      source: new ImageWMS({
        url: "/api/wms",
        params: {
          LAYERS: nombreCapa
        }
      })
    })
    return layer
  }

  function agregarCapaVectorial(nombreCapa) {
    // const epsg = "4326"
    const epsg = "3857"
    const source = new VectorSource({
      format: new WFS(),
      url: "/api/wfs",
      loader: (extent, resolution, projection, ...rest) => {
        const proj = projection.getCode()
        fetch(
          `/api/wfs?SERVICE=WFS&TYPENAME=${nombreCapa}&REQUEST=GetFeature&bbox=${extent.join(
            ","
          )},EPSG:${epsg}&OUTPUTFORMAT=application/json&SRSNAME=${proj}`
        )
          .then((response) => response.text())
          .then((responseText) => {
            const featuresGeoJSON = new GeoJSON().readFeatures(responseText)

            // test
            const features3857 = featuresGeoJSON.map((feature) => {
              feature.getGeometry().transform("EPSG:4326", "EPSG:3857")
              return feature
            })

            source.addFeatures(featuresGeoJSON)
          })
          .catch((error) => {
            console.error("Error al cargar WFS:", error)
            source.removeLoadedExtent(extent)
          })
      },
      strategy: LoadStrategy.bbox
    })

    const special = SPECIAL_LAYER_COLORS.find(
      (item) => item[0].toLowerCase() === nombreCapa.toLowerCase()
    )
    const color = special ? special[1] : LAYER_COLORS[nextLayerColorRef.current]
    const layer = new VectorLayer({
      title: nombreCapa,
      source,
      style: new Style({
        stroke: new Stroke({
          color,
          width: 2
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: color + "40"
          }),
          stroke: new Stroke({
            color,
            width: 2
          })
        })
      })
    })
    setLayerColors((current) => {
      const newLayerColors = [...current]
      const index = newLayerColors.findIndex(
        (item) => item.title === nombreCapa
      )
      if (index === -1) {
        newLayerColors.push({ title: nombreCapa, color })
      } else {
        newLayerColors[index].color = color
      }
      return newLayerColors
    })
    if (!special) {
      nextLayerColorRef.current =
        (nextLayerColorRef.current + 1) % LAYER_COLORS.length
    }
    return layer
  }

  function changeVisibility(layer) {
    const newLayers = [...layers]
    newLayers
      .find((_layer) => _layer === layer)
      ?.setVisible(!layer.getProperties().visible)
    setLayers(newLayers)
  }

  function quitarTodasLasCapas() {
    setLayers((current) =>
      current.filter(
        (layer) =>
          layer === BaseTileLayer ||
          layer.getProperties().title.includes("custom_")
      )
    )
    map
      .getLayers()
      .getArray()
      .forEach((layer) => {
        const properties = layer.getProperties()
        if (layer !== BaseTileLayer && !properties.title.includes("custom_")) {
          map.removeLayer(layer)
        } else {
        }
      })
  }

  return (
    <>
      <AddLayer
        isOpen={modals.addLayer}
        currentLayers={layers}
        featureList={featureList}
        onOpenChange={(isOpen) => setModals({ ...modals, addLayer: isOpen })}
        onAddLayer={agregarCapa}
      />

      <SelectDrawTarget
        isOpen={modals.drawTarget}
        activeLayers={layers}
        featureList={featureList}
        type={drawInfo.type}
        onCancel={() => setModals({ ...modals, drawTarget: false })}
        onSelect={(layerName) => {
          setDrawInfo({ ...drawInfo, layerName })
          setModals({ ...modals, drawTarget: false, addFeature: true })
        }}
      />

      <AddFeature
        isOpen={modals.addFeature}
        layers={layers}
        layerName={drawInfo.layerName}
        type={drawInfo.type}
        coordinates={drawInfo.coordinates}
        featureList={featureList}
        onSuccess={() => {
          const vectorLayer = getLayerByName(map, drawInfo.layerName)
          if (drawInfo.type === TYPE_POINT) {
            addPointToLayer(vectorLayer, drawInfo.coordinates[0])
          } else if (drawInfo.type === TYPE_MULTILINESTRING) {
            addLineToLayer(vectorLayer, drawInfo.coordinates)
          }
        }}
        onOpenChange={(isOpen) => {
          setModals({ ...modals, addFeature: isOpen })
          if (!isOpen) {
            setDrawInfo({ layerName: null, type: null, coordinates: [] })
          }
        }}
      />

      <SelectionResults
        isOpen={modals.selectionResults}
        layers={layers}
        stringifiedPolygon={selectionPolygon}
        onOpenChange={(isOpen) => {
          setModals({ ...modals, selectionResults: isOpen })
          if (!isOpen) setSelectionPolygon(null)
        }}
      />
      <div className="relative w-screen h-screen">
        <div className="absolute bg-gray-100 top-20 left-0 z-10 w-full max-w-xs px-4 py-6">
          <div className="flex flex-col justify-start gap-2 mb-16">
            {showDebugOptions && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  color="default"
                  variant="flat"
                  size="sm"
                  onClick={() => setModals({ ...modals, addLayer: true })}
                >
                  AGREGAR CAPA
                </Button>
                <Button
                  color="default"
                  variant="flat"
                  size="sm"
                  onClick={() => {
                    const coordinates = [-58.38682204546973, -34.60515438401025]
                    const vectorLayer = getLayerByName(map, "custom_points")
                    if (!vectorLayer) return
                    vectorLayer
                      .getSource()
                      .addFeature(new Feature(new Point(coordinates)))
                  }}
                >
                  TEST ADD POINT
                </Button>
                <Button
                  color="default"
                  variant="flat"
                  size="sm"
                  onClick={quitarTodasLasCapas}
                >
                  QUITAR CAPAS
                </Button>
                <Button
                  color="default"
                  variant="flat"
                  size="sm"
                  onClick={() => {
                    layers.forEach((layer) => {
                      try {
                        const properties = layer.getProperties()
                        const source = layer.getSource()
                        const features = source.getFeatures()
                        const { title, visible } = properties
                      } catch (error) {
                        console.error("Error al listar capas:", error)
                        console.error(layer)
                      }
                    })
                  }}
                >
                  LIST LAYERS
                </Button>
              </div>
            )}
            {layers.map((layer) => {
              const properties = layer.getProperties()
              const { title } = properties
              const feature = getLayerFeature(featureList, title)
              const layerColor = layerColors.find(
                (item) => item.title === title
              )
              return (
                <LayerButton
                  key={title}
                  layer={layer}
                  layerColor={layerColor?.color}
                  feature={feature}
                  onClick={() => changeVisibility(layer)}
                  onDelete={(layer) => {
                    const newLayers = layers.filter(
                      (_layer) => _layer !== layer
                    )
                    setLayers(newLayers)
                  }}
                />
              )
            })}
            <Button
              color="default"
              variant="flat"
              size="sm"
              startContent={<IconPlus className="w-4 h-4" />}
              onClick={() => setModals({ ...modals, addLayer: true })}
            >
              Agregar
            </Button>
            <Button
              color="default"
              variant="flat"
              size="sm"
              startContent={<IconTrash className="w-4 h-4" />}
              onClick={quitarTodasLasCapas}
            >
              Quitar todo
            </Button>
          </div>
          {legendUrls.length > 0 && (
            <section className="bg-white bg-opacity-90 p-4 rounded-md shadow">
              <p className="text-sm font-medium">
                Leyendas de las capas no vectoriales
              </p>
              {legendUrls.map(({ title, url }) => (
                <div key={title} className="mb-2">
                  <img src={url} alt={`Leyenda de ${title}`} />
                </div>
              ))}
            </section>
          )}
        </div>
        <MapEvents
          map={map}
          onClick={(e) => {
            const [lng, lat] = e.coordinate
            if (
              e.originalEvent.ctrlKey &&
              !e.originalEvent.shiftKey &&
              !e.originalEvent.altKey
            ) {
              setDrawInfo((current) => ({
                ...current,
                type: TYPE_POINT,
                coordinates: [...current.coordinates, [lng, lat]]
              }))
              setModals({ ...modals, drawTarget: true })
            }
          }}
          onContextMenu={(e) => {
            const [lng, lat] = e.coordinate
          }}
        />
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </>
  )
}

function hasAnyVisibleLayer(layers) {
  return layers.some((layer) => layer.getProperties().visible)
}

function layerExists(map, name) {
  return map
    .getLayers()
    .getArray()
    .some((layer) => layer.getProperties().title === name)
}

function getLayerByName(map, name) {
  return map
    .getLayers()
    .getArray()
    .find((layer) => layer.getProperties().title === name)
}

/** * @param {number[]} coordinates */
function addPointToLayer(vectorLayer, coordinates) {
  // Crear la geometría del punto
  const pointGeometry = new Point(coordinates)

  // Crear un estilo para el punto
  const pointStyle = new Style({
    image: new CircleStyle({
      radius: 5,
      fill: new Fill({
        color: "#1f7f1d" // Color del punto
      }),
      stroke: new Stroke({
        color: "#fff", // Color del borde del punto
        width: 2 // Ancho del borde del punto
      })
    })
  })

  // Crear una característica con la geometría
  const pointFeature = new Feature({
    geometry: pointGeometry,
    style: pointStyle
  })

  // Aplicar el estilo a la característica
  // pointFeature.setStyle(pointStyle)
  vectorLayer.getSource().addFeature(pointFeature)
  /*
  const _pointFeature = new Feature({
    geometry: new Point(coordinates)
  })
  vectorLayer.getSource().addFeature(_pointFeature)
  */
}

/** * @param {number[]} coordinates */
function addLineToLayer(vectorLayer, coordinates) {
  // Crear la geometría de la línea
  const lineGeometry = new LineString(coordinates)

  // Crear un estilo para la línea
  const lineStyle = new Style({
    stroke: new Stroke({
      color: "#1f7f1d", // Color de la línea
      width: 2 // Ancho de la línea
    })
  })

  // Crear una característica con la geometría
  const lineFeature = new Feature({
    geometry: lineGeometry
  })

  // Aplicar el estilo a la característica
  lineFeature.setStyle(lineStyle)

  vectorLayer.getSource().addFeature(lineFeature)
}
