"use client"

import { Button } from "@nextui-org/react"
import Conditions from "ol/events/condition"
import DragBox from "ol/interaction/dragbox"
import DragPan from "ol/interaction/dragpan"
import MouseWheelZoom from "ol/interaction/mousewheelzoom"
import TileLayer from "ol/layer/Tile"
import ImageLayer from "ol/layer/image"
import Map from "ol/map"
import "ol/ol.css"
import ImageWMS from "ol/source/imagewms"
import TileWMS from "ol/source/tilewms"
import ScaleLine from "ol/control/ScaleLine";
import View from "ol/view"
import React, { useEffect, useRef, useState } from "react"
import useKeyShortcut from "../hooks/useKeyShortcut"
import SelectionResults from "../components/SelectionResults"
import AddLayer from "../components/AddLayer"

const DragBoxInteraction = new DragBox({
  condition: Conditions.always,
  className: "bg-green-500 bg-opacity-25 border-green-500 border-opacity-50"
})

export default function OpenLayersMap() {
  const [layers, setLayers] = useState([])
  const [map, setMap] = useState(null)
  const [selectionPolygon, setSelectionPolygon] = useState(null)
  const [isAddLayerOpen, setIsAddLayerOpen] = useState(false)
  const [isResultsOpen, setIsResultsOpen] = useState(false)
  const [legendUrls, setLegendUrls] = useState([]);
  const mapRef = useRef()

  useKeyShortcut({
    key: "I",
    shift: true,
    callback: () => setIsAddLayerOpen((isOpen) => !isOpen)
  })

  useEffect(() => {
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          title: "Base Map",
          source: new TileWMS({
            url: "https://wms.ign.gob.ar/geoserver/ows",
            params: {
              LAYERS: "capabaseargenmap",
              VERSION: "1.1.1"
            }
          })
        })
      ],
      interactions: [new DragPan(), new MouseWheelZoom(), DragBoxInteraction],
      view: new View({
        projection: "EPSG:4326",
        center: [-50.06475055195127, -21.684262995069],
        minZoom: 3,
        maxZoom: 18,
        zoom: 4
      })
    })
    // Crear instancia de ScaleLine
    const scaleLineControl = new ScaleLine({
      units: "metric", // Opciones: 'metric', 'imperial', etc.
    });
  
    // Agregar el control al mapa
    map.addControl(scaleLineControl);

    setMap(map)

    return () => {
      map.setTarget(null)
    }
  }, [])
   
  useEffect(() => {
    if (!map) return

    DragBoxInteraction.on("boxend", (event) => {
      const coordinates = event.target.getGeometry().getCoordinates()
      const stringifiedPolygon = coordinates[0]
        .map((coord) => coord.join(" "))
        .join(",")
      setSelectionPolygon(stringifiedPolygon)
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

    // Remover capas obsoletas que ya no están en el estado
    currentLayers.forEach((layer) => {
      if (!layers.includes(layer) && layer !== currentLayers[0]) {
        map.removeLayer(layer)
      }
    })
  }, [map, layers])

  useEffect(() => {
    if (map && hasAnyVisibleLayer(layers) && selectionPolygon) {
      setIsResultsOpen(true)
    }
  }, [selectionPolygon, layers, map])

  useEffect(() => {
    if (map && layers.length > 0) {
      const updatedLegends = layers
        .map((layer) => {
          const source = layer.getSource();
          
          if (source instanceof ImageWMS) {
            const params = source.getParams();
            const url = source.getUrl(); // Obtener la URL base del WMS
  
            if (!url) {
              console.error(
                `La fuente de la capa "${layer.getProperties().title}" no tiene una URL válida.`
              );
              return null;
            }
  
            // Construir la URL para la leyenda
            const legendUrl = `${url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${params.LAYERS}`;
            
            return {
              title: layer.getProperties().title,
              url: legendUrl,
            };
          }
  
          console.warn(`La capa "${layer.getProperties().title}" no es del tipo ImageWMS.`);
          return null;
        })
        .filter(Boolean);
  
      setLegendUrls(updatedLegends);
    }
  }, [map, layers]);
  

  function agregarCapa(nombreCapa) {
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
        isOpen={isAddLayerOpen}
        onOpenChange={setIsAddLayerOpen}
        onAddLayer={agregarCapa}
      />

      <SelectionResults
        isOpen={isResultsOpen}
        layers={layers}
        stringifiedPolygon={selectionPolygon}
        onOpenChange={(isOpen) => {
          setIsResultsOpen(isOpen)
          if (!isOpen) setSelectionPolygon(null)
        }}
      />
      <div className="relative w-screen h-screen">
        <div className="absolute top-0 left-0 z-10 flex justify-center gap-2 w-full py-6">
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
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        
      </div>
      <div className="absolute bottom-0 right-0 bg-white p-4 z-10 shadow-lg">
          <h3 className="font-bold mb-2">Leyendas:</h3>
          {legendUrls.map(({ title, url }) => (
            <div key={title} className="mb-2">
              <p className="text-sm font-semibold">{title}</p>
              <img
                src={url}
                alt={`Leyenda de ${title}`}
                className="border border-gray-300"
              />
            </div>
          ))}
        </div>
      
    </>
  )
}

function hasAnyVisibleLayer(layers) {
  return layers.some((layer) => layer.getProperties().visible)
}

/*
maxResolution: Infinity
minResolution: 0
opacity: 1
source: _ol_source_ImageWMS_ {pendingRemovals: {…}, dispatching_: {…}, listeners_: {…}, revision_: 0, ol_uid: 275, …}
title: "red_vial"
visible: true
zIndex: 0
*/
