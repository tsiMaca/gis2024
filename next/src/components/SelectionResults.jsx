"use client"

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner
} from "@nextui-org/react"
import { useEffect, useState } from "react"

export default function SelectionResults({
  isOpen,
  onOpenChange,
  layers,
  stringifiedPolygon
}) {
  const [results, setResults] = useState([])
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    if (!layers.length || !stringifiedPolygon) return

    if (isOpen) {
      setIsFetching(true)
      const layerName = layers
        .find((layer) => layer.getProperties().visible)
        ?.getProperties().title
      if (!layerName) return
      fetch(`/api/wtk?layer=${layerName}&polygon=${stringifiedPolygon}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results))
        .finally(() => {
          setIsFetching(false)
        })
    } else {
      setResults([])
      setIsFetching(false)
    }
  }, [isOpen, layers, stringifiedPolygon])

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Resultados de la selección
            </ModalHeader>
            <ModalBody>
              {isFetching ? (
                <Spinner size="large" />
              ) : (
                <>
                  {results.length ? (
                    <>
                      {results.slice(0, 25).map((result) => (
                        <div key={result.gid}>
                          <p className="text-slate-700 text-xs truncate">
                            {JSON.stringify(result)}
                          </p>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p>No hay resultados</p>
                  )}
                </>
              )}
            </ModalBody>
            <ModalFooter className="flex justify-center">
              <Button color="default" onPress={onClose}>
                Cerrar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
