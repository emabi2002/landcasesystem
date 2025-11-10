# Satellite & Map Imagery Guide for DLPP Legal CMS

## Overview

The DLPP Legal CMS includes interactive maps with **FREE satellite imagery** for viewing land parcels. No API keys required!

## 🛰️ Available Map Views

### 1. **Satellite View** (ESRI World Imagery)
- **Source**: ESRI ArcGIS Online
- **Features**: High-resolution aerial/satellite imagery
- **Coverage**: Global, including Papua New Guinea
- **Cost**: FREE (no API key needed)
- **Best For**: Viewing actual terrain, buildings, vegetation

### 2. **Satellite + Labels**
- **Source**: ESRI World Imagery + Boundaries
- **Features**: Satellite view with place names and boundaries
- **Best For**: Understanding location context with satellite view

### 3. **Street Map** (OpenStreetMap)
- **Source**: OpenStreetMap contributors
- **Features**: Detailed street-level map
- **Cost**: FREE and open-source
- **Best For**: Understanding roads, infrastructure, neighborhoods

### 4. **Terrain Map** (ESRI World Topo)
- **Source**: ESRI Topographic Map
- **Features**: Elevation, terrain features, contours
- **Best For**: Understanding land elevation and topography

## 📍 How GPS Coordinates Work

### Coordinate System
- **Latitude**: North/South position (-90 to +90)
  - Papua New Guinea: approximately -1° to -12° (South)
- **Longitude**: East/West position (-180 to +180)
  - Papua New Guinea: approximately 140° to 160° (East)

### Example Coordinates for PNG Locations:
- **Port Moresby**: -9.4438, 147.1803
- **Madang**: -5.2245, 145.7966
- **Lae**: -6.7369, 146.9974
- **Mount Hagen**: -5.8593, 144.2959

## 🗺️ How to Use Maps in the System

### Viewing Land Parcels on Map

1. **Navigate to Land Parcels**:
   - Go to Land Parcels page
   - Click on any parcel card
   - Map automatically loads with parcel location

2. **Switch Map Views**:
   - Look for layer control in **top-right** corner
   - Click to open layer menu
   - Select desired view (Satellite, Terrain, etc.)

3. **Map Controls**:
   - **Zoom**: Scroll wheel or +/- buttons
   - **Pan**: Click and drag
   - **Marker**: Click marker for parcel details
   - **Boundary Circle**: Red circle shows approximate parcel area

### Adding GPS Coordinates to Land Parcels

#### Method 1: When Creating New Parcel
1. Open "Add Land Parcel" dialog
2. Enter Latitude and Longitude fields
3. Save parcel
4. Map will automatically display location

#### Method 2: When Editing Existing Parcel
1. Click on parcel to edit
2. Update Latitude and Longitude
3. Save changes
4. Map updates to new location

## 📲 How to Get GPS Coordinates

