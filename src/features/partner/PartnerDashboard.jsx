import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { CampaignSection } from '../../components/CampaignSection';
import { StrategicIntelShelf } from '../../components/StrategicIntelShelf';
import { PageLoader } from '../../components/PageLoader';
import { CSRApplicationPage } from './CSRApplicationPage';
import { SmoothMap } from '../../components/SmoothMap';
import { useLocationSystem } from '../../hooks/useLocationSystem';
import { LocationGuard } from '../../components/LocationGuard';
import { FiGrid, FiDollarSign, FiTarget, FiUser, FiActivity, FiEdit2, FiAlertCircle, FiUsers, FiSave, FiX, FiBox, FiFileText, FiStar, FiCheckCircle, FiHeart, FiClock } from 'react-icons/fi';

/* ─── DESIGN TOKENS (Cream & Sage Theme) ─── */
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
  bgAlt:        '#FFF8F3',
  surface:      '#FFFFFF',
  surfaceWarm:  '#FFF5EE',
  border:       'rgba(28,25,23,0.07)',
  borderMid:    'rgba(28,25,23,0.11)',
  text:         '#1C1917',
  textSub:      '#57534E',
  textMuted:    '#A8A29E',
};

/* ─── DOT GRID ─── */
function DotGrid({ opacity = 0.03 }) {
  return (
    <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, pointerEvents: 'none' }}>
      <defs>
        <pattern id="dash-dots-partner-light" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#1C1917" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dash-dots-partner-light)" />
    </svg>
  );
}

/* ─── MAGNETIC CARD ─── */
function TiltCard({ children, intensity = 5, className = '' }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const sx = useSpring(rx, { stiffness: 240, damping: 24 });
  const sy = useSpring(ry, { stiffness: 240, damping: 24 });

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    rx.set(((e.clientY - top) / height - 0.5) * -intensity);
    ry.set(((e.clientX - left) / width - 0.5) * intensity);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };

  return (
    <motion.div
      ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ rotateX: sx, rotateY: sy, transformStyle: 'preserve-3d', willChange: 'transform' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── STAT CARD ─── */
function StatCard({ label, value, Icon, color, glow, light, border, delay, loading }) {
  return (
    <TiltCard intensity={7}>
      <motion.div
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        transition={{ delay, duration:0.6, ease:[0.22,1,0.36,1] }}
        whileHover={{ y:-4, boxShadow:`0 24px 48px -8px ${glow}` }}
        style={{
          background: T.surface, border: `1px solid ${border}`, borderRadius: 20,
          padding: '24px 24px 20px', position: 'relative', overflow: 'hidden',
          boxShadow: `0 2px 16px -2px ${glow}`, transition: 'box-shadow 0.25s',
        }}
      >
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${color}, transparent)`, borderRadius:'20px 20px 0 0' }} />
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 60% 60% at 0% 0%, ${light} 0%, transparent 80%)`, opacity:0.7 }} />

        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:light, border:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center', color }}>
              <Icon size={18}/>
            </div>
            <FiActivity size={20} color={T.borderMid} />
          </div>
          
          <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:T.textMuted, marginBottom:4 }}>{label}</p>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            {loading ? (
               <div style={{ width:60, height:32, background:T.borderMid, borderRadius:6 }} className="animate-pulse" />
            ) : (
               <span style={{ fontSize:32, fontWeight:800, color:T.text, letterSpacing:'-0.03em', lineHeight:1 }}>{value}</span>
            )}
          </div>
        </div>
      </motion.div>
    </TiltCard>
  );
}

