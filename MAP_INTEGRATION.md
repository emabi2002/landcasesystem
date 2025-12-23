# How to Add Maps to Your Pages

## Quick Start

The `ParcelMap` component is ready to use! Here's how to add it to any page:

### 1. Import the Component

```tsx
import { ParcelMap } from '@/components/maps/ParcelMap';
```

### 2. Use in Your Page

```tsx
<ParcelMap
  latitude={-9.4438}
  longitude={147.1803}
  parcelNumber="SEC123-ALL456"
  location="Port Moresby, NCD"
  area={2.5}
  zoom={15}
  height="500px"
/>
```

## Complete Examples

### Example 1: Land Parcel Detail Page

```tsx
'use client';

import { ParcelMap } from '@/components/maps/ParcelMap';

export default function ParcelDetailPage({ parcel }: { parcel: LandParcel }) {
  // Extract coordinates from database
  const latitude = parcel.coordinates?.latitude;
  const longitude = parcel.coordinates?.longitude;
  
  return (
    <div>
      <h1>Parcel {parcel.parcel_number}</h1>
      
      <ParcelMap
        latitude={latitude}
        longitude={longitude}
        parcelNumber={parcel.parcel_number}
        location={parcel.location}
        area={parcel.area}
        zoom={16}
        height="600px"
      />
    </div>
  );
}
```

### Example 2: Edit Land Parcel Dialog

Add map preview to the edit dialog:

```tsx
import { useState } from 'react';
import { ParcelMap } from '@/components/maps/ParcelMap';

export function EditLandParcelDialog({ parcel }: { parcel: LandParcel }) {
  const [latitude, setLatitude] = useState(parcel.coordinates?.latitude);
  const [longitude, setLongitude] = useState(parcel.coordinates?.longitude);
  
  return (
    <div>
      {/* Form fields */}
      <Input 
        value={latitude} 
        onChange={(e) => setLatitude(parseFloat(e.target.value))}
      />
      <Input 
        value={longitude} 
        onChange={(e) => setLongitude(parseFloat(e.target.value))}
      />
      
      {/* Map Preview */}
      <ParcelMap
        latitude={latitude}
        longitude={longitude}
        parcelNumber={parcel.parcel_number}
        height="300px"
      />
    </div>
  );
}
```

### Example 3: Land Parcels List Page

Show maps in cards:

```tsx
{parcels.map(parcel => (
  <Card key={parcel.id}>
    <CardHeader>
      <CardTitle>Parcel {parcel.parcel_number}</CardTitle>
    </CardHeader>
    <CardContent>
      <ParcelMap
        latitude={parcel.coordinates?.latitude}
        longitude={parcel.coordinates?.longitude}
        parcelNumber={parcel.parcel_number}
        location={parcel.location}
        height="250px"
        zoom={14}
      />
    </CardContent>
  </Card>
))}
```

## Component Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `latitude` | number | No | -9.4438 | GPS latitude coordinate |
| `longitude` | number | No | 147.1803 | GPS longitude coordinate |
| `parcelNumber` | string | No | 'Unknown' | Parcel identifier |
| `location` | string | No | 'Unknown Location' | Location description |
| `area` | number | No | - | Parcel area in hectares |
| `zoom` | number | No | 15 | Initial zoom level (1-19) |
| `height` | string | No | '400px' | Map container height |

## Available Map Views

Users can switch between these views using the layer control:

1. **Street Map** (default) - OpenStreetMap
2. **Satellite View** - ESRI World Imagery
3. **Terrain Map** - ESRI World Topo
4. **Satellite + Labels** - Hybrid view

## Tips

### Getting Coordinates

To get GPS coordinates for parcels:

1. **From Google Maps**:
   - Right-click on location → "What's here?"
   - Coordinates appear at bottom
   - Copy both numbers

2. **From Database**:
   ```tsx
   const { latitude, longitude } = parcel.coordinates;
   ```

3. **From Form Input**:
   ```tsx
   const lat = parseFloat(formData.latitude);
   const lng = parseFloat(formData.longitude);
   ```

### Coordinate Format

Always use decimal degrees:
- ✅ Correct: `-9.4438, 147.1803`
- ❌ Wrong: `9°26'37.7"S 147°10'49.1"E`

### Default Location

If no coordinates provided, map defaults to Port Moresby:
- Latitude: -9.4438
- Longitude: 147.1803

### Performance

- Maps only render client-side (`'use client'`)
- Shows "Loading map..." until mounted
- Tiles are cached by browser
- Very fast after first load

## Styling

### Custom Height

```tsx
<ParcelMap height="400px" />  // Fixed height
<ParcelMap height="50vh" />   // Viewport height
<ParcelMap height="100%" />   // Full container
```

### Responsive Design

```tsx
<div className="w-full h-96 lg:h-[600px]">
  <ParcelMap height="100%" />
</div>
```

## Troubleshooting

### Map Not Showing

1. Check if component is client-side:
   ```tsx
   'use client';  // Must be at top of file
   ```

2. Verify coordinates are numbers:
   ```tsx
   latitude={-9.4438}  // ✅ Number
   latitude={"-9.4438"}  // ❌ String
   ```

3. Check Leaflet CSS is imported (already done in component)

### Wrong Location

- Latitude must be negative for South (PNG)
- Longitude must be positive for East (PNG)
- Valid ranges: Lat -1 to -12, Lng 140 to 160

## Next Steps

Read the complete guide: `MAP_SATELLITE_GUIDE.md`

---

**Component Location**: `src/components/maps/ParcelMap.tsx`
**FREE Satellite Imagery**: ESRI World Imagery (no API key needed)
**Last Updated**: October 30, 2025
