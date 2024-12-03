"use client"

import { Button } from "@nextui-org/react"
import { IconTrash } from "@tabler/icons-react"
import { LAYER_FLAGS } from "../data/layers"
import ButtonGeometryType from "./ButtonGeometryType"

export default function LayerButton({
  layer,
  layerColor,
  feature,
  onDelete,
  ...props
}) {
  const properties = layer.getProperties()
  const layerFlags = LAYER_FLAGS.find((flag) => flag.id === properties.flag)
  const { title, visible } = properties
  const { type } = feature

  console.log("Color final de ", title, "es", layerColor)
  return (
    <div className="grid grid-cols-[1fr,32px,32px] items-center gap-1 w-full">
      <button
        className="inline-block rounded-md text-xs uppercase truncate hover:bg-opacity-50 w-full max-w-xs px-4 py-2"
        style={{
          backgroundColor: layerColor ? layerColor + "C0" : "#dfdfdf80"
        }}
        {...props}
      >
        <span className="w-40 truncate">{title}</span>
      </button>
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
