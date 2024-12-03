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

export default function LayerButton({ layer, feature, onDelete, ...props }) {
  const properties = layer.getProperties()
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
      <Tooltip content={typeDescription} placement="top">
        <Button
          color="success"
          variant="flat"
          size="sm"
          isIconOnly
          startContent={
            type !== TYPE_UNKNOWN ? (
              <>
                {type === TYPE_POINT ? (
                  <IconPoint className="w-3 h-3" />
                ) : type === TYPE_MULTILINESTRING ? (
                  <IconLine className="w-3 h-3" />
                ) : (
                  <IconPolygon className="w-3 h-3" />
                )}
              </>
            ) : null
          }
        />
      </Tooltip>
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
