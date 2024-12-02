import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader
} from "@nextui-org/react"
import { useState } from "react"
import { alertmessage } from "../utils/alerts"

export default function AddFeature({
  isOpen,
  layerName,
  type,
  coordinates,
  onOpenChange,
  onSuccess
}) {
  const [data, setData] = useState({ nombre: "", detalle: "", autor: "" })
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    try {
      const body = {
        layerName,
        data,
        type,
        coordinates
      }
      await fetch("/api/db/addfeature", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json"
        }
      })
      alertmessage("Elemento agregado correctamente ✔️", "success")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      alertmessage("Error al agregar el elemento ❌", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Agregar nuevo elemento
          </ModalHeader>
          <ModalBody>
            {coordinates.length > 0 ? (
              <>
                <div className="grid grid-cols-2 items-center gap-2">
                  <p className="text-slate-700 text-sm">Nombre</p>
                  <Input
                    placeholder="Nombre"
                    isDisabled={loading}
                    value={data.nombre}
                    onChange={(e) =>
                      setData({ ...data, nombre: e.target.value })
                    }
                  />
                  <p className="text-slate-700 text-sm">Detalle</p>
                  <Input
                    placeholder="Detalle"
                    isDisabled={loading}
                    value={data.detalle}
                    onChange={(e) =>
                      setData({ ...data, detalle: e.target.value })
                    }
                  />
                  <p className="text-slate-700 text-sm">Autor</p>
                  <Input
                    placeholder="Autor"
                    isDisabled={loading}
                    value={data.autor}
                    onChange={(e) =>
                      setData({ ...data, autor: e.target.value })
                    }
                  />
                </div>
              </>
            ) : (
              <p className="text-center text-slate-700">
                No se han seleccionado coordenadas
              </p>
            )}
          </ModalBody>
          <ModalFooter className="flex gap-2 w-full">
            {coordinates.length > 0 && (
              <>
                <Button
                  className="w-1/2"
                  color="default"
                  variant="flat"
                  isDisabled={loading}
                  onPress={() => {
                    if (!loading) {
                      onOpenChange(false)
                    }
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="w-1/2"
                  color="primary"
                  isDisabled={loading}
                  isLoading={loading}
                  onClick={() => {
                    if (!data.nombre) {
                      alertmessage("Completar todos los campos ❌", "error")
                      return
                    }
                    submit()
                  }}
                >
                  {loading ? "Agregando..." : "Agregar"}
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
