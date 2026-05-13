import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiUsers, FiGift, FiX, FiFlag, FiClock, FiTarget } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { CATEGORY_ITEMS } from '../utils/constants';
import toast from 'react-hot-toast';

const T = {
  orange: '#E8622A', orangeLight: '#FFF0E8', orangeBorder: 'rgba(232,98,42,0.18)',
  green: '#2D9B6F', greenLight: '#EDFAF4',
  bg: '#FFFDF9', surface: '#FFFFFF', surfaceWarm: '#FFF5EE',
  border: 'rgba(28,25,23,0.07)', text: '#1C1917', textSub: '#57534E', textMuted: '#A8A29E',
};

export const CampaignSection = ({ user, profile, role }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [joined, setJoined] = useState(new Set());
  const [joiningId, setJoiningId] = useState(null);
  const [donateModal, setDonateModal] = useState(null);
  const [donateForm, setDonateForm] = useState({ items: [{ name: '', quantity: 1 }] });
  const [donating, setDonating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from('campaigns').select('*').eq('status', 'active').order('created_at', { ascending: false });
      setCampaigns(data || []);
      const { data: jp } = await supabase.from('campaign_participants').select('campaign_id').eq('user_id', user.id);
      if (jp) setJoined(new Set(jp.map(j => j.campaign_id)));
    };
    fetch();
  }, [user]);

  const handleJoin = async (id) => {
    setJoiningId(id);
    try {
      await supabase.from('campaign_participants').insert({
        campaign_id: id, user_id: user.id, user_name: profile?.full_name || 'User', user_role: role
      });
      const c = campaigns.find(x => x.id === id);
      await supabase.from('campaigns').update({ participants_count: (c?.participants_count || 0) + 1 }).eq('id', id);
      setJoined(prev => new Set([...prev, id]));
      setCampaigns(prev => prev.map(x => x.id === id ? { ...x, participants_count: (x.participants_count || 0) + 1 } : x));
      toast.success('Joined campaign!');
    } catch (err) { if (err.code !== '23505') toast.error(err.message); }
    finally { setJoiningId(null); }
  };

  const handleDonate = async () => {
    const totalItems = donateForm.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    if (donateForm.items.some(it => !it.name)) { toast.error('Please select all items'); return; }
    if (totalItems === 0) { toast.error('Add at least 1 item'); return; }
    setDonating(true);
    try {
      const cat = donateModal.donation_category || 'Clothing';
      const itemsPayload = donateForm.items.map(it => ({ name: it.name, quantity: Number(it.quantity) || 1, category: cat }));
      const { error } = await supabase.from('donations').insert({
        donor_id: user.id, donor_name: profile?.full_name || 'Donor',
        items_json: itemsPayload, category: cat, quantity: totalItems,
        status: 'submitted', campaign_id: donateModal.id, contact_number: profile?.phone || ''
      });
      if (error) throw error;
      const { data: fresh } = await supabase.from('campaigns').select('current_amount').eq('id', donateModal.id).single();
      await supabase.from('campaigns').update({ current_amount: (fresh?.current_amount || 0) + totalItems, updated_at: new Date().toISOString() }).eq('id', donateModal.id);
      setCampaigns(prev => prev.map(c => c.id === donateModal.id ? { ...c, current_amount: (c.current_amount || 0) + totalItems } : c));
      toast.success(`Donated ${totalItems} items!`);
      setDonateModal(null);
    } catch (err) { toast.error('Failed: ' + err.message); }
    finally { setDonating(false); }
  };

  if (campaigns.length === 0) return null;

  const priorityColors = { low: '#94a3b8', normal: '#3b82f6', high: '#E8622A', urgent: '#ef4444' };
  const categoryLabels = { donation_drive: 'Donation Drive', fundraiser: 'Fundraiser', awareness: 'Awareness', emergency: 'Emergency Relief' };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 20px rgba(28,25,23,0.05)' }}>
        <div style={{ padding: '20px 28px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #FFF8F3 0%, #FFFFFF 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiFlag size={16} color={T.orange} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Active Campaigns</h2>
            <span style={{ fontSize: 10, fontWeight: 800, color: T.orange, background: T.orangeLight, padding: '2px 10px', borderRadius: 10 }}>{campaigns.length}</span>
          </div>
        </div>

        {campaigns.map((c, idx) => {
          const progress = c.goal_amount > 0 ? Math.min(100, Math.round(((c.current_amount || 0) / c.goal_amount) * 100)) : 0;
          const daysLeft = c.end_date ? Math.max(0, Math.ceil((new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24))) : null;

          return (
            <div key={c.id} style={{ padding: '20px 28px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4 }}>{c.title}</h4>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: T.green, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>Active</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: priorityColors[c.priority], background: priorityColors[c.priority] + '15', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{c.priority}</span>
                    {c.donation_category && <span style={{ fontSize: 9, fontWeight: 800, color: T.orange, background: T.orangeLight, padding: '2px 8px', borderRadius: 6 }}>Needs: {c.donation_category}</span>}
                  </div>
                </div>
                {daysLeft !== null && (
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: daysLeft <= 3 ? '#ef4444' : T.orange }}>{daysLeft}</p>
                    <p style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>days left</p>
                  </div>
                )}
              </div>
              {c.description && <p style={{ fontSize: 12, color: T.textSub, marginBottom: 10, lineHeight: 1.5 }}>{c.description}</p>}

              {/* Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ flex: 1, height: 7, background: T.bg, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${T.orange}, #F4A135)`, transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: T.orange, flexShrink: 0 }}>{progress}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 10, color: T.textSub, fontWeight: 600 }}>{c.current_amount || 0} / {c.goal_amount || 0} items</span>
                <span style={{ fontSize: 10, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}><FiUsers size={10} /> {c.participants_count || 0} joined</span>
              </div>

              {/* Join / Donate */}
              {joined.has(c.id) ? (
                <button onClick={() => { setDonateModal(c); setDonateForm({ items: [{ name: '', quantity: 1 }] }); }}
                  style={{ width: '100%', padding: '10px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${T.green}, #34b87a)`, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(45,155,111,0.25)' }}>
                  <FiGift size={14} /> Donate to Campaign
                </button>
              ) : (
                <button onClick={() => handleJoin(c.id)} disabled={joiningId === c.id}
                  style={{ width: '100%', padding: '10px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${T.orange}, #F4A135)`, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: joiningId === c.id ? 0.6 : 1, boxShadow: '0 4px 12px rgba(232,98,42,0.25)' }}>
                  <FiHeart size={14} /> {joiningId === c.id ? 'Joining...' : 'Join Campaign'}
                </button>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Donate Modal */}
      {donateModal && (() => {
        const cat = donateModal.donation_category || 'Clothing';
        const itemOptions = CATEGORY_ITEMS[cat] || [];
        const totalItems = donateForm.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,25,23,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={() => setDonateModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 28, width: 480, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 32px 64px rgba(0,0,0,0.2)' }}>
              <div style={{ position: 'relative', padding: '24px 28px', borderBottom: '1px solid rgba(28,25,23,0.08)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.green}, #34b87a)` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Donate to Campaign</h3>
                    <p style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>{donateModal.title}</p>
                  </div>
                  <button onClick={() => setDonateModal(null)} style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${T.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FiX size={16} /></button>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: T.orange, background: T.orangeLight, padding: '3px 10px', borderRadius: 8 }}>Needs: {cat}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.textSub, background: T.surfaceWarm, padding: '3px 10px', borderRadius: 8 }}>{donateModal.current_amount || 0}/{donateModal.goal_amount || 0} collected</span>
                </div>
              </div>
              <div style={{ padding: '20px 28px' }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'block' }}>Select Items to Donate</label>
                {donateForm.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                    <select value={item.name} onChange={e => { const u = [...donateForm.items]; u[idx].name = e.target.value; setDonateForm({ items: u }); }}
                      style={{ flex: 2, padding: '10px 14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, fontSize: 13, fontWeight: 600, color: T.text, outline: 'none' }}>
                      <option value="">Choose item...</option>
                      {itemOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <input type="number" min="1" value={item.quantity} onChange={e => { const u = [...donateForm.items]; u[idx].quantity = e.target.value; setDonateForm({ items: u }); }}
                      style={{ width: 70, padding: '10px 12px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, fontSize: 13, fontWeight: 700, textAlign: 'center', outline: 'none' }} />
                    {donateForm.items.length > 1 && (
                      <button onClick={() => setDonateForm({ items: donateForm.items.filter((_, i) => i !== idx) })}
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FiX size={14} /></button>
                    )}
                  </div>
                ))}
                <button onClick={() => setDonateForm({ items: [...donateForm.items, { name: '', quantity: 1 }] })}
                  style={{ fontSize: 12, fontWeight: 700, color: T.orange, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}>+ Add another item</button>
              </div>
              <div style={{ padding: '16px 28px 24px', display: 'flex', gap: 10 }}>
                <button onClick={() => setDonateModal(null)}
                  style={{ flex: 1, padding: '12px', border: `1px solid ${T.border}`, borderRadius: 14, background: '#fff', color: T.textSub, fontSize: 13, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>Cancel</button>
                <button onClick={handleDonate} disabled={donating}
                  style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 14, background: `linear-gradient(135deg, ${T.green}, #34b87a)`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textTransform: 'uppercase', opacity: donating ? 0.6 : 1, boxShadow: `0 4px 16px rgba(45,155,111,0.3)` }}>
                  <FiGift size={16} /> {donating ? 'Donating...' : `Donate ${totalItems} Items`}
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </>
  );
};
