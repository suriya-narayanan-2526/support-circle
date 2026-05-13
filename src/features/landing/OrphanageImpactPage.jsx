import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiHome, FiMapPin, FiUsers, FiAlertTriangle, FiArrowRight, FiCheckCircle, FiPackage, FiActivity, FiShield } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const T = {
  orange: '#E8622A',
  orangeLight: '#FFF0E8',
  green: '#2D9B6F',
  greenLight: '#EDFAF4',
  amber: '#D97706',
  amberLight: '#FFF8E8',
  bg: '#FFFDF9',
  surface: '#FFFFFF',
  border: 'rgba(28,25,23,0.08)',
  text: '#1C1917',
  textSub: '#57534E',
};

export const OrphanageImpactPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user, profile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataType, setDataType] = useState('request'); // 'request' or 'campaign'

  useEffect(() => {
    const fetchMissionIntel = async () => {
      try {
        // Try fetching as orphan request first
        const { data: reqData } = await supabase
          .from('orphan_requests')
          .select('*, orphanages(*)')
          .eq('id', id)
          .maybeSingle();

        if (reqData) {
          setData(reqData);
          setDataType('request');
        } else {
          // Try fetching as campaign
          const { data: campData } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (campData) {
            setData(campData);
            setDataType('campaign');
          }
        }
      } catch (err) {
        console.error('Failed to fetch mission intel:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMissionIntel();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-[#E8622A]/20 border-t-[#E8622A] rounded-full" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-8 text-center">
      <FiAlertTriangle size={48} className="text-amber-500 mb-4" />
      <h2 className="text-2xl font-bold text-stone-900">Mission Data Unreachable</h2>
      <p className="text-stone-500 mt-2">The requested mission intelligence could not be retrieved.</p>
      <Link to="/home" className="mt-6 px-8 py-3 bg-stone-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest">Return Home</Link>
    </div>
  );

  const orphanage = dataType === 'request' ? data.orphanages : null;
  
  // Parse items from items_json or fall back to notes (JSON string)
  let items = [];
  if (dataType === 'request') {
    if (data.items_json && Array.isArray(data.items_json)) {
      items = data.items_json;
    } else if (data.notes) {
      try {
        const parsed = JSON.parse(data.notes);
        if (Array.isArray(parsed)) items = parsed;
      } catch (e) {
        items = [{ name: data.category, quantity: 'Essential', unit: 'Needs' }];
      }
    }
  } else {
    items = [{ name: data.donation_category || 'Essential Supplies', quantity: data.goal_amount || 100, unit: 'Units' }];
  }

  const category = dataType === 'request' ? data.category : (data.donation_category || 'Community Support');
  const urgency = dataType === 'request' ? data.urgency : 3;

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-24 overflow-x-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[5%] left-[-10%] w-[40vw] h-[40vw] bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 pt-12 relative z-10">
        <Link to="/home" className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors mb-12 group">
          <motion.div whileHover={{ x: -4 }}><FiArrowRight className="rotate-180" /></motion.div>
          <span className="text-xs font-black uppercase tracking-widest">Back to Intelligence Feed</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Identity Panel */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-stone-200 rounded-[32px] overflow-hidden shadow-sm">
              <div className="aspect-[4/5] bg-stone-50 relative group">
                {orphanage?.image_url ? (
                  <img src={orphanage.image_url} alt={orphanage.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-200">
                    {dataType === 'campaign' ? <FiActivity size={64} className="text-[#E8622A]/20" /> : <FiHome size={64} />}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8 text-white">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{dataType === 'campaign' ? 'Active Campaign Intel' : 'Verified Entity Portrait'}</p>
                  <h3 className="text-xl font-bold uppercase tracking-tight">{orphanage?.name || data.title}</h3>
                </div>
              </div>
              <div className="p-10 space-y-6">
                <div className="flex items-center gap-4 text-stone-500">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-[#E8622A]"><FiMapPin size={18} /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Operations Base</p>
                    <p className="text-sm font-bold text-stone-900 leading-tight">{orphanage?.location || 'Community Wide Distribution'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-stone-500">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-[#2D9B6F]"><FiUsers size={18} /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Target Impact</p>
                    <p className="text-sm font-bold text-stone-900 leading-tight">{orphanage?.capacity ? `${orphanage.capacity} Children Supported` : `${data.participants_count || 0} Partners Involved`}</p>
                  </div>
                </div>
                <div className="pt-6 border-t border-stone-100">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <FiShield size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Support Circle Verified Mission</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mission Briefing Panel */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-[10px] font-black text-[#E8622A] tracking-widest uppercase">
                {dataType === 'campaign' ? 'Strategic Initiative' : 'Active Mission Intelligence'}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-stone-900 leading-tight">Support Requested for <span className="text-[#E8622A]">{category}</span></h1>
              <p className="text-stone-500 font-medium max-w-xl leading-relaxed">
                {data.description || 'This verified organization is requesting critical supplies to maintain their daily operations and child care standards.'}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-stone-200 rounded-[32px] p-10 shadow-sm space-y-10">
              <div>
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Inventory Logistics Breakdown</h3>
                <div className="grid grid-cols-1 gap-4">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-orange-50/30 p-6 rounded-[24px] border border-orange-100 group hover:border-orange-300 transition-all shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#E8622A] border border-orange-100 shadow-md group-hover:scale-110 transition-transform"><FiPackage size={24} /></div>
                        <div>
                          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-0.5">Required Item</span>
                          <span className="font-black text-2xl text-stone-900 tracking-tight">{it.name}</span>
                        </div>
                      </div>
                      <div className="bg-white px-6 py-3 rounded-2xl border-2 border-orange-200 text-xl font-black text-[#E8622A] shadow-sm">
                        {it.quantity} <span className="text-xs uppercase ml-1 opacity-60">{it.unit === 'litre' ? 'L' : it.unit === 'kg' ? 'KG' : it.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-10 border-t border-stone-100 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#E8622A]"><FiActivity size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Priority Index</p>
                    <p className={`text-sm font-black uppercase tracking-widest ${urgency >= 4 ? 'text-red-500' : urgency >= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {urgency >= 4 ? 'Urgent Response Required' : urgency >= 3 ? 'High Priority Mission' : 'Standard Rotation'}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (role === 'donor' || role === 'community_partner') {
                      navigate('/donor/donate/items', { 
                        state: { 
                          selectedCategory: category, 
                          orphanage_id: orphanage?.id || data.orphanage_id,
                          request_id: dataType === 'request' ? data.id : null,
                          campaign_id: dataType === 'campaign' ? data.id : null,
                          campaign_title: dataType === 'campaign' ? data.title : null
                        } 
                      });
                    } else {
                      toast.error("Donation terminal restricted to verified partners.");
                    }
                  }}
                  className="w-full md:w-auto px-10 py-5 bg-[#E8622A] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#C4521F] transition-all flex items-center justify-center gap-3"
                >
                  Initiate Donation Mission <FiArrowRight />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
