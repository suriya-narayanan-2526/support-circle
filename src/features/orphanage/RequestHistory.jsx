import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { FiClipboard } from 'react-icons/fi';

/* ─── DESIGN TOKENS (Cream & Sage Theme) ─── */
const T = {
  orange:       '#E8622A',
  orangeGlow:   'rgba(232,98,42,0.15)',
  orangeLight:  '#FFF0E8',
  orangeBorder: 'rgba(232,98,42,0.18)',
  green:        '#2D9B6F',
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

// Badges beautifully tuned for light theme
const StatusBadge = ({ status }) => {
  let bg, text, border;
  switch (status?.toLowerCase()) {
    case 'submitted': bg = T.orangeLight; text = T.orange; border = T.orangeBorder; break;
    case 'approved':  bg = '#E0F2FE'; text = '#0284C7'; border = 'rgba(2,132,199,0.2)'; break;
    case 'allocated': bg = T.amberLight; text = T.amber; border = T.amberBorder; break;
    case 'delivered': bg = T.greenLight; text = T.green; border = T.greenBorder; break;
    case 'rejected':  bg = '#FEE2E2'; text = '#DC2626'; border = 'rgba(220,38,38,0.2)'; break;
    default:          bg = '#F1F5F9'; text = '#64748B'; border = 'rgba(100,116,139,0.2)';
  }

  return (
    <span style={{
      background: bg, color: text, border: `1px solid ${border}`,
      padding: '4px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '0.05em'
    }}>
      {status || 'Submitted'}
    </span>
  );
};

const UrgencyBadge = ({ level }) => {
  let bg, text, border;
  if (level === 5) {
    bg = '#FEE2E2'; text = '#DC2626'; border = 'rgba(220,38,38,0.2)';
  } else if (level >= 3) {
    bg = T.amberLight; text = T.amber; border = T.amberBorder;
  } else {
    bg = T.orangeLight; text = T.orange; border = T.orangeBorder;
  }

  return (
    <span style={{
      background: bg, color: text, border: `1px solid ${border}`,
      padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
    }}>
      {level === 5 ? 'Critical (5)' : level >= 3 ? `High (${level})` : `Normal (${level})`}
    </span>
  );
};

export const RequestHistory = ({ limit }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDonations, setRequestDonations] = useState([]);
  const [fetchingDonations, setFetchingDonations] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data: orphanageParams } = await supabase
          .from('orphanages')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!orphanageParams?.id) {
          setLoading(false);
          return;
        }

        let query = supabase
          .from('orphan_requests')
          .select('*')
          .eq('orphanage_id', orphanageParams.id)
          .order('created_at', { ascending: false });

        if (limit) query = query.limit(limit);

        const { data, error } = await query;
        if (error) throw error;
        setRequests(data || []);
      } catch (err) {
        console.error('Error fetching requests:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchRequests();
  }, [user, limit]);

  const handleRequestClick = async (req) => {
    setSelectedRequest(req);
    setFetchingDonations(true);
    try {
      // 1. Fetch donations directly linked via new request_id or legacy campaign_id
      const { data: directData } = await supabase
        .from('donations')
        .select('*')
        .or(`request_id.eq.${req.id},campaign_id.eq.${req.id}`);
      
      // 2. Fetch donations linked via orphanage and category (fallback for legacy/general)
      const { data: fallbackData } = await supabase
        .from('donations')
        .select('*')
        .eq('orphanage_id', req.orphanage_id)
        .eq('category', req.category)
        .is('request_id', null)
        .is('campaign_id', null);

      const allDonations = [...(directData || []), ...(fallbackData || [])];
      
      // Remove duplicates by ID just in case
      const uniqueDonations = Array.from(new Map(allDonations.map(item => [item.id, item])).values());
      setRequestDonations(uniqueDonations);
    } catch (err) {
      console.error('Error fetching linked donations:', err);
    } finally {
      setFetchingDonations(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: T.textMuted }}>
        <p style={{ fontSize: 13, letterSpacing: '0.05em', fontWeight: 600 }}>LOADING REQUESTS...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: T.surfaceWarm, border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
        }}>
          <FiClipboard size={24} color={T.textMuted} />
        </div>
        <p className="font-display" style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8 }}>No active requests</p>
        <p style={{ fontSize: 14, color: T.textSub, maxWidth: 320, lineHeight: 1.6 }}>
          Submit a new request to ask for essential community assistance.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: T.surfaceWarm, borderBottom: `1px solid ${T.borderMid}` }}>
            {['Date', 'Category', 'Urgency', 'Status'].map(head => (
              <th key={head} style={{ padding: '16px 24px', fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {requests.map((req, idx) => (
            <tr 
              key={req.id} 
              onClick={() => handleRequestClick(req)}
              style={{ borderBottom: idx === requests.length - 1 ? 'none' : `1px solid ${T.border}`, transition: 'background 0.2s', background: T.surface, cursor: 'pointer' }} 
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(232,98,42,0.04)'} 
              onMouseLeave={(e) => e.currentTarget.style.background = T.surface}
            >
              <td style={{ padding: '20px 24px', fontSize: 14, color: T.text, fontWeight: 500 }}>
                {new Date(req.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </td>
              <td style={{ padding: '20px 24px', fontSize: 14, fontWeight: 700, color: T.text }}>
                {req.category}
              </td>
              <td style={{ padding: '20px 24px' }}>
                <UrgencyBadge level={req.urgency || 3} />
              </td>
              <td style={{ padding: '20px 24px' }}>
                <StatusBadge status={req.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* REQUEST DETAIL MODAL */}
      {selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
           <div onClick={() => setSelectedRequest(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(28,25,23,0.4)', backdropFilter: 'blur(4px)' }} />
           
           <div style={{ 
              position: 'relative', width: '100%', maxWidth: 600, background: '#fff', borderRadius: 32, overflow: 'hidden', 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', border: `1px solid ${T.borderMid}` 
           }}>
              <div style={{ padding: '32px 40px', background: T.surfaceWarm, borderBottom: `1px solid ${T.borderMid}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <p style={{ fontSize: 10, fontWeight: 800, color: T.orange, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>Fulfillment Intelligence</p>
                    <h3 style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>{selectedRequest.category} Support</h3>
                 </div>
                 <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: T.textMuted }}>✕</button>
              </div>

              <div style={{ padding: 40, maxHeight: '60vh', overflowY: 'auto' }}>
                 <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                       <span style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase' }}>Request Status</span>
                       <StatusBadge status={selectedRequest.status} />
                    </div>
                    
                    {/* Render Requested Items if they exist in notes */}
                    {(() => {
                       try {
                          const items = JSON.parse(selectedRequest.notes);
                          if (Array.isArray(items)) {
                             return (
                                <div style={{ marginBottom: 20 }}>
                                   <p style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', marginBottom: 12 }}>Requested Provisions</p>
                                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                      {items.map((it, idx) => (
                                         <div key={idx} style={{ padding: '10px 16px', borderRadius: 12, background: T.orangeLight, border: `1px solid ${T.orangeBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 14, fontWeight: 800, color: T.orange }}>{it.quantity}{it.unit === 'litre' ? 'L' : 'kg'}</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{it.name}</span>
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             );
                          }
                       } catch (e) {}
                       return <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.6 }}>{selectedRequest.description || 'No detailed description provided for this request.'}</p>;
                    })()}
                 </div>

                 <h4 style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>
                    Community Contributions
                 </h4>

                 {fetchingDonations ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: T.textMuted }}>
                       <p style={{ fontSize: 12, fontWeight: 600 }}>SCANNING DONATION LEDGER...</p>
                    </div>
                 ) : requestDonations.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                       {requestDonations.map(don => (
                          <div key={don.id} style={{ padding: 20, borderRadius: 20, background: T.surface, border: `1px solid ${T.borderMid}`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                                <p style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{don.donor_name || 'Anonymous Donor'}</p>
                                <span style={{ fontSize: 10, fontWeight: 800, color: T.green, background: T.greenLight, padding: '4px 8px', borderRadius: 8 }}>{don.status.toUpperCase()}</span>
                             </div>
                             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {(don.items_json || []).map((item, i) => (
                                   <span key={i} style={{ fontSize: 11, fontWeight: 600, color: T.textSub, background: T.surfaceWarm, padding: '2px 8px', borderRadius: 6 }}>
                                      {item.quantity}x {item.name}
                                   </span>
                                ))}
                             </div>
                             <p style={{ fontSize: 10, color: T.textMuted, marginTop: 12 }}>Logged {new Date(don.created_at).toLocaleDateString()}</p>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div style={{ padding: '40px 0', textAlign: 'center', border: `1px dashed ${T.borderMid}`, borderRadius: 24 }}>
                       <p style={{ fontSize: 13, fontWeight: 600, color: T.textMuted }}>No direct donations matched yet.</p>
                       <p style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Our AI is still matching this request with potential donors.</p>
                    </div>
                 )}
              </div>

              <div style={{ padding: '24px 40px', background: T.surfaceWarm, borderTop: `1px solid ${T.borderMid}`, display: 'flex', justifyContent: 'center' }}>
                 <button onClick={() => setSelectedRequest(null)} style={{ padding: '12px 32px', borderRadius: 16, background: T.text, color: '#fff', fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
                    Close Intelligence Report
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
