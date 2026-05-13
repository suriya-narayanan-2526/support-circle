import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import { FiClock, FiNavigation } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Professional Marker Icons
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const icons = {
  volunteer: createIcon('green'),
  donor: createIcon('orange'),
  destination: createIcon('red'),
  viewer: createIcon('blue'), // Still blue for generic 'you' pulse
};

/**
 * Component to handle map centering and smooth transitions
 */
const MapController = ({ center, autoFollow, forceCenterTrigger }) => {
  const map = useMap();
  const lastCenter = useRef(null);

  useEffect(() => {
    if (center && autoFollow) {
      // Re-center if forced by button OR if target moved significantly
      const dist = lastCenter.current ? map.distance(center, lastCenter.current) : 999;
      
      if (dist > 10 || forceCenterTrigger > 0) {
        map.panTo(center, { animate: true, duration: 1 });
        lastCenter.current = center;
      }
    }
  }, [center, autoFollow, map, forceCenterTrigger]);
  return null;
};

export const SmoothMap = ({ 
  targetUserId, 
  targetRole = 'volunteer',
  viewerId,
  viewerRole = 'donor',
  destination, // { lat, lng }
  destinationIcon = 'destination', // 'volunteer' | 'donor' | 'destination'
  autoFollow = true 
}) => {
  const [currentPos, setCurrentPos] = useState(null);
  const [displayPos, setDisplayPos] = useState(null);
  const [viewerPos, setViewerPos] = useState(null);
  const [pathHistory, setPathHistory] = useState([]);
  const [eta, setEta] = useState(null);
  const [forceCenter, setForceCenter] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    if (!targetUserId) return;

    const table = targetRole === 'volunteer' ? 'volunteers' : targetRole === 'donor' ? 'donors' : 'partners';

    // 1. Initial Fetch
    const fetchLatest = async () => {
      console.log(`SmoothMap: Fetching latest for ${targetRole} ${targetUserId}`);
      const { data, error } = await supabase
        .from(table)
        .select('latitude, longitude')
        .eq('user_id', targetUserId)
        .single();
      
      if (error) console.error(`SmoothMap: Fetch error`, error);

      if (data?.latitude && data?.longitude) {
        const pos = [data.latitude, data.longitude];
        setCurrentPos(pos);
        setDisplayPos(pos);
        setPathHistory([pos]);
      } else {
        console.warn(`SmoothMap: No location found in DB for ${targetUserId}`);
      }
    };
    fetchLatest();

    // 2. Real-time Subscription
    const channel = supabase
      .channel(`tracking_${targetUserId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table, filter: `user_id=eq.${targetUserId}` },
        (payload) => {
          console.log(`SmoothMap: Received Realtime Update for ${targetUserId}`, payload.new);
          if (payload.new.latitude) {
            const newPos = [payload.new.latitude, payload.new.longitude];
            setCurrentPos(newPos);
            setPathHistory(prev => {
              const updated = [...prev, newPos];
              return updated.slice(-100); // Keep last 100 points
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [targetUserId, targetRole]);

  // 2.5 Viewer Tracking
  useEffect(() => {
    if (!viewerId) return;
    const table = viewerRole === 'volunteer' ? 'volunteers' : viewerRole === 'donor' ? 'donors' : 'partners';

    const fetchViewer = async () => {
      const { data } = await supabase.from(table).select('latitude, longitude').eq('user_id', viewerId).single();
      if (data?.latitude) setViewerPos([data.latitude, data.longitude]);
    };
    fetchViewer();

    const channel = supabase.channel(`viewer_${viewerId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter: `user_id=eq.${viewerId}` }, (payload) => {
        if (payload.new.latitude) setViewerPos([payload.new.latitude, payload.new.longitude]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [viewerId, viewerRole]);

  // 3. Smooth Marker Interpolation
  useEffect(() => {
    if (!currentPos || !displayPos) {
      if (currentPos) setDisplayPos(currentPos);
      return;
    }

    const interpolate = () => {
      const step = 0.05; // Smoothing factor
      const [currLat, currLng] = currentPos;
      const [dispLat, dispLng] = displayPos;

      const nextLat = dispLat + (currLat - dispLat) * step;
      const nextLng = dispLng + (currLng - dispLng) * step;

      if (Math.abs(nextLat - currLat) < 0.00001 && Math.abs(nextLng - currLng) < 0.00001) {
        setDisplayPos(currentPos);
        return;
      }

      setDisplayPos([nextLat, nextLng]);
      animRef.current = requestAnimationFrame(interpolate);
    };

    animRef.current = requestAnimationFrame(interpolate);
    return () => cancelAnimationFrame(animRef.current);
  }, [currentPos]);

  // 4. ETA Calculation
  useEffect(() => {
    const targetPos = destination ? [destination.lat, destination.lng] : viewerPos;
    if (currentPos && targetPos) {
      const R = 6371;
      const [lat1, lon1] = currentPos;
      const [lat2, lon2] = targetPos;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      const mins = Math.ceil(dist / (25 / 60)); // Avg 25km/h
      setEta(mins);
    }
  }, [currentPos, destination, viewerPos]);

  return (
    <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-stone-100 shadow-inner">
      <AnimatePresence>
        {eta !== null && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur-md border border-orange-100 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-black text-stone-800 uppercase tracking-widest">
              {eta > 0 ? `ETA: ${eta} MIN` : 'Arriving Now'}
            </span>
          </motion.div>
        )}

        {displayPos && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setForceCenter(prev => prev + 1)}
            style={{ 
              position: 'absolute', bottom: 24, right: 24, zIndex: 1000,
              width: 44, height: 44, borderRadius: 14, background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px -4px rgba(0,0,0,0.1)', border: '1px solid #eee'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Recenter Map"
          >
            <FiNavigation size={20} className="text-stone-600" />
          </motion.button>
        )}
      </AnimatePresence>

      <MapContainer
        center={displayPos || (destination ? [destination.lat, destination.lng] : [13.0827, 80.2707])}
        zoom={16}
        scrollWheelZoom={true}
        zoomControl={true}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        <MapController center={displayPos} autoFollow={autoFollow} forceCenterTrigger={forceCenter} />

        {/* Destination */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={icons[destinationIcon] || icons.destination} />
        )}

        {/* Trail */}
        {pathHistory.length > 1 && (
          <Polyline 
            positions={pathHistory} 
            color="#E8622A" 
            weight={3} 
            dashArray="10, 10" 
            opacity={0.6} 
          />
        )}

        {/* Route between Volunteer and Donor (Swiggy style) */}
        {displayPos && viewerPos && viewerId !== targetUserId && (
          <Polyline 
            positions={[displayPos, viewerPos]} 
            color="#3b82f6" 
            weight={4} 
            dashArray="5, 10" 
            opacity={0.8} 
          />
        )}

        {/* Viewer Marker (Hide if it's the same person as the target) */}
        {viewerPos && viewerId !== targetUserId && (
          <Marker position={viewerPos} icon={viewerRole === 'volunteer' ? icons.volunteer : icons.donor}>
             <div className="viewer-marker" />
          </Marker>
        )}

        {/* Moving Target Marker */}
        {displayPos && (
          <Marker position={displayPos} icon={targetRole === 'volunteer' ? icons.volunteer : icons.donor}>
            <div className="pulse-marker" />
          </Marker>
        )}
      </MapContainer>

      <style jsx global>{`
        .leaflet-container {
          background: #f8fafc !important;
        }
        .viewer-marker {
          width: 14px;
          height: 14px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        .pulse-marker {
          width: 20px;
          height: 20px;
          background: rgba(232, 98, 42, 0.4);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
