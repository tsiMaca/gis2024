import { TYPE_UNKNOWN } from "../constants/geometry-types"

export function getLayerFeature(featureList, layerName) {
  return (
    featureList.find((feature) => feature.title === layerName) || {
      title: layerName,
      type: TYPE_UNKNOWN,
      fields: []
    }
  )
}
