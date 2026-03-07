'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ParcelMapProps {
  latitude?: number;
  longitude?: number;
  parcelNumber?: string;
  location?: string;
  area?: number;
  zoom?: number;
  height?: string;
}

// Component to recenter map when coordinates change
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

export function ParcelMap({ 
  latitude, 
  longitude, 
  parcelNumber = 'Unknown',
  location = 'Unknown Location',
  area,
  zoom = 15,
  height = '400px'
}: ParcelMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Default to Port Moresby, Papua New Guinea if no coordinates provided
  const defaultLat = -9.4438;
  const defaultLng = 147.1803;
  
  const lat = latitude ?? defaultLat;
  const lng = longitude ?? defaultLng;
  const position: [number, number] = [lat, lng];

  // Client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div 
        className="bg-slate-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-slate-500">Loading map...</p>
      </div>
    );
  }

  // Calculate approximate circle radius for parcel area (if provided)
  const areaRadius = area ? Math.sqrt(area * 10000 / Math.PI) : 100;

  return (
    <div className="relative rounded-lg overflow-hidden border-2 border-slate-200" style={{ height }}>
      <MapContainer
        center={position}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapUpdater center={position} zoom={zoom} />
        
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Terrain Map">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satellite + Labels">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <TileLayer
              attribution=''
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <Marker position={position}>
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-sm mb-1">Parcel {parcelNumber}</h3>
              <p className="text-xs text-slate-600 mb-1">{location}</p>
              {area && (
                <p className="text-xs text-slate-500">Area: {area} hectares</p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>

        {area && (
          <Circle
            center={position}
            radius={areaRadius}
            pathOptions={{
              color: '#EF5A5A',
              fillColor: '#EF5A5A',
              fillOpacity: 0.2,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">Approximate Boundary</p>
                <p className="text-slate-600">Area: {area} hectares</p>
                <p className="text-slate-500 text-xs mt-1">
                  Circular approximation
                </p>
              </div>
            </Popup>
          </Circle>
        )}
      </MapContainer>

      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg text-xs z-[1000] max-w-xs">
        <h4 className="font-bold mb-2">Map Controls</h4>
        <ul className="space-y-1 text-slate-600">
          <li>• Layer control (top right) switches views</li>
          <li>• <strong>Satellite View</strong> for aerial imagery</li>
          <li>• Click marker for details</li>
          <li>• Scroll to zoom, drag to pan</li>
        </ul>
      </div>
    </div>
  );
}
