'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RotateCcw
} from 'lucide-react'

interface BodyZone {
  id: string
  name: string
  front: boolean
  x: number
  y: number
  width: number
  height: number
}

interface SelectedZone {
  zoneId: string
  intensity: number
}

const BODY_ZONES: BodyZone[] = [
  { id: 'head', name: 'Head', front: true, x: 140, y: 30, width: 40, height: 40 },
  { id: 'neck', name: 'Neck', front: true, x: 145, y: 70, width: 30, height: 20 },
  { id: 'shoulders', name: 'Shoulders', front: true, x: 110, y: 90, width: 100, height: 20 },
  { id: 'chest', name: 'Chest', front: true, x: 120, y: 110, width: 80, height: 60 },
  { id: 'abdomen', name: 'Abdomen', front: true, x: 120, y: 170, width: 80, height: 70 },
  { id: 'pelvis', name: 'Pelvis', front: true, x: 130, y: 240, width: 60, height: 40 },
  { id: 'left-arm', name: 'Left Arm', front: true, x: 80, y: 90, width: 30, height: 100 },
  { id: 'right-arm', name: 'Right Arm', front: true, x: 220, y: 90, width: 30, height: 100 },
  { id: 'left-forearm', name: 'Left Forearm', front: true, x: 60, y: 190, width: 20, height: 70 },
  { id: 'right-forearm', name: 'Right Forearm', front: true, x: 240, y: 190, width: 20, height: 70 },
  { id: 'left-thigh', name: 'Left Thigh', front: true, x: 110, y: 280, width: 30, height: 100 },
  { id: 'right-thigh', name: 'Right Thigh', front: true, x: 190, y: 280, width: 30, height: 100 },
  { id: 'left-lower-leg', name: 'Left Lower Leg', front: true, x: 115, y: 380, width: 20, height: 80 },
  { id: 'right-lower-leg', name: 'Right Lower Leg', front: true, x: 185, y: 380, width: 20, height: 80 },
  { id: 'back-head', name: 'Head', front: false, x: 140, y: 30, width: 40, height: 40 },
  { id: 'back-neck', name: 'Neck', front: false, x: 145, y: 70, width: 30, height: 20 },
  { id: 'back-shoulders', name: 'Shoulders', front: false, x: 110, y: 90, width: 100, height: 20 },
  { id: 'upper-back', name: 'Upper Back', front: false, x: 120, y: 110, width: 80, height: 60 },
  { id: 'lower-back', name: 'Lower Back', front: false, x: 120, y: 170, width: 80, height: 70 },
  { id: 'back-pelvis', name: 'Pelvis', front: false, x: 130, y: 240, width: 60, height: 40 },
  { id: 'back-left-arm', name: 'Left Arm', front: false, x: 80, y: 90, width: 30, height: 100 },
  { id: 'back-right-arm', name: 'Right Arm', front: false, x: 220, y: 90, width: 30, height: 100 },
  { id: 'back-left-forearm', name: 'Left Forearm', front: false, x: 60, y: 190, width: 20, height: 70 },
  { id: 'back-right-forearm', name: 'Right Forearm', front: false, x: 240, y: 190, width: 20, height: 70 },
  { id: 'back-left-thigh', name: 'Left Thigh', front: false, x: 110, y: 280, width: 30, height: 100 },
  { id: 'back-right-thigh', name: 'Right Thigh', front: false, x: 190, y: 280, width: 30, height: 100 },
  { id: 'back-left-lower-leg', name: 'Left Lower Leg', front: false, x: 115, y: 380, width: 20, height: 80 },
  { id: 'back-right-lower-leg', name: 'Right Lower Leg', front: false, x: 185, y: 380, width: 20, height: 80 },
]

