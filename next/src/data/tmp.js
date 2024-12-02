const BaseTileLayer = new TileLayer({
  title: "Base Map",
  source: new TileWMS({
    url: "https://wms.ign.gob.ar/geoserver/ows",
    params: {
      LAYERS: "capabaseargenmap",
      VERSION: "1.1.1"
    }
  })
})

const ShapeLayer = new VectorLayer({
  title: "Features",
  source: new VectorSource({ wrapX: false })
})

const map = new Map({
  target: mapRef.current,
  layers: [BaseTileLayer, ShapeLayer],
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
