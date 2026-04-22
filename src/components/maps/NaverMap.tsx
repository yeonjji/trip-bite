"use client"

import { useEffect, useRef } from "react"

import { Skeleton } from "@/components/ui/skeleton"

interface NaverMapProps {
  lat: number
  lng: number
  zoom?: number
  className?: string
  children?: React.ReactNode
  showMarker?: boolean
}

export default function NaverMap({
  lat,
  lng,
  zoom = 15,
  className,
  children,
  showMarker = false,
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const isLoadedRef = useRef(false)

  useEffect(() => {
    const scriptId = "naver-map-script"

    const initMap = () => {
      if (!mapRef.current) return
      const naver = (window as any).naver
      if (!naver?.maps) return

      mapInstanceRef.current = new naver.maps.Map(mapRef.current, {
        center: new naver.maps.LatLng(lat, lng),
        zoom,
      })
      if (showMarker) {
        new naver.maps.Marker({
          position: new naver.maps.LatLng(lat, lng),
          map: mapInstanceRef.current,
        })
      }
      isLoadedRef.current = true
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
  }, [lat, lng, zoom, showMarker])

  useEffect(() => {
    if (!isLoadedRef.current || !mapInstanceRef.current) return
    const naver = (window as any).naver
    if (!naver?.maps) return
    mapInstanceRef.current.setCenter(new naver.maps.LatLng(lat, lng))
  }, [lat, lng])

  return (
    <div className={className}>
      {!isLoadedRef.current && (
        <Skeleton className="absolute inset-0 z-10 rounded-md" />
      )}
      <div ref={mapRef} id="naver-map" className="h-full w-full" />
      {children}
    </div>
  )
}
