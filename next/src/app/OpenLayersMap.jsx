"use client"

import { Button } from "@nextui-org/react"
import Conditions from "ol/events/condition"
import Feature from "ol/feature"
import GeoJSON from "ol/format/geojson"
import WFS from "ol/format/wfs"
import Point from "ol/geom/point"
import LineString from "ol/geom/linestring"
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
import ImageWMS from "ol/source/imagewms"
import OSM from "ol/source/osm"
import TileWMS from "ol/source/tilewms"
import VectorSource from "ol/source/vector"
import CircleStyle from "ol/style/circle"
import Fill from "ol/style/fill"
import Stroke from "ol/style/stroke"
import Style from "ol/style/style"
import View from "ol/view"
import React, { useEffect, useRef, useState } from "react"
import AddFeature from "../components/AddFeature"
import AddLayer from "../components/AddLayer"
import MapEvents from "../components/MapEvents"
import SelectDrawTarget from "../components/SelectDrawTarget"
import SelectionResults from "../components/SelectionResults"
import { TYPE_MULTILINESTRING, TYPE_POINT } from "../constants/geometry-types"
import { LAYER_FLAGS } from "../data/layers"
import useKeyShortcut from "../hooks/useKeyShortcut"
import "../types/layer-geometry"

const IGNTileWMS = new TileWMS({
  url: "https://wms.ign.gob.ar/geoserver/ows",
  params: {
    LAYERS: "capabaseargenmap",
    VERSION: "1.1.1"
  }
})

