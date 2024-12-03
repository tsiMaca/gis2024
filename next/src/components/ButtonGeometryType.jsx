"use client"

import { Button, Tooltip } from "@nextui-org/react"
import {
  TYPE_MULTILINESTRING,
  TYPE_MULTIPOLYGON,
  TYPE_POINT
} from "../constants/geometry-types"
import {
  IconFileTypePng,
  IconLine,
  IconPoint,
  IconPolygon,
  IconQuestionMark
} from "@tabler/icons-react"
import { geometryDescription } from "../utils/geometries"

export default function ButtonGeometryType({ type, allowVector, ...props }) {
  const iconColor =
    type === TYPE_POINT
      ? "primary"
      : type === TYPE_MULTILINESTRING
      ? "warning"
      : type === TYPE_MULTIPOLYGON
      ? "secondary"
      : "default"
  const description = geometryDescription(type)
  return (
    <Tooltip
      content={
        allowVector
          ? description
          : "Para no ralentizar el mapa, esta capa solo se puede agregar como raster"
      }
    >
      <Button
        color={allowVector ? iconColor : "default"}
        variant="flat"
        size="sm"
        radius="lg"
        isIconOnly
        {...props}
      >
        {allowVector ? (
          <>
            {type === TYPE_POINT ? (
              <IconPoint className="w-4 h-4" />
            ) : type === TYPE_MULTILINESTRING ? (
              <IconLine className="w-4 h-4" />
            ) : type === TYPE_MULTIPOLYGON ? (
              <IconPolygon className="w-4 h-4" />
            ) : (
              <IconQuestionMark className="w-4 h-4" />
            )}
          </>
        ) : (
          <IconFileTypePng className="w-4 h-4" />
        )}
      </Button>
    </Tooltip>
  )
}
