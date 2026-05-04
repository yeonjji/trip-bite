"use client"

import { useEffect, useRef, useState } from "react"

export interface MapStop {
  name: string
  type: string
  lat: number
  lng: number
  address?: string | null
  distanceFromPreviousKm?: number | null
}

const TYPE_LABEL: Record<string, string> = {
  travel: "여행지",
  restaurant: "맛집",
  festival: "축제",
  camping: "숙박",
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export default function CourseRouteMap({ stops }: { stops: MapStop[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!containerRef.current || stops.length === 0) return
    setIsLoaded(false)

    const container = containerRef.current

    const init = () => {
      const naver = (window as any).naver
      if (!naver?.maps || !container) return

      const avgLat = stops.reduce((s, p) => s + p.lat, 0) / stops.length
      const avgLng = stops.reduce((s, p) => s + p.lng, 0) / stops.length

      const map = new naver.maps.Map(container, {
        center: new naver.maps.LatLng(avgLat, avgLng),
        zoom: 12,
        mapTypeControl: false,
      })

      const markers: any[] = []
      const iws: any[] = []

      stops.forEach((stop, i) => {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(stop.lat, stop.lng),
          map,
          icon: {
            content: `<div style="width:30px;height:30px;background:#D84315;border:2.5px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;box-shadow:0 2px 8px rgba(216,67,21,.4);cursor:pointer">${i + 1}</div>`,
            anchor: new naver.maps.Point(15, 15),
          },
        })

        const addrHtml = stop.address
          ? `<p style="color:#9ca3af;margin:0 0 3px;font-size:11px;line-height:1.4">${esc(stop.address)}</p>`
          : ""
        const distHtml =
          stop.distanceFromPreviousKm != null
            ? `<p style="color:#6b7280;margin:0;font-size:11px">이전 장소에서 ${stop.distanceFromPreviousKm}km</p>`
            : ""

        const iw = new naver.maps.InfoWindow({
          content: `<div style="padding:10px 14px;min-width:170px;max-width:220px;font-family:-apple-system,sans-serif"><div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><span style="background:#FFF3EF;color:#D84315;padding:2px 8px;border-radius:99px;font-weight:600;font-size:11px">${TYPE_LABEL[stop.type] ?? stop.type}</span><span style="color:#9ca3af;font-size:11px">${i + 1}번째</span></div><p style="font-weight:700;color:#1B1C1A;margin:0 0 3px;font-size:13px">${esc(stop.name)}</p>${addrHtml}${distHtml}</div>`,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          backgroundColor: "#fff",
          anchorSize: new naver.maps.Size(10, 10),
          pixelOffset: new naver.maps.Point(0, -5),
        })

        markers.push(marker)
        iws.push(iw)
      })

      markers.forEach((marker, i) => {
        naver.maps.Event.addListener(marker, "click", () => {
          iws.forEach((iw, j) => { if (j !== i) iw.close() })
          if (iws[i].getMap()) iws[i].close()
          else iws[i].open(map, marker)
        })
      })

      if (stops.length > 1) {
        new naver.maps.Polyline({
          path: stops.map((s) => new naver.maps.LatLng(s.lat, s.lng)),
          map,
          strokeColor: "#D84315",
          strokeOpacity: 0.65,
          strokeWeight: 2.5,
          strokeStyle: "shortdash",
        })

        const lats = stops.map((s) => s.lat)
        const lngs = stops.map((s) => s.lng)
        map.fitBounds(
          new naver.maps.LatLngBounds(
            new naver.maps.LatLng(Math.min(...lats), Math.min(...lngs)),
            new naver.maps.LatLng(Math.max(...lats), Math.max(...lngs))
          ),
          { padding: 60 }
        )
      }

      setIsLoaded(true)
    }

    const scriptId = "naver-map-script"

    if ((window as any).naver?.maps) {
      init()
      return
    }

    const existing = document.getElementById(scriptId)
    if (existing) {
      existing.addEventListener("load", init)
      return () => existing.removeEventListener("load", init)
    }

    const script = document.createElement("script")
    script.id = scriptId
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`
    script.async = true
    script.onload = init
    document.head.appendChild(script)
  }, [stops])

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-xl">
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[#FAFAF8]">
          <p className="text-sm text-gray-400">지도를 불러오는 중…</p>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
