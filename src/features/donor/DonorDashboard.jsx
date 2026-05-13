import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiMapPin, FiHeart, FiArrowRight, FiGift, FiStar,
  FiChevronRight, FiActivity, FiCheckCircle, FiShield,
  FiZap, FiClock, FiLayers, FiInfo, FiSmartphone
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { DonationHistory } from './DonationHistory';
import { LocationModal } from './LocationModal';
import { SmoothMap } from '../../components/SmoothMap';
import { CampaignSection } from '../../components/CampaignSection';
import { StrategicIntelShelf } from '../../components/StrategicIntelShelf';
import { PageLoader } from '../../components/PageLoader';
import { useLocationSystem } from '../../hooks/useLocationSystem';
import { LocationGuard } from '../../components/LocationGuard';

/* ─── DESIGN TOKENS ─── */
const T = {
  orange:       '#E8622A',
  orangeDark:   '#C4521F',
  orangeGlow:   'rgba(232,98,42,0.15)',
  orangeLight:  '#FFF0E8',
  orangeBorder: 'rgba(232,98,42,0.18)',
  green:        '#2D9B6F',
  greenGlow:    'rgba(45,155,111,0.12)',
  greenLight:   '#EDFAF4',
  greenBorder:  'rgba(45,155,111,0.20)',
  amber:        '#D97706',
  amberLight:   '#FFF8E8',
  amberBorder:  'rgba(217,119,6,0.20)',
  bg:           '#FFFDF9',
  surface:      '#FFFFFF',
  surfaceWarm:  '#FFF5EE',
  border:       'rgba(28,25,23,0.07)',
  borderMid:    'rgba(28,25,23,0.11)',
  text:         '#1C1917',
  textSub:      '#57534E',
  textMuted:    '#A8A29E',
};

/* ─── HELPERS ─── */
function DotGrid() {
  return (
    <svg aria-hidden style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.04, pointerEvents:'none' }}>
      <defs><pattern id="dd" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#1C1917"/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#dd)"/>
    </svg>
  );
}

