'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Map as LeafletMap } from 'leaflet'
import { Header } from '@/components/shared/header'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapProps {
  center?: [number, number]
  zoom?: number
}

interface MapTheme {
  id: string
  label: string
  emoji: string
  url: string
  attribution: string
}

interface SearchResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

// ─── Themes ───────────────────────────────────────────────────────────────────

const THEMES: MapTheme[] = [
  {
    id: 'street',
    label: 'Street',
    emoji: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    id: 'satellite',
    label: 'Satellite',
    emoji: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© <a href="https://www.esri.com">Esri</a>',
  },
  {
    id: 'dark',
    label: 'Dark',
    emoji: '🌑',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://carto.com">CARTO</a>',
  },
  {
    id: 'light',
    label: 'Light',
    emoji: '☀️',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://carto.com">CARTO</a>',
  },
  {
    id: 'topo',
    label: 'Topo',
    emoji: '⛰️',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Map({ center = [20.5937, 78.9629], zoom = 5 }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const tileLayerRef = useRef<ReturnType<typeof import('leaflet')['tileLayer']> | null>(null)
  const markerRef = useRef<ReturnType<typeof import('leaflet')['marker']> | null>(null)

  const [activeTheme, setActiveTheme] = useState<MapTheme>(THEMES[0])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Init map ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return

    import('leaflet').then((L) => {
      if (!mapRef.current) return

      // Fix marker icons
      const DefaultIcon = L.Icon.Default as unknown as {
        prototype: { _getIconUrl?: string }
        mergeOptions: (opts: object) => void
      }
      delete DefaultIcon.prototype._getIconUrl
      DefaultIcon.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, { zoomControl: false }).setView(center, zoom)

      // Position zoom control bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      const tile = L.tileLayer(THEMES[0].url, {
        attribution: THEMES[0].attribution,
        maxZoom: 19,
      }).addTo(map)

      tileLayerRef.current = tile as unknown as ReturnType<typeof import('leaflet')['tileLayer']>
      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        tileLayerRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // ── Theme switching ───────────────────────────────────────────────────────

  const handleThemeChange = useCallback(async (theme: MapTheme) => {
    setActiveTheme(theme)
    const map = mapInstanceRef.current
    if (!map) return

    const L = await import('leaflet')

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current as unknown as import('leaflet').Layer)
    }

    const newTile = L.tileLayer(theme.url, {
      attribution: theme.attribution,
      maxZoom: 19,
    }).addTo(map)

    tileLayerRef.current = newTile as unknown as ReturnType<typeof import('leaflet')['tileLayer']>
  }, [])

  // ── Geocoding search (Nominatim - free, no key) ───────────────────────────

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 3) {
      setResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data: SearchResult[] = await res.json()
        setResults(data)
        setShowDropdown(true)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)
  }, [])

  const handleSelect = useCallback(async (result: SearchResult) => {
    const map = mapInstanceRef.current
    if (!map) return

    const L = await import('leaflet')
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)

    map.flyTo([lat, lng], 13, { animate: true, duration: 1.2 })

    if (markerRef.current) {
      map.removeLayer(markerRef.current as unknown as import('leaflet').Layer)
    }

    const marker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(result.display_name)
      .openPopup()

    markerRef.current = marker as unknown as ReturnType<typeof import('leaflet')['marker']>

    setQuery(result.display_name)
    setShowDropdown(false)
    setResults([])
  }, [])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Header
        query={query}
        onSearch={handleSearch}
        results={results}
        isSearching={isSearching}
        showDropdown={showDropdown}
        onSelect={handleSelect}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        themes={THEMES}
        activeTheme={activeTheme}
        onThemeChange={handleThemeChange}
      />

      <div
        ref={mapRef}
        className="h-screen w-full"
      />
    </>
  )
}