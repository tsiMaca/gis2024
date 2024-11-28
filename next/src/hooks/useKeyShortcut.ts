"use client"

import { useEffect } from "react"

interface Props {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  callback: () => void
}

function useKeyShortcut({
  key,
  ctrl = false,
  alt = false,
  shift = false,
  callback
}: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === key &&
        e.ctrlKey === ctrl &&
        e.altKey === alt &&
        e.shiftKey === shift
      ) {
        e.preventDefault()
        e.stopPropagation()
        callback()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [key, ctrl, alt, shift, callback])
}

export default useKeyShortcut
