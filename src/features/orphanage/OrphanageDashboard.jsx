import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { RequestHistory } from './RequestHistory';
import { FiAlertCircle, FiClipboard, FiAlertTriangle, FiPlus, FiSettings, FiBriefcase, FiMapPin, FiBarChart2, FiUser, FiHome, FiImage, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageLoader } from '../../components/PageLoader';

/* ─── DESIGN TOKENS (Cream & Sage Theme - Professional) ─── */
const T = {
  orange:       '#E8622A',
  orangeDark:   '#C4521F',
  orangeGlow:   'rgba(232,98,42,0.12)',
  orangeLight:  '#FFF0E8',
  orangeBorder: 'rgba(232,98,42,0.18)',
  green:        '#2D9B6F',
  greenGlow:    'rgba(45,155,111,0.10)',
  greenLight:   '#EDFAF4',
  greenBorder:  'rgba(45,155,111,0.20)',
  bg:           '#FFFDF9',
  surface:      '#FFFFFF',
  border:       'rgba(28,25,23,0.08)',
  text:         '#1C1917',
  textSub:      '#57534E',
  textMuted:    '#A8A29E',
};

/* ─── UI HELPERS ─── */
function DotGrid({ opacity = 0.03 }) {
  return (
    <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, pointerEvents: 'none' }}>
      <defs><pattern id="prof-dots-final" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#1C1917" /></pattern></defs>
      <rect width="100%" height="100%" fill="url(#prof-dots-final)" />
    </svg>
  );
}