### Option 1: Google Maps (Most Accurate)
1. Go to [Google Maps](https://maps.google.com)
2. Search for location or right-click on map
3. Click "What's here?"
4. Coordinates appear at bottom (e.g., -9.4438, 147.1803)
5. Copy latitude (first number) and longitude (second number)

### Option 2: Google Earth
1. Open Google Earth
2. Navigate to location
3. Coordinates shown at bottom of screen
4. Click to copy coordinates

### Option 3: GPS Device or Smartphone
1. Use GPS app on smartphone
2. Navigate to physical location
3. App displays current GPS coordinates
4. Record latitude and longitude

### Option 4: Survey Data
- If you have official survey documents
- GPS coordinates usually included in survey reports
- Use exact coordinates from official survey

## 🎯 Best Practices

### For Accurate Mapping:
1. **Use Decimal Degrees** (e.g., -9.4438, 147.1803)
   - NOT degrees/minutes/seconds
   - System automatically converts if needed

2. **PNG Coordinate Ranges**:
   - Latitude: Between -1 and -12 (negative for South)
   - Longitude: Between 140 and 160 (positive for East)

3. **Verify Coordinates**:
   - After entering coordinates, check the map
   - Marker should appear at expected location
   - Use satellite view to verify terrain matches

4. **Accuracy Levels**:
   - **4 decimal places**: ±11 meters accuracy
   - **5 decimal places**: ±1.1 meters accuracy
   - **6 decimal places**: ±0.11 meters accuracy (survey-grade)

### For Parcel Boundaries:
- System shows **approximate circular boundary**
- Actual parcel may have irregular shape
- Circle radius calculated from hectare area
- For exact boundaries, upload survey plan

## 🌐 Free Map Data Sources

### Current Implementation (Built-in):
1. **ESRI World Imagery** - Satellite views
   - URL: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer`
   - Free for public use
   - High-resolution imagery globally

2. **OpenStreetMap** - Street maps
   - URL: `https://www.openstreetmap.org`
   - Community-contributed
   - Completely free and open

3. **ESRI World Topo** - Terrain maps
   - Topographic features
   - Elevation data
   - Free for public use

### Why These Are Free:
- **No API Key Required**: Direct tile access
- **Public Services**: Provided free by ESRI and OSM
- **No Rate Limits**: For reasonable use
- **No Costs**: Completely free forever

## 🔄 Upgrading to Premium Maps (Optional)

If you need even higher resolution or additional features:

### Option 1: Mapbox (Recommended)
- **Cost**: Free tier includes 50,000 loads/month
- **Benefits**: Very high-res satellite, custom styling
- **Setup**: Get free API key at [mapbox.com](https://mapbox.com)

### Option 2: Google Maps
- **Cost**: $200 free credit/month
- **Benefits**: Street View, directions, places
- **Setup**: Requires Google Cloud account

### Option 3: Here Maps
- **Cost**: Free tier available
- **Benefits**: Good coverage, routing
- **Setup**: Get API key at [here.com](https://here.com)

**Note**: Current free implementation is sufficient for most use cases!

## 🛠️ Technical Details

### Map Component Location:
- `src/components/maps/ParcelMap.tsx`

### Libraries Used:
- **Leaflet.js**: Open-source mapping library
- **React-Leaflet**: React wrapper for Leaflet
- **Tile Providers**: ESRI, OpenStreetMap

### How It Works:
1. Component loads with parcel coordinates
2. Fetches map tiles from free servers
3. Displays interactive map with controls
4. Users can switch between different views
5. All processing happens in browser (no backend needed)

### Performance:
- Map tiles cached by browser
- Fast loading after first view
- Works offline with cached tiles
- No database storage required for maps

## 📋 Troubleshooting

### Map Not Loading
**Problem**: Blank gray box instead of map
**Solutions**:
- Check internet connection
- Try refreshing the page
- Clear browser cache
- Make sure coordinates are valid

### Wrong Location Showing
**Problem**: Marker appears in wrong place
**Solutions**:
- Verify coordinates are correct
- Check latitude is negative (South)
- Check longitude is positive (East)
- Ensure decimal format (not deg/min/sec)

### Satellite View Not Working
**Problem**: Satellite view shows gray tiles
**Solutions**:
- Internet required for satellite imagery
- Try different zoom level
- ESRI servers may be temporarily down
- Fall back to Street Map view

### Coordinates Not Displaying
**Problem**: GPS coordinates blank or missing
**Solutions**:
- Parcel must have coordinates in database
- Edit parcel to add coordinates
- Use "Add Land Parcel" with coordinates

## 📊 Data Format

### Database Storage:
```json
{
  "coordinates": {
    "latitude": -9.4438,
    "longitude": 147.1803
  }
}
```

### Import Format (CSV):
```
parcel_number,latitude,longitude,area,location
SEC123-ALL456,-9.4438,147.1803,2.5,"Port Moresby"
```

## 🎓 Training Resources

### For Staff:
1. **Basic GPS Training**: How to read coordinates
2. **Google Maps Training**: Finding locations
3. **Data Entry Training**: Entering coordinates correctly
4. **Map Navigation**: Using layer controls and zoom

### For Management:
- **Report Features**: Maps in reports (planned)
- **Data Quality**: Ensuring coordinate accuracy
- **Coverage**: Checking all parcels have coordinates

## 🔮 Future Enhancements

Planned features:
- [ ] Draw custom parcel boundaries
- [ ] Upload KML/Shapefile for exact boundaries
- [ ] Measure distance and area tools
- [ ] Print maps in reports
- [ ] Batch geocoding from addresses
- [ ] Historical imagery comparison
- [ ] Elevation profiles

## 📞 Support

### Getting Coordinates:
- Contact DLPP Survey Department
- Use GPS device on-site
- Refer to official survey documents

### Map Issues:
- Check this guide first
- Verify coordinates are in correct format
- Contact system administrator

---

**Last Updated**: October 30, 2025  
**Map Version**: 1.0  
**Free Satellite Imagery**: ESRI World Imagery (No API Key Required)
