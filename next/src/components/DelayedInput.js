"use client"

import { Input } from "@nextui-org/react"
import { useEffect, useState } from "react"
import useDebounce from "../hooks/useDebounce"

export default function DelayedInput({
  delayms = 900,
  value,
  onValueChange,
  ...rest
}) {
  const [input, setInput] = useState(value ?? "")
  const { debouncedValue } = useDebounce(input, delayms)

  useEffect(() => {
    setInput(value ?? "")
  }, [value])

  useEffect(() => {
    if (value === debouncedValue) return
    onValueChange?.(debouncedValue)
  }, [debouncedValue])

  return (
    <Input
      color="default"
      variant="flat"
      placeholder="Alias del campo"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      {...rest}
    />
  )
}
