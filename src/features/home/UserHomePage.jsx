import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardRoute, CATEGORY_ITEMS } from '../../utils/constants';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { PageLoader } from '../../components/PageLoader';
import { aiRecommendationService } from '../../services/aiRecommendationService';
import { FiHome, FiTrendingUp, FiHeart, FiBell, FiChevronRight, FiGrid, FiAlertTriangle, FiUsers, FiGift, FiX, FiZap, FiTarget, FiBox, FiArrowRight, FiShield } from 'react-icons/fi';

/* ─── DESIGN TOKENS (Warm Charity Theme) ─── */
const T = {
  blue:         '#E8622A',   /* orange as primary */
  blueDark:     '#D4541E',
  blueGlow:     'rgba(232,98,42,0.14)',
  emerald:      '#2D9B6F',
  emeraldDim:   'rgba(45,155,111,0.12)',
  amber:        '#F4A135',
  amberDim:     'rgba(244,161,53,0.12)',
  bg:           '#FFFDF9',
  bgAlt:        '#FFF8F3',
  surface:      '#FFFFFF',
  surfaceMid:   '#FFF5EE',
  border:       'rgba(28,25,23,0.08)',
  borderHover:  'rgba(28,25,23,0.14)',
  textPrimary:  '#1C1917',
  textSecondary:'#78716C',
};

/* ─── DOT GRID ─── */
function DotGrid({ opacity = 0.06 }) {
  return (
    <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, pointerEvents: 'none' }}>
      <defs>
        <pattern id="user-home-dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#1C1917" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#user-home-dots)" />
    </svg>
  );
}

