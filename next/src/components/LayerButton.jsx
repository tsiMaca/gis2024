"use client"

import { Button, Tooltip } from "@nextui-org/react"
import {
  IconLine,
  IconPoint,
  IconPolygon,
  IconTrash
} from "@tabler/icons-react"
import {
  TYPE_MULTILINESTRING,
  TYPE_POINT,
  TYPE_UNKNOWN
} from "../constants/geometry-types"
import { geometryDescription } from "../utils/geometries"
import { LAYER_FLAGS } from "../data/layers"
import ButtonGeometryType from "./ButtonGeometryType"

export default function LayerButton({ layer, feature, onDelete, ...props }) {
  const properties = layer.getProperties()
  const layerFlags = LAYER_FLAGS.find((flag) => flag.id === properties.flag)
  const { title, visible } = properties
  const { type } = feature
  const typeDescription = geometryDescription(type)
  return (
    <div className="grid grid-cols-[1fr,32px,32px] items-center gap-1 w-full">
      <Button
        className="text-xs uppercase w-full max-w-xs"
        color={visible ? "primary" : "default"}
        variant={visible ? "solid" : "flat"}
        size="sm"
        radius="sm"
        {...props}
      >
        <span className="w-40 truncate">{title}</span>
      </Button>
      <ButtonGeometryType type={type} allowVector={layerFlags?.allowVector} />
      <Button
        color="danger"
        variant="faded"
        size="sm"
        isIconOnly
        startContent={<IconTrash className="w-3 h-3" />}
        onClick={() => onDelete(layer)}
      />
    </div>
  )
}
