import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../../lib/supabase';
import { FiClock, FiMapPin } from 'react-icons/fi';
import { motion } from 'framer-motion';

// Minimal Custom Icon for the Volunteer/Courier
const courierIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map smoothly to live coords
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15, { animate: true, duration: 1.5 });
    }
  }, [lat, lng, map]);
  return null;
};

// Haversine formula to calc approximate live distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);  
  const dLon = (lon2 - lon1) * (Math.PI / 180); 
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

export const LiveCourierMap = ({ volunteerId, destinationLat, destinationLng }) => {
  const [courierPos, setCourierPos] = useState(null);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    if (!volunteerId) return;

    // Listen to the realtime GPS coordinates injected directly from VolunteerDashboard
    const channel = supabase.channel(`tracking:vol_${volunteerId}`)
      .on('broadcast', { event: 'location' }, ({ payload }) => {
        setCourierPos({ lat: payload.lat, lng: payload.lng });
        
        // Setup distance/ETA logic
        if (destinationLat && destinationLng) {
            const distKm = getDistanceFromLatLonInKm(
                payload.lat, payload.lng, 
                destinationLat, destinationLng
            );
            // Rough estimate: an average city driving speed of 30 km/h (0.5 km/min)
            const minutes = Math.ceil(distKm / 0.5);
            setEta(minutes);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [volunteerId, destinationLat, destinationLng]);

  // Robust fallback for initial center
  const centerLat = courierPos?.lat || (destinationLat ? parseFloat(destinationLat) : 13.0827);
  const centerLng = courierPos?.lng || (destinationLng ? parseFloat(destinationLng) : 80.2707);

  return (
    <div style={{ position: 'relative', width: '100%', height: 280, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(28,25,23,0.1)', background: '#F1F5F9' }}>
      {/* ETA HUD */}
      {courierPos && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, background: '#FFF6E5', color: '#D97706', padding: '8px 14px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13, border: '2px solid rgba(217,119,6,0.3)', boxShadow: '0 8px 24px rgba(217,119,6,0.2)' }}>
          <FiClock /> {eta && eta > 0 ? `${eta} Min Away` : 'Arriving immediately'}
        </motion.div>
      )}

      {/* When waiting for lock */}
      {!courierPos && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1000, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', flexDirection: 'column', gap: 10 }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#E8622A' }} className="animate-ping" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1C1917', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Acquiring Live GPS Signal...</span>
        </div>
      )}

      {/* Map rendering */}
      <MapContainer 
         key={`map-${centerLat}-${centerLng}`} // Forces re-mount if base changes drastically
         center={[centerLat, centerLng]} 
         zoom={14} 
         zoomControl={false}
         style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Nice clean map style
        />
        
        {/* Destination marker (e.g. Donor's House) */}
        {destinationLat && destinationLng && (
            <Marker position={[parseFloat(destinationLat), parseFloat(destinationLng)]} />
        )}

        {/* Live Courier marker */}
        {courierPos && (
          <>
             <RecenterMap lat={courierPos.lat} lng={courierPos.lng} />
             <Marker position={[courierPos.lat, courierPos.lng]} icon={courierIcon}>
                <Popup>Courier live position</Popup>
             </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
};
