"use client"

import { useEffect } from "react"

export default function MapEvents({ map, onClick, onContextMenu }) {
  useEffect(() => {
    if (!map) return

    function handleClickListener(e) {
      onClick?.(e)
    }

    function handleContextMenuListener(e) {
      const button = e.originalEvent.button
      if (button === 2) {
        e.preventDefault()
        e.stopPropagation()
        onContextMenu?.(e)
      }
    }

    map.on("click", handleClickListener)
    map.on("pointerdown", handleContextMenuListener)

    return () => {
      map.un("click", handleClickListener)
      map.un("pointerdown", handleContextMenuListener)
    }
  }, [map])

  return <></>
}
