import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to update map center and zoom
function MapController({ lat, lng }) {
    const map = useMap();

    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], 6, { animate: true });
        }
    }, [lat, lng, map]);

    return null;
}

export default function MapDisplay({ lat, lng, questionType = 'city' }) {
    // Default to political map for cities/regions, physical for rivers
    const defaultMapType = questionType === 'river' ? 'physical' : 'political';
    const [mapType, setMapType] = useState(defaultMapType);

    // Reset map type when question type changes
    useEffect(() => {
        setMapType(defaultMapType);
    }, [questionType, defaultMapType]);
    
    if (!lat || !lng) {
        return (
            <div
                style={{
                    height: '500px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                }}
            >
                <p>No location to display</p>
            </div>
        );
    }

    // Map tile URLs
    const tileUrls = {
        political: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        physical: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
    };
    
    const tileUrl = tileUrls[mapType];
    
    return (
        <div style={{ position: 'relative' }}>
            {/* Map Type Toggle Button */}
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                backgroundColor: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                display: 'flex',
                gap: '8px'
            }}>
                <button
                    onClick={() => setMapType('political')}
                    style={{
                        padding: '6px 12px',
                        fontSize: '14px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: mapType === 'political' ? '#007bff' : 'white',
                        color: mapType === 'political' ? 'white' : '#333',
                        cursor: 'pointer',
                        fontWeight: mapType === 'political' ? 'bold' : 'normal'
                    }}
                >
                    Political
                </button>
                <button
                    onClick={() => setMapType('physical')}
                    style={{
                        padding: '6px 12px',
                        fontSize: '14px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: mapType === 'physical' ? '#007bff' : 'white',
                        color: mapType === 'physical' ? 'white' : '#333',
                        cursor: 'pointer',
                        fontWeight: mapType === 'physical' ? 'bold' : 'normal'
                    }}
                >
                    Physical
                </button>
            </div>
            
            <div
                style={{
                    height: '500px',
                    width: '100%',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '2px solid #ddd',
                }}
            >
                <MapContainer
                    center={[lat, lng]}
                    zoom={6}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                    key={mapType}
                >
                    <TileLayer
                        url={tileUrl}
                        attribution={mapType === 'political' 
                            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            : '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'}
                    />
                    <Marker position={[lat, lng]} />
                    <Circle 
                        center={[lat, lng]} 
                        radius={16500}
                        pathOptions={{
                            fillColor: 'gray',
                            fillOpacity: 1.0,
                            color: 'gray',
                            weight: 1,
                            opacity: 0.8
                        }}
                    />
                    <MapController lat={lat} lng={lng} />
                </MapContainer>
            </div>
        </div>
    );
}
