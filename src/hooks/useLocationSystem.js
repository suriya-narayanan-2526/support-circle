import { useState, useEffect, useCallback } from 'react';
import { locationEngine } from '../services/locationEngine';
import { toast } from 'react-hot-toast';

export const useLocationSystem = (user, role, active = false) => {
  const [status, setStatus] = useState('initializing'); // 'initializing' | 'active' | 'blocked' | 'error'
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);

  const initLocation = useCallback(async () => {
    if (!user || !role) return;

    setStatus('initializing');
    const result = await locationEngine.checkStatus();

    if (!result.available) {
      setStatus('blocked');
      setError(result.error);
      toast.error('Location Access Required. Please enable GPS and grant permissions to continue.', {
        duration: 5000,
        id: 'location-blocked',
      });
      return;
    }

    setStatus('active');
    if (active) {
      locationEngine.startTracking(user.id, role);
    }
  }, [user, role, active]);

  useEffect(() => {
    initLocation();

    const unsubscribe = locationEngine.addListener((pos, err) => {
      if (err) {
        setError(err.message);
        if (err.code === 1) setStatus('blocked'); // Permission denied
      } else if (pos) {
        setCurrentLocation(pos);
        setStatus('active');
      }
    });

    return () => {
      unsubscribe();
      locationEngine.stopTracking();
    };
  }, [initLocation]);

  const requestRetry = () => {
    initLocation();
  };

  return {
    status,
    currentLocation,
    error,
    requestRetry,
    isBlocked: status === 'blocked',
  };
};
