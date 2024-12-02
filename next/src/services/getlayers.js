export async function getLayers() {
  /*
  fetch("/api/wms/gc")
      .then((res) => res.text())
      .then((text) => {
        const parser = new DOMParser()
        const xml = parser.parseFromString(text, "text/xml")
        const layers = xml.querySelectorAll("Layer > Name")
        layers.forEach((layer) => {
          const layerName = layer.textContent
          // agregarCapa(layerName)
          console.log("Layer name:", layerName)
        })
      })
  */
  const response = await fetch("/api/wms/gc")
  const text = await response.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(text, "text/xml")
  const layers = xml.querySelectorAll("Layer > Name")
  const layerNames = []
  layers.forEach((layer) => {
    const layerName = layer.textContent
    layerNames.push(layerName)
  })
  return layerNames
}
