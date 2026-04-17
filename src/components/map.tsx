'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Map as LeafletMap } from 'leaflet'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapProps {
  center?: [number, number]
  zoom?: number
}

interface MapTheme {
  id: string
  label: string
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
    label: '🗺️ Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    id: 'satellite',
    label: '🛰️ Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© <a href="https://www.esri.com">Esri</a>',
  },
  {
    id: 'dark',
    label: '🌑 Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://carto.com">CARTO</a>',
  },
  {
    id: 'light',
    label: '☀️ Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://carto.com">CARTO</a>',
  },
  {
    id: 'topo',
    label: '⛰️ Topo',
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

      const map = L.map(mapRef.current, { zoomControl: true }).setView(center, zoom)

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>

      {/* ── Controls bar ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
      }}>

        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="Search any place..."
            style={{
              width: '100%',
              padding: '8px 36px 8px 12px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '14px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          {/* Search icon / spinner */}
          <span style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '16px',
            pointerEvents: 'none',
          }}>
            {isSearching ? '⏳' : '🔍'}
          </span>

          {/* Dropdown */}
          {showDropdown && results.length > 0 && (
            <ul style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              listStyle: 'none',
              margin: 0,
              padding: '4px 0',
              zIndex: 9999,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              maxHeight: '220px',
              overflowY: 'auto',
            }}>
              {results.map((r) => (
                <li
                  key={r.place_id}
                  onClick={() => handleSelect(r)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    color: '#333',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  📍 {r.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Theme buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeTheme.id === theme.id ? '#2563eb' : '#ddd',
                background: activeTheme.id === theme.id ? '#2563eb' : '#fff',
                color: activeTheme.id === theme.id ? '#fff' : '#444',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: activeTheme.id === theme.id ? 600 : 400,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Map ── */}
      <div
        ref={mapRef}
        style={{
          height: 'clamp(500px, 100vh, 700px)', // responsive height
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
        }}
      />
    </div>
  )
}