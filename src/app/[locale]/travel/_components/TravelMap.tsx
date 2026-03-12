"use client"

import { useRef, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface TravelMapProps {
  lat: number
  lng: number
  title?: string
}

export default function TravelMap({ lat, lng, title }: TravelMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    const scriptId = "naver-map-script"

    const initMap = () => {
      if (!mapRef.current) return
      const naver = (window as any).naver
      if (!naver?.maps) return

      const center = new naver.maps.LatLng(lat, lng)

      mapInstanceRef.current = new naver.maps.Map(mapRef.current, {
        center,
        zoom: 15,
      })

      markerRef.current = new naver.maps.Marker({
        position: center,
        map: mapInstanceRef.current,
        title,
      })
    }

    if ((window as any).naver?.maps) {
      initMap()
      return
    }

    if (document.getElementById(scriptId)) {
      const existing = document.getElementById(scriptId)
      existing?.addEventListener("load", initMap)
      return () => existing?.removeEventListener("load", initMap)
    }

    const script = document.createElement("script")
    script.id = scriptId
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_KEY}`
    script.async = true
    script.onload = initMap
    document.head.appendChild(script)
  }, [lat, lng, title])

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl">
      <Skeleton className="absolute inset-0 z-10 rounded-xl" />
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}
