"use client"

import { useEffect } from "react"

interface MapMarkerProps {
  map: any
  lat: number
  lng: number
  title?: string
  onClick?: () => void
}

export default function MapMarker({ map, lat, lng, title, onClick }: MapMarkerProps) {
  useEffect(() => {
    if (!map) return

    const naver = (window as any).naver
    if (!naver?.maps) return

    const marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(lat, lng),
      map,
      title,
    })

    let listener: any
    if (onClick) {
      listener = naver.maps.Event.addListener(marker, "click", onClick)
    }

    return () => {
      if (listener) {
        naver.maps.Event.removeListener(listener)
      }
      marker.setMap(null)
    }
  }, [map, lat, lng, title, onClick])

  return null
}
