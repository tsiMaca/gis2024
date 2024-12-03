import {
  TYPE_MULTILINESTRING,
  TYPE_MULTIPOLYGON,
  TYPE_POINT
} from "../constants/geometry-types"

export function geometryDescription(type) {
  if (type === TYPE_POINT) {
    return "Punto"
  } else if (type === TYPE_MULTILINESTRING) {
    return "Línea"
  } else if (type === TYPE_MULTIPOLYGON) {
    return "Polígono"
  }
  return "Desconocido"
}