/* ─── MAIN EXPORT ─── */
export const PartnerDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ institution_name: '', institution_type: '', location: '', address: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [stats, setStats] = useState({ inKindImpact: '0', activeCampaigns: '0', childrenReached: '0' });
  const [partnerData, setPartnerData] = useState(null);
  const [isCsrVerified, setIsCsrVerified] = useState(false);
  const [activeCourier, setActiveCourier] = useState(null);

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const [partnerRes, donationsRes, participantsRes, csrRes, activeRes] = await Promise.all([
          supabase.from('partners').select('*').eq('user_id', user.id).single(),
          supabase.from('donations').select('quantity').eq('donor_id', user.id),
          supabase.from('campaign_participants').select('campaign_id').eq('user_id', user.id),
          supabase.from('csr_applications').select('id').eq('partner_id', user.id).eq('status', 'Approved').limit(1),
          supabase.from('donations').select('*').eq('donor_id', user.id).eq('status', 'in_transit').order('created_at', { ascending: false }).limit(1).maybeSingle()
        ]);

        if (csrRes.data && csrRes.data.length > 0) setIsCsrVerified(true);
        
        if (activeRes.data && activeRes.data.volunteer_id) {
          const { data: volData } = await supabase.from('volunteers').select('full_name, phone, face_image, status, rating, total_reviews').eq('user_id', activeRes.data.volunteer_id).maybeSingle();
          if (volData) {
            setActiveCourier({ ...activeRes.data, volunteer: volData });
          } else {
            setActiveCourier(null);
          }
        } else {
          setActiveCourier(null);
        }

        let joinedCampaignsData = [];
        if (participantsRes.data && participantsRes.data.length > 0) {
          const campaignIds = participantsRes.data.map(p => p.campaign_id);
          const { data: cData } = await supabase.from('campaigns').select('*').in('id', campaignIds).order('created_at', { ascending: false });
          if (cData) joinedCampaignsData = cData;
        }
        
        if (partnerRes.data) {
          const data = partnerRes.data;
          setPartnerData(data);
          setEditForm({
            institution_name: data.institution_name || '',
            institution_type: data.institution_type || 'Corporate',
            location: data.location || '',
            address: data.address || ''
          });
        }

        if (donationsRes.data) {
          const totalEvents = donationsRes.data.length;
          const totalQuantity = donationsRes.data.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
          const activeCampaignsCount = joinedCampaignsData.length;
          
          setCampaigns(joinedCampaignsData);

          setStats(prev => ({ 
            ...prev, 
            inKindImpact: totalEvents.toString(),
            activeCampaigns: activeCampaignsCount.toString(),
            childrenReached: totalQuantity.toString()
          }));

          // Group by category for chart
          const groups = donationsRes.data.reduce((acc, d) => {
            const cat = d.category || 'General Support';
            if (!acc[cat]) acc[cat] = { name: cat, "Children Reached": 0, "Resource Contributions": 0 };
            acc[cat]["Children Reached"] += (Number(d.quantity) || 0);
            acc[cat]["Resource Contributions"] += 1;
            return acc;
          }, {});

          setChartData(Object.values(groups));
        }
      } catch (err) {
        console.error('Failed to load partner stats', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchPartner();

    const channel = supabase
      .channel('partner-donations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations', filter: `donor_id=eq.${user.id}` }, () => {
         fetchPartner();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ══════════ NEW HIGH-PRECISION TRACKING ══════════
  const { status: locationStatus, error, isBlocked, requestRetry } = useLocationSystem(
    user, 
    'partner', 
    !!user
  );

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update(editForm)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setPartnerData(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
      toast.success('Corporate profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiGrid },
    { id: 'contributions', label: 'Contributions', icon: FiBox },
    { id: 'programs', label: 'Joined Campaigns', icon: FiTarget },
    { id: 'csr', label: 'CSR Application', icon: FiFileText },
    { id: 'profile', label: 'Profile Management', icon: FiUser },
  ];

  const firstName = profile?.full_name?.split(' ')[0] || 'Partner';

  if (loading) return <PageLoader message="Loading Dashboard" subtitle="Preparing institutional insights..." />;

  return (
    <LocationGuard status={locationStatus} error={error} onRetry={requestRetry}>
      <div style={{ minHeight: '100vh', background: T.bg, position: 'relative', overflowX: 'hidden', paddingBottom: 80 }}>
        <DotGrid />

      {/* Ambient Orbs */}
      <div style={{ position:'absolute', top:'-8%', right:'-4%', width:'44vw', height:'44vw', background:'radial-gradient(ellipse, rgba(232,98,42,0.07) 0%, transparent 65%)', filter:'blur(80px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'5%', left:'-6%', width:'32vw', height:'32vw', background:'radial-gradient(ellipse, rgba(45,155,111,0.06) 0%, transparent 65%)', filter:'blur(80px)', pointerEvents:'none' }}/>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Pending Verification Banner */}
        {!loading && partnerData && !partnerData.is_verified && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ 
              background: T.amberLight, border: `1px solid ${T.amberBorder}`, 
              borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 
            }}
          >
            <FiAlertCircle size={24} color={T.amber} />
            <div style={{ color: T.amber, fontSize: 14 }}>
              <span style={{ fontWeight: 800 }}>Pending Verification:</span> Your institution account is under review. Campaigns cannot go live until approved by an Admin.
            </div>
          </motion.div>
        )}

        {/* ══════════ MODERN COMMAND CENTER HERO ══════════ */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 mb-16 p-12 bg-white rounded-[40px] border border-stone-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-50/50 to-transparent pointer-events-none" />
           
           <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.6 }} className="relative z-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full mb-6">
                 <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                 <span className="text-[9px] font-black tracking-[0.25em] text-stone-500 uppercase">Partner Status: Authorized</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-stone-900 leading-none">
                {partnerData?.institution_name || `Hello, ${firstName}.`}
              </h1>
              <p className="mt-4 text-stone-400 font-medium max-w-sm leading-relaxed">
                Your institutional CSR initiatives are active. Track your community impact below.
              </p>
           </motion.div>

           <div className="flex flex-col items-center lg:items-end gap-6 relative z-10 w-full lg:w-auto">
              <div className="flex items-center gap-6">
                 <div className="text-center">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">CSR Status</p>
                    <p className={`text-sm font-black ${isCsrVerified ? 'text-emerald-500' : 'text-amber-500'} uppercase tracking-tighter`}>
                      {isCsrVerified ? 'Verified' : 'Pending'}
                    </p>
                 </div>
                 <div className="w-[1px] h-8 bg-stone-100" />
                 <div className="text-center">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Network</p>
                    <p className="text-sm font-black text-emerald-500 uppercase tracking-tighter">Connected</p>
                 </div>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setActiveTab('csr')} className="px-6 py-3 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors">
                    Manage CSR
                 </button>
              </div>
           </div>
        </div>

        {/* ══════════ METRIC PODS ══════════ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
             {/* Resource Contributions Pod */}
             <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.1 }}
                className="p-8 bg-white border border-stone-100 rounded-[32px] shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600" />
                <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                      <FiBox size={20} />
                   </div>
                   <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Global CSR</span>
                </div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Resource Contributions</p>
                <h3 className="text-5xl font-black text-stone-900 tracking-tighter mb-6">{loading ? '...' : stats.inKindImpact}</h3>
                <div className="flex items-center gap-2">
                   <div className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-black">+8%</div>
                   <span className="text-[10px] font-bold text-stone-300">Vs Last Quarter</span>
                </div>
             </motion.div>

             {/* Joined Campaigns Pod */}
             <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.2 }}
                className="p-8 bg-white border border-stone-100 rounded-[32px] shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-orange-600" />
                <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-100">
                      <FiTarget size={20} />
                   </div>
                   <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Active Sponsorships</span>
                </div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Joined Campaigns</p>
                <h3 className="text-5xl font-black text-stone-900 tracking-tighter mb-6">{loading ? '...' : stats.activeCampaigns}</h3>
                <div className="flex items-center gap-2">
                   <div className="px-2 py-0.5 rounded bg-orange-50 text-orange-600 text-[9px] font-black">STABLE</div>
                   <span className="text-[10px] font-bold text-stone-300">Social Engagement</span>
                </div>
             </motion.div>

             {/* Children Reached Pod */}
             <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.3 }}
                className="p-8 bg-stone-900 text-white rounded-[32px] shadow-xl relative group overflow-hidden border border-stone-800">
                <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 pointer-events-none">
                   <FiUsers size={80} />
                </div>
                <div className="relative z-10">
                   <div className="flex justify-between items-center mb-6">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 text-amber-400">
                         <FiHeart size={22} />
                      </div>
                      <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.25em] bg-amber-400/10 px-3 py-1 rounded-full">Primary Impact</span>
                   </div>
                   <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Children Reached</p>
                   <h3 className="text-5xl font-black text-white tracking-tight mb-8 leading-tight">
                      {loading ? '...' : stats.childrenReached}
                   </h3>
                   <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => <div key={i} className="h-1.5 flex-1 bg-orange-500 rounded-full" />)}
                   </div>
                </div>
             </motion.div>
          </div>
        )}

        {/* ACTIVE COURIER TRACKER */}
        {activeCourier && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
            className="w-full relative overflow-hidden"
            style={{ background:T.surface, border:`1px solid ${T.greenBorder}`, borderRadius:24, boxShadow:'0 8px 32px rgba(45,155,111,0.08)' }}>
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 70% 70% at 100% 0%, ${T.greenLight} 0%, transparent 80%)`, opacity:0.8, pointerEvents:'none' }}/>
            
            <div style={{ padding:'20px 24px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', zIndex:2 }}>
               <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div className="relative">
                     <span style={{ width:10, height:10, borderRadius:'50%', background:T.green, display:'block' }} className="animate-pulse" />
                     <span style={{ position:'absolute', inset:-4, borderRadius:'50%', background:T.green, opacity:0.3 }} className="animate-ping" />
                  </div>
                  <h2 style={{ fontSize:16, fontWeight:800, color:T.text, letterSpacing:'-0.01em', textTransform:'uppercase' }}>Live Courier En Route</h2>
               </div>
               <span style={{ fontSize:10, fontWeight:800, color:T.green, background:T.greenLight, padding:'4px 10px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                 {activeCourier.category} Pickup
               </span>
            </div>

            <div style={{ padding:'24px', display:'flex', gap:20, alignItems:'center', flexWrap:'wrap', position:'relative', zIndex:2 }}>
               <div style={{ width:72, height:72, borderRadius:20, background:T.bg, border:`2px solid ${T.greenBorder}`, padding:3, flexShrink:0 }}>
                  <div style={{ width:'100%', height:'100%', borderRadius:16, overflow:'hidden', background:T.surfaceWarm, display:'flex', alignItems:'center', justifyContent:'center' }}>
                     {activeCourier.volunteer?.face_image ? 
                       <img src={activeCourier.volunteer.face_image} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : 
                       <FiHeart size={24} color={T.green} />
                     }
                  </div>
               </div>
               <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                     <h3 style={{ fontSize:20, fontWeight:800, color:T.text, textTransform:'capitalize' }}>{activeCourier.volunteer?.full_name || 'Volunteer'}</h3>
                     <FiCheckCircle color={T.green} fill={T.greenLight} size={16} />
                  </div>
                  
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                     <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(i => <FiStar key={i} size={12} fill={T.amber} color={T.amber} />)}
                     </div>
                     <span style={{ fontSize: 11, fontWeight: 700, color: T.textSub }}>{activeCourier.volunteer?.rating ? activeCourier.volunteer.rating.toFixed(1) : '0.0'} ({activeCourier.volunteer?.total_reviews || 0} Reviews)</span>
                  </div>
                  <p style={{ fontSize:13, color:T.textMuted, fontWeight:600, marginBottom:8 }}>Verified Support Circle Logistics Partner</p>
                  
                  <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                      <div>
                         <span style={{ fontSize:10, color:T.textMuted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Contact</span>
                         <p style={{ fontSize:14, fontWeight:700, color:T.text }}>{activeCourier.volunteer?.phone || 'Hidden'}</p>
                      </div>
                      <div style={{ width:1, height:24, background:T.border }} />
                      <div>
                         <span style={{ fontSize:10, color:T.textMuted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Items</span>
                         <p style={{ fontSize:14, fontWeight:700, color:T.text }}>{activeCourier.quantity} Total</p>
                      </div>
                      {activeCourier.pickup_address?.pickup_otp && (
                        <>
                           <div style={{ width:1, height:24, background:T.border }} className="hidden sm:block" />
                           <div style={{ background: T.bg, padding: '4px 12px', borderRadius: 12, border: `1px solid ${T.greenBorder}` }}>
                              <span style={{ fontSize:9, color:T.green, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:1 }}>Pickup PIN</span>
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                 <p style={{ fontSize:18, fontWeight:900, color:T.text, letterSpacing:'0.15em', fontFamily:'monospace' }}>{activeCourier.pickup_address.pickup_otp}</p>
                              </div>
                           </div>
                        </>
                      )}
                   </div>
               </div>
            </div>

            <div style={{ padding:'0 24px 24px', position: 'relative', zIndex: 2 }}>
                 <SmoothMap 
                    targetUserId={activeCourier.volunteer_id}
                    targetRole="volunteer"
                    viewerId={user.id}
                    viewerRole="partner"
                    destination={{
                        lat: parseFloat(activeCourier.pickup_address?.lat) || (partnerData?.latitude || 0),
                        lng: parseFloat(activeCourier.pickup_address?.lng) || (partnerData?.longitude || 0)
                    }}
                />
            </div>
          </motion.div>
        )}

        {/* TAB NAVIGATION */}
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', borderBottom: `1px solid ${T.borderMid}` }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'contributions') {
                  navigate('/partner/contributions');
                } else {
                  setActiveTab(tab.id);
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s', background: 'transparent',
                color: activeTab === tab.id ? T.orange : T.textSub,
                borderBottom: activeTab === tab.id ? `3px solid ${T.orange}` : '3px solid transparent',
              }}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">

                {/* Dynamic Impact Chart */}
                <div style={{ background: T.surface, padding: '32px', borderRadius: 24, border: `1px solid ${T.borderMid}`, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4 }}>Resource Distribution Impact</h3>
                      <p style={{ fontSize: 13, color: T.textSub }}>Total items contributed across different essential categories</p>
                    </div>
                    <div style={{ padding: '6px 12px', background: T.greenLight, borderRadius: 12, border: `1px solid ${T.greenGlow}` }}>
                       <span style={{ fontSize: 12, fontWeight: 800, color: T.green }}>Live Analytics</span>
                    </div>
                  </div>

                  {loading ? (
                    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}>
                       Loading analytics...
                    </div>
                  ) : chartData.length === 0 ? (
                    <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.surfaceWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <FiActivity size={20} color={T.textMuted} />
                      </div>
                      <p style={{ color: T.textSub, fontSize: 14, fontWeight: 500 }}>No donation data available to visualize yet.</p>
                    </div>
                  ) : (
                    <div style={{ height: 320, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.border} />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: T.textSub, fontSize: 12, fontWeight: 600 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: T.textSub, fontSize: 12, fontWeight: 600 }}
                          />
                          <Tooltip 
                            cursor={{ fill: T.surfaceWarm, radius: 8 }}
                            contentStyle={{ background: T.surface, border: `1px solid ${T.borderMid}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: '12px' }}
                            itemStyle={{ fontWeight: 800, fontSize: 13 }}
                            labelStyle={{ fontWeight: 800, marginBottom: 4, color: T.text }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            align="right" 
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: 20, fontSize: 12, fontWeight: 700 }}
                          />
                          <Bar dataKey="Children Reached" fill={T.orange} radius={[4, 4, 0, 0]} barSize={30} />
                          <Bar dataKey="Resource Contributions" fill={T.green} radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* AI STRATEGIC INTEL SHELF */}
                <StrategicIntelShelf />

                {/* Active Campaigns - Join & Donate */}
                <CampaignSection user={user} profile={profile} role="community_partner" />
              </div>
            )}


            {/* PROGRAMS TAB */}
            {activeTab === 'programs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.borderMid}`, overflow: 'hidden' }}>
                  <div style={{ padding: 32, borderBottom: `1px solid ${T.borderMid}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.surfaceWarm }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Joined Campaigns</h3>
                      <p style={{ fontSize: 14, color: T.textSub, marginTop: 4 }}>Institutional CSR initiatives and sponsored programs your organization has joined.</p>
                    </div>
                  </div>
                  
                  <div style={{ padding: 32 }}>
                    {campaigns.length === 0 ? (
                      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                        <p style={{ color: T.textSub, fontSize: 14, fontWeight: 500 }}>Your institution is not currently funding any active campaigns.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                        {campaigns.map(campaign => {
                          const progress = campaign.goal_amount ? Math.min(100, Math.round((campaign.current_amount || 0) / campaign.goal_amount * 100)) : 0;
                          const daysLeft = campaign.end_date ? Math.max(0, Math.ceil((new Date(campaign.end_date) - new Date()) / (1000 * 60 * 60 * 24))) : null;
                          
                          return (
                            <div key={campaign.id} style={{ border: `1px solid ${T.borderMid}`, borderRadius: 20, padding: 24, background: T.surface, position: 'relative' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                  <span style={{ fontSize: 10, fontWeight: 800, color: T.orange, background: T.orangeLight, padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {campaign.status}
                                  </span>
                                  <h4 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginTop: 12 }}>{campaign.title}</h4>
                                </div>
                              </div>

                              <div style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 8 }}>
                                  <span>{campaign.current_amount || 0} / {campaign.goal_amount || 0} items collected</span>
                                  <span>{progress}%</span>
                                </div>
                                <div style={{ height: 8, background: T.surfaceWarm, borderRadius: 4, overflow: 'hidden' }}>
                                  <motion.div 
                                    initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                                    style={{ height: '100%', background: T.orange, borderRadius: 4 }}
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <div style={{ fontSize: 12, color: T.textSub }}>
                                    {daysLeft !== null ? <><span style={{ fontWeight: 800, color: T.text }}>{daysLeft}</span> days left</> : 'No deadline'}
                                 </div>
                                 <button onClick={() => navigate(`/community/request/${campaign.id}`)} style={{ background: T.surfaceWarm, border: `1px solid ${T.borderMid}`, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: T.text, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = T.borderMid} onMouseLeave={e => e.currentTarget.style.background = T.surfaceWarm}>
                                    View Details
                                 </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div style={{ maxWidth: 800 }}>
                <div style={{ background: T.surface, padding: 40, borderRadius: 24, border: `1px solid ${T.borderMid}`, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Corporate Profile Details</h3>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: T.surfaceWarm, border: `1px solid ${T.borderMid}`, borderRadius: 10, fontWeight: 800, color: T.text, cursor: 'pointer' }}>
                        <FiEdit2 size={16} /> Edit Profile
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setIsEditing(false)} disabled={savingProfile} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'transparent', border: `1px solid ${T.borderMid}`, borderRadius: 10, fontWeight: 700, color: T.textSub, cursor: 'pointer' }}>
                          <FiX size={16} /> Cancel
                        </button>
                        <button onClick={handleSaveProfile} disabled={savingProfile} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: T.orange, border: 'none', borderRadius: 10, fontWeight: 800, color: '#fff', cursor: 'pointer' }}>
                          {savingProfile ? 'Saving...' : <><FiSave size={16} /> Save Changes</>}
                        </button>
                      </div>
                    )}
                  </div>

                  {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>Loading profile...</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Institution Name</p>
                        {isEditing ? (
                           <input type="text" value={editForm.institution_name} onChange={e => setEditForm({...editForm, institution_name: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.borderMid}`, background: T.surfaceWarm, fontSize: 15, fontWeight: 700, color: T.text, outline: 'none' }} />
                        ) : (
                           <p style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{partnerData?.institution_name || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Institution Type</p>
                        {isEditing ? (
                           <select value={editForm.institution_type} onChange={e => setEditForm({...editForm, institution_type: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.borderMid}`, background: T.surfaceWarm, fontSize: 15, fontWeight: 700, color: T.text, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                              <option value="School">School</option>
                              <option value="College">College</option>
                              <option value="Corporate">Corporate</option>
                              <option value="Other">Other</option>
                           </select>
                        ) : (
                           <p style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{partnerData?.institution_type || 'Corporate'}</p>
                        )}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Representative Name</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{profile?.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Email Address</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{user?.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>City / Region</p>
                        {isEditing ? (
                           <input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.borderMid}`, background: T.surfaceWarm, fontSize: 15, fontWeight: 700, color: T.text, outline: 'none' }} />
                        ) : (
                           <p style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{partnerData?.location || 'Not provided'}</p>
                        )}
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Full Pickup Address</p>
                        {isEditing ? (
                           <textarea value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} rows={3} placeholder="Enter full street address for donation pickups" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.borderMid}`, background: T.surfaceWarm, fontSize: 15, fontWeight: 700, color: T.text, outline: 'none', resize: 'vertical' }} />
                        ) : (
                           <p style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{partnerData?.address || 'No pickup address provided. Please edit to add.'}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CSR APPLICATION TAB */}
            {activeTab === 'csr' && (
              <CSRApplicationPage user={user} profile={profile} />
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
    </LocationGuard>
  );
};