/* ─── STAT CARD ─── */
function StatCard({ label, value, Icon, color, glow, light, border, delay, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, boxShadow: `0 30px 60px -12px ${glow}` }}
      style={{
        background: `linear-gradient(145deg, #FFFFFF 0%, ${light} 100%)`,
        border: `1px solid ${border}`,
        borderRadius: 32,
        padding: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 4px 20px -4px rgba(0,0,0,0.03)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 180
      }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: '60%', height: '60%', background: `radial-gradient(circle at 100% 0%, ${color}08, transparent 70%)`, pointerEvents: 'none' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fff', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, boxShadow: '0 8px 16px -4px rgba(0,0,0,0.05)' }}>
          <Icon size={22}/>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 12px ${color}` }} />
      </div>

      <div>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 8 }}>{label}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <h3 style={{ fontSize: 44, fontWeight: 900, color: T.text, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {loading ? "..." : value}
          </h3>
          <span style={{ fontSize: 12, fontWeight: 700, color: color, opacity: 0.8 }}>+12%</span>
        </div>
      </div>
      
      <div style={{ height: 4, width: '100%', background: 'rgba(0,0,0,0.03)', borderRadius: 2, marginTop: 20, overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: '70%' }} 
          transition={{ duration: 1.5, delay: delay + 0.5, ease: "circOut" }}
          style={{ height: '100%', background: color, borderRadius: 2 }} 
        />
      </div>
    </motion.div>
  );
}

/* ─── MAIN ─── */
export const DonorDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ totalDonations:0, livesTouched:0 });
  const [savedAddress, setSavedAddress] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [activeCourier, setActiveCourier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'campaigns' | 'history'

  useEffect(() => {
    if (!user) return;
    const fetchDashboardData = async () => {
      try {
        const [donorRes, allRes, activeRes] = await Promise.all([
          supabase.from('donors').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('donations').select('items_json').eq('donor_id', user.id),
          supabase.from('donations').select('*').eq('donor_id', user.id).eq('status', 'in_transit').order('created_at', { ascending: false }).limit(1).maybeSingle()
        ]);
        if (donorRes.data) {
          setStats(s => ({ ...s, totalDonations: donorRes.data.total_donations || 0 }));
          if (donorRes.data.address?.address_line1) setSavedAddress(donorRes.data.address);
        }
        if (allRes.data) {
          let count = 0;
          allRes.data.forEach(d => (d.items_json||[]).forEach(i => count += (i.quantity||1)));
          setStats(s => ({ ...s, livesTouched: count * 2 }));
        }
        if (activeRes.data && activeRes.data.volunteer_id) {
          const { data: volData } = await supabase.from('volunteers').select('full_name, phone, face_image, status, rating, total_reviews').eq('user_id', activeRes.data.volunteer_id).maybeSingle();
          if (volData) setActiveCourier({ ...activeRes.data, volunteer: volData });
        } else setActiveCourier(null);
      } catch(e) { console.error(e); } finally { setLoading(false); }
    };
    fetchDashboardData();
    const channel = supabase.channel('donor-donations').on('postgres_changes', { event: '*', schema: 'public', table: 'donations', filter: `donor_id=eq.${user.id}` }, () => fetchDashboardData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ══════════ NEW HIGH-PRECISION TRACKING ══════════
  const { status: locationStatus, error, isBlocked, requestRetry } = useLocationSystem(
    user, 
    'donor', 
    !!user
  );

  const firstName = profile?.full_name?.split(' ')[0] || 'Donor';
  if (loading) return <PageLoader message="Loading Dashboard" subtitle="Preparing your giving hub..." />;

  return (
    <LocationGuard status={locationStatus} error={error} onRetry={requestRetry}>
      <div style={{ minHeight:'100vh', background:T.bg, paddingBottom:80, position:'relative' }}>
        <DotGrid/>
        <LocationModal isOpen={locationModalOpen} onClose={() => setLocationModalOpen(false)} userId={user?.id} currentAddress={savedAddress} onSaved={setSavedAddress}/>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'36px 24px', position:'relative', zIndex:10 }}>
        
        {/* ══════════ MODERN COMMAND CENTER HERO ══════════ */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 mb-16 p-12 bg-white rounded-[40px] border border-stone-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-50/50 to-transparent pointer-events-none" />
           
           <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.6 }} className="relative z-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full mb-6">
                 <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                 <span className="text-[9px] font-black tracking-[0.25em] text-stone-500 uppercase">System Status: Optimal</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-stone-900 leading-none">
                Hello, <span className="text-orange-600">{firstName}.</span>
              </h1>
              <p className="mt-4 text-stone-400 font-medium max-w-sm leading-relaxed">
                Your contribution stream is active. Track your impact and manage missions below.
              </p>
           </motion.div>

           <div className="flex flex-col items-center lg:items-end gap-6 relative z-10 w-full lg:w-auto">
              <Link to="/donor/donate" className="w-full lg:w-auto">
                 <motion.button 
                    whileHover={{ scale:1.02, backgroundColor: '#000' }} 
                    whileTap={{ scale:0.98 }}
                    style={{ 
                       background: '#1C1917', 
                       color: '#fff', 
                       padding: '22px 48px', 
                       borderRadius: 24, 
                       fontWeight: 900, 
                       fontSize: 14, 
                       border: 'none', 
                       cursor: 'pointer', 
                       width: '100%', 
                       boxShadow: '0 20px 40px -12px rgba(0,0,0,0.3)',
                       textTransform: 'uppercase',
                       letterSpacing: '0.1em'
                    }}>
                    Initiate Donation
                 </motion.button>
              </Link>
              <div className="flex items-center gap-6">
                 <div className="text-center">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Efficiency</p>
                    <p className="text-sm font-black text-stone-800">99.2%</p>
                 </div>
                 <div className="w-[1px] h-8 bg-stone-100" />
                 <div className="text-center">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Network</p>
                    <p className="text-sm font-black text-emerald-500 uppercase tracking-tighter">Online</p>
                 </div>
              </div>
           </div>
        </div>

        {/* ══════════ METRIC PODS ══════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           {/* Donation Volume Pod - RESTYLED */}
           <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.3 }}
              className="p-8 bg-white border border-stone-100 rounded-[32px] shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-orange-600" />
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-100">
                    <FiGift size={20} />
                 </div>
                 <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Global Vol.</span>
              </div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Donations</p>
              <h3 className="text-5xl font-black text-stone-900 tracking-tighter mb-6">{loading ? '...' : stats.totalDonations}</h3>
              <div className="flex items-center gap-2">
                 <div className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-black">+14%</div>
                 <span className="text-[10px] font-bold text-stone-300">Vs Last Month</span>
              </div>
           </motion.div>

           {/* Impact Reach Pod - RESTYLED */}
           <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.4 }}
              className="p-8 bg-white border border-stone-100 rounded-[32px] shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600" />
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <FiHeart size={20} />
                 </div>
                 <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Network Impact</span>
              </div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Lives Touched</p>
              <h3 className="text-5xl font-black text-stone-900 tracking-tighter mb-6">{loading ? '...' : stats.livesTouched}</h3>
              <div className="flex items-center gap-2">
                 <div className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-black">ACTIVE</div>
                 <span className="text-[10px] font-bold text-stone-300">Verified Outcomes</span>
              </div>
           </motion.div>

           {/* ACTIVE TERMINAL (Address) */}
           <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.5 }}
              className="p-8 bg-stone-900 text-white rounded-[32px] shadow-xl relative group overflow-hidden border border-stone-800">
              <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 pointer-events-none">
                 <FiMapPin size={80} />
              </div>
              <div className="relative z-10">
                 <div className="flex justify-between items-center mb-6">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 text-orange-400">
                       <FiMapPin size={22} />
                    </div>
                    <span className="text-[9px] font-black text-orange-400 uppercase tracking-[0.25em] bg-orange-400/10 px-3 py-1 rounded-full">Primary Terminal</span>
                 </div>
                 <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Current Collection Point</p>
                 <h3 className="text-4xl font-black text-white tracking-tight mb-8 leading-tight">
                    {loading ? '...' : (savedAddress?.label || 'Not Set')}
                 </h3>
                 <motion.button 
                    onClick={() => setLocationModalOpen(true)}
                    whileHover={{ scale: 1.02, backgroundColor: '#fff', color: '#000' }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest transition-all"
                 >
                    Update Terminal
                 </motion.button>
              </div>
           </motion.div>
        </div>

        {/* ══════════ LIVE TRACKING (Primary Focus) ══════════ */}
        {activeCourier && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="mb-12">
            <div className="flex items-center gap-3 mb-6 px-2">
               <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <FiActivity size={18} />
               </div>
               <h2 className="text-lg font-black uppercase tracking-widest text-stone-800">Live Courier En Route</h2>
               <div className="h-[1px] flex-1 bg-stone-100" />
               <span className="text-[10px] font-black text-emerald-600 uppercase animate-pulse">In Transit</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
             <div className="bg-white border border-stone-100 rounded-[32px] overflow-hidden shadow-sm h-[500px]">
                <SmoothMap 
                  targetUserId={activeCourier.volunteer_id} 
                  targetRole="volunteer"
                  viewerId={user.id}
                  viewerRole="donor"
                />
             </div>

               <div className="flex flex-col gap-6">
                  <div className="p-8 rounded-[32px] bg-stone-900 text-white shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><FiShield size={100} /></div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20">
                              {activeCourier.volunteer?.face_image ? <img src={activeCourier.volunteer.face_image} className="w-full h-full object-cover" /> : <FiUser size={32} />}
                           </div>
                           <div>
                              <h4 className="text-xl font-black">{activeCourier.volunteer?.full_name || 'Volunteer'}</h4>
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Support Circle Logistics</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                           <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Contact</p>
                              <p className="text-sm font-bold">{activeCourier.volunteer?.phone || 'Hidden'}</p>
                           </div>
                           <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Pickup PIN</p>
                              <p className="text-xl font-black text-orange-500 tracking-widest font-mono">{activeCourier.pickup_address?.pickup_otp || '----'}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-stone-400 leading-tight">
                           <FiInfo className="shrink-0" /> Share this PIN with the volunteer ONLY when they arrive.
                        </div>
                     </div>
                  </div>

                  <div className="p-8 rounded-[32px] bg-white border border-stone-100 flex-1 flex flex-col justify-center text-center">
                     <FiCheckCircle size={32} className="mx-auto mb-4 text-emerald-500" />
                     <h4 className="text-lg font-black text-stone-800 mb-1">Pickup Scheduled</h4>
                     <p className="text-sm text-stone-500 font-medium">Your {activeCourier.category} donation is being claimed.</p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {/* ══════════ REORGANIZED TABS ══════════ */}
        <div className="flex items-center gap-8 mb-8 border-b border-stone-100 overflow-x-auto hide-scrollbar">
           {[ { id: 'overview', label: 'Priority Needs' }, { id: 'campaigns', label: 'Active Campaigns' }, { id: 'history', label: 'My Activity' } ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-4 text-sm font-black uppercase tracking-[0.15em] transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-stone-800' : 'text-stone-300'}`}>
                 {tab.label}
                 {activeTab === tab.id && <motion.div layoutId="donorTab" className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-full" />}
              </button>
           ))}
        </div>

        <div className="min-h-[500px]">
           <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="intel" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
                   <StrategicIntelShelf />
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                      <div className="p-10 rounded-[48px] bg-stone-900 text-white relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-10"><FiZap size={100} /></div>
                         <h3 className="text-2xl font-black mb-4">Network Status</h3>
                         <p className="text-sm text-stone-400 font-medium leading-relaxed mb-8">The Support Circle network is currently operating at 98% efficiency. Real-time matching is active for all categories.</p>
                         <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                            <motion.div initial={{ width:0 }} animate={{ width:'98%' }} className="h-full bg-emerald-500" />
                         </div>
                         <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500">
                            <span>Network Capacity</span>
                            <span className="text-emerald-400">98% Active</span>
                         </div>
                      </div>

                      <div className="p-10 rounded-[48px] bg-orange-600 text-white relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-20"><FiStar size={100} /></div>
                         <h3 className="text-2xl font-black mb-4">Ready to help?</h3>
                         <p className="text-sm text-orange-100 font-medium leading-relaxed mb-8">Every donation is intelligently matched to the facility that needs it most. Zero waste policy.</p>
                         <Link to="/donor/donate">
                           <button className="px-8 py-4 bg-white text-orange-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">Start Donation</button>
                         </Link>
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'campaigns' && (
                <motion.div key="camps" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
                   <CampaignSection user={user} profile={profile} role="donor" />
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div key="hist" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
                   <div className="bg-white rounded-[32px] border border-stone-100 p-8 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                         <div>
                            <h3 className="text-xl font-black text-stone-800">Donation History</h3>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Full contribution record</p>
                         </div>
                         <Link to="/donor/history" className="text-[11px] font-black text-orange-600 uppercase tracking-widest">View All Page</Link>
                      </div>
                      <DonationHistory limit={10} />
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>

        </div>
      </div>
    </LocationGuard>
  );
};
