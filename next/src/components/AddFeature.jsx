import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader
} from "@nextui-org/react"
import { IconArrowsShuffle, IconClearAll } from "@tabler/icons-react"
import { Fragment, useEffect, useState } from "react"
import { alertmessage } from "../utils/alerts"
import DelayedInput from "./DelayedInput"
import proj from "ol/proj"
import { randomString } from "../utils/random"

export default function AddFeature({
  isOpen,
  layerName,
  type,
  coordinates,
  featureList,
  onOpenChange,
  onSuccess
}) {
  const [loading, setLoading] = useState(false)
  const [fields, setFields] = useState([])

  useEffect(() => {
    if (!isOpen || !layerName || !featureList?.length) {
      setFields([])
      return
    }
    const feature = featureList.find((f) => f.title === layerName)
    if (!feature) {
      return
    }
    setFields(
      feature.fields.map(({ name, type }) => ({ name, type, value: "" }))
    )
  }, [isOpen, featureList, layerName])

  async function submit() {
    const coordsAs4326 = coordinates.map((coord) =>
      proj.transform(coord, "EPSG:3857", "EPSG:4326")
    )
    console.log("coordsAs4326:", coordsAs4326)
    setLoading(true)
    try {
      const body = {
        layerName,
        data: fields.reduce((acc, field) => {
          acc[field.name] = field.value
          return acc
        }, {}),
        type,
        coordinates: coordsAs4326
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
      <Modal size="2xl" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Agregar nuevo elemento
          </ModalHeader>
          <ModalBody>
            {coordinates.length > 0 ? (
              <>
                <div className="grid grid-cols-6 items-center gap-2">
                  {fields.map((field) => (
                    <Fragment key={field.name}>
                      <p className="text-slate-700 text-sm">{field.name}</p>
                      <DelayedInput
                        placeholder="..."
                        isDisabled={loading}
                        value={field.value}
                        onChange={(e) =>
                          setFields((prev) =>
                            prev.map((f) =>
                              f.name === field.name
                                ? { ...f, value: e.target.value }
                                : f
                            )
                          )
                        }
                      />
                    </Fragment>
                  ))}
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
                  color="default"
                  variant="flat"
                  isDisabled={loading}
                  startContent={<IconArrowsShuffle className="w-4 h-4" />}
                  onPress={() => {
                    setFields(randomize(fields))
                  }}
                >
                  Random
                </Button>
                <Button
                  className="w-1/2"
                  color="default"
                  variant="flat"
                  isDisabled={loading}
                  startContent={<IconClearAll className="w-4 h-4" />}
                  onPress={() => {
                    setFields(fields.map((field) => ({ ...field, value: "" })))
                  }}
                >
                  Limpiar
                </Button>
                <Button
                  className="w-1/2"
                  color="primary"
                  isDisabled={loading}
                  isLoading={loading}
                  onClick={() => {
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

function randomize(fields) {
  return fields.map((field) => {
    if (field.type === "decimal") {
      return { ...field, value: Math.round(Math.random() * 100) }
    }
    if (field.type === "string") {
      return { ...field, value: randomString(4) }
    }
    if (field.type === "boolean") {
      return { ...field, value: Math.random() > 0.5 }
    }
    return field
  })
}
