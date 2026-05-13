import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { FiAlertCircle, FiArrowRight } from 'react-icons/fi';

export const Footer = () => {
  const { user, role } = useAuth();
  const [needsLocation, setNeedsLocation] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkUserLocation = async () => {
      if (user && role === 'donor') {
        try {
          const { data } = await supabase
            .from('donors')
            .select('address')
            .eq('user_id', user.id)
            .single();
          
          if (isMounted && (!data || !data.address || !data.address.address_line1)) {
            setNeedsLocation(true);
          } else if (isMounted) {
            setNeedsLocation(false);
          }
        } catch (err) {
          console.error('Error checking donor address for footer:', err);
        }
      } else if (isMounted) {
        setNeedsLocation(false);
      }
    };
    
    checkUserLocation();
    
    // Listen for cross-component address updates (e.g. from LocationModal)
    const handleAddressUpdate = (e) => {
      console.log('Footer: Received address update event:', e.detail);
      if (isMounted && e.detail && e.detail.address_line1) {
        setNeedsLocation(false);
      }
    };
    
    window.addEventListener('donorAddressUpdated', handleAddressUpdate);

    return () => { 
      isMounted = false; 
      window.removeEventListener('donorAddressUpdated', handleAddressUpdate);
    };
  }, [user, role]);

  const orange  = '#E8622A';
  const green   = '#2D9B6F';
  const border  = 'rgba(28,25,23,0.08)';
  const textSec = '#78716C';
  const textMut = '#A8A29E';

  return (
    <footer style={{ background: '#FFF8F3', borderTop: `1px solid ${border}` }} className="py-14 relative">

      {/* Donor Location Reminder — Sticky warm banner */}
      {needsLocation && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
          <div
            className="mx-auto max-w-4xl rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border pointer-events-auto"
            style={{ background: '#FFFFFF', borderColor: 'rgba(232,98,42,0.35)', boxShadow: '0 8px 32px rgba(232,98,42,0.15)' }}
          >
            <div className="flex items-center gap-3">
              <FiAlertCircle style={{ color: orange }} className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm" style={{ color: '#44403C' }}>
                <strong style={{ color: '#1C1917' }}>Action Required:</strong> Please update your pickup address in your dashboard so volunteers can find you.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setNeedsLocation(false)} className="text-xs transition-colors" style={{ color: textMut }}>Dismiss</button>
              <Link
                to="/donor/dashboard"
                onClick={() => setNeedsLocation(false)}
                className="flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all"
                style={{ background: `linear-gradient(135deg, ${orange}, #D4541E)`, boxShadow: '0 4px 14px rgba(232,98,42,0.3)' }}
              >
                Update Address <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">

          {/* Brand column */}
          <div className="col-span-1 md:col-span-2">
            <Logo showText={true} />
            <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: textSec }}>
              Connecting compassionate donors, trusted volunteers, and verified orphanages — ensuring every contribution reaches a child who needs it most.
            </p>
            {/* Warm accent bar */}
            <div className="mt-6 flex gap-2">
              <div style={{ width: 32, height: 3, borderRadius: 999, background: orange }} />
              <div style={{ width: 16, height: 3, borderRadius: 999, background: green }} />
              <div style={{ width: 8, height: 3, borderRadius: 999, background: 'rgba(244,161,53,0.5)' }} />
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: orange }}>Platform</h3>
            <ul className="space-y-2.5 text-sm" style={{ color: textSec }}>
              <li><Link to="/about" className="hover:text-stone-800 transition-colors">About Us</Link></li>
              <li><Link to="/community" className="hover:text-stone-800 transition-colors">Community Partners</Link></li>
              <li><Link to="/auth/register/volunteer" className="hover:text-stone-800 transition-colors">Volunteer Application</Link></li>
              <li><Link to="/partner/apply" className="hover:text-stone-800 transition-colors">Partner Application</Link></li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: green }}>Legal</h3>
            <ul className="space-y-2.5 text-sm" style={{ color: textSec }}>
              <li><a href="#" className="hover:text-stone-800 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-stone-800 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-stone-800 transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: `1px solid ${border}` }}>
          <p className="text-sm" style={{ color: textMut }}>
            &copy; {new Date().getFullYear()} Support Circle. All rights reserved.
          </p>
          <p className="text-sm flex items-center gap-1.5" style={{ color: textMut }}>
            Made with <span style={{ color: orange }}>❤️</span> to help children in need
          </p>
        </div>
      </div>
    </footer>
  );
};
