"use client"

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner
} from "@nextui-org/react"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { useEffect, useState } from "react"

const PAGE_SIZE = 5

export default function SelectionResults({
  isOpen,
  onOpenChange,
  layers,
  stringifiedPolygon
}) {
  const [results, setResults] = useState({})
  const [layerResultPages, setLayerResultPages] = useState({})
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    if (!layers.length) return
    const newLayerResultPages = {}
    layers.forEach((layer) => {
      newLayerResultPages[layer.getProperties().title] = 1
    })
    setLayerResultPages(newLayerResultPages)
  }, [layers])

  useEffect(() => {
    if (!layers.length || !stringifiedPolygon) return
    if (!isOpen) {
      setResults([])
      setIsFetching(false)
      return
    }

    async function fetchData(currentResults) {
      const allResults = currentResults || {}
      console.log(allResults)
      for (let layer of layers) {
        const layerName = layer.getProperties().title
        const page = layerResultPages[layerName] || 1

        if (currentResults[layerName] && currentResults[layerName][page]) {
          continue
        }

        if (
          currentResults[layerName] &&
          currentResults[layerName].total === 0
        ) {
          allResults[layerName] = {
            [page]: [],
            total: 0
          }
          continue
        }

        const response = await fetch(
          `/api/wtk?layer=${
            layer.getProperties().title
          }&polygon=${stringifiedPolygon}&page=${page}&count=${PAGE_SIZE}`
        )
        const data = await response.json()
        const total = page === 1 ? data.total : allResults[layerName].total
        const currentPages = allResults[layer.getProperties().title] || {}
        allResults[layer.getProperties().title] = {
          ...currentPages,
          [page]: data.results,
          total
        }
      }
      return allResults
    }

    setIsFetching(true)
    fetchData(results)
      .then((allResults) => {
        setResults(allResults)
      })
      .catch((error) => {
        console.error(error)
      })
      .finally(() => setIsFetching(false))
  }, [isOpen, layers, stringifiedPolygon, layerResultPages])

  function nextPage(layerName) {
    setLayerResultPages((prev) => ({
      ...prev,
      [layerName]: (prev[layerName] || 1) + 1
    }))
  }

  function prevPage(layerName) {
    setLayerResultPages((prev) => ({
      ...prev,
      [layerName]: Math.max((prev[layerName] || 1) - 1, 1)
    }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      style={{ height: "80vh" }}
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Resultados de la selección
            </ModalHeader>
            <ModalBody>
              <>
                {Object.keys(results)
                  .filter((key) => results[key] && results[key].total > 0)
                  .map((key) => {
                    const currentPage = layerResultPages[key] || 1
                    const totalPages = Math.ceil(
                      results[key]?.total / PAGE_SIZE
                    )
                    const total = results[key]?.total || 0
                    return (
                      <div
                        key={key}
                        className="border border-gray-100 w-full p-2"
                      >
                        <div>
                          <p className="text-slate-700 text-sm uppercase mb-2 px-2">
                            <span className="mr-2">{key}</span>
                            <span className="text-xs text-gray-500">
                              {total}
                            </span>
                            <span className="text-xs text-gray-500">
                              {" "}
                              ({currentPage}/{totalPages})
                            </span>
                          </p>
                          <section className="h-44 mb-4">
                            {Boolean(results[key][currentPage]) && (
                              <>
                                {results[key][currentPage].map((result) => (
                                  <button
                                    key={result.gid}
                                    className="block text-slate-700 text-xs truncate transition-colors hover:bg-gray-100 active:bg-gray-200 w-full p-2"
                                  >
                                    {JSON.stringify(result)}
                                  </button>
                                ))}
                              </>
                            )}
                          </section>
                        </div>
                        <section className="flex justify-center gap-2">
                          <Button
                            color="default"
                            variant="flat"
                            size="sm"
                            isDisabled={currentPage === 1}
                            isIconOnly
                            startContent={
                              <IconChevronLeft className="w-4 h-4" />
                            }
                            onPress={() => prevPage(key)}
                          />
                          <Button
                            color="default"
                            variant="flat"
                            size="sm"
                            isDisabled={
                              !results[key] ||
                              currentPage * PAGE_SIZE >= total ||
                              isFetching
                            }
                            isIconOnly
                            startContent={
                              <IconChevronRight className="w-4 h-4" />
                            }
                            onPress={() => nextPage(key)}
                          />
                        </section>
                      </div>
                    )
                  })}
              </>
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
