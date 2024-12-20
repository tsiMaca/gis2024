"use client"

import {
  Button,
  Input,
  Listbox,
  ListboxItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Snippet
} from "@nextui-org/react"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import { MAX_LAYERS } from "../constants/layers-limits"
import { LAYER_FLAGS } from "../data/layers"
import useKeyShortcut from "../hooks/useKeyShortcut"
import "../types/layer-geometry"
import { getLayerFeature } from "../utils/layer-feature"
import ButtonGeometryType from "./ButtonGeometryType"

const PAGE_SIZE = 7

export default function AddLayer({
  isOpen,
  currentLayers,
  featureList,
  onOpenChange,
  onAddLayer
}) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [layers, setLayers] = useState([])
  const [filteredLayers, setFilteredLayers] = useState([])

  const inputRef = useRef(null)

  useKeyShortcut({
    shortcutId: ["NextPage"],
    key: "ArrowRight",
    callback: () => {
      if (isOpen) {
        setPage((current) =>
          Math.min(current + 1, Math.ceil(layers.length / PAGE_SIZE))
        )
      }
    }
  })

  useKeyShortcut({
    shortcutId: ["PreviousPage"],
    key: "ArrowLeft",
    callback: () => {
      if (isOpen) {
        setPage((current) => Math.max(current - 1, 1))
      }
    }
  })

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onOpenChange(false)
      }
      if (/[a-zA-Z0-9]/.test(e.key) && e.key.length === 1) {
        inputRef.current?.focus()
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  useEffect(() => {
    setLayers(
      featureList
        .filter((layer) => !layer.title.startsWith("custom_"))
        .map((layer) => ({ title: layer.title }))
    )
  }, [featureList])

  useEffect(() => {
    if (search) {
      setFilteredLayers(
        layers.filter((layer) =>
          layer.title.toLowerCase().includes(search.toLowerCase())
        )
      )
      setPage(1)
    } else {
      setFilteredLayers(layers)
    }
  }, [search])

  useEffect(() => {
    if (!isOpen) {
      setPage(1)
      setSearch("")
    }
  }, [isOpen])

  return (
    <Modal
      size="xl"
      className="h-[630px]"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Agregar capa
            </ModalHeader>
            <ModalBody>
              <>
                {loading ? (
                  <>
                    <Progress
                      aria-label="Loading"
                      className="w-full"
                      color="primary"
                      size="sm"
                      isIndeterminate
                    />
                  </>
                ) : (
                  <>
                    {currentLayers.length >= MAX_LAYERS ? (
                      <div className="flex items-center text-slate-700 text-sm h-full mb-4">
                        Solo se permiten hasta {MAX_LAYERS} capas. Elimine
                        alguna capa para poder agregar otra.
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Input
                            ref={inputRef}
                            className="flex-1"
                            placeholder="Buscar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div>
                        <div className="border border-gray-100 rounded-md mb-4">
                          <Listbox
                            aria-label="Layers"
                            itemClasses={{
                              base: "px-3 rounded-md gap-3 h-12 data-[hover=true]:bg-default-100/80"
                            }}
                            onAction={(key) => {
                              onAddLayer(key)
                              onClose()
                            }}
                          >
                            {layers
                              .filter((layer) =>
                                search
                                  ? layer.title
                                      .toLowerCase()
                                      .includes(search.toLowerCase())
                                  : true
                              )
                              .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                              .map((layer) => {
                                const layerFlags = LAYER_FLAGS.find(
                                  (flag) => flag.title === layer.title
                                )
                                const layerFeature = getLayerFeature(
                                  featureList,
                                  layer.title
                                )
                                const { type } = layerFeature
                                return (
                                  <ListboxItem
                                    key={layer.title}
                                    textValue={layer.title}
                                    classNames={{ base: "h-auto" }}
                                    endContent={
                                      <div className="flex items-center gap-4">
                                        {layerFlags?.allowVector && (
                                          <Snippet
                                            color="default"
                                            size="sm"
                                            hideCopyButton
                                            hideSymbol
                                          >
                                            {type}
                                          </Snippet>
                                        )}
                                        <ButtonGeometryType
                                          type={type}
                                          allowVector={layerFlags?.allowVector}
                                        />
                                      </div>
                                    }
                                  >
                                    <span className="block text-slate-700 text-xs text-left uppercase w-full">
                                      {layer.title}
                                    </span>
                                  </ListboxItem>
                                )
                              })}
                          </Listbox>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            </ModalBody>
            <ModalFooter className="w-full">
              {currentLayers.length >= MAX_LAYERS ? (
                <Button
                  className="w-full"
                  color="default"
                  variant="flat"
                  onPress={onClose}
                >
                  Cerrar
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 w-full">
                  <Button
                    variant="flat"
                    isDisabled={page === 1}
                    isIconOnly
                    startContent={<IconChevronLeft className="w-4 h-4" />}
                    onClick={() => setPage((current) => current - 1)}
                  />
                  <Button
                    variant="flat"
                    isDisabled={page * PAGE_SIZE >= layers.length}
                    isIconOnly
                    endContent={<IconChevronRight className="w-4 h-4" />}
                    onClick={() => setPage((current) => current + 1)}
                  />
                  <p className="text-center text-sm text-slate-700">
                    Página {page} de {Math.ceil(layers.length / PAGE_SIZE)} (
                    {layers.length} capas)
                  </p>
                </div>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
