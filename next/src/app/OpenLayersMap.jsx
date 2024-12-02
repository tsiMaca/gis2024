"use client"

import { Button } from "@nextui-org/react"
import Conditions from "ol/events/condition"
import Feature from "ol/feature"
import GeoJSON from "ol/format/geojson"
import WFS from "ol/format/wfs"
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
import useKeyShortcut from "../hooks/useKeyShortcut"
import { LAYER_FLAGS } from "../data/layers"

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
  const [map, setMap] = useState(null)
  const [coordinates, setCoordinates] = useState([])
  const [selectionPolygon, setSelectionPolygon] = useState(null)
  const [drawLayerName, setDrawLayerName] = useState(null)
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
    const map = new Map({
      target: mapRef.current,
      // layers: [BaseTileLayer, CustomLinesLayer],
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
      setCoordinates(coordinates)
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
    const layerFlags = LAYER_FLAGS.find((layer) => layer.nombre === nombreCapa)
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
        onOpenChange={(isOpen) => setModals({ ...modals, addLayer: isOpen })}
        onAddLayer={agregarCapa}
      />

      <SelectDrawTarget
        isOpen={modals.drawTarget}
        layerNames={layers.map((layer) => layer.getProperties().title)}
        onOpenChange={(isOpen) => setModals({ ...modals, drawTarget: isOpen })}
        onSelect={(layerName) => {
          setDrawLayerName(layerName)
          setModals({ ...modals, drawTarget: false, addFeature: true })
        }}
      />

      <AddFeature
        isOpen={modals.addFeature}
        layers={layers}
        layerName={drawLayerName}
        coordinates={coordinates}
        onSuccess={() => {
          const vectorLayer = getLayerByName(map, drawLayerName)
          console.log("Draw layer name:", drawLayerName)
          console.log("Vector layer:", vectorLayer)
          addLineToLayer(vectorLayer, coordinates)
        }}
        onOpenChange={(isOpen) => {
          setModals({ ...modals, addFeature: isOpen })
          if (!isOpen) {
            setCoordinates([])
            setDrawLayerName(null)
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
            // console.log("Map clicked", { lat, lng })
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

/**
 *
 * @param {number[]} coordinates
 */
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
