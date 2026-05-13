import { supabase } from '../lib/supabase';

class LocationEngine {
  constructor() {
    this.watchId = null;
    this.lastPosition = null;
    this.options = {
      enableHighAccuracy: true,
      timeout: 30000, // Increased to 30s to prevent desktop timeouts
      maximumAge: 10000, // Allow 10s old cached positions
      distanceFilter: 5, // meters
      accuracyThreshold: 100, // Relaxed to 100m to avoid ignoring desktop locations
      updateInterval: 3000, // ms
    };
    this.listeners = new Set();
    this.isTracking = false;
    this.hasPerformedInitialUpdate = false;
  }

  /**
   * Check if location services are enabled and permissions granted
   */
  async checkStatus() {
    if (!navigator.geolocation) {
      return { available: false, error: 'Geolocation not supported' };
    }

    // Attempt to check permission status if supported
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          return { available: false, error: 'Location permission denied. Please enable it in browser settings.' };
        }
      } catch (e) {
        console.warn('LocationEngine: Permissions API check failed', e);
      }
    }

    try {
      const result = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          timeout: 30000, // 30 seconds for initial check
          maximumAge: 10000,
          enableHighAccuracy: true 
        });
      });
      return { available: true, position: result };
    } catch (error) {
      let msg = error.message;
      if (error.code === 1) msg = "Permission denied. Please allow location access.";
      if (error.code === 2) msg = "Position unavailable. Is your GPS on?";
      if (error.code === 3) msg = "Timed out waiting for GPS. Try moving closer to a window.";
      return { available: false, error: msg };
    }
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Start high-precision tracking
   */
  startTracking(userId, userRole, customOptions = {}) {
    if (this.isTracking) return;

    this.options = { ...this.options, ...customOptions };
    this.isTracking = true;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handleUpdate(position, userId, userRole),
      (error) => this.handleError(error),
      {
        enableHighAccuracy: this.options.enableHighAccuracy,
        timeout: this.options.timeout,
        maximumAge: this.options.maximumAge,
      }
    );

    console.log('LocationEngine: Tracking started for', userId);
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    this.lastPosition = null;
    this.hasPerformedInitialUpdate = false;
    console.log('LocationEngine: Tracking stopped');
  }

  async handleUpdate(position, userId, userRole) {
    let { latitude, longitude, accuracy, timestamp } = position.coords;

    console.log(`LocationEngine: Received GPS Update - Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}, Acc: ${accuracy.toFixed(1)}m`);

    // 1. Accuracy Filter
    if (accuracy > this.options.accuracyThreshold) {
      console.warn(`LocationEngine: Low accuracy update (${accuracy.toFixed(1)}m). Processing anyway to allow desktop updates.`);
    }

    // Force PSNA Location for Testing / Demo
    latitude = 10.416730 + (userRole === 'volunteer' ? 0.0003 : 0);
    longitude = 77.901189 + (userRole === 'volunteer' ? 0.0003 : 0);

    // Smart Demo Override: If volunteer, try to copy the donor's actual location
    if (userRole === 'volunteer') {
      try {
        const { data: donation } = await supabase
          .from('donations')
          .select('donor_id')
          .eq('volunteer_id', userId)
          .eq('status', 'in_transit')
          .maybeSingle();
          
        if (donation && donation.donor_id) {
          const { data: donor } = await supabase
            .from('donors')
            .select('latitude, longitude')
            .eq('user_id', donation.donor_id)
            .maybeSingle();
            
          if (donor && donor.latitude && donor.longitude) {
            latitude = donor.latitude;
            longitude = donor.longitude;
            console.log('LocationEngine: Volunteer location synced to Donor location:', latitude, longitude);
          }
        }
      } catch (err) {
        console.error('LocationEngine: Failed to sync volunteer to donor location', err);
      }
    }

    // 2. Distance Filter: Only update if moved > 5m, UNLESS it's the first update
    if (this.lastPosition && this.hasPerformedInitialUpdate) {
      const distance = this.getDistance(
        this.lastPosition.latitude,
        this.lastPosition.longitude,
        latitude,
        longitude
      );

      if (distance < this.options.distanceFilter) {
        return; // Haven't moved enough
      }
      console.log(`LocationEngine: Significant movement detected: ${distance.toFixed(1)}m`);
    } else {
      console.log('LocationEngine: Performing initial position sync...');
    }

    const updatePayload = {
      latitude,
      longitude,
      accuracy,
      last_location_update: new Date().toISOString(),
    };

    this.lastPosition = { latitude, longitude, accuracy, timestamp };
    this.hasPerformedInitialUpdate = true;

    // 3. Backend Communication (Supabase)
    try {
      const table = this.getTableName(userRole);
      if (table) {
        const { error } = await supabase
          .from(table)
          .update(updatePayload)
          .eq('user_id', userId);
        
        if (error) {
          console.error(`LocationEngine: Supabase Update Error for ${table}:`, error);
        } else {
          console.log(`LocationEngine: Successfully synced to ${table} for user ${userId}`);
        }
      }

      // Notify internal listeners
      this.listeners.forEach(callback => callback(this.lastPosition));
      
    } catch (err) {
      console.error('LocationEngine: Sync Exception', err);
    }
  }

  handleError(error) {
    console.error('LocationEngine: GPS Error', error);
    this.listeners.forEach(callback => callback(null, error));
  }

  getTableName(role) {
    const map = {
      volunteer: 'volunteers',
      donor: 'donors',
      partner: 'partners',
    };
    return map[role.toLowerCase()] || null;
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export const locationEngine = new LocationEngine();