export default function BodyMap() {
  const [selectedZones, setSelectedZones] = useState<SelectedZone[]>([])
  const [showFront, setShowFront] = useState(true)
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)

  const toggleView = () => {
    setShowFront(!showFront)
    setHoveredZone(null)
  }

  const handleZoneClick = (zoneId: string) => {
    const existingZone = selectedZones.find(zone => zone.zoneId === zoneId)
    
    if (existingZone) {
      // Remove zone if already selected
      setSelectedZones(selectedZones.filter(zone => zone.zoneId !== zoneId))
    } else {
      // Add new zone with default intensity
      setSelectedZones([...selectedZones, { zoneId, intensity: 5 }])
    }
  }

  const handleIntensityChange = (zoneId: string, intensity: number) => {
    setSelectedZones(selectedZones.map(zone => 
      zone.zoneId === zoneId ? { ...zone, intensity } : zone
    ))
  }

  const clearSelection = () => {
    setSelectedZones([])
    setHoveredZone(null)
  }

  const getZoneIntensity = (zoneId: string) => {
    const zone = selectedZones.find(zone => zone.zoneId === zoneId)
    return zone ? zone.intensity : 0
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'fill-gray-100 stroke-gray-300'
    if (intensity <= 2) return 'fill-blue-100 stroke-blue-300'
    if (intensity <= 4) return 'fill-green-100 stroke-green-300'
    if (intensity <= 6) return 'fill-yellow-100 stroke-yellow-300'
    if (intensity <= 8) return 'fill-orange-100 stroke-orange-300'
    return 'fill-red-100 stroke-red-300'
  }

  const currentZones = BODY_ZONES.filter(zone => zone.front === showFront)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Body Map</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleView}
            >
              {showFront ? 'Show Back' : 'Show Front'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearSelection}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-full max-w-md">
            <svg 
              width="320" 
              height="480" 
              viewBox="0 0 320 480" 
              className="w-full h-auto border rounded-lg bg-gray-50"
            >
              {currentZones.map((zone) => {
                const intensity = getZoneIntensity(zone.id)
                const isSelected = intensity > 0
                
                return (
                  <g key={zone.id}>
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.width}
                      height={zone.height}
                      className={`
                        cursor-pointer transition-all duration-200
                        ${isSelected ? getIntensityColor(intensity) : 'fill-gray-100 stroke-gray-300'}
                        ${hoveredZone === zone.id ? 'stroke-2' : 'stroke-1'}
                      `}
                      onClick={() => handleZoneClick(zone.id)}
                      onMouseEnter={() => setHoveredZone(zone.id)}
                      onMouseLeave={() => setHoveredZone(null)}
                      strokeDasharray={isSelected ? '0' : '4,4'}
                    />
                    {isSelected && (
                      <text
                        x={zone.x + zone.width / 2}
                        y={zone.y + zone.height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-bold fill-gray-700 pointer-events-none"
                      >
                        {intensity}
                      </text>
                    )}
                  </g>
                )
              })}
              
              {/* Body outline */}
              <path
                d="M160 30 Q180 40 180 60 Q180 80 160 90 Q140 80 140 60 Q140 40 160 30 Z
                   M140 90 L140 240 L180 240 L180 90 Z
                   M120 110 L120 170 L200 170 L200 110 Z
                   M110 240 L110 280 L130 280 L130 240 Z
                   M190 240 L190 280 L210 280 L210 240 Z
                   M110 280 L110 380 L130 380 L130 280 Z
                   M190 280 L190 380 L210 380 L210 280 Z
                   M115 380 L115 460 L125 460 L125 380 Z
                   M195 380 L195 460 L205 460 L205 380 Z"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
              />
            </svg>
          </div>

          {selectedZones.length > 0 && (
            <div className="w-full max-w-md">
              <h3 className="font-medium mb-2">Selected Areas:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedZones.map(({ zoneId, intensity }) => {
                  const zone = BODY_ZONES.find(z => z.id === zoneId)
                  return (
                    <div key={zoneId} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-sm">{zone?.name}</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={intensity}
                        onChange={(e) => handleIntensityChange(zoneId, parseInt(e.target.value))}
                        className="w-16"
                      />
                      <Badge variant="secondary">{intensity}</Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500 text-center">
            Click on body areas to select them. Adjust pain intensity using sliders.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}