const BaseTileLayer = new TileLayer({
  title: "base_map",
  source: new OSM()
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

export default function OpenLayersMap() {
  const [layers, setLayers] = useState([])
  const [initializing, setInitializing] = useState(true)

  /*** @type {[LayerGeometry[], React.Dispatch<React.SetStateAction<LayerGeometry[]>>]} */
  const [layersGeometries, setLayersGeometries] = useState([])

  const [map, setMap] = useState(null)
  const [selectionPolygon, setSelectionPolygon] = useState(null)
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
  const mapRef = useRef()

  useKeyShortcut({
    key: "I",
    shift: true,
    callback: () => setModals({ ...modals, addLayer: true })
  })

  useKeyShortcut({
    key: "A",
    shift: true,
    callback: () => setModals({ ...modals, addFeature: true })
  })

  useEffect(() => {
    fetch("/api/wfs/df")
      .then((response) => response.json())
      .then((data) => {
        setLayersGeometries(data)
      })
      .catch((error) => {
        console.error("Error al obtener geometrías de capas:", error)
      })
      .finally(() => setInitializing(false))
  }, [])

  useEffect(() => {
    const map = new Map({
      target: mapRef.current,
      layers: [BaseTileLayer],
      interactions: [
        new DragPan(),
        new MouseWheelZoom(),
        DragBoxInteraction,
        DrawLineInteraction
      ],
      view: new View({
        projection: "EPSG:4326",
        center: [-50.06475055195127, -21.684262995069],
        minZoom: 3,
        maxZoom: 18,
        zoom: 4
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

    DragBoxInteraction.on("boxend", (event) => {
      const coordinates = event.target.getGeometry().getCoordinates()
      const stringifiedPolygon = coordinates[0]
        .map((coord) => coord.join(" "))
        .join(",")
      setSelectionPolygon(stringifiedPolygon)
    })

    DrawLineInteraction.on("drawend", (event) => {
      const geometry = event.feature.getGeometry()
      const length = geometry.getLength()
      // console.log("Length: ", length)
      const coordinates = geometry.getCoordinates()
      // console.log("Coordinates: ", coordinates)
      setDrawInfo((current) => ({
        ...current,
        type: TYPE_MULTILINESTRING,
        coordinates
      }))
      setModals({ ...modals, drawTarget: true })
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
    const layerFlags = LAYER_FLAGS.find((layer) => layer.title === nombreCapa)
    if (!layerFlags) return
    if (layerFlags.allowVector) {
      agregarCapaVectorial(nombreCapa)
    } else {
      agregarCapaImagen(nombreCapa)
    }
  }

  function agregarCapaImagen(nombreCapa) {
    if (layerExists(map, nombreCapa)) return
    const layer = new ImageLayer({
      title: nombreCapa,
      source: new ImageWMS({
        url: "/api/wms",
        params: {
          LAYERS: nombreCapa
        }
      })
    })
    setLayers((current) => [...current, layer])
  }

  function agregarCapaVectorial(nombreCapa) {
    if (layerExists(map, nombreCapa)) return
    const source = new VectorSource({
      format: new WFS(),
      url: "/api/wfs",
      loader: (extent, resolution, projection, ...rest) => {
        const proj = projection.getCode()
        fetch(
          `/api/wfs?SERVICE=WFS&TYPENAME=${nombreCapa}&REQUEST=GetFeature&bbox=${extent.join(
            ","
          )},EPSG:4326&OUTPUTFORMAT=application/json&SRSNAME=${proj}`
        )
          .then((response) => response.text())
          .then((responseText) => {
            const featuresGeoJSON = new GeoJSON().readFeatures(responseText)
            source.addFeatures(featuresGeoJSON)
          })
          .catch((error) => {
            console.error("Error al cargar WFS:", error)
            source.removeLoadedExtent(extent)
          })
      },
      strategy: LoadStrategy.bbox
    })

    const layer = new VectorLayer({
      title: nombreCapa,
      source
    })
    setLayers((current) => [...current, layer])
  }

  function changeVisibility(layer) {
    const newLayers = [...layers]
    newLayers
      .find((_layer) => _layer === layer)
      ?.setVisible(!layer.getProperties().visible)
    setLayers(newLayers)
  }

  return (
    <>
      <AddLayer
        isOpen={modals.addLayer}
        currentLayers={layers}
        layersGeometries={layersGeometries}
        onOpenChange={(isOpen) => setModals({ ...modals, addLayer: isOpen })}
        onAddLayer={agregarCapa}
      />

      <SelectDrawTarget
        isOpen={modals.drawTarget}
        activeLayers={layers}
        layersGeometries={layersGeometries}
        type={drawInfo.type}
        onCancel={() => {
          setModals({ ...modals, drawTarget: false })
          // setDrawInfo({ layerName: null, type: null, coordinates: [] })
        }}
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
        onSuccess={() => {
          const vectorLayer = getLayerByName(map, drawInfo.layerName)
          if (drawInfo.type === TYPE_POINT) {
            console.log(
              `add to ${drawInfo.layerName} point`,
              drawInfo.coordinates
            )
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
        <div className="absolute top-0 left-0 z-10 flex justify-center gap-2 w-full py-6">
          <button onClick={() => setModals({ ...modals, addLayer: true })}>
            AGREGAR CAPA
          </button>
          <button
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
          </button>
          <button
            onClick={() => {
              setLayers([])
              map
                .getLayers()
                .getArray()
                .forEach((layer) => {
                  const properties = layer.getProperties()
                  if (
                    layer !== BaseTileLayer &&
                    !properties.title.includes("custom_")
                  ) {
                    map.removeLayer(layer)
                  }
                })
            }}
          >
            QUITAR CAPAS
          </button>
          <button
            onClick={() => {
              layers.forEach((layer) => {
                try {
                  const properties = layer.getProperties()
                  const source = layer.getSource()
                  const features = source.getFeatures()
                  const { title, visible } = properties
                  console.log({ title, visible, properties, features })
                } catch (error) {
                  console.error("Error al listar capas:", error)
                  console.error(layer)
                }
              })
            }}
          >
            LIST LAYERS
          </button>
          {layers.map((layer) => {
            const properties = layer.getProperties()
            const { title, visible } = properties
            return (
              <Button
                key={title}
                className="text-xs uppercase"
                color="primary"
                variant={visible ? "solid" : "flat"}
                radius="sm"
                onClick={() => changeVisibility(layer)}
              >
                {title}
              </Button>
            )
          })}
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
            console.log("Map context menu", { lat, lng })
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
  /*
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
    geometry: pointGeometry
  })

  // Aplicar el estilo a la característica
  // pointFeature.setStyle(pointStyle)
  vectorLayer.getSource().addFeature(pointFeature)
  */
  console.log("addPointToLayer", coordinates)
  const _pointFeature = new Feature({
    geometry: new Point(coordinates)
  })
  vectorLayer.getSource().addFeature(_pointFeature)
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
