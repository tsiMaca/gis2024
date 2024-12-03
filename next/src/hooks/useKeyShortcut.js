"use client"

import { useEffect } from "react"

function useKeyShortcut({
  shortcutId,
  key,
  ctrl = false,
  alt = false,
  shift = false,
  callback
}) {
  useEffect(() => {
    function handleKeyDown(e) {
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
  }, [shortcutId, key, ctrl, alt, shift, callback])
}

export default useKeyShortcut
