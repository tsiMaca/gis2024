"use client"

import {
  Button,
  Listbox,
  ListboxItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Snippet
} from "@nextui-org/react"
import { useEffect, useState } from "react"
import { alertmessage } from "../utils/alerts"
import { TYPE_MULTILINESTRING, TYPE_POINT } from "../constants/geometry-types"

export default function SelectDrawTarget({
  isOpen,
  activeLayers,
  layersGeometries,
  type,
  onSelect,
  onCancel
}) {
  const [_layerNames, setLayerNames] = useState([])

  useEffect(() => {
    setLayerNames(
      activeLayers
        .filter((layer) => {
          const properties = layer.getProperties()
          const title = properties.title
          return !title.startsWith("custom_") && title !== "base_map"
        })
        .map((layer) => {
          const properties = layer.getProperties()
          return properties.title
        })
    )
  }, [activeLayers])

  return (
    <>
      <Modal
        isOpen={isOpen}
        size="xl"
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onCancel()
          }
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Seleccionar capa...
          </ModalHeader>
          <ModalBody>
            <div className="border border-gray-200 rounded-sm p-2">
              <Listbox
                aria-label="Capas"
                disabledKeys={[
                  _layerNames,
                  "custom_points",
                  "custom_lines"
                ].filter((layer) => {
                  const layerGeometry = layersGeometries.find(
                    (geometry) => geometry.title === layer
                  )
                  return !layerGeometry || layerGeometry.type !== type
                })}
                onAction={(key) => onSelect(key)}
              >
                {_layerNames.map((layer) => {
                  const layerGeometry = layersGeometries.find(
                    (geometry) => geometry.title === layer
                  )
                  return (
                    <ListboxItem
                      key={layer}
                      textValue={layer}
                      className="flex items-center gap-4"
                      endContent={
                        !layerGeometry ? (
                          <>
                            <small className="text-slate-500">
                              Capa raster
                            </small>
                          </>
                        ) : layerGeometry.type !== type ? (
                          <>
                            <small className="text-slate-500">
                              No es {type}
                            </small>
                          </>
                        ) : (
                          ""
                        )
                      }
                    >
                      <span className="text-slate-700 text-sm uppercase">
                        {layer}
                      </span>
                      <Snippet
                        className="ml-4"
                        color="default"
                        size="sm"
                        hideCopyButton
                        hideSymbol
                      >
                        {layerGeometry.type}
                      </Snippet>
                    </ListboxItem>
                  )
                })}
                <ListboxItem
                  key="custom_points"
                  className="text-slate-700 text-sm uppercase"
                  endContent={
                    type !== TYPE_POINT ? (
                      <>
                        <small className="text-slate-500">No es {type}</small>
                      </>
                    ) : (
                      ""
                    )
                  }
                >
                  Puntos del usuario
                </ListboxItem>
                <ListboxItem
                  key="custom_lines"
                  className="text-slate-700 text-sm uppercase"
                  endContent={
                    type !== TYPE_MULTILINESTRING ? (
                      <>
                        <small className="text-slate-500">No es {type}</small>
                      </>
                    ) : (
                      ""
                    )
                  }
                >
                  Líneas del usuario
                </ListboxItem>
              </Listbox>
            </div>
          </ModalBody>
          <ModalFooter className="w-full">
            <Button
              className="w-full"
              color="default"
              variant="flat"
              onPress={onCancel}
            >
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
