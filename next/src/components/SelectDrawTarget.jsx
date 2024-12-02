"use client"

import {
  Button,
  Listbox,
  ListboxItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader
} from "@nextui-org/react"
import { useEffect, useState } from "react"
import { alertmessage } from "../utils/alerts"

/**
 *
 * @param {{ isOpen: boolean, layerNames: string[], onOpenChange: (isOpen: boolean) => void, onSelect: (type: string) => void }} props
 */
export default function SelectDrawTarget({
  isOpen,
  layerNames,
  onOpenChange,
  onSelect
}) {
  const [_layerNames, setLayerNames] = useState(layerNames)

  useEffect(() => {
    setLayerNames(
      layerNames.filter(
        (layer) => !layer.startsWith("custom_") && layer !== "base_map"
      )
    )
  }, [layerNames])

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Seleccionar capa...
          </ModalHeader>
          <ModalBody>
            <div className="border border-gray-200 rounded-sm p-2">
              <Listbox aria-label="Capas" onAction={(key) => onSelect(key)}>
                {_layerNames.map((layer) => (
                  <ListboxItem
                    key={layer}
                    className="text-slate-700 text-sm uppercase"
                  >
                    {layer}
                  </ListboxItem>
                ))}
                <ListboxItem
                  key="custom_lines"
                  className="text-slate-700 text-sm uppercase"
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
              onPress={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
