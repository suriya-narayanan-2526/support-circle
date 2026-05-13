import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  FiArrowLeft, FiMail, FiPhone, FiCalendar, FiBox, 
  FiUser, FiShield, FiTrendingUp, FiActivity, FiMapPin, FiClock, FiStar, FiTruck, FiLayers
} from 'react-icons/fi';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';

const T = {
  navy: '#1E293B',
  orange: '#E8622A',
  orangeLight: '#FFF0E8',
  green: '#2D9B6F',
  greenLight: '#EDFAF4',
  blue: '#3B82F6',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSub: '#64748B',
};

export const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [roleMetrics, setRoleMetrics] = useState({ primary: 0, secondary: 0 });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(7); // 7 or 30 days
  const [activeMission, setActiveMission] = useState(null);

  useEffect(() => {
    fetchFullDetails();
  }, [id]);

  const fetchFullDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch User Profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (userError) throw userError;
      setUser(userData);

      // 2. Fetch Role Specific Metrics & Activity
      let activityRes;
      let metrics = { primary: 0, secondary: 0 };

      if (userData.role === 'volunteer') {
        const [missionsRes, ongoingRes, volProfileRes] = await Promise.all([
          supabase.from('donations').select('*').eq('volunteer_id', id).eq('status', 'delivered'),
          supabase.from('donations').select('*').eq('volunteer_id', id).in('status', ['in_transit', 'picked_up', 'arrived']).maybeSingle(),
          supabase.from('volunteers').select('*').eq('user_id', id).maybeSingle()
        ]);
        
        const missions = missionsRes.data;
        if (volProfileRes.data) setVolunteerProfile(volProfileRes.data);
        if (ongoingRes.data) setActiveMission(ongoingRes.data);
        
        activityRes = { data: missions };
        metrics.primary = (missions || []).length;
        metrics.secondary = (missions || []).reduce((s, m) => s + (m.quantity || 0), 0);
      } else if (userData.role === 'orphanage') {
        const { data: reqs } = await supabase.from('orphan_requests').select('*').eq('orphanage_id', id).order('created_at', { ascending: false });
        activityRes = { data: reqs };
        metrics.primary = (reqs || []).length;
        metrics.secondary = (reqs || []).filter(r => r.status === 'completed').length;
      } else {
        // Partner or Donor
        const { data: dons } = await supabase.from('donations').select('*').eq('donor_id', id).order('created_at', { ascending: false });
        const { data: camps } = await supabase.from('campaign_participants').select('id').eq('user_id', id);
        activityRes = { data: dons };
        metrics.primary = (dons || []).length;
        metrics.secondary = (camps || []).length;
      }
      
      setActivity(activityRes.data || []);
      setRoleMetrics(metrics);

    } catch (err) {
      console.error('Error fetching details:', err);
      toast.error('Could not load user profile');
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!activity.length) return [];
    const days = timeframe;
    const map = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      map[key] = { name: key, count: 0, units: 0 };
    }

    activity.forEach(act => {
      const dateKey = new Date(act.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (map[dateKey]) {
        map[dateKey].count += 1;
        map[dateKey].units += (act.quantity || 0);
      }
    });

    return Object.values(map);
  }, [activity, timeframe]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 40, height: 40, border: `4px solid ${T.orange}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
    </div>
  );

  if (!user) return <div style={{ padding: 100, textAlign: 'center' }}>User not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ minHeight: '100vh', background: T.bg, padding: '40px 20px' }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        <motion.button 
          whileHover={{ x: -5 }} onClick={() => navigate('/admin/dashboard?view=volunteers')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: T.textSub, fontWeight: 700, cursor: 'pointer', marginBottom: 32, fontSize: 14 }}
        >
          <FiArrowLeft /> Back to Command Center
        </motion.button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: T.surface, borderRadius: 32, padding: '48px', border: `1px solid ${T.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden', marginBottom: 32 }}
        >
           <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: `linear-gradient(135deg, transparent, ${T.orangeLight})`, opacity: 0.5 }} />
           
           <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
              <div style={{ width: 140, height: 140, borderRadius: 40, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.orange, boxShadow: '0 8px 24px rgba(232, 98, 42, 0.12)', overflow: 'hidden', border: `4px solid #fff` }}>
                 {volunteerProfile?.face_image ? (
                   <img src={volunteerProfile.face_image} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 ) : (
                   <FiUser size={70} />
                 )}
              </div>
              
              <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: T.orange, background: T.orangeLight, padding: '6px 14px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {user.role} Intelligence
                    </span>
                    <span style={{ fontSize: 13, color: T.textSub, fontWeight: 600 }}>Dossier: {user.id.slice(0, 12)}</span>
                    {user.role === 'volunteer' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#D97706', background: '#FFFBEB', padding: '6px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700, border: '1px solid rgba(217,119,6,0.1)' }}>
                           <FiStar fill="#D97706" size={14} /> {volunteerProfile?.rating ? volunteerProfile.rating.toFixed(1) : '5.0'} Performance Rating
                        </div>
                     )}
                 </div>
                 <h1 style={{ fontSize: 48, fontWeight: 900, color: T.text, letterSpacing: '-0.03em', marginBottom: 8 }}>{user.full_name || 'Verified Member'}</h1>
                 <p style={{ fontSize: 18, color: T.textSub, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}><FiMail /> {user.email}</p>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                 <button style={{ padding: '14px 28px', borderRadius: 16, background: T.navy, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>UPDATE ACCESS</button>
              </div>
           </div>
        </motion.div>

        {/* ONGOING MISSION INTELLIGENCE */}
        {activeMission && (
          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
            style={{ background: T.greenLight, border: `1px solid ${T.green}30`, borderRadius: 28, padding: 32, marginBottom: 32, display: 'flex', gap: 32, alignItems: 'center' }}
          >
             <div style={{ width: 64, height: 64, borderRadius: 18, background: T.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${T.green}30` }}>
                <FiTruck size={32} />
             </div>
             <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                   <span style={{ fontSize: 10, fontWeight: 900, color: T.green, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Operational Intel</span>
                   <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} className="animate-pulse" />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: T.text }}>Ongoing {activeMission.category} Pickup</h3>
                <div style={{ display: 'flex', gap: 32, marginTop: 16 }}>
                   <div>
                      <p style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase' }}>Donor Identity</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{activeMission.donor_name}</p>
                   </div>
                   <div>
                      <p style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase' }}>Secure Contact</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{activeMission.contact_number}</p>
                   </div>
                   <div>
                      <p style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase' }}>Pickup Location</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                        {activeMission.pickup_address?.address_line1}, {activeMission.pickup_address?.city}
                      </p>
                   </div>
                </div>
             </div>
             <div style={{ padding: '12px 24px', background: '#fff', borderRadius: 16, border: `1px solid ${T.green}20`, textAlign: 'center' }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 4 }}>Access Pin</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: T.text, letterSpacing: '0.1em' }}>{activeMission.pickup_address?.pickup_otp || 'N/A'}</p>
             </div>
          </motion.div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                style={{ background: T.surface, borderRadius: 24, padding: 32, border: `1px solid ${T.border}` }}
              >
                 <h3 style={{ fontSize: 12, fontWeight: 900, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 24 }}>Operational Data</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {[
                       { label: 'Primary Contact', value: user.phone || 'Classified', icon: FiPhone, color: T.green },
                       { label: 'Base Location', value: user.location || volunteerProfile?.address || 'N/A', icon: FiMapPin, color: T.blue },
                       { label: 'Deployment Status', value: volunteerProfile?.status?.replace('_', ' ') || 'Active', icon: FiShield, color: T.orange },
                       { label: 'Commission Date', value: new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }), icon: FiCalendar, color: T.navy },
                    ].map((item, i) => (
                       <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, border: `1px solid ${T.border}` }}>
                             <item.icon size={20} />
                          </div>
                          <div>
                             <p style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase' }}>{item.label}</p>
                             <p style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{item.value}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                style={{ background: T.surface, borderRadius: 24, padding: 32, border: `1px solid ${T.border}` }}
              >
                 <h3 style={{ fontSize: 12, fontWeight: 900, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 24 }}>Mission Summary</h3>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ padding: 24, background: T.bg, borderRadius: 20, textAlign: 'center', border: `1px solid ${T.border}` }}>
                       <p style={{ fontSize: 32, fontWeight: 900, color: T.orange }}>{roleMetrics.primary}</p>
                       <p style={{ fontSize: 10, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', marginTop: 4 }}>
                          {user.role === 'volunteer' ? 'Completed Missions' : 'Total Contributions'}
                       </p>
                    </div>
                    <div style={{ padding: 24, background: T.bg, borderRadius: 20, textAlign: 'center', border: `1px solid ${T.border}` }}>
                       <p style={{ fontSize: 32, fontWeight: 900, color: T.green }}>{roleMetrics.secondary}</p>
                       <p style={{ fontSize: 10, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', marginTop: 4 }}>
                          {user.role === 'volunteer' ? 'Impact Units' : 'Global Reached'}
                       </p>
                    </div>
                 </div>
              </motion.div>
           </div>

           <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ background: T.surface, borderRadius: 32, padding: 40, border: `1px solid ${T.border}` }}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 900, color: T.text }}>Performance Intelligence</h3>
                      <p style={{ fontSize: 14, color: T.textSub }}>Mission fulfillment velocity over time.</p>
                    </div>
                    <div style={{ background: T.bg, padding: 4, borderRadius: 12, display: 'flex', gap: 4, border: `1px solid ${T.border}` }}>
                       {[7, 30].map(d => (
                         <button 
                           key={d} onClick={() => setTimeframe(d)}
                           style={{ padding: '8px 16px', borderRadius: 8, background: timeframe === d ? T.surface : 'transparent', color: timeframe === d ? T.text : T.textSub, border: timeframe === d ? `1px solid ${T.border}` : 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                         >
                           {d}D
                         </button>
                       ))}
                    </div>
                 </div>

                 <div style={{ height: 260, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData}>
                          <defs>
                             <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={T.orange} stopOpacity={0.2}/>
                                <stop offset="95%" stopColor={T.orange} stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.border} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: T.textSub, fontSize: 10, fontWeight: 700 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textSub, fontSize: 10, fontWeight: 700 }} />
                          <Tooltip 
                            contentStyle={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: 12, fontWeight: 700 }}
                            itemStyle={{ color: T.orange }}
                          />
                          <Area type="monotone" dataKey="count" stroke={T.orange} strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                style={{ background: T.surface, borderRadius: 32, padding: 40, border: `1px solid ${T.border}` }}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: T.text }}>Mission Ledger</h3>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: T.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.green }}>
                       <FiLayers size={22} />
                    </div>
                 </div>

                 {activity.length === 0 ? (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                       <FiTruck size={48} color={T.border} style={{ marginBottom: 16 }} />
                       <p style={{ color: T.textSub, fontWeight: 600 }}>No mission history available for this operative.</p>
                    </div>
                 ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                       {activity.slice(0, 5).map((act, i) => (
                          <div key={i} style={{ display: 'flex', gap: 20, padding: 20, background: T.bg, borderRadius: 20, border: `1px solid ${T.border}` }}>
                             <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.orange }}>
                                <FiBox size={24} />
                             </div>
                             <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                   <h4 style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{act.category} Pickup</h4>
                                   <span style={{ fontSize: 11, fontWeight: 800, color: T.textSub }}>{new Date(act.created_at).toLocaleDateString()}</span>
                                </div>
                                <p style={{ fontSize: 13, color: T.textSub, fontWeight: 500, lineHeight: 1.5 }}>
                                   Successfully retrieved and delivered {act.quantity} resource units to targeted facility.
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: T.green, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                   <FiClock /> Delivery Verified
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </motion.div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};