const OrganizationSettingsModal = ({ isOpen, onClose, data, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: data?.name || '',
    location: data?.location || '',
    capacity: data?.capacity || 0,
    fullName: data?.fullName || '',
    image_url: data?.image_url || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [preview, setPreview] = useState(data?.image_url || '');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setPreview(base64);
        setFormData(prev => ({ ...prev, image_url: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await Promise.all([
        supabase.from('orphanages').update({ 
          name: formData.name, 
          location: formData.location, 
          capacity: formData.capacity, 
          image_url: formData.image_url 
        }).eq('user_id', data.user_id),
        supabase.from('users').update({ full_name: formData.fullName }).eq('id', data.user_id)
      ]);
      onUpdate({ ...formData });
      toast.success('Organization data synchronized.');
      onClose();
    } catch (err) {
      console.error('Update failed:', err);
      toast.error(`Update Error: ${err.message || 'Verification failed'}`);
    } finally { setIsUpdating(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white rounded-[24px] w-full max-w-2xl overflow-hidden relative z-10 shadow-2xl border border-stone-200">
        <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <h2 className="text-xl font-bold text-stone-900 uppercase tracking-widest">Organization Settings</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 transition-colors">✕</button>
        </div>
        <div className="p-8 space-y-8 overflow-y-auto max-h-[75vh]">
          <div className="flex items-center gap-8 py-4">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 group">
              {preview ? <img src={preview} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-stone-300"><FiHome size={32} /></div>}
              <label htmlFor="orphanage-photo-upload-final" className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                <FiImage size={18} className="mb-1" />
                <span className="text-[9px] font-black uppercase tracking-widest">Change</span>
              </label>
              <input id="orphanage-photo-upload-final" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
            <div><h3 className="text-stone-900 font-bold mb-1">Corporate Portrait</h3><p className="text-xs text-stone-500">Official profile imagery for the organization.</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Representative Name</label><input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-semibold text-stone-900 focus:border-orange-500 transition-all outline-none" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Entity Name</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-semibold text-stone-900 focus:border-orange-500 transition-all outline-none" /></div>
          </div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Physical Location</label><input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-semibold text-stone-900 focus:border-orange-500 transition-all outline-none" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Child Capacity</label><input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-semibold text-stone-900 focus:border-orange-500 transition-all outline-none" /></div>
        </div>
        <div className="p-8 bg-stone-50/50 border-t border-stone-100 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 text-xs font-black text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-widest">Discard</button>
          <button onClick={handleSave} disabled={isUpdating} className="flex-1 py-4 bg-stone-900 text-white rounded-xl text-xs font-black shadow-lg hover:bg-stone-800 transition-all disabled:opacity-50 uppercase tracking-widest">
            {isUpdating ? 'Synchronizing...' : 'Save Configuration'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const OrphanageDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ totalRequests: 0, activeNeeds: 0, isVerified: false });
  const [orphanageProfile, setOrphanageProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeAudits, setActiveAudits] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: oData } = await supabase.from('orphanages').select('*').eq('user_id', user.id).single();
        if (oData) {
          setOrphanageProfile({ ...oData, fullName: profile?.full_name });
          
          const [reqsRes, auditsRes] = await Promise.all([
            supabase.from('orphan_requests').select('*').eq('orphanage_id', oData.id),
            supabase.from('inventory_audits').select('*').eq('orphanage_id', oData.id).eq('status', 'accepted')
          ]);

          const reqs = reqsRes.data || [];
          let active = 0; reqs.forEach(r => { if (r.status !== 'delivered' && r.status !== 'rejected') active++; });
          setStats({ totalRequests: reqs.length, activeNeeds: active, isVerified: oData.is_verified || false });
          setActiveAudits(auditsRes.data || []);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (user) fetchData();
  }, [user, profile]);

  if (loading) return <PageLoader message="Loading Dashboard" subtitle="Preparing organization insights..." />;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, position: 'relative', overflowX: 'hidden', paddingBottom: 80 }}>
      <DotGrid />
      <AnimatePresence>{settingsOpen && <OrganizationSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} data={orphanageProfile} onUpdate={newData => setOrphanageProfile(p => ({ ...p, ...newData }))} />}</AnimatePresence>
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 space-y-10">
        {!loading && !stats.isVerified && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-4 text-amber-700 text-sm font-semibold">
            <FiAlertCircle size={20} /> Application under review. Public request clearance pending verification.
          </div>
        )}

        {/* ─── LIVE AUDIT VERIFICATION ─── */}
        <AnimatePresence>
           {activeAudits.map((audit) => (
              <motion.div 
                 key={audit.id}
                 initial={{ opacity: 0, y: -20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="relative group overflow-hidden bg-stone-900 rounded-[32px] p-8 border border-stone-800 shadow-2xl"
              >
                 <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] pointer-events-none" />
                 <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-900/20">
                          <FiClipboard size={28} />
                       </div>
                       <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-wider">Live Inventory Audit</h3>
                          <p className="text-stone-400 text-xs font-bold mt-1 uppercase tracking-widest flex items-center gap-2">
                             <FiUser className="text-orange-500" /> Awaiting Volunteer Verification
                          </p>
                       </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end">
                       <span className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em] mb-2">Verification Code</span>
                       <div className="flex gap-2">
                          {audit.audit_code?.split('').map((char, i) => (
                             <div key={i} className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl font-black text-orange-500 shadow-inner">
                                {char}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
                 <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Provide this code to the volunteer to authorize access</p>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Session</span>
                    </div>
                 </div>
              </motion.div>
           ))}
        </AnimatePresence>
        {/* ══════════ MODERN COMMAND CENTER HERO ══════════ */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 mb-16 p-12 bg-white rounded-[40px] border border-stone-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-50/50 to-transparent pointer-events-none" />
           
           <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.6 }} className="relative z-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full mb-6">
                 <span className={`w-1.5 h-1.5 rounded-full ${stats.isVerified ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                 <span className="text-[9px] font-black tracking-[0.25em] text-stone-500 uppercase">
                   Status: {stats.isVerified ? 'Verified Organization' : 'Under Review'}
                 </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-stone-900 leading-none">
                {orphanageProfile?.name || 'Hello, Admin.'}
              </h1>
              <p className="mt-4 text-stone-400 font-medium max-w-sm leading-relaxed">
                Logistics and inventory systems are operational. Lead Representative: {profile?.full_name}
              </p>
           </motion.div>

           <div className="flex flex-col items-center lg:items-end gap-6 relative z-10 w-full lg:w-auto">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl relative group cursor-pointer" onClick={() => setSettingsOpen(true)}>
                 {orphanageProfile?.image_url ? (
                   <img src={orphanageProfile.image_url} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                     <FiHome size={32} />
                   </div>
                 )}
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <FiSettings size={20} />
                 </div>
              </div>
              <div className="flex gap-3">
                 <Link to="/orphanage/request">
                    <button className="px-8 py-4 bg-orange-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-900/10 flex items-center gap-2">
                       <FiPlus /> New Request
                    </button>
                 </Link>
                 <button onClick={() => setSettingsOpen(true)} className="px-6 py-4 bg-stone-100 text-stone-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-stone-200 transition-colors">
                    Config
                 </button>
              </div>
           </div>
        </div>

        {/* ══════════ METRIC PODS ══════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           {/* Historical Requests Pod */}
           <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.1 }}
              className="p-8 bg-white border border-stone-100 rounded-[32px] shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-orange-600" />
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-100">
                    <FiClipboard size={20} />
                 </div>
                 <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Network Flow</span>
              </div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Historical Requests</p>
              <h3 className="text-5xl font-black text-stone-900 tracking-tighter mb-6">{loading ? '...' : stats.totalRequests}</h3>
              <div className="flex items-center gap-2">
                 <div className="px-2 py-0.5 rounded bg-orange-50 text-orange-600 text-[9px] font-black">LOGGED</div>
                 <span className="text-[10px] font-bold text-stone-300">Total Lifecycle</span>
              </div>
           </motion.div>

           {/* Active Operations Pod */}
           <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.2 }}
              className="p-8 bg-white border border-stone-100 rounded-[32px] shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600" />
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <FiActivity size={20} />
                 </div>
                 <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Live Needs</span>
              </div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Active Operations</p>
              <h3 className="text-5xl font-black text-stone-900 tracking-tighter mb-6">{loading ? '...' : stats.activeNeeds}</h3>
              <div className="flex items-center gap-2">
                 <div className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-black">ACTIVE</div>
                 <span className="text-[10px] font-bold text-stone-300">In Pipeline</span>
              </div>
           </motion.div>

           {/* Capacity Pod */}
           <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.3 }}
              className="p-8 bg-stone-900 text-white rounded-[32px] shadow-xl relative group overflow-hidden border border-stone-800">
              <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 pointer-events-none">
                 <FiBriefcase size={80} />
              </div>
              <div className="relative z-10">
                 <div className="flex justify-between items-center mb-6">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 text-amber-400">
                       <FiUser size={22} />
                    </div>
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.25em] bg-amber-400/10 px-3 py-1 rounded-full">Entity Status</span>
                 </div>
                 <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Total Capacity</p>
                 <h3 className="text-5xl font-black text-white tracking-tight mb-8 leading-tight">
                    {orphanageProfile?.capacity || '0'}
                 </h3>
                 <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-1.5 flex-1 bg-emerald-500 rounded-full" />)}
                 </div>
              </div>
           </motion.div>
        </div>
        <div className="bg-white border border-stone-200 rounded-[24px] overflow-hidden shadow-sm">
          <div className="p-8 md:p-10 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
            <h2 className="text-lg font-bold text-stone-900 uppercase tracking-widest">Inventory Logistics</h2>
            <div className="text-xs font-bold text-[#E8622A] uppercase tracking-widest cursor-pointer">View All &rarr;</div>
          </div>
          <RequestHistory limit={10} />
        </div>
      </div>
    </div>
  );
};
