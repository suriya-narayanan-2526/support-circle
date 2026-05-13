import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { SignaturePad } from '../../components/SignaturePad';
import { aiRecommendationService } from '../../services/aiRecommendationService';
import { FiFileText, FiUploadCloud, FiCheckCircle, FiClock, FiAlertCircle, FiPenTool, FiZap, FiTarget } from 'react-icons/fi';

const T = {
  orange: '#E8622A',
  bg: '#FFFDF9',
  surface: '#FFFFFF',
  surfaceWarm: '#FFF5EE',
  border: 'rgba(28,25,23,0.07)',
  borderMid: 'rgba(28,25,23,0.11)',
  text: '#1C1917',
  textSub: '#57534E',
  textMuted: '#A8A29E',
  blue: '#3B82F6',
  green: '#10B981',
};

export const CSRApplicationPage = ({ user, profile }) => {
  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const sigCanvas = useRef({});
  const [submitting, setSubmitting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const [form, setForm] = useState({
    org_name: '', reg_number: '', contact_person: '', email: '', phone: '', address: '', org_type: 'Corporate',
    interests: [], support_type: '', estimated_capacity: '', collaboration_duration: ''
  });

  const interestsOptions = ['Education Support', 'Food Support', 'Clothing Support', 'Sponsorship Programs', 'Volunteer Collaboration'];

  useEffect(() => {
    if (!user) return;
    const fetchApps = async () => {
      try {
        const { data } = await supabase.from('csr_applications').select('*').eq('partner_id', user.id).order('created_at', { ascending: false });
        if (data) setApplications(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();

    const fetchAi = async () => {
      const sugg = await aiRecommendationService.suggestCsrInitiative();
      if (sugg) setAiSuggestion(sugg);
    };
    fetchAi();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sigCanvas.current.isEmpty()) {
      toast.error('Digital signature is required.');
      return;
    }
    
    setSubmitting(true);
    try {
      const signatureDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      
      const payload = {
        partner_id: user.id,
        ...form,
        digital_signature: signatureDataUrl,
        status: 'Under Review'
      };

      const { data, error } = await supabase.from('csr_applications').insert([payload]).select().single();
      
      if (error) throw error;
      setApplications(prev => [data, ...prev]);
      setShowForm(false);
      setForm({ org_name: '', reg_number: '', contact_person: '', email: '', phone: '', address: '', org_type: 'Corporate', interests: [], support_type: '', estimated_capacity: '', collaboration_duration: '' });
      toast.success('CSR Partnership Application Submitted!');
    } catch (err) {
      toast.error('Failed to submit application: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const clearSig = () => sigCanvas.current.clear();

  const toggleInterest = (i) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(i) ? prev.interests.filter(x => x !== i) : [...prev.interests, i]
    }));
  };

  if (loading) return <div className="p-8 text-center text-stone-500">Loading CSR data...</div>;

  if (applications.length > 0 && !showForm) {
    return (
      <div style={{ background: T.surface, padding: 40, borderRadius: 24, border: `1px solid ${T.borderMid}`, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 8 }}>CSR Partnership Status</h3>
            <p style={{ fontSize: 14, color: T.textSub }}>Track the progress of your institutional collaboration requests.</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ padding: '12px 24px', borderRadius: 12, background: T.orange, color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
            Submit New Proposal
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {applications.map((app) => (
            <div key={app.id} style={{ border: `1px solid ${T.borderMid}`, borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h4 style={{ fontSize: 18, fontWeight: 800 }}>{app.org_name} <span style={{ fontSize: 14, color: T.textSub, fontWeight: 600 }}>({app.support_type})</span></h4>
                <div style={{ fontSize: 12, color: T.textSub }}>Submitted: {new Date(app.created_at).toLocaleDateString()}</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ padding: 16, borderRadius: 12, background: T.surfaceWarm }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: T.textSub, textTransform: 'uppercase' }}>Current Status</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    {app.status === 'Approved' ? <FiCheckCircle color={T.green} size={16} /> : <FiClock color={T.orange} size={16} />}
                    <span style={{ fontSize: 15, fontWeight: 800, color: app.status === 'Approved' ? T.green : T.orange }}>{app.status}</span>
                  </div>
                </div>
                <div style={{ padding: 16, borderRadius: 12, background: T.surfaceWarm }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: T.textSub, textTransform: 'uppercase' }}>Panel Member</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: T.text, marginTop: 4 }}>{app.panel_member_id ? 'Assigned' : 'Pending Assignment'}</p>
                </div>
                <div style={{ padding: 16, borderRadius: 12, background: T.surfaceWarm }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: T.textSub, textTransform: 'uppercase' }}>Meeting Scheduled</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: T.text, marginTop: 4 }}>{app.meeting_scheduled ? new Date(app.meeting_scheduled).toLocaleDateString() : 'Not Scheduled'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: T.surface, padding: 40, borderRadius: 24, border: `1px solid ${T.borderMid}`, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 8 }}>CSR Partnership Application</h3>
          <p style={{ fontSize: 14, color: T.textSub }}>Formalize your institutional contribution strategy. Complete this form to initiate a partnership review by our panel.</p>
        </div>
        {applications.length > 0 && (
          <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: 8, background: T.bg, color: T.textSub, border: `1px solid ${T.border}`, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
        )}
      </div>

      {aiSuggestion && (
         <motion.div
           initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
           style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20, padding: 24, marginBottom: 32, display: 'flex', gap: 20 }}
         >
            <div style={{ width: 56, height: 56, borderRadius: 14, background: T.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <FiTarget size={28} />
            </div>
            <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: T.blue, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Smart CSR Architect Suggestion</span>
                  <FiZap size={12} color={T.blue} className="animate-pulse" />
               </div>
               <h4 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 6 }}>{aiSuggestion.title}</h4>
               <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.5, marginBottom: 16 }}>{aiSuggestion.description}</p>
               <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    type="button"
                    onClick={() => {
                      setForm(prev => ({ 
                        ...prev, 
                        support_type: `Institutional ${aiSuggestion.targetCategory} Support`,
                        interests: [ ...new Set([...prev.interests, `${aiSuggestion.targetCategory} Support`])]
                      }));
                      toast.success("AI Recommendation Applied!");
                    }}
                    style={{ padding: '8px 16px', borderRadius: 10, background: T.blue, color: '#fff', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Apply Intelligent Blueprint
                  </button>
                  <div style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #C7D2FE', fontSize: 12, fontWeight: 800, color: T.blue }}>
                     Priority: {aiSuggestion.priority}
                  </div>
               </div>
            </div>
         </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1 */}
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>1. Organization Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Organization Name" value={form.org_name} onChange={e => setForm({...form, org_name: e.target.value})} className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 outline-none font-medium" />
            <input placeholder="Registration Number" value={form.reg_number} onChange={e => setForm({...form, reg_number: e.target.value})} className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 outline-none font-medium" />
            <input required placeholder="Contact Person" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 outline-none font-medium" />
            <input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 outline-none font-medium" />
            <input required placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 outline-none font-medium" />
            <select value={form.org_type} onChange={e => setForm({...form, org_type: e.target.value})} className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 outline-none font-medium">
              <option>Corporate</option><option>NGO</option><option>Educational Institution</option><option>Other</option>
            </select>
            <input placeholder="Full Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 outline-none font-medium md:col-span-2" />
          </div>
        </div>

        {/* Section 2 */}
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>2. CSR Support Interests</h4>
          <div className="flex flex-wrap gap-3">
            {interestsOptions.map(opt => (
              <button type="button" key={opt} onClick={() => toggleInterest(opt)}
                style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${form.interests.includes(opt) ? T.orange : T.borderMid}`, background: form.interests.includes(opt) ? T.orangeLight : 'transparent', color: form.interests.includes(opt) ? T.orange : T.textSub, fontWeight: 700, fontSize: 13, transition: 'all 0.2s' }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3 */}
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>3. Contribution Proposal</h4>
          <div className="space-y-4">
            <textarea required rows={3} placeholder="Type of support offered (Details)" value={form.support_type} onChange={e => setForm({...form, support_type: e.target.value})} className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 outline-none font-medium resize-y" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="Estimated support capacity (e.g. 500 meals/month)" value={form.estimated_capacity} onChange={e => setForm({...form, estimated_capacity: e.target.value})} className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 outline-none font-medium" />
              <input required placeholder="Proposed collaboration duration (e.g. 1 Year)" value={form.collaboration_duration} onChange={e => setForm({...form, collaboration_duration: e.target.value})} className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 outline-none font-medium" />
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>4. Digital Signature Authentication</h4>
          <p style={{ fontSize: 13, color: T.textSub, marginBottom: 16 }}>Sign below to declare authenticity and authorize this partnership proposal.</p>
          <div style={{ border: `1px solid ${T.borderMid}`, borderRadius: 16, background: '#fff', overflow: 'hidden' }}>
            <SignaturePad onReady={(api) => { sigCanvas.current = api; }} penColor={T.text} />
          </div>
          <button type="button" onClick={clearSig} style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: T.orange, background: 'none', border: 'none', cursor: 'pointer' }}>Clear Signature</button>
        </div>

        <button disabled={submitting} type="submit" style={{ width: '100%', padding: 16, borderRadius: 16, background: T.orange, color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: `0 8px 24px ${T.orangeGlow}`, transition: 'all 0.2s' }}>
          {submitting ? 'Submitting Application...' : 'Submit Partnership Application for Panel Review'}
        </button>
      </form>
    </div>
  );
};
