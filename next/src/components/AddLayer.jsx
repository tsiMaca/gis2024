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
import { useState } from "react"
import { ALL_LAYERS } from "../data/layers"

export default function AddLayer({ isOpen, onOpenChange, onAddLayer }) {
  const [page, setPage] = useState(1)

  return (
    <Modal
      style={{
        height: "504px"
      }}
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
              <div className="border border-gray-100 rounded-md mb-4">
                <Listbox
                  aria-label="Layers"
                  onAction={(key) => {
                    onAddLayer(key)
                    onClose()
                  }}
                >
                  {ALL_LAYERS.slice((page - 1) * 10, page * 10).map((layer) => (
                    <ListboxItem key={layer.nombre}>{layer.nombre}</ListboxItem>
                  ))}
                </Listbox>
              </div>
            </ModalBody>
            <ModalFooter className="flex justify-center w-full">
              <Button
                isDisabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                <svg
                  className="text-slate-400 w-4 h-4"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M15 6l-6 6l6 6" />
                </svg>
              </Button>
              <Button
                isDisabled={page * 10 >= ALL_LAYERS.length}
                onClick={() => setPage((current) => current + 1)}
              >
                <svg
                  className="text-slate-400 w-4 h-4"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
