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
import View from "ol/view"
import React, { useEffect, useRef, useState } from "react"
import useKeyShortcut from "../hooks/useKeyShortcut"
import SelectionResults from "../components/SelectionResults"
import AddLayer from "../components/AddLayer";
// import ImageWMS from 'ol/source/ImageWMS.js';
import OSM from 'ol/source/OSM.js';
// import {Image, Tile} from 'ol/layer.js';

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
