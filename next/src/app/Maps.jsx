"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"

export default function Maps() {
  const OpenLayersMap = useMemo(
    () =>
      dynamic(() => import("./OpenLayersMap"), {
        ssr: false
      }),
    []
  )

  return (
    <div className="h-screen">
      <OpenLayersMap />
    </div>
  )
}