/* ─── MAGNETIC CARD ─── */
function MagneticCard({ children, intensity = 4, className = '', style = {} }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const sx = useSpring(rx, { stiffness: 200, damping: 20 });
  const sy = useSpring(ry, { stiffness: 200, damping: 20 });

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
      style={{ rotateX: sx, rotateY: sy, transformStyle: 'preserve-3d', willChange: 'transform', ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const UserHomePage = () => {
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = React.useState([]);
  const [loadingFeed, setLoadingFeed] = React.useState(true);
  const [campaignStats, setCampaignStats] = React.useState({ active: 0, total: 0, goalProgress: 0 });
  const [activeCampaigns, setActiveCampaigns] = React.useState([]);
  const [joinedCampaigns, setJoinedCampaigns] = React.useState(new Set());
  const [joiningId, setJoiningId] = React.useState(null);
  const [donateModal, setDonateModal] = React.useState(null); // campaign object
  const [donateForm, setDonateForm] = React.useState({ items: [{ name: '', quantity: 1 }] });
  const [donating, setDonating] = React.useState(false);
  const [isCsrVerified, setIsCsrVerified] = React.useState(false);
  const [aiSuggestions, setAiSuggestions] = React.useState([]);

  // Route to their specific dashboard
  const dashboardPath = getDashboardRoute(role);

  React.useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data, error } = await supabase
          .from('orphan_requests')
          .select('*, orphanages(name, location)')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        const formatted = (data || []).map((req) => {
          // Format time
          const date = new Date(req.created_at);
          const time = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

          // Format title and icon based on urgency
          let title = `Request: ${req.category}`;
          let icon = <FiBell size={18} color="#2D9B6F" />;
          let bg = 'rgba(45, 155, 111, 0.15)';
          let border = 'rgba(45, 155, 111, 0.3)';

          if (req.urgency >= 4) {
            title = `Urgent Request: ${req.category}`;
            icon = <FiAlertTriangle size={18} color="#EF4444" />;
            bg = 'rgba(239, 68, 68, 0.15)';
            border = 'rgba(239, 68, 68, 0.3)';
          } else if (req.urgency === 3) {
            title = `High Priority: ${req.category}`;
            icon = <FiTrendingUp size={18} color="#F59E0B" />;
            bg = 'rgba(245, 158, 11, 0.15)';
            border = 'rgba(245, 158, 11, 0.3)';
          }

          return {
            id: req.id,
            category: req.category,
            title,
            location: req.orphanages ? `${req.orphanages.name}, ${req.orphanages.location}` : 'Local Organization',
            time,
            icon,
            bg,
            border
          };
        });

        setActivities(formatted);
      } catch (err) {
        console.error('Failed to fetch feed:', err);
      } finally {
        setLoadingFeed(false);
      }
    };

    const fetchAi = async () => {
      const suggestions = await aiRecommendationService.getSmartSuggestions();
      setAiSuggestions(suggestions);
    };

    const fetchCampaignStats = async () => {
      try {
        const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
        if (data) {
          const activeList = data.filter(c => c.status === 'active');
          const totalGoal = data.reduce((s, c) => s + (Number(c.goal_amount) || 0), 0);
          const totalCurrent = data.reduce((s, c) => s + (Number(c.current_amount) || 0), 0);
          setCampaignStats({ active: activeList.length, total: data.length, goalProgress: totalGoal > 0 ? Math.round((totalCurrent / totalGoal) * 100) : 0 });
          setActiveCampaigns(activeList);
        }
        // Fetch which campaigns user already joined
        if (user) {
          const { data: joined } = await supabase.from('campaign_participants').select('campaign_id').eq('user_id', user.id);
          if (joined) setJoinedCampaigns(new Set(joined.map(j => j.campaign_id)));
        }
      } catch (err) { console.error('Campaign stats error:', err); }
    };

    const fetchCsrStatus = async () => {
      if (!user || role !== 'community_partner') return;
      try {
        const { data } = await supabase.from('csr_applications').select('id').eq('partner_id', user.id).eq('status', 'Approved').limit(1);
        if (data && data.length > 0) setIsCsrVerified(true);
      } catch (err) {}
    };

    fetchFeed();
    fetchAi();
    fetchCampaignStats();
    fetchCsrStatus();
  }, [user]);

  const handleJoinCampaign = async (campaignId) => {
    if (!user) { return; }
    setJoiningId(campaignId);
    try {
      // Insert into campaign_participants
      const { error: joinErr } = await supabase.from('campaign_participants').insert({
        campaign_id: campaignId, user_id: user.id, user_name: isCsrVerified ? 'CSR Verified Support Circle Partner' : (profile?.full_name || 'User'), user_role: role || 'donor'
      });
      if (joinErr) {
        if (joinErr.code === '23505') { /* Already joined */ }
        else throw joinErr;
      }
      // Increment participants_count
      const campaign = activeCampaigns.find(c => c.id === campaignId);
      await supabase.from('campaigns').update({ participants_count: (campaign?.participants_count || 0) + 1 }).eq('id', campaignId);
      // Update local state
      setJoinedCampaigns(prev => new Set([...prev, campaignId]));
      setActiveCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, participants_count: (c.participants_count || 0) + 1 } : c));
    } catch (err) { console.error('Join error:', err); }
    finally { setJoiningId(null); }
  };

  if (loadingFeed) return <PageLoader message="Loading Community" subtitle="Fetching latest activity..." />;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 64, position: 'relative', overflow: 'hidden' }}>
      <DotGrid opacity={0.035} />

      {/* Floating Orbs — warm orange tones */}
      <div style={{ position: 'absolute', top: '-5%', right: '5%', width: '45vw', height: '45vw', background: `radial-gradient(ellipse, rgba(232,98,42,0.10) 0%, transparent 65%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '35vw', height: '35vw', background: `radial-gradient(ellipse, rgba(244,161,53,0.08) 0%, transparent 65%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Top Banner — warm orange gradient */}
      <div style={{
        position: 'relative', zIndex: 10, padding: '52px 0',
        borderBottom: `1px solid rgba(232,98,42,0.12)`,
        background: `linear-gradient(135deg, #FFF8F3 0%, #FFFDF9 50%, #FFF3EA 100%)`,
        overflow: 'hidden',
      }}>
        {/* Decorative orange glow top-right */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', pointerEvents: 'none',
          background: `radial-gradient(ellipse 80% 120% at 100% 0%, rgba(232,98,42,0.12) 0%, transparent 70%)`,
        }} />
        {/* Bottom accent bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, pointerEvents: 'none',
          background: `linear-gradient(90deg, transparent, rgba(232,98,42,0.30), rgba(244,161,53,0.20), transparent)`,
        }} />

        <div className="mx-auto max-w-6xl px-4 sm:px-6" style={{ position: 'relative', zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display font-bold" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', color: T.textPrimary, letterSpacing: '-0.02em' }}>
              Welcome back,{' '}
              <span style={{
                backgroundImage: `linear-gradient(135deg, ${T.blue}, ${T.amber})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{isCsrVerified ? 'CSR Verified Support Circle Partner' : profile?.full_name?.split(' ')[0] || 'Member'}</span> 👋
            </h1>
            <p style={{ marginTop: 8, color: T.textSecondary, fontSize: 16, maxWidth: 600 }}>
              Here's what's happening in your community today — check urgent requests and access your dashboard.
            </p>
          </motion.div>
        </div>
      </div>

      {/* AI PRECISION GIVING GUIDE — HORIZONTAL SHELF */}
      {aiSuggestions.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-12">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div style={{ width: 32, height: 32, borderRadius: 10, background: T.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiZap size={18} className="animate-pulse" />
                 </div>
                 <div>
                    <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary }}>Precision Giving Guide</h2>
                    <p style={{ fontSize: 11, color: T.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI-Driven Network Priority</p>
                 </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ borderColor: T.border, background: T.surface }}>
                 <FiShield size={12} color={T.blue} />
                 <span style={{ fontSize: 10, fontWeight: 800, color: T.textSecondary }}>LIVE ANALYSIS ACTIVE</span>
              </div>
           </div>

           <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {aiSuggestions.map((sug, idx) => (
                 <motion.div
                   key={idx}
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                   style={{
                     minWidth: 280, width: 280, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 24, padding: 24,
                     boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden'
                   }}
                 >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: T.blue }} />
                    <div className="flex items-center gap-3 mb-4">
                       <div style={{ width: 36, height: 36, borderRadius: 10, background: T.bgAlt, color: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiBox size={18} />
                       </div>
                       <span style={{ fontSize: 14, fontWeight: 800, color: T.textPrimary }}>{sug.category}</span>
                    </div>
                    <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6, marginBottom: 20, height: 40, overflow: 'hidden' }}>
                       {sug.reason}
                    </p>
                    <button
                      onClick={() => navigate('/donor/donate', { state: { selectedCategory: sug.category, orphanage_id: sug.target } })}
                      style={{
                        width: '100%', padding: '12px', borderRadius: 12, background: T.bgAlt, color: T.blue, border: `1px solid ${T.blue}20`,
                        fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = T.blueLight}
                      onMouseLeave={e => e.currentTarget.style.background = T.bgAlt}
                    >
                      Fulfill This Need <FiArrowRight size={14} />
                    </button>
                 </motion.div>
              ))}
           </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        
        {/* Main Feed Column */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: T.textPrimary }}>Community Feed</h2>
          </div>

          <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, overflow: 'hidden', minHeight: 150 }}>
            {loadingFeed ? (
              <div style={{ padding: '32px', textAlign: 'center', color: T.textSecondary }}>Loading community feed...</div>
            ) : activities.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: T.textSecondary }}>No recent requests in your community.</div>
            ) : (
              activities.map((activity, idx) => (
                <motion.div 
                  key={activity.id}
                  onClick={() => {
                    navigate(`/community/request/${activity.id}`);
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{
                    padding: '24px',
                    borderBottom: idx === activities.length - 1 ? 'none' : `1px solid ${T.border}`,
                    display: 'flex',
                    gap: 20,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                  }}
                  whileHover={{ backgroundColor: T.bgAlt }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, background: activity.bg, border: `1px solid ${activity.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: `0 4px 12px ${activity.bg}`
                  }}>
                    {activity.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary }}>{activity.title}</h3>
                    <p style={{ fontSize: 13, color: T.textSecondary, marginTop: 3 }}>{activity.location}</p>
                  </div>
                  <span style={{ fontSize: 12, color: T.textSecondary, fontWeight: 500, whiteSpace: 'nowrap' }}>{activity.time}</span>
                </motion.div>
              ))
            )}
          </div>

          {/* Active Campaigns Section */}
          {activeCampaigns.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiHeart size={14} color="#E8622A" /> Active Campaigns ({activeCampaigns.length})
              </h3>
              {activeCampaigns.map((c, idx) => {
                const progress = c.goal_amount > 0 ? Math.min(100, Math.round(((c.current_amount || 0) / c.goal_amount) * 100)) : 0;
                const daysLeft = c.end_date ? Math.max(0, Math.ceil((new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24))) : null;
                const priorityColors = { low: '#94a3b8', normal: '#3b82f6', high: '#E8622A', urgent: '#ef4444' };
                const categoryLabels = { donation_drive: 'Donation Drive', fundraiser: 'Fundraiser', awareness: 'Awareness', emergency: 'Emergency Relief' };
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                    style={{ background: T.surface, borderRadius: 18, border: `1px solid ${T.border}`, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #E8622A, #F4A135)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary, marginBottom: 4 }}>{c.title}</h4>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#2D9B6F', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>Active</span>
                          <span style={{ fontSize: 9, fontWeight: 800, color: priorityColors[c.priority] || '#3b82f6', background: (priorityColors[c.priority] || '#3b82f6') + '15', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{c.priority}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: T.textSecondary, background: T.surfaceMid, padding: '2px 8px', borderRadius: 6 }}>{categoryLabels[c.category] || c.category}</span>
                          {c.donation_category && <span style={{ fontSize: 9, fontWeight: 800, color: '#E8622A', background: '#FFF0EA', padding: '2px 8px', borderRadius: 6 }}>Needs: {c.donation_category}</span>}
                        </div>
                      </div>
                      {daysLeft !== null && (
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                          <p style={{ fontSize: 20, fontWeight: 800, color: daysLeft <= 3 ? '#ef4444' : '#E8622A' }}>{daysLeft}</p>
                          <p style={{ fontSize: 9, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase' }}>days left</p>
                        </div>
                      )}
                    </div>
                    {c.description && (
                      <p style={{ fontSize: 12, color: T.textSecondary, marginBottom: 12, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.description}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ flex: 1, height: 8, background: T.surfaceMid, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #E8622A, #F4A135)', transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#E8622A', flexShrink: 0 }}>{progress}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: T.textSecondary, fontWeight: 600 }}>{c.current_amount || 0} / {c.goal_amount || 0} items collected</span>
                      <span style={{ fontSize: 10, color: T.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiUsers size={12} /> {c.participants_count || 0} joined
                      </span>
                    </div>

                    {/* Join / Donate Button */}
                    {(role === 'donor' || role === 'community_partner') && (
                      <div style={{ marginTop: 12 }}>
                        {joinedCampaigns.has(c.id) ? (
                          <button
                            onClick={() => {
                              navigate(`/community/request/${c.id}`);
                            }}
                            style={{
                              width: '100%', padding: '10px', borderRadius: 12, border: 'none',
                              background: 'linear-gradient(135deg, #2D9B6F, #34b87a)',
                              color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                              textTransform: 'uppercase', letterSpacing: '0.03em',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              boxShadow: '0 4px 12px rgba(45,155,111,0.3)',
                              transition: 'transform 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <FiGift size={14} /> Donate to Campaign
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinCampaign(c.id)}
                            disabled={joiningId === c.id}
                            style={{
                              width: '100%', padding: '10px', borderRadius: 12, border: 'none',
                              background: 'linear-gradient(135deg, #E8622A, #F4A135)',
                              color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                              textTransform: 'uppercase', letterSpacing: '0.03em',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              opacity: joiningId === c.id ? 0.6 : 1,
                              boxShadow: '0 4px 12px rgba(232,98,42,0.3)',
                              transition: 'transform 0.2s, opacity 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <FiHeart size={14} /> {joiningId === c.id ? 'Joining...' : 'Join Campaign'}
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* CAMPAIGN DONATE MODAL */}
          {donateModal && (() => {
            const cat = donateModal.donation_category || 'Clothing';
            const itemOptions = CATEGORY_ITEMS[cat] || [];
            const totalItems = donateForm.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);

            const handleCampaignDonate = async () => {
              if (donateForm.items.some(it => !it.name)) { toast.error('Please select all items'); return; }
              if (totalItems === 0) { toast.error('Add at least 1 item'); return; }
              setDonating(true);
              try {
                // Create donation record linked to campaign
                const itemsPayload = donateForm.items.map(it => ({ name: it.name, quantity: Number(it.quantity) || 1, category: cat }));
                
                const { error: donErr } = await supabase.from('donations').insert({
                  donor_id: user.id,
                  donor_name: isCsrVerified ? 'CSR Verified Support Circle Partner' : (profile?.full_name || 'Donor'),
                  items_json: itemsPayload,
                  category: cat,
                  quantity: totalItems,
                  status: 'submitted',
                  campaign_id: donateModal.id,
                  contact_number: profile?.phone || ''
                });
                if (donErr) throw donErr;

                // Increment current_amount — fetch fresh value first
                const { data: freshCampaign } = await supabase.from('campaigns').select('current_amount').eq('id', donateModal.id).single();
                const newAmount = (freshCampaign?.current_amount || 0) + totalItems;
                const { error: updateErr } = await supabase.from('campaigns').update({
                  current_amount: newAmount, updated_at: new Date().toISOString()
                }).eq('id', donateModal.id);
                if (updateErr) console.error('Campaign update error:', updateErr);

                // Update local state
                setActiveCampaigns(prev => prev.map(c => c.id === donateModal.id ? { ...c, current_amount: (c.current_amount || 0) + totalItems } : c));
                toast.success(`Donated ${totalItems} items to ${donateModal.title}!`);
                setDonateModal(null);
              } catch (err) { toast.error('Donation failed: ' + err.message); }
              finally { setDonating(false); }
            };

            return (
              <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,25,23,0.5)', backdropFilter: 'blur(6px)' }}
                onClick={() => setDonateModal(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  onClick={e => e.stopPropagation()}
                  style={{ background: '#fff', borderRadius: 28, width: 480, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 32px 64px rgba(0,0,0,0.2)' }}
                >
                  {/* Header */}
                  <div style={{ position: 'relative', padding: '24px 28px', borderBottom: '1px solid rgba(28,25,23,0.08)' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #2D9B6F, #34b87a)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1C1917' }}>Donate to Campaign</h3>
                        <p style={{ fontSize: 12, color: '#78716C', marginTop: 2 }}>{donateModal.title}</p>
                      </div>
                      <button onClick={() => setDonateModal(null)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(28,25,23,0.08)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <FiX size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#E8622A', background: '#FFF0EA', padding: '3px 10px', borderRadius: 8 }}>Needs: {cat}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#78716C', background: '#FFF5EE', padding: '3px 10px', borderRadius: 8 }}>{donateModal.current_amount || 0}/{donateModal.goal_amount || 0} collected</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ padding: '20px 28px' }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'block' }}>Select Items to Donate</label>
                    {donateForm.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                        <select value={item.name} onChange={e => {
                          const updated = [...donateForm.items];
                          updated[idx].name = e.target.value;
                          setDonateForm({ items: updated });
                        }}
                          style={{ flex: 2, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(28,25,23,0.08)', background: '#FFFDF9', fontSize: 13, fontWeight: 600, color: '#1C1917', outline: 'none' }}>
                          <option value="">Choose item...</option>
                          {itemOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <input type="number" min="1" value={item.quantity} onChange={e => {
                          const updated = [...donateForm.items];
                          updated[idx].quantity = e.target.value;
                          setDonateForm({ items: updated });
                        }}
                          style={{ width: 70, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(28,25,23,0.08)', background: '#FFFDF9', fontSize: 13, fontWeight: 700, color: '#1C1917', textAlign: 'center', outline: 'none' }} />
                        {donateForm.items.length > 1 && (
                          <button onClick={() => setDonateForm({ items: donateForm.items.filter((_, i) => i !== idx) })}
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                            <FiX size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setDonateForm({ items: [...donateForm.items, { name: '', quantity: 1 }] })}
                      style={{ fontSize: 12, fontWeight: 700, color: '#E8622A', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}>
                      + Add another item
                    </button>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '16px 28px 24px', display: 'flex', gap: 10 }}>
                    <button onClick={() => setDonateModal(null)}
                      style={{ flex: 1, padding: '12px', border: '1px solid rgba(28,25,23,0.08)', borderRadius: 14, background: '#fff', color: '#78716C', fontSize: 13, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>
                      Cancel
                    </button>
                    <button onClick={handleCampaignDonate} disabled={donating}
                      style={{
                        flex: 2, padding: '12px', border: 'none', borderRadius: 14,
                        background: 'linear-gradient(135deg, #2D9B6F, #34b87a)',
                        color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        textTransform: 'uppercase', opacity: donating ? 0.6 : 1,
                        boxShadow: '0 4px 16px rgba(45,155,111,0.3)'
                      }}>
                      <FiGift size={16} /> {donating ? 'Donating...' : `Donate ${totalItems} Items`}
                    </button>
                  </div>
                </motion.div>
              </div>
            );
          })()}

          <motion.button
            whileHover={{ backgroundColor: T.surfaceMid, borderColor: T.borderHover }}
            style={{
              width: '100%', padding: '16px', background: T.surface,
              border: `1px solid ${T.border}`, borderRadius: 16,
              color: T.textSecondary, fontWeight: 600, fontSize: 14,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Load Older Activity
          </motion.button>
        </div>

        {/* Sidebar Column */}
        <div className="col-span-1 space-y-6">
          
          {/* Dashboard Portal Card */}
          <MagneticCard intensity={5}>
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ 
                background: T.blue, borderRadius: 20, padding: 32, color: '#fff', 
                boxShadow: `0 20px 40px -10px ${T.blueGlow}`,
                position: 'relative', overflow: 'hidden'
              }}
            >
              {/* Internal glow */}
              <div style={{ position: 'absolute', top: '-50%', right: '-50%', width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)', pointerEvents: 'none' }} />
              
              <div style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <FiGrid size={24} color="#fff" />
                </div>
                <h3 className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Your Workspace</h3>
                <p style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.5, marginBottom: 24 }}>
                  Access your role-specific tools, track your history, and manage your contributions directly in your dashboard.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Link to={dashboardPath}>
                    <motion.button 
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      style={{
                        width: '100%', padding: '14px', background: '#fff', color: T.blueDark,
                        border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                      }}
                    >
                      Open Dashboard <FiChevronRight />
                    </motion.button>
                  </Link>
                  
                  {(role === 'donor' || role === 'community_partner') && (
                    <Link to="/donor/donate">
                      <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        style={{
                          width: '100%', padding: '14px', background: 'rgba(255,255,255,0.1)', color: '#fff',
                          border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, fontWeight: 700, fontSize: 15,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          cursor: 'pointer', transition: 'background 0.2s'
                        }}
                      >
                        <FiHeart /> {role === 'donor' ? 'Make Donation' : 'Record Contribution'}
                      </motion.button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </MagneticCard>

          {/* Quick Platform Stats */}
          <MagneticCard intensity={3}>
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ background: T.surfaceMid, borderRadius: 20, border: `1px solid ${T.border}`, padding: 24 }}
            >
              <h3 style={{ fontSize: 12, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Platform Impact</h3>
              <div className="space-y-6">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>Active Campaigns</span>
                    <span style={{ fontSize: 14, color: T.blue, fontWeight: 700 }}>{campaignStats.active} Running</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: T.surface, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: campaignStats.total > 0 ? `${Math.round((campaignStats.active / campaignStats.total) * 100)}%` : '0%', height: '100%', background: T.blue, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>Overall Goal</span>
                    <span style={{ fontSize: 14, color: T.blue, fontWeight: 700 }}>{campaignStats.goalProgress}% Complete</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: T.amberDim, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${campaignStats.goalProgress}%`, height: '100%', background: `linear-gradient(90deg, ${T.blue}, ${T.amber})`, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          </MagneticCard>

        </div>
      </div>
    </div>
  );
};
