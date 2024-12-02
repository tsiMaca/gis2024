"use client"

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress
} from "@nextui-org/react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconReload
} from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import { getLayers } from "../services/getlayers"
import { MAX_LAYERS } from "../constants/layers-limits"

export default function AddLayer({
  isOpen,
  currentLayers,
  onOpenChange,
  onAddLayer
}) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [layers, setLayers] = useState([])
  const [filteredLayers, setFilteredLayers] = useState([])

  const inputRef = useRef(null)

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
    if (isOpen && layers.length === 0 && currentLayers.length <= MAX_LAYERS) {
      setLoading(true)
      getLayers()
        .then((layerNames) => {
          // layerNames.forEach((layerName) =>
          //   console.log("Layer name:", layerName)
          // )
          setLayers(
            layerNames
              .filter((layerName) => !layerName.startsWith("custom_"))
              .map((nombre) => ({ nombre }))
          )
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  useEffect(() => {
    if (search) {
      setFilteredLayers(
        layers.filter((layer) =>
          layer.nombre.toLowerCase().includes(search.toLowerCase())
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
    <Modal className="h-[594px]" isOpen={isOpen} onOpenChange={onOpenChange}>
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
                          <Button
                            color="primary"
                            variant="flat"
                            isIconOnly
                            startContent={<IconReload className="w-4 h-4" />}
                            onClick={() => {
                              setLoading(true)
                              getLayers()
                                .then((layerNames) => {
                                  setLayers(
                                    layerNames.map((nombre) => ({ nombre }))
                                  )
                                })
                                .finally(() => setLoading(false))
                            }}
                          />
                        </div>
                        <div className="border border-gray-100 rounded-md mb-4 p-2">
                          {layers
                            .filter((layer) =>
                              search
                                ? layer.nombre
                                    .toLowerCase()
                                    .includes(search.toLowerCase())
                                : true
                            )
                            .slice((page - 1) * 10, page * 10)
                            .map((layer) => (
                              <button
                                key={layer.nombre}
                                className="block rounded-lg text-slate-700 text-sm text-left transition-colors hover:bg-gray-100 active:bg-gray-200 w-full p-2"
                                onClick={() => {
                                  onAddLayer(layer.nombre)
                                  onClose()
                                }}
                              >
                                {layer.nombre}
                              </button>
                            ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            </ModalBody>
            <ModalFooter className="flex items-center justify-center w-full">
              <Button
                isDisabled={page === 1}
                isIconOnly
                startContent={<IconChevronLeft className="w-4 h-4" />}
                onClick={() => setPage((current) => current - 1)}
              />
              <Button
                isDisabled={page * 10 >= layers.length}
                isIconOnly
                endContent={<IconChevronRight className="w-4 h-4" />}
                onClick={() => setPage((current) => current + 1)}
              />
              <p className="text-center text-sm text-slate-700">
                Página {page} de {Math.ceil(layers.length / 10)}
              </p>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
