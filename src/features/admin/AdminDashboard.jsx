import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  FiUsers, FiCheckCircle, FiAlertCircle, FiActivity, 
  FiPackage, FiSettings, FiLogOut, FiShield, FiSend,
  FiSearch, FiFilter, FiBarChart2, FiClock, FiX, FiUser, FiGrid, FiStar, FiAlertTriangle,
  FiFlag, FiCalendar, FiPlus, FiEdit, FiTrash2, FiTarget, FiFileText
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import toast from 'react-hot-toast';
import { PageLoader } from '../../components/PageLoader';


const T = {
  navy: '#1E293B',
  navyLight: '#334155',
  orange: '#E8622A',
  green: '#2D9B6F',
  blue: '#3B82F6',
  amber: '#D97706',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSub: '#64748B',
};

const OrphanageInfoModal = ({ orphanage, auditHistory, onClose }) => {
  if (!orphanage) return null;
  const latestAudit = auditHistory.length > 0 ? auditHistory[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 relative shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-stone-100 text-stone-500">
          <FiX size={20} />
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-3xl font-black text-stone-900">{orphanage.full_name}</h2>
            {orphanage.is_verified && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><FiCheckCircle /> Verified</span>}
          </div>
          <p className="text-stone-500 font-medium">{orphanage.email} • {orphanage.phone || 'No phone provided'}</p>
        </div>

        <div className="space-y-8">
          {/* General Info */}
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest mb-4">Orphanage Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase">Location</p>
                <p className="font-medium text-stone-800">{orphanage.location || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase">Joined Platform</p>
                <p className="font-medium text-stone-800">{new Date(orphanage.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Latest Audit Info */}
          <div>
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest mb-4">Latest Inventory Audit</h3>
            {!latestAudit ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                <p className="text-stone-500 font-medium">No inventory audits have been conducted for this orphanage yet.</p>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Audit Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-black uppercase ${latestAudit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {latestAudit.status}
                      </span>
                      {latestAudit.status === 'completed' && <span className="text-sm font-medium text-stone-500">on {new Date(latestAudit.visit_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Beneficiaries</p>
                    <p className="text-2xl font-black text-stone-800">{latestAudit.beneficiary_count || 0}</p>
                  </div>
                </div>

                {latestAudit.audit_data && Array.isArray(latestAudit.audit_data) && (
                  <div className="p-6">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Stock Levels</h4>
                    <div className="space-y-3">
                      {latestAudit.audit_data.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-stone-100">
                          <div className="flex-1">
                            <p className="font-bold text-stone-800">{item.name}</p>
                            <p className="text-xs text-stone-500">Available: {item.available} | Required: {item.required}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-stone-400 uppercase mb-0.5">Deficit</p>
                            <p className={`font-black ${item.deficit > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{item.deficit}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {latestAudit.notes && (
                  <div className="p-6 border-t border-stone-100 bg-amber-50/50">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Volunteer Notes</p>
                    <p className="text-sm text-stone-700 italic">"{latestAudit.notes}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const VolunteerInfoModal = ({ volunteer, onClose }) => {
  if (!volunteer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-3xl p-8 relative shadow-2xl text-center"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-stone-100 text-stone-500 transition-colors">
          <FiX size={20} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-stone-100 mb-4 border-4 border-stone-50 shadow-md">
            {volunteer.face_image ? (
              <img src={volunteer.face_image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300">
                <FiUser size={40} />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-black text-stone-900 leading-tight">{volunteer.full_name}</h2>
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-2">
            <FiCheckCircle size={14} /> Identity Verified
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Impact Rating</p>
            <div className="flex items-center justify-center gap-1.5">
               <FiStar size={16} className="text-amber-500 fill-amber-500" />
               <span className="text-lg font-black text-stone-800">{Number(volunteer.rating || 5).toFixed(1)}</span>
            </div>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Status</p>
            <p className="text-sm font-black text-emerald-600 uppercase tracking-tighter">Active Agent</p>
          </div>
        </div>

        <div className="text-left space-y-4">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Contact Email</p>
            <p className="text-sm font-medium text-stone-800 truncate">{volunteer.email || 'Private Identity'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Operational Area</p>
            <p className="text-sm font-medium text-stone-800">Global Hub</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 bg-stone-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg"
        >
          Close Intelligence
        </button>
      </motion.div>
    </div>
  );
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonations: 0,
    pendingPartners: 0,
    pendingOrphanages: 0,
    pendingDonations: 0
  });
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [activeView, setActiveView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') || 'overview';
  });
  const [growthData, setGrowthData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [globalDonations, setGlobalDonations] = useState([]);
  const [allOrphanages, setAllOrphanages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
   const [roleFilter, setRoleFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isAllocating, setIsAllocating] = useState(null);
  const [selectedDonations, setSelectedDonations] = useState([]);
  const [selectedOrphanage, setSelectedOrphanage] = useState(null);
  const [orphanageTab, setOrphanageTab] = useState('inventory'); // Array of donation objects for bulk
  const [allOrphanRequests, setAllOrphanRequests] = useState([]);
  const [orphanageInventory, setOrphanageInventory] = useState([]);
  const [orphanageAllocations, setOrphanageAllocations] = useState([]);
  const [orphanageRecords, setOrphanageRecords] = useState([]); // orphanages table records {id, user_id, name}
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [dispatchConfirm, setDispatchConfirm] = useState(null); // { orphanage, allocations }
  const [dispatching, setDispatching] = useState(false);
  const [allResourceAllocations, setAllResourceAllocations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ title: '', description: '', category: 'donation_drive', donation_category: 'Clothing', goal_amount: '', start_date: '', end_date: '', priority: 'normal', status: 'draft' });
  const [assignedVolunteer, setAssignedVolunteer] = useState(null);
  const [loadingVolunteer, setLoadingVolunteer] = useState(false);
  const [csrApplications, setCsrApplications] = useState([]);
  const [selectedCsr, setSelectedCsr] = useState(null);
  const [meetingDate, setMeetingDate] = useState('');
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [onlineVolunteers, setOnlineVolunteers] = useState({});
  const [selectedOrphanageInfo, setSelectedOrphanageInfo] = useState(null);
  const [orphanageAuditHistory, setOrphanageAuditHistory] = useState([]);
  const [allInventoryAudits, setAllInventoryAudits] = useState([]);
  const [viewingVolunteer, setViewingVolunteer] = useState(null); // volunteer object v443 v443
  const [selectedAuditOrg, setSelectedAuditOrg] = useState('all'); // 'all' or orphanage_id

  const handleViewOrphanage = async (orphanage) => {
    setSelectedOrphanageInfo(orphanage);
    const orgRec = orphanageRecords.find(r => r.user_id === orphanage.id);
    if (orgRec) {
      const { data } = await supabase.from('inventory_audits')
        .select('*')
        .eq('orphanage_id', orgRec.id)
        .order('created_at', { ascending: false });
      setOrphanageAuditHistory(data || []);
    } else {
      setOrphanageAuditHistory([]);
    }
  };

  // Sync URL with active view
  useEffect(() => {
    const url = new URL(window.location);
    url.searchParams.set('view', activeView);
    window.history.replaceState({}, '', url);
  }, [activeView]);

  useEffect(() => {
    fetchAdminData();

    // Real-time subscription for donations to update badges/stats
    const donationSubscription = supabase
      .channel('admin-donations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => {
        fetchAdminData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(donationSubscription);
    };
  }, []);

  // Real-time Presence tracking for Volunteers
  useEffect(() => {
    const channel = supabase.channel('volunteers-presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineVolunteers(channel.presenceState());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch inventory when selected orphanage changes
  useEffect(() => {
    if (!selectedOrphanage) return;
    supabase
      .from('orphanages')
      .select('current_inventory_json')
      .eq('user_id', selectedOrphanage.id)
      .maybeSingle()
      .then(({ data }) => {
        let inv = data?.current_inventory_json;
        if (typeof inv === 'string') try { inv = JSON.parse(inv); } catch(e) { inv = []; }
        setOrphanageInventory(Array.isArray(inv) ? inv : []);
      });
  }, [selectedOrphanage]);

  // Fetch allocated resources from resource_allocations table
  useEffect(() => {
    if (!selectedOrphanage) return;
    setLoadingAllocations(true);
    supabase
      .from('orphanages')
      .select('id')
      .eq('user_id', selectedOrphanage.id)
      .maybeSingle()
      .then(({ data: orgRecord }) => {
        if (!orgRecord) {
          setOrphanageAllocations([]);
          setLoadingAllocations(false);
          return;
        }
        return supabase
          .from('resource_allocations')
          .select('*')
          .eq('orphanage_id', orgRecord.id)
          .eq('status', 'allocated')
          .order('created_at', { ascending: false });
      })
      .then((res) => {
        if (!res) return;
        setOrphanageAllocations(res.data || []);
        setLoadingAllocations(false);
      });
  }, [selectedOrphanage]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString();

      // Individual queries to avoid entire block failure
      const [
        partnersRes,
        orphanagesRes,
        donationsRes,
        usersRes,
        donationsHistory,
        usersHistory,
        orphanReqs,
        orgRecords,
        resAllocs,
        campaignData,
        csrData,
        volunteerData,
        auditsRes
      ] = await Promise.all([
        supabase.from('partners').select('*').eq('is_verified', false),
        supabase.from('orphanages').select('*').eq('is_verified', false),
        supabase.from('donations').select('*'),
        supabase.from('users').select('*'),
        supabase.from('donations').select('created_at, quantity').gte('created_at', dateStr),
        supabase.from('users').select('created_at').gte('created_at', dateStr),
        supabase.from('orphan_requests').select('*, orphanages(name, location)').order('created_at', { ascending: false }),
        supabase.from('orphanages').select('id, user_id, name'),
        supabase.from('resource_allocations').select('*').eq('status', 'allocated'),
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('csr_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('volunteers').select('*').order('full_name', { ascending: true }),
        supabase.from('inventory_audits').select('*').order('created_at', { ascending: false })
      ]);

      // 1. Process Pending Verifications
      const pending = [
        ...(partnersRes.data || []).map(p => ({ ...p, type: 'Partner', name: p.institution_name })),
        ...(orphanagesRes.data || []).map(o => ({ ...o, type: 'Orphanage', name: o.orphanage_name }))
      ];
      setPendingVerifications(pending);

      // 2. Process Global Stats
      const totalQuantity = (donationsRes.data || [])
        .filter(d => d.status === 'delivered')
        .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
      setStats({
        totalUsers: (usersRes.data || []).length,
        totalDonations: totalQuantity,
        pendingPartners: (partnersRes.data || []).length,
        pendingOrphanages: (orphanagesRes.data || []).length,
        pendingDonations: (donationsRes.data || []).filter(d => d.status === 'submitted').length
      });

      // 3. Process Growth Data (Last 7 Days)
      const chartMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString(undefined, { weekday: 'short' });
        const dateKey = d.toISOString().split('T')[0];
        chartMap[dateKey] = { name: label, donations: 0, users: 0 };
      }

      (usersHistory.data || []).forEach(u => {
        const day = u.created_at.split('T')[0];
        if (chartMap[day]) chartMap[day].users += 1;
      });

      (donationsHistory.data || []).forEach(d => {
        const day = d.created_at.split('T')[0];
        if (chartMap[day]) chartMap[day].donations += (Number(d.quantity) || 0);
      });

      setGrowthData(Object.values(chartMap));

      // 4. Set state data
      setAllUsers(usersRes.data || []);
      setGlobalDonations(donationsRes.data || []);
      setAllOrphanRequests(orphanReqs.data || []);
      setAllOrphanages(usersRes.data?.filter(u => u.role === 'orphanage') || []);
      setOrphanageRecords(orgRecords.data || []);
      setAllResourceAllocations(resAllocs.data || []);
      setCampaigns(campaignData.data || []);
      setCsrApplications(csrData.data || []);
      setAllVolunteers(volunteerData.data || []);
      setAllInventoryAudits(auditsRes.data || []);

      const roleCounts = (usersRes.data || []).reduce((acc, u) => {
        const r = u.role || 'Other';
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {});

      const formattedPie = Object.entries(roleCounts).map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '), 
        value 
      }));
      setPieData(formattedPie);

    } catch (err) {
      console.error('Admin Dashboard Load Error:', err);
      toast.error('Failed to load real-time analytics');
    } finally {
      setLoading(false);
    }
  };



  const fetchVolunteerForDonation = async (donation) => {
    if (!donation.volunteer_id) {
      toast.error('No volunteer has been assigned to this donation yet.');
      return;
    }
    setSelectedDonation(donation);
    setLoadingVolunteer(true);
    setAssignedVolunteer(null);
    try {
      const [userRes, volRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', donation.volunteer_id).single(),
        supabase.from('volunteers').select('*').eq('user_id', donation.volunteer_id).maybeSingle()
      ]);
      
      if (userRes.error) throw userRes.error;
      
      const combined = { 
        ...userRes.data, 
        face_image: volRes.data?.face_image,
        rating: volRes.data?.rating 
      };
      
      setAssignedVolunteer(combined);
    } catch (err) {
      console.error('Logistics fetch error:', err);
      toast.error('Could not retrieve volunteer intelligence');
    } finally {
      setLoadingVolunteer(false);
    }
  };

  const handleVerify = async (id, type, action) => {
    const table = type === 'Partner' ? 'partners' : 'orphanages';
    const is_verified = action === 'approve';
    
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_verified })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`${type} ${action === 'approve' ? 'verified' : 'rejected'} successfully`);
      fetchAdminData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAllocate = async (donations, orphanageId) => {
    // Ensure donations is an array for consistent processing
    const donationList = Array.isArray(donations) ? donations : [donations];
    
    try {
      // 1. Get current inventory of the orphanage
      const { data: orphanage, error: fetchErr } = await supabase
        .from('orphanages')
        .select('id, current_inventory_json, name')
        .eq('user_id', orphanageId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      let currentInv = [];
      let orphanageRecordId = orphanage?.id;

      if (orphanage) {
        currentInv = orphanage.current_inventory_json;
        if (typeof currentInv === 'string') try { currentInv = JSON.parse(currentInv); } catch(e) { currentInv = []; }
        if (!Array.isArray(currentInv)) currentInv = [];
      } else {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', orphanageId).single();
        const { data: newOrg, error: createErr } = await supabase
          .from('orphanages')
          .insert({ 
            user_id: orphanageId, 
            name: profile?.full_name || 'Organization Entity',
            current_inventory_json: [] 
          })
          .select().single();
        
        if (createErr) throw createErr;
        orphanageRecordId = newOrg.id;
        currentInv = [];
      }

      // 2. Aggregate all items from all selected donations
      let allNewItems = [];
      const allocationRows = [];
      donationList.forEach(d => {
        let items = d.items_json;
        if (typeof items === 'string') try { items = JSON.parse(items); } catch(e) { items = []; }
        if (Array.isArray(items)) {
          allNewItems = [...allNewItems, ...items];
          items.forEach(it => {
            allocationRows.push({
              orphanage_id: orphanageRecordId,
              donation_id: d.id,
              donor_name: d.donor_name || 'Anonymous',
              category: d.category || 'Other',
              item_name: it.name,
              quantity: Number(it.quantity) || 0,
              status: 'allocated'
            });
          });
        }
      });
      
      const updatedInv = [...currentInv, ...allNewItems];

      // 3. Update Orphanage & All Donations
      const { error: updateErr } = await supabase
        .from('orphanages')
        .update({ current_inventory_json: updatedInv })
        .eq('id', orphanageRecordId);

      if (updateErr) throw updateErr;

      const donationIds = donationList.map(d => d.id);
      const { error: donationErr } = await supabase
        .from('donations')
        .update({ status: 'allocated', orphanage_id: orphanageRecordId })
        .in('id', donationIds);

      if (donationErr) throw donationErr;

      // 4. Insert into resource_allocations table
      if (allocationRows.length > 0) {
        const { error: allocErr } = await supabase
          .from('resource_allocations')
          .insert(allocationRows);
        if (allocErr) throw allocErr;
      }

      toast.success(`${donationList.length} Batch(es) successfully allocated`);
      setIsAllocating(null);
      setSelectedDonations([]);
      fetchAdminData();
    } catch (err) {
      console.error('Allocation Error:', err);
      toast.error('Failed to deploy manifest: ' + err.message);
    }
  };

  const handleCsrUpdate = async (id, payload) => {
    try {
      const { error } = await supabase.from('csr_applications').update(payload).eq('id', id);
      if (error) throw error;
      toast.success('CSR Application updated successfully.');
      if (payload.status) {
        setSelectedCsr(null);
      } else {
        setSelectedCsr(prev => ({ ...prev, ...payload }));
      }
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
    }
  };

  const handleRequestAudit = async (orphanage) => {
    try {
      const orgRec = orphanageRecords.find(r => r.user_id === orphanage.id);
      if (!orgRec) {
        toast.error('Orphanage record not fully set up yet.');
        return;
      }
      
      const { error } = await supabase.from('inventory_audits').insert({
        orphanage_id: orgRec.id,
        orphanage_name: orphanage.full_name,
        status: 'requested',
        beneficiary_count: 50 // default, volunteer will update
      });

      if (error) throw error;
      toast.success(`Inventory audit requested for ${orphanage.full_name}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to request audit: ' + err.message);
    }
  };


  const handleDownloadCsrPdf = (csr) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(30, 41, 59); // T.navy
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('CSR Partnership Proposal', 14, 25);
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Application ID: ${csr.id}`, 14, 32);
    
    // Org Details Table
    autoTable(doc, {
      startY: 50,
      head: [['Organization Details', '']],
      body: [
        ['Organization Name', csr.org_name || 'N/A'],
        ['Registration Number', csr.reg_number || 'N/A'],
        ['Organization Type', csr.org_type || 'N/A'],
        ['Contact Person', csr.contact_person || 'N/A'],
        ['Email', csr.email || 'N/A'],
        ['Phone', csr.phone || 'N/A'],
        ['Address', csr.address || 'N/A']
      ],
      theme: 'grid',
      headStyles: { fillColor: [232, 98, 42], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
      styles: { fontSize: 10, cellPadding: 6 }
    });

    // Proposal Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Contribution Proposal', '']],
      body: [
        ['Support Type', csr.support_type || 'N/A'],
        ['Support Interests', Array.isArray(csr.interests) ? csr.interests.join(', ') : 'None specified'],
        ['Estimated Capacity', csr.estimated_capacity || 'N/A'],
        ['Collaboration Duration', csr.collaboration_duration || 'N/A'],
        ['Current Status', csr.status || 'N/A']
      ],
      theme: 'grid',
      headStyles: { fillColor: [45, 155, 111], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
      styles: { fontSize: 10, cellPadding: 6 }
    });
    
    // Signature block
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, 'bold');
    doc.text('Digital Signature Authentication', 14, finalY);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('This document represents an official intent for institutional partnership.', 14, finalY + 6);

    if (csr.digital_signature) {
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, finalY + 12, 80, 35, 'S');
      doc.addImage(csr.digital_signature, 'PNG', 16, finalY + 14, 76, 31);
    } else {
      doc.text('No signature provided.', 14, finalY + 20);
    }
    
    doc.save(`CSR_Proposal_${csr.org_name.replace(/\s+/g, '_')}.pdf`);
  };



  if (loading) return <PageLoader message="Loading Admin Panel" subtitle="Aggregating platform data..." />;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: 280, background: T.navy, color: '#fff', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiShield size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>Admin Panel</h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support Circle v1.0</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { id: 'overview', label: 'Dashboard', icon: FiActivity },
            { id: 'verifications', label: 'Verifications', icon: FiCheckCircle, badge: stats.pendingPartners + stats.pendingOrphanages },
            { id: 'users', label: 'User Directory', icon: FiUsers },
            { id: 'donations', label: 'Global Donations', icon: FiPackage, badge: stats.pendingDonations },
            { id: 'orphan_requests', label: 'Orphan Requests', icon: FiAlertTriangle },
            { id: 'inventory', label: 'Inventory Control', icon: FiGrid },
            { id: 'orphanages', label: 'Orphan Inventory', icon: FiShield },
            { id: 'orphan_allocations', label: 'Resource Allocation', icon: FiPackage },
            { id: 'csr', label: 'CSR Proposals', icon: FiFileText },
            { id: 'volunteers', label: 'Volunteer Management', icon: FiUsers },
            { id: 'campaigns', label: 'Campaigns', icon: FiFlag },
            { id: 'settings', label: 'System Settings', icon: FiSettings },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 12, border: 'none',
                background: activeView === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeView === item.id ? '#fff' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600 }}>
                <item.icon size={18} />
                {item.label}
              </div>
              {item.badge > 0 && (
                <span style={{ fontSize: 10, fontWeight: 800, background: T.orange, color: '#fff', padding: '2px 8px', borderRadius: 10 }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto' }}>
           <button 
             onClick={() => navigate('/')}
             style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
           >
             <FiLogOut /> Logout
           </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto', maxHeight: '100vh' }}>
        
        {/* HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>
              {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
            </h2>
            <p style={{ color: T.textSub, fontSize: 14 }}>Welcome back, System Administrator</p>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.textSub }} />
              <input 
                type="text" placeholder={activeView === 'users' ? "Search users..." : "Global Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '12px 16px 12px 42px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, width: 280, fontSize: 14 }}
              />
            </div>
          </div>
        </header>

        {/* OVERVIEW CONTENT */}
        {activeView === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
              {[
                { label: 'Total Members', value: stats.totalUsers, icon: FiUsers, color: T.blue },
                { label: 'Resource Impact', value: stats.totalDonations, icon: FiPackage, color: T.green },
                { label: 'Pending Partners', value: stats.pendingPartners, icon: FiShield, color: T.orange },
                { label: 'Pending Orphanages', value: stats.pendingOrphanages, icon: FiAlertCircle, color: T.amber },
              ].map((stat, i) => (
                <motion.div
                  key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  style={{ background: T.surface, padding: 24, borderRadius: 20, border: `1px solid ${T.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{stat.label}</p>
                      <h4 style={{ fontSize: 28, fontWeight: 800, color: T.text }}>{stat.value}</h4>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                      <stat.icon size={22} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CHARTS */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              <div style={{ background: T.surface, padding: 32, borderRadius: 24, border: `1px solid ${T.border}` }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 24 }}>Platform Growth (Last 7 Days)</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: T.textSub, fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textSub, fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 20 }} />
                      <Line name="New Donations" type="monotone" dataKey="donations" stroke={T.orange} strokeWidth={4} dot={{ r: 4, fill: T.orange }} activeDot={{ r: 6 }} />
                      <Line name="New Users" type="monotone" dataKey="users" stroke={T.blue} strokeWidth={4} dot={{ r: 4, fill: T.blue }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: T.surface, padding: 32, borderRadius: 24, border: `1px solid ${T.border}` }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 24 }}>User Role Distribution</h3>
                <div style={{ height: 300 }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={pieData}
                         innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value"
                       >
                         {pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={[T.orange, T.blue, T.green, T.amber, '#8B5CF6'][index % 5]} />
                         ))}
                       </Pie>
                       <Tooltip />
                       <Legend verticalAlign="bottom" align="center" />
                     </PieChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USER DIRECTORY VIEW */}
        {activeView === 'users' && (
          <div style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>All Registered Users</h3>
                <p style={{ fontSize: 13, color: T.textSub }}>Full directory of donors, partners, and orphanages</p>
              </div>
            </div>

            <div style={{ padding: '24px 32px', display: 'flex', gap: 24, borderBottom: `1px solid ${T.border}`, background: T.bg }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 16 }}>Platform Demographics</h4>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={[T.orange, T.blue, T.green, T.amber, '#8B5CF6'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="middle" align="right" layout="vertical" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
                <div style={{ background: T.surface, padding: 16, borderRadius: 16, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Total Registered Network</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.text, marginTop: 4 }}>{allUsers.length}</div>
                </div>
                <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5 }}>
                  This interactive directory manages all platform participants. Use the graphical chart to analyze distribution between Donors, Volunteers, Orphanages, and Partners.
                </p>
              </div>
            </div>

            <div style={{ padding: '24px 32px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 24 }}>
              {['all', 'donor', 'volunteer', 'orphanage', 'community_partner'].map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  style={{
                    background: 'none', border: 'none', padding: '8px 0', fontSize: 13, fontWeight: 700,
                    color: roleFilter === role ? T.orange : T.textSub,
                    borderBottom: roleFilter === role ? `2px solid ${T.orange}` : '2px solid transparent',
                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s'
                  }}
                >
                  {role.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: T.bg }}>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Full Name / Email</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Role</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Joined On</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers
                    .filter(u => {
                      const matchesSearch = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          u.email?.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
                      return matchesSearch && matchesRole;
                    })
                    .map((u, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = T.bg}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ fontWeight: 700, color: T.text }}>{u.full_name || 'No Name'}</div>
                        <div style={{ fontSize: 12, color: T.textSub }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: '#F1F5F9', color: T.navyLight, textTransform: 'capitalize' }}>
                          {u.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '20px 32px', fontSize: 14, color: T.textSub }}>
                         {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.green, fontWeight: 700 }}>
                           <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />
                           Active
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GLOBAL DONATIONS VIEW */}
        {activeView === 'donations' && (
          <div style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Global Contribution Ledger</h3>
                  <p style={{ fontSize: 13, color: T.textSub }}>Complete history of all resources shared on the platform</p>
                </div>
                {stats.pendingDonations > 0 && (
                   <div style={{ background: T.orangeLight, color: T.orange, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, border: `1px solid ${T.orange}20`, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.orange }} />
                      {stats.pendingDonations} Pending Action
                   </div>
                )}
                {categoryFilter !== 'all' && (
                   <div style={{ background: T.greenLight, color: T.green, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, border: `1px solid ${T.green}20`, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiPackage size={14} />
                      {globalDonations.filter(d => d.status === 'delivered' && (d.category === categoryFilter || (categoryFilter === 'Education' && d.category === 'Books'))).reduce((s, d) => s + (d.quantity || 0), 0)} {categoryFilter} Delivered
                   </div>
                )}
              </div>
            </div>

            <div style={{ padding: '0 32px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 24, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {['all', 'Food', 'Clothing', 'Education', 'Toys', 'Other'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    background: 'none', border: 'none', padding: '8px 0', fontSize: 13, fontWeight: 700,
                    color: categoryFilter === cat ? T.orange : T.textSub,
                    borderBottom: categoryFilter === cat ? `2px solid ${T.orange}` : '2px solid transparent',
                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div style={{ padding: '16px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', background: T.bg + '50' }}>
               <span style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', alignSelf: 'center', marginRight: 8 }}>Status:</span>
               {['all', 'submitted', 'in_transit', 'delivered'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    background: statusFilter === status ? T.navy : 'transparent', 
                    border: `1px solid ${statusFilter === status ? T.navy : T.border}`,
                    padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    color: statusFilter === status ? '#fff' : T.textSub,
                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: T.bg }}>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Donor / Organization</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Category / Items</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Quantity</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {globalDonations
                    .filter(d => {
                      const matchesSearch = d.donor_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          d.category?.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesCat = categoryFilter === 'all' || 
                                         d.category === categoryFilter || 
                                         (categoryFilter === 'Education' && d.category === 'Books');
                      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
                      return matchesSearch && matchesCat && matchesStatus;
                    })
                    .map((d, idx) => {
                      const isClickable = d.status?.toLowerCase() === 'in_transit' || d.status?.toLowerCase() === 'delivered';
                      return (
                        <tr 
                          key={idx} 
                          onClick={() => isClickable && fetchVolunteerForDonation(d)}
                          style={{ 
                            borderBottom: `1px solid ${T.border}`, 
                            cursor: isClickable ? 'pointer' : 'default',
                            transition: 'background 0.2s' 
                          }}
                          onMouseEnter={(e) => isClickable && (e.currentTarget.style.background = T.bg)}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '20px 32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                               <div style={{ fontWeight: 700, color: T.text }}>{d.donor_name}</div>
                               {window.adminUserRoleMap && window.adminUserRoleMap[d.donor_id] === 'community_partner' && (
                                  <FiCheckCircle size={14} color={T.blue} fill={T.blue + '10'} title="Verified Community Partner" />
                               )}
                            </div>
                            <div style={{ fontSize: 11, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID: {d.id.slice(0,8)}</div>
                          </td>
                          <td style={{ padding: '20px 32px', maxWidth: 300 }}>
                            <div style={{ marginBottom: 6 }}>
                               <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: T.navy + '10', color: T.navyLight, textTransform: 'uppercase' }}>
                                 {d.category}
                               </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                               {(() => {
                                  let items = d.items_json;
                                  if (typeof items === 'string') {
                                     try { items = JSON.parse(items); } catch(e) { items = null; }
                                  }
                                  if (items && Array.isArray(items)) {
                                     return items.map((it, i) => (
                                        <span key={i} style={{ fontSize: 11, fontWeight: 600, color: T.text, background: T.bg, padding: '2px 8px', borderRadius: 6, border: `1px solid ${T.border}` }}>
                                           {it.name} <span style={{ color: T.orange, fontWeight: 800 }}>x{it.quantity}</span>
                                        </span>
                                     ));
                                  }
                                  return <span style={{ fontSize: 12, color: T.textSub }}>{d.items_description || 'Details unavailable'}</span>;
                               })()}
                            </div>
                          </td>
                          <td style={{ padding: '20px 32px' }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{d.quantity} units</div>
                          </td>
                          <td style={{ padding: '20px 32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: d.status?.toLowerCase() === 'delivered' ? T.green : T.orange }}>
                               <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.status?.toLowerCase() === 'delivered' ? T.green : T.orange }} />
                               {d.status?.replace('_', ' ')}
                            </div>
                          </td>
                          <td style={{ padding: '20px 32px', fontSize: 14, color: T.textSub }}>
                             {new Date(d.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INVENTORY MANAGEMENT VIEW */}
        {activeView === 'inventory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ padding: '0 32px', display: 'flex', gap: 24, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {['all', 'Food', 'Clothing', 'Education', 'Toys', 'Other'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    background: 'none', border: 'none', padding: '8px 0', fontSize: 13, fontWeight: 700,
                    color: categoryFilter === cat ? T.orange : T.textSub,
                    borderBottom: categoryFilter === cat ? `2px solid ${T.orange}` : '2px solid transparent',
                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ background: T.surface, padding: 32, borderRadius: 24, border: `1px solid ${T.border}` }}>
               <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 24 }}>
                 {categoryFilter === 'all' ? 'Inventory Distribution (Delivered Only)' : `${categoryFilter} Stock Level (Delivered)`}
               </h3>
               <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={
                      categoryFilter === 'all' 
                      ? ['Food', 'Clothing', 'Education', 'Toys', 'Other'].map(cat => ({
                          name: cat,
                          total: globalDonations.filter(d => d.status === 'delivered' && (d.category === cat || (cat === 'Education' && d.category === 'Books'))).reduce((s, d) => s + (d.quantity || 0), 0)
                        }))
                      : [{
                          name: categoryFilter,
                          total: globalDonations.filter(d => d.status === 'delivered' && (d.category === categoryFilter || (categoryFilter === 'Education' && d.category === 'Books'))).reduce((s, d) => s + (d.quantity || 0), 0)
                        }]
                    }>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40}>
                         {['Food', 'Clothing', 'Education', 'Toys', 'Other'].map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={[T.orange, T.blue, T.green, T.amber, T.navy][index % 5]} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
               {[
                 { label: `${categoryFilter === 'all' ? 'Pipeline' : categoryFilter + ' Pipeline'}`, value: globalDonations.filter(d => d.status === 'in_transit' && (categoryFilter === 'all' || d.category === categoryFilter || (categoryFilter === 'Education' && d.category === 'Books'))).reduce((s,d) => s + (d.quantity || 0), 0), icon: FiActivity, color: T.blue },
                 { label: `${categoryFilter === 'all' ? 'Delivered' : categoryFilter + ' Delivered'}`, value: globalDonations.filter(d => d.status === 'delivered' && (categoryFilter === 'all' || d.category === categoryFilter || (categoryFilter === 'Education' && d.category === 'Books'))).reduce((s,d) => s + (d.quantity || 0), 0), icon: FiPackage, color: T.green },
                 { label: 'Total Contribution Batches', value: globalDonations.filter(d => categoryFilter === 'all' || d.category === categoryFilter || (categoryFilter === 'Education' && d.category === 'Books')).length, icon: FiGrid, color: T.orange },
               ].map((stat, i) => (
                  <div key={i} style={{ background: T.surface, padding: 24, borderRadius: 20, border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                       <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}10`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <stat.icon size={24} />
                       </div>
                       <div>
                          <p style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase' }}>{stat.label}</p>
                          <h4 style={{ fontSize: 24, fontWeight: 800, color: T.text }}>{stat.value} Units</h4>
                       </div>
                    </div>
                  </div>
               ))}
            </div>

            <div style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
             {categoryFilter !== 'all' && (
                <div style={{ background: T.surface, padding: 32, borderRadius: 24, border: `1px solid ${T.border}`, marginBottom: 32 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: T.orangeLight, color: T.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <FiGrid size={20} />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{categoryFilter} Itemized Inventory</h3>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                      {(() => {
                         const aggregates = {};
                         globalDonations
                           .filter(d => d.status === 'delivered' && (d.category === categoryFilter || (categoryFilter === 'Education' && d.category === 'Books')))
                           .forEach(d => {
                              let items = d.items_json;
                              if (typeof items === 'string') try { items = JSON.parse(items); } catch(e) { items = null; }
                              if (items && Array.isArray(items)) {
                                 items.forEach(it => {
                                    aggregates[it.name] = (aggregates[it.name] || 0) + (Number(it.quantity) || 0);
                                 });
                              }
                           });
                         
                         const sortedItems = Object.entries(aggregates).sort((a,b) => b[1] - a[1]);
                         
                         if (sortedItems.length === 0) {
                            return <p style={{ fontSize: 14, color: T.textSub, gridColumn: '1 / -1' }}>No itemized data available for this category.</p>;
                         }
                         
                         return sortedItems.map(([name, qty]) => (
                            <div key={name} style={{ background: T.bg, padding: '16px 20px', borderRadius: 16, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{name}</span>
                               <span style={{ fontSize: 13, fontWeight: 800, color: T.orange, background: T.orangeLight, padding: '4px 10px', borderRadius: 8 }}>x{qty}</span>
                            </div>
                         ));
                      })()}
                   </div>
                </div>
             )}

              <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{categoryFilter === 'all' ? '' : categoryFilter + ' '}Stock Audit Log</h3>
                {selectedDonations.length > 0 && (
                   <button 
                     onClick={() => { console.log('Batch allocating:', selectedDonations.length, 'items'); setIsAllocating(selectedDonations); }}
                     style={{ background: T.orange, color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px ' + T.orange + '40' }}
                   >
                      <FiPackage size={16} /> Batch Allocate Selected ({selectedDonations.length})
                   </button>
                )}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                 <thead>
                    <tr style={{ textAlign: 'left', background: T.bg }}>
                                               <th style={{ padding: '16px 32px', width: 40 }}>
                           <input 
                             type="checkbox" 
                             onChange={(e) => {
                               const deliverable = globalDonations.filter(d => d.status === 'delivered' && (categoryFilter === 'all' || d.category === categoryFilter || (categoryFilter === 'Education' && d.category === 'Books')));
                               if (e.target.checked) {
                                 setSelectedDonations(deliverable);
                               } else {
                                 setSelectedDonations([]);
                               }
                             }}
                             checked={selectedDonations.length > 0 && selectedDonations.length === globalDonations.filter(d => d.status === 'delivered' && (categoryFilter === 'all' || d.category === categoryFilter || (categoryFilter === 'Education' && d.category === 'Books'))).length}
                             style={{ cursor: 'pointer' }} 
                           />
                        </th>
                        <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub }}>Batch / Source</th>
                        <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub }}>Category</th>
                        <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub }}>Itemized Details</th>
                       <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub }}>Quantity</th>
                       <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub }}>Lifecycle Status</th>
                    </tr>
                 </thead>
                 <tbody>
                    {globalDonations
                      .filter(d => d.status === 'delivered' && (categoryFilter === 'all' || d.category === categoryFilter || (categoryFilter === 'Education' && d.category === 'Books')))
                      .slice(0, 10).map((d, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: selectedDonations.find(sd => sd.id === d.id) ? T.orange + '05' : 'transparent' }}>
                           <td style={{ padding: '16px 32px' }}>
                              <input 
                                type="checkbox" 
                                checked={!!selectedDonations.find(sd => sd.id === d.id)}
                                onChange={(e) => {
                                   if (e.target.checked) setSelectedDonations([...selectedDonations, d]);
                                   else setSelectedDonations(selectedDonations.filter(sd => sd.id !== d.id));
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                           </td>
                           <td style={{ padding: '16px 32px', fontWeight: 700, color: T.text }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ fontSize: 14 }}>{d.donor_name}</div>
                                {window.adminUserRoleMap && window.adminUserRoleMap[d.donor_id] === 'community_partner' && (
                                   <FiCheckCircle size={12} color={T.blue} fill={T.blue + '10'} title="Verified Community Partner" />
                                )}
                             </div>
                             <div style={{ fontSize: 10, color: T.textSub }}>{d.id.slice(0,8)}</div>
                           </td>
                           <td style={{ padding: '16px 32px' }}>
                              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: T.navy + '10', color: T.navyLight, textTransform: 'uppercase' }}>
                                {d.category}
                              </span>
                           </td>
                           <td style={{ padding: '16px 32px', maxWidth: 220 }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                 {(() => {
                                    let items = d.items_json;
                                    if (typeof items === 'string') {
                                       try { items = JSON.parse(items); } catch(e) { items = null; }
                                    }
                                    if (items && Array.isArray(items)) {
                                       return items.map((it, i) => (
                                          <span key={i} style={{ fontSize: 10, fontWeight: 600, color: T.text, background: T.bg, padding: '2px 6px', borderRadius: 6, border: `1px solid ${T.border}` }}>
                                             {it.name} <span style={{ color: T.orange }}>x{it.quantity}</span>
                                          </span>
                                       ));
                                    }
                                    return <span style={{ fontSize: 11, color: T.textSub }}>{d.items_description || 'N/A'}</span>;
                                 })()}
                              </div>
                           </td>
                           <td style={{ padding: '16px 32px', color: T.textSub, fontWeight: 700 }}>{d.quantity} Units</td>
                           <td style={{ padding: '16px 32px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: d.status === 'delivered' ? T.greenLight : d.status === 'allocated' ? T.blue + '10' : T.bg, color: d.status === 'delivered' ? T.green : d.status === 'allocated' ? T.blue : T.textSub }}>
                                  {d.status?.replace('_', ' ')}
                                </span>
                                {d.status === 'delivered' && (
                                   <button 
                                     onClick={() => setIsAllocating(d)}
                                     style={{ padding: '4px 10px', borderRadius: 8, background: T.orange, color: '#fff', border: 'none', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                                   >
                                     Allocate
                                   </button>
                                )}
                              </div>
                           </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORPHANAGE MANAGEMENT VIEW */}
        {activeView === 'orphanages' && (
          <>
          <div style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.border}` }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Orphan Inventory Management</h3>
              <p style={{ fontSize: 13, color: T.textSub }}>Monitor and verify all registered orphanage partners</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: T.bg }}>
                  <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Orphanage Name</th>
                  <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Verification</th>
                  <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Location</th>
                  <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Joined</th>
                  <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allOrphanages
                  .filter(o => o.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((o, idx) => {
                    const orgRec = orphanageRecords.find(r => r.user_id === o.id);
                    // Find the most recent non-completed audit or the latest one
                    const latestAudit = allInventoryAudits.find(a => a.orphanage_id === orgRec?.id);
                    const volRecord = allVolunteers.find(v => v.user_id === latestAudit?.volunteer_id);
                    const volUser = allUsers.find(u => u.id === latestAudit?.volunteer_id);
                    const volunteer = volRecord ? { ...volRecord, email: volUser?.email } : null;

                    return (
                    <tr key={idx} onClick={() => handleViewOrphanage(o)} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = T.bg} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ fontWeight: 700, color: T.text }}>{o.full_name}</div>
                        <div style={{ fontSize: 12, color: T.textSub }}>{o.email}</div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: T.green }}>
                          <FiCheckCircle size={14} /> Verified Member
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px', fontSize: 14, color: T.textSub }}>{o.location || 'No location set'}</td>
                      <td style={{ padding: '20px 32px', fontSize: 14, color: T.textSub }}>
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        {!latestAudit || latestAudit.status === 'completed' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRequestAudit(o); }}
                            style={{ padding: '8px 16px', borderRadius: 8, background: T.orange, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <FiCheckCircle size={14} /> {latestAudit?.status === 'completed' ? 'Request Re-Audit' : 'Request Audit'}
                          </button>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: latestAudit.status === 'requested' ? T.orange + '10' : T.green + '10', color: latestAudit.status === 'requested' ? T.orange : T.green, textTransform: 'uppercase' }}>
                                {latestAudit.status === 'requested' ? 'Request Submitted' : latestAudit.status.replace('_', ' ')}
                              </span>
                            </div>
                            {volunteer && (
                              <div style={{ marginTop: 8 }}>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setViewingVolunteer(volunteer); }}
                                   style={{ 
                                     background: T.navy + '10', border: `1px solid ${T.navy}15`, 
                                     color: T.navy, padding: '4px 10px', borderRadius: 8, 
                                     fontSize: 10, fontWeight: 800, cursor: 'pointer',
                                     display: 'flex', alignItems: 'center', gap: 6,
                                     transition: 'all 0.2s'
                                   }}
                                   onMouseEnter={e => e.currentTarget.style.background = T.navy + '15'}
                                   onMouseLeave={e => e.currentTarget.style.background = T.navy + '10'}
                                 >
                                   <FiUser size={12} /> View Volunteer: {volunteer.full_name}
                                 </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })}
              </tbody>

            </table>
          </div>

          {/* INVENTORY AUDIT INTELLIGENCE */}
          {(() => {
            // Get only the latest completed audit per orphanage
            const latestAuditsMap = {};
            allInventoryAudits
              .filter(a => a.status === 'completed' && a.audit_data)
              .forEach(a => {
                if (!latestAuditsMap[a.orphanage_id] || new Date(a.created_at) > new Date(latestAuditsMap[a.orphanage_id].created_at)) {
                  latestAuditsMap[a.orphanage_id] = a;
                }
              });
            const latestAudits = Object.values(latestAuditsMap);
            
            const filteredAudits = selectedAuditOrg === 'all' ? latestAudits : latestAudits.filter(a => a.orphanage_id === selectedAuditOrg);

            // Aggregate all items across all latest audits
            const aggregatedItems = {};
            let totalBeneficiaries = 0;
            filteredAudits.forEach(audit => {
              totalBeneficiaries += (audit.beneficiary_count || 0);
              let data = audit.audit_data;
              if (typeof data === 'string') try { data = JSON.parse(data); } catch(e) { data = []; }
              if (Array.isArray(data)) {
                data.forEach(item => {
                  if (!aggregatedItems[item.name]) {
                    aggregatedItems[item.name] = { name: item.name, available: 0, required: 0, deficit: 0 };
                  }
                  aggregatedItems[item.name].available += (Number(item.available) || 0);
                  aggregatedItems[item.name].required += (Number(item.required) || 0);
                  aggregatedItems[item.name].deficit += (Number(item.deficit) || 0);
                });
              }
            });
            const chartData = Object.values(aggregatedItems);
            const CHART_COLORS = [T.blue, T.orange, T.green, T.amber, T.navy, '#8B5CF6', '#EC4899', '#06B6D4'];

            return (
              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Section Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: 'hidden', position: 'relative' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.green}, ${T.blue})` }} />
                  <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FiBarChart2 size={20} color={T.green} /> Inventory Audit Intelligence
                      </h3>
                      <p style={{ fontSize: 13, color: T.textSub }}>Real-time stock analysis from latest completed audits</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <select 
                        value={selectedAuditOrg} 
                        onChange={(e) => setSelectedAuditOrg(e.target.value)}
                        style={{ padding: '8px 16px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, fontSize: 13, fontWeight: 700, outline: 'none', color: T.text, cursor: 'pointer' }}
                      >
                        <option value="all">All Orphanages Overview</option>
                        {latestAudits.map(a => {
                           const orgName = a.orphanage_name || orphanageRecords.find(r => r.id === a.orphanage_id)?.name || 'Unknown';
                           return <option key={a.orphanage_id} value={a.orphanage_id}>{orgName}</option>;
                        })}
                      </select>
                      <span style={{ fontSize: 11, fontWeight: 800, background: T.green + '10', color: T.green, padding: '6px 12px', borderRadius: 20, border: `1px solid ${T.green}20`, display: 'flex', alignItems: 'center' }}>
                        {latestAudits.length} Audited
                      </span>
                    </div>
                  </div>

                  {latestAudits.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <FiBarChart2 size={28} color={T.border} />
                      </div>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>No Audit Data Available</h4>
                      <p style={{ fontSize: 13, color: T.textSub }}>Completed audits will appear here with graphical resource analysis.</p>
                    </div>
                  ) : filteredAudits.length === 0 ? (
                      <div style={{ padding: 60, textAlign: 'center' }}>
                         <p style={{ fontSize: 14, color: T.textSub }}>No audit data found for the selected orphanage.</p>
                      </div>
                  ) : (
                    <>
                      {/* Stats Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderBottom: `1px solid ${T.border}` }}>
                        {[
                          { label: 'Total Beneficiaries', value: totalBeneficiaries, color: T.blue },
                          { label: 'Resources Tracked', value: chartData.length, color: T.green },
                          { label: 'Total Available', value: chartData.reduce((s, d) => s + d.available, 0), color: T.orange },
                          { label: 'Total Deficit', value: chartData.reduce((s, d) => s + d.deficit, 0), color: chartData.reduce((s, d) => s + d.deficit, 0) > 0 ? '#ef4444' : T.green },
                        ].map((s, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            style={{ padding: '20px 24px', textAlign: 'center', borderRight: i < 3 ? `1px solid ${T.border}` : 'none' }}
                          >
                            <p style={{ fontSize: 10, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                            <p style={{ fontSize: 24, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</p>
                          </motion.div>
                        ))}
                      </div>

                      {/* Charts Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                        {/* Bar Chart: Available vs Required */}
                        <div style={{ padding: 32, borderRight: `1px solid ${T.border}` }}>
                          <h4 style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FiActivity size={14} color={T.blue} /> Stock Level Comparison
                          </h4>
                          <div style={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.border} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: T.textSub, fontSize: 11, fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textSub, fontSize: 11 }} />
                                <Tooltip
                                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontSize: 12 }}
                                  formatter={(v, name) => [v, name === 'available' ? 'Available' : 'Required']}
                                />
                                <Legend
                                  verticalAlign="top" align="right"
                                  wrapperStyle={{ paddingBottom: 12 }}
                                  formatter={(v) => <span style={{ fontSize: 11, fontWeight: 700, color: T.textSub }}>{v === 'available' ? 'Available' : 'Required'}</span>}
                                />
                                <Bar dataKey="available" name="available" fill={T.green} radius={[4, 4, 0, 0]} barSize={24} />
                                <Bar dataKey="required" name="required" fill={T.orange} radius={[4, 4, 0, 0]} barSize={24} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Deficit Visualization */}
                        <div style={{ padding: 32 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FiAlertTriangle size={14} color={T.orange} /> Resource Gap Analysis
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 260, overflowY: 'auto', paddingRight: 8 }}>
                            {chartData.map((item, i) => {
                              const pct = item.required > 0 ? Math.min(100, Math.round((item.available / item.required) * 100)) : 100;
                              const barColor = pct >= 80 ? T.green : pct >= 50 ? T.amber : '#ef4444';
                              return (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                  style={{ background: T.bg, borderRadius: 16, padding: '14px 18px', border: `1px solid ${T.border}` }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      {item.deficit > 0 && (
                                        <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', background: '#fef2f2', padding: '2px 8px', borderRadius: 6 }}>
                                          -{item.deficit} deficit
                                        </span>
                                      )}
                                      <span style={{ fontSize: 12, fontWeight: 800, color: barColor }}>{pct}%</span>
                                    </div>
                                  </div>
                                  <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct}%` }}
                                      transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                                      style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${barColor}, ${barColor}90)` }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                    <span style={{ fontSize: 10, color: T.textSub, fontWeight: 600 }}>Available: {item.available}</span>
                                    <span style={{ fontSize: 10, color: T.textSub, fontWeight: 600 }}>Required: {item.required}</span>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Audit Log Per Orphanage */}
                      <div style={{ padding: '0 32px 24px' }}>
                        <h4 style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FiFileText size={14} color={T.navy} /> {selectedAuditOrg === 'all' ? 'Latest Audit Reports by Orphanage' : 'Selected Orphanage Audit Report'}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                          {filteredAudits.map((audit, i) => {
                            const orgName = audit.orphanage_name || orphanageRecords.find(r => r.id === audit.orphanage_id)?.name || 'Unknown';
                            let data = audit.audit_data;
                            if (typeof data === 'string') try { data = JSON.parse(data); } catch(e) { data = []; }
                            const items = Array.isArray(data) ? data : [];

                            return (
                              <motion.div
                                key={audit.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                style={{ background: T.bg, borderRadius: 20, border: `1px solid ${T.border}`, overflow: 'hidden' }}
                              >
                                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <p style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{orgName}</p>
                                    <p style={{ fontSize: 10, color: T.textSub }}>{new Date(audit.visit_date || audit.created_at).toLocaleDateString()} • {audit.beneficiary_count || 0} beneficiaries</p>
                                  </div>
                                  <span style={{ fontSize: 9, fontWeight: 800, background: T.green + '10', color: T.green, padding: '3px 10px', borderRadius: 8, textTransform: 'uppercase' }}>Completed</span>
                                </div>
                                <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {items.slice(0, 5).map((it, j) => (
                                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{it.name}</span>
                                      <div style={{ display: 'flex', gap: 8 }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: T.green, background: T.green + '10', padding: '1px 8px', borderRadius: 6 }}>{it.available} avail</span>
                                        {(it.deficit || 0) > 0 && (
                                          <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '1px 8px', borderRadius: 6 }}>-{it.deficit}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {items.length > 5 && (
                                    <p style={{ fontSize: 10, color: T.textSub, fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>+ {items.length - 5} more items</p>
                                  )}
                                </div>
                                {audit.notes && (
                                  <div style={{ padding: '8px 20px 16px', borderTop: `1px solid ${T.border}` }}>
                                    <p style={{ fontSize: 10, fontStyle: 'italic', color: T.textSub }}>"{audit.notes}"</p>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </div>
            );
          })()}
        </>
        )}

        {/* ORPHAN RESOURCE ALLOCATION VIEW */}
        {activeView === 'orphan_allocations' && (() => {
          // Compute allocation analytics from resource_allocations table
          const allAllocated = allResourceAllocations;
          const totalItems = allAllocated.reduce((s, d) => s + (d.quantity || 0), 0);
          const uniqueOrgIds = [...new Set(allAllocated.map(d => d.orphanage_id).filter(Boolean))];
          
          // Build mapping: orphanages.id -> user profile
          const orgIdToUser = {};
          orphanageRecords.forEach(rec => {
            const userProfile = allOrphanages.find(u => u.id === rec.user_id);
            if (userProfile) orgIdToUser[rec.id] = userProfile;
          });

          // Category distribution
          const catMap = {};
          allAllocated.forEach(d => {
            catMap[d.category || 'Other'] = (catMap[d.category || 'Other'] || 0) + (d.quantity || 0);
          });
          const catData = Object.entries(catMap).map(([name, value]) => ({ name, value }));
          const PIE_COLORS = [T.orange, T.blue, T.green, T.amber, T.navy];

          // Per-org distribution for bar chart
          const orgMap = {};
          allAllocated.forEach(d => {
            orgMap[d.orphanage_id || 'Unknown'] = (orgMap[d.orphanage_id || 'Unknown'] || 0) + (d.quantity || 0);
          });
          const orgBarData = uniqueOrgIds.map(orgId => {
            const user = orgIdToUser[orgId];
            return { name: user?.full_name?.split(' ').slice(0,2).join(' ') || 'Org', units: orgMap[orgId] || 0 };
          }).sort((a,b) => b.units - a.units).slice(0, 8);

          // Helper: get orphanage table ID from user profile ID
          const getUserOrgId = (userId) => {
            const rec = orphanageRecords.find(r => r.user_id === userId);
            return rec?.id;
          };

          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* STATS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {[
                { label: 'Total Allocations', value: allAllocated.length, icon: FiPackage, color: T.orange, bg: T.orange + '10' },
                { label: 'Items Deployed', value: totalItems, icon: FiActivity, color: T.blue, bg: T.blue + '10' },
                { label: 'Organizations Served', value: uniqueOrgIds.length, icon: FiShield, color: T.green, bg: T.green + '10' },
                { label: 'Categories Covered', value: catData.length, icon: FiGrid, color: T.amber, bg: T.amber + '10' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{ background: T.surface, borderRadius: 20, padding: '24px 28px', border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <s.icon size={22} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: T.text, marginTop: 2 }}>{s.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CHARTS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              {/* Bar Chart: Allocation per Organization */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, padding: 32, position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.blue}, ${T.green})` }} />
                <h4 style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiBarChart2 size={16} color={T.blue} /> Allocation Distribution by Organization
                </h4>
                {orgBarData.length === 0 ? (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub, fontSize: 13 }}>No allocation data yet</div>
                ) : (
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orgBarData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={T.border} />
                        <XAxis type="number" axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontSize: 12 }} 
                          formatter={(v) => [`${v} Units`, 'Deployed']}
                        />
                        <Bar dataKey="units" radius={[0, 6, 6, 0]} barSize={20}>
                          {orgBarData.map((_, idx) => (
                            <Cell key={idx} fill={[T.blue, T.orange, T.green, T.amber, T.navy, '#8B5CF6', '#EC4899', '#06B6D4'][idx % 8]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>

              {/* Pie Chart: Category Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, padding: 32, position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.orange}, ${T.amber})` }} />
                <h4 style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiGrid size={16} color={T.orange} /> Category Breakdown
                </h4>
                {catData.length === 0 ? (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub, fontSize: 13 }}>No data available</div>
                ) : (
                  <>
                    <div style={{ height: 180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                            {catData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                      {catData.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: T.textSub }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {c.name} ({c.value})
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </div>

            {/* MASTER-DETAIL: Organization Selector + Allocated Resources */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedOrphanage ? '340px 1fr' : '1fr', gap: 24, alignItems: 'start' }}>

              {/* LEFT: Orphanage List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: 'hidden' }}
              >
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FiShield size={16} color={T.orange} />
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Organizations</h4>
                  <span style={{ fontSize: 10, fontWeight: 800, color: T.orange, background: T.orange + '10', padding: '2px 8px', borderRadius: 10, marginLeft: 'auto' }}>{allOrphanages.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 400, overflowY: 'auto' }}>
                  {allOrphanages
                    .filter(o => o.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((o, idx) => {
                      const userOrgId = getUserOrgId(o.id);
                      const orgAllocCount = userOrgId ? allAllocated.filter(d => d.orphanage_id === userOrgId).length : 0;
                      return (
                      <div
                        key={idx}
                        onClick={() => setSelectedOrphanage(o)}
                        style={{
                          padding: '14px 20px',
                          borderBottom: `1px solid ${T.border}`,
                          cursor: 'pointer',
                          background: selectedOrphanage?.id === o.id ? T.orange + '08' : 'transparent',
                          borderLeft: selectedOrphanage?.id === o.id ? `3px solid ${T.orange}` : '3px solid transparent',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { if (selectedOrphanage?.id !== o.id) e.currentTarget.style.background = T.bg; }}
                        onMouseLeave={e => { if (selectedOrphanage?.id !== o.id) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.blue + '10', color: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FiShield size={16} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: T.text, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.full_name}</div>
                            <div style={{ fontSize: 10, color: T.textSub, marginTop: 2 }}>{o.location || 'No location set'}</div>
                          </div>
                          {orgAllocCount > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 800, color: T.green, background: T.green + '10', padding: '2px 8px', borderRadius: 10 }}>{orgAllocCount}</span>
                          )}
                        </div>
                      </div>
                    );})}
                </div>
              </motion.div>

              {/* RIGHT: Allocated Resources Detail */}
              {selectedOrphanage && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: 'hidden' }}
                >
                  {/* Header with gradient accent */}
                  <div style={{ position: 'relative', padding: '24px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.orange}, ${T.blue})` }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: T.orange + '10', color: T.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiShield size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{selectedOrphanage.full_name}</h3>
                        <p style={{ fontSize: 12, color: T.textSub }}>{selectedOrphanage.location || 'No location'} &bull; {selectedOrphanage.email}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedOrphanage(null)} style={{ background: T.bg, border: `1px solid ${T.border}`, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <FiX size={16} />
                    </button>
                  </div>

                  {/* Summary mini-stats */}
                  {!loadingAllocations && orphanageAllocations.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderBottom: `1px solid ${T.border}` }}>
                      {[
                        { label: 'Batches', value: orphanageAllocations.length, color: T.blue },
                        { label: 'Total Units', value: orphanageAllocations.reduce((s, d) => s + (d.quantity || 0), 0), color: T.green },
                        { label: 'Donors', value: [...new Set(orphanageAllocations.map(d => d.donor_name))].length, color: T.orange },
                      ].map((ms, i) => (
                        <div key={i} style={{ padding: '16px 24px', textAlign: 'center', borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
                          <p style={{ fontSize: 10, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ms.label}</p>
                          <p style={{ fontSize: 22, fontWeight: 800, color: ms.color, marginTop: 4 }}>{ms.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Allocation List */}
                  <div style={{ padding: 24, maxHeight: 400, overflowY: 'auto' }}>
                    {loadingAllocations ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: T.textSub }}>Loading allocations...</div>
                    ) : orphanageAllocations.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: T.textSub }}>
                        <FiGrid size={32} color={T.border} style={{ marginBottom: 12 }} />
                        <p style={{ fontSize: 14, fontWeight: 600 }}>No allocations recorded.</p>
                        <p style={{ fontSize: 12, marginTop: 4 }}>Use Inventory Control to allocate delivered donations to this organization.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {orphanageAllocations.map((d, i) => {
                          return (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                              style={{ background: T.bg, padding: '14px 18px', borderRadius: 16, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: T.blue + '10', color: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <FiUser size={16} />
                                </div>
                                <div>
                                  <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{d.donor_name}</p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                    <span style={{ fontSize: 9, fontWeight: 800, color: T.orange, background: T.orange + '10', padding: '1px 6px', borderRadius: 4 }}>{d.category}</span>
                                    <span style={{ fontSize: 9, fontWeight: 700, color: T.textSub, background: '#fff', padding: '1px 6px', borderRadius: 4, border: `1px solid ${T.border}` }}>
                                      {d.item_name} x{d.quantity}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <p style={{ fontSize: 14, fontWeight: 800, color: T.green }}>+{d.quantity}</p>
                                <p style={{ fontSize: 9, color: T.textSub, marginTop: 2 }}>{new Date(d.created_at).toLocaleDateString()}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Dispatch Button */}
                  {!loadingAllocations && orphanageAllocations.length > 0 && (
                    <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.bg }}>
                      <button
                        onClick={() => setDispatchConfirm({ orphanage: selectedOrphanage, allocations: [...orphanageAllocations] })}
                        style={{
                          width: '100%', padding: '14px 24px', border: 'none', borderRadius: 14,
                          background: `linear-gradient(135deg, ${T.green}, #1a8a5a)`,
                          color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                          boxShadow: `0 4px 16px ${T.green}40`, transition: 'all 0.2s',
                          textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <FiSend size={18} /> Dispatch Resources
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
          );
        })()}

        {/* DISPATCH CONFIRMATION MODAL */}
        <AnimatePresence>
          {dispatchConfirm && (() => {
            const { orphanage, allocations } = dispatchConfirm;
            // Each allocation row IS an item (from resource_allocations table)
            const allItems = allocations.map(d => ({
              name: d.item_name, quantity: Number(d.quantity) || 0, category: d.category, donor: d.donor_name
            }));
            const totalUnits = allItems.reduce((s, it) => s + it.quantity, 0);

            const handleDispatch = async () => {
              setDispatching(true);
              try {
                const allocIds = allocations.map(d => d.id);
                const donationIds = [...new Set(allocations.map(d => d.donation_id).filter(Boolean))];
                const invoiceNo = `SC-${Date.now().toString(36).toUpperCase()}`;

                // 1. Remove from resource_allocations (actual deletion from db as requested)
                const { error: allocDelErr } = await supabase
                  .from('resource_allocations')
                  .delete()
                  .in('id', allocIds);
                if (allocDelErr) throw allocDelErr;

                // 2. Remove from donations (actual deletion from db as requested)
                if (donationIds.length > 0) {
                  const { error: donationDelErr } = await supabase
                    .from('donations')
                    .delete()
                    .in('id', donationIds);
                  if (donationDelErr) throw donationDelErr;
                }

                // 3. Clear orphanage inventory
                const orgRec = orphanageRecords.find(r => r.user_id === orphanage.id);
                if (orgRec) {
                  await supabase.from('orphanages').update({ current_inventory_json: [] }).eq('id', orgRec.id);
                }

                // 3. Generate PDF Invoice
                const doc = new jsPDF();
                const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

                // Header
                doc.setFillColor(30, 41, 59);
                doc.rect(0, 0, 210, 45, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text('SUPPORT CIRCLE', 20, 22);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text('Community Resource Management Platform', 20, 30);
                doc.text('Building bridges of care, one resource at a time', 20, 36);

                // Invoice Details
                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255);
                doc.text(`Invoice: ${invoiceNo}`, 145, 22);
                doc.text(`Date: ${today}`, 145, 30);

                // Gradient line
                doc.setDrawColor(232, 98, 42);
                doc.setLineWidth(1.5);
                doc.line(0, 45, 210, 45);

                // Dispatch Details
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('DISPATCH INVOICE', 20, 60);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                doc.text('FROM:', 20, 72);
                doc.setTextColor(30, 41, 59);
                doc.setFont('helvetica', 'bold');
                doc.text('Support Circle HQ', 20, 78);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                doc.text('Community Resource Management', 20, 84);

                doc.setTextColor(100, 116, 139);
                doc.text('TO:', 120, 72);
                doc.setTextColor(30, 41, 59);
                doc.setFont('helvetica', 'bold');
                doc.text(orphanage.full_name || 'Organization', 120, 78);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                doc.text(orphanage.location || 'Address not specified', 120, 84);
                doc.text(orphanage.email || '', 120, 90);

                // Separator
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.5);
                doc.line(20, 96, 190, 96);

                // Summary Box
                doc.setFillColor(248, 250, 252);
                doc.roundedRect(20, 100, 170, 20, 3, 3, 'F');
                doc.setFontSize(9);
                doc.setTextColor(100, 116, 139);
                doc.text('TOTAL ITEMS', 35, 109);
                doc.text('TOTAL UNITS', 90, 109);
                doc.text('UNIQUE DONORS', 145, 109);
                doc.setFontSize(12);
                doc.setTextColor(30, 41, 59);
                doc.setFont('helvetica', 'bold');
                doc.text(String(allItems.length), 48, 116);
                doc.text(String(totalUnits), 100, 116);
                doc.text(String([...new Set(allocations.map(a => a.donor_name))].length), 158, 116);

                // Items Table
                const tableResult = autoTable(doc, {
                  startY: 128,
                  head: [['#', 'Item Name', 'Category', 'Quantity', 'Donor']],
                  body: allItems.map((it, idx) => [idx + 1, it.name, it.category || '-', it.quantity, it.donor || 'Anonymous']),
                  theme: 'grid',
                  headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
                  bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
                  alternateRowStyles: { fillColor: [248, 250, 252] },
                  columnStyles: { 0: { cellWidth: 12 }, 3: { halign: 'center', fontStyle: 'bold' } },
                  margin: { left: 20, right: 20 },
                  styles: { cellPadding: 4 }
                });

                const finalY = (tableResult?.finalY ?? doc.lastAutoTable?.finalY ?? 200) + 15;

                // Footer area
                doc.setDrawColor(232, 98, 42);
                doc.setLineWidth(1);
                doc.line(20, finalY, 190, finalY);

                doc.setFontSize(9);
                doc.setTextColor(100, 116, 139);
                doc.setFont('helvetica', 'normal');
                doc.text('This document certifies the dispatch of resources from Support Circle to the above-mentioned organization.', 20, finalY + 8);
                doc.text('All items have been verified and approved by the administration team.', 20, finalY + 14);

                // Signature lines
                doc.setDrawColor(200, 200, 200);
                doc.line(20, finalY + 35, 80, finalY + 35);
                doc.line(130, finalY + 35, 190, finalY + 35);
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text('Admin Signature', 35, finalY + 41);
                doc.text('Receiving Authority', 145, finalY + 41);

                // Bottom bar
                const pageH = doc.internal.pageSize.height;
                doc.setFillColor(30, 41, 59);
                doc.rect(0, pageH - 12, 210, 12, 'F');
                doc.setFontSize(7);
                doc.setTextColor(255, 255, 255);
                doc.text('Support Circle \u2022 Community Resource Management Platform \u2022 Generated automatically', 105, pageH - 5, { align: 'center' });

                doc.save(`Dispatch_${orphanage.full_name?.replace(/\s+/g, '_')}_${invoiceNo}.pdf`);

                // 4. Refresh data
                setDispatchConfirm(null);
                setSelectedOrphanage(null);
                setOrphanageAllocations([]);
                setAllResourceAllocations(prev => prev.filter(r => !allocIds.includes(r.id)));
                await fetchAdminData();
                toast.success('Resources dispatched successfully! Invoice downloaded.');
              } catch (err) {
                console.error('Dispatch error:', err);
                toast.error('Failed to dispatch: ' + err.message);
              } finally {
                setDispatching(false);
              }
            };

            return (
              <motion.div
                key="dispatch-modal"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)' }}
                onClick={() => !dispatching && setDispatchConfirm(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                  style={{ background: T.surface, borderRadius: 28, width: 520, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 32px 64px rgba(0,0,0,0.2)' }}
                >
                  {/* Modal Header */}
                  <div style={{ position: 'relative', padding: '28px 32px', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.green}, ${T.blue})` }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: T.green + '10', color: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiSend size={24} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Confirm Dispatch</h3>
                        <p style={{ fontSize: 12, color: T.textSub }}>This action will finalize and dispatch all resources</p>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Summary */}
                  <div style={{ padding: '24px 32px' }}>
                    <div style={{ background: T.bg, borderRadius: 16, padding: 20, border: `1px solid ${T.border}`, marginBottom: 20 }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Dispatching To</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{orphanage.full_name}</p>
                      <p style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>{orphanage.location || 'No location'} &bull; {orphanage.email}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                      {[
                        { label: 'Batches', value: allocations.length, color: T.blue },
                        { label: 'Total Items', value: totalUnits, color: T.green },
                        { label: 'Donors', value: [...new Set(allocations.map(a => a.donor_name))].length, color: T.orange },
                      ].map((s, i) => (
                        <div key={i} style={{ background: T.bg, borderRadius: 12, padding: '12px 16px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                          <p style={{ fontSize: 9, fontWeight: 800, color: T.textSub, textTransform: 'uppercase' }}>{s.label}</p>
                          <p style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Item Preview */}
                    <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {allItems.map((it, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: T.orange, background: T.orange + '10', padding: '1px 6px', borderRadius: 4 }}>{it.category}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{it.name}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: T.green }}>x{it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 20, padding: 12, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>⚠️ This will remove all allocated resources from this organization and generate a dispatch invoice PDF.</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ padding: '16px 32px 28px', display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => setDispatchConfirm(null)}
                      disabled={dispatching}
                      style={{ flex: 1, padding: '14px', border: `1px solid ${T.border}`, borderRadius: 14, background: T.surface, color: T.textSub, fontSize: 13, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}
                    >Cancel</button>
                    <button
                      onClick={handleDispatch}
                      disabled={dispatching}
                      style={{
                        flex: 2, padding: '14px', border: 'none', borderRadius: 14,
                        background: dispatching ? T.textSub : `linear-gradient(135deg, ${T.green}, #1a8a5a)`,
                        color: '#fff', fontSize: 13, fontWeight: 800, cursor: dispatching ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        textTransform: 'uppercase', boxShadow: `0 4px 16px ${T.green}40`
                      }}
                    >
                      <FiSend size={16} /> {dispatching ? 'Dispatching...' : 'Confirm & Generate Invoice'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* CSR APPLICATIONS PORTAL */}
        {activeView === 'csr' && (
          <div style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>CSR Partnership Proposals</h3>
                <p style={{ fontSize: 13, color: T.textSub }}>Review, verify, and approve corporate applications</p>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg, textAlign: 'left' }}>
                  <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub }}>Organization</th>
                  <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub }}>Type</th>
                  <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub }}>Date</th>
                  <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub }}>Status</th>
                  <th style={{ padding: '16px 32px' }}></th>
                </tr>
              </thead>
              <tbody>
                {csrApplications.map(app => (
                  <tr key={app.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '16px 32px', fontWeight: 700 }}>{app.org_name}</td>
                    <td style={{ padding: '16px 32px', fontSize: 13 }}>{app.org_type}</td>
                    <td style={{ padding: '16px 32px', fontSize: 13, color: T.textSub }}>{new Date(app.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 32px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 6, background: app.status === 'Approved' ? T.greenLight : T.orangeLight, color: app.status === 'Approved' ? T.green : T.orange }}>{app.status}</span>
                    </td>
                    <td style={{ padding: '16px 32px', textAlign: 'right' }}>
                      <button onClick={() => setSelectedCsr(app)} style={{ padding: '6px 12px', borderRadius: 8, background: T.navy, color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Review</button>
                    </td>
                  </tr>
                ))}
                {csrApplications.length === 0 && (
                  <tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', color: T.textSub }}>No applications found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* CAMPAIGN MANAGEMENT VIEW */}
        {activeView === 'campaigns' && (() => {
          const activeCampaigns = campaigns.filter(c => c.status === 'active');
          const completedCampaigns = campaigns.filter(c => c.status === 'completed');
          const totalGoal = campaigns.reduce((s, c) => s + (Number(c.goal_amount) || 0), 0);
          const totalCurrent = campaigns.reduce((s, c) => s + (Number(c.current_amount) || 0), 0);

          const statusColors = { draft: '#94a3b8', active: T.green, paused: T.amber, completed: T.blue, cancelled: '#ef4444' };
          const priorityColors = { low: '#94a3b8', normal: T.blue, high: T.orange, urgent: '#ef4444' };
          const categoryLabels = { donation_drive: 'Donation Drive', fundraiser: 'Fundraiser', awareness: 'Awareness', emergency: 'Emergency Relief' };

          const handleSaveCampaign = async () => {
            try {
              if (!campaignForm.title.trim()) { toast.error('Campaign title is required'); return; }
              if (!Number(campaignForm.goal_amount) || Number(campaignForm.goal_amount) <= 0) { toast.error('Please set a target goal greater than 0'); return; }
              if (editingCampaign) {
                const { error } = await supabase.from('campaigns').update({
                  ...campaignForm, goal_amount: Number(campaignForm.goal_amount) || 0, updated_at: new Date().toISOString()
                }).eq('id', editingCampaign.id);
                if (error) throw error;
                toast.success('Campaign updated successfully');
              } else {
                const { data: { session } } = await supabase.auth.getSession();
                const { error } = await supabase.from('campaigns').insert({
                  ...campaignForm, goal_amount: Number(campaignForm.goal_amount) || 0, created_by: session?.user?.id
                });
                if (error) throw error;
                toast.success('Campaign created successfully');
              }
              setShowCampaignModal(false);
              setEditingCampaign(null);
              setCampaignForm({ title: '', description: '', category: 'donation_drive', donation_category: 'Clothing', goal_amount: '', start_date: '', end_date: '', priority: 'normal', status: 'draft' });
              fetchAdminData();
            } catch (err) { toast.error('Failed: ' + err.message); }
          };

          const handleDeleteCampaign = async (id) => {
            if (!window.confirm('Are you sure you want to delete this campaign?')) return;
            const { error } = await supabase.from('campaigns').delete().eq('id', id);
            if (error) toast.error(error.message);
            else { toast.success('Campaign deleted'); fetchAdminData(); }
          };

          const handleStatusChange = async (id, newStatus) => {
            const { error } = await supabase.from('campaigns').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
            if (error) toast.error(error.message);
            else { toast.success(`Status updated to ${newStatus}`); fetchAdminData(); }
          };

          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* STATS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Total Campaigns', value: campaigns.length, icon: FiFlag, color: T.orange, bg: T.orange + '10' },
                { label: 'Active', value: activeCampaigns.length, icon: FiTarget, color: T.green, bg: T.green + '10' },
                { label: 'Completed', value: completedCampaigns.length, icon: FiCheckCircle, color: T.blue, bg: T.blue + '10' },
                { label: 'Overall Progress', value: totalGoal > 0 ? Math.round((totalCurrent / totalGoal) * 100) + '%' : '0%', icon: FiBarChart2, color: T.amber, bg: T.amber + '10' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  style={{ background: T.surface, borderRadius: 20, padding: '20px 24px', border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}, ${s.color}60)` }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</p>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <s.icon size={20} color={s.color} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CAMPAIGN LIST */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: 'hidden' }}
            >
              <div style={{ padding: '20px 28px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FiFlag size={18} color={T.orange} />
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: T.text }}>All Campaigns</h4>
                  <span style={{ fontSize: 10, fontWeight: 800, color: T.orange, background: T.orange + '10', padding: '2px 10px', borderRadius: 10 }}>{campaigns.length}</span>
                </div>
                <button
                  onClick={() => {
                    setEditingCampaign(null);
                    setCampaignForm({ title: '', description: '', category: 'donation_drive', donation_category: 'Clothing', goal_amount: '', start_date: '', end_date: '', priority: 'normal', status: 'draft' });
                    setShowCampaignModal(true);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none',
                    background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark || '#c65820'})`,
                    color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.03em'
                  }}
                >
                  <FiPlus size={16} /> New Campaign
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: T.textSub }}>
                  <FiFlag size={40} color={T.border} style={{ marginBottom: 16 }} />
                  <p style={{ fontSize: 15, fontWeight: 700 }}>No campaigns yet</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Create your first campaign to start making impact</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {campaigns.map((c, i) => {
                    const progress = c.goal_amount > 0 ? Math.min(100, Math.round((c.current_amount / c.goal_amount) * 100)) : 0;
                    const daysLeft = c.end_date ? Math.max(0, Math.ceil((new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24))) : null;
                    return (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                        style={{ padding: '20px 28px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 20, alignItems: 'center' }}
                      >
                        {/* Icon */}
                        <div style={{
                          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                          background: `linear-gradient(135deg, ${statusColors[c.status]}20, ${statusColors[c.status]}10)`,
                          border: `1px solid ${statusColors[c.status]}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <FiFlag size={20} color={statusColors[c.status]} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <h5 style={{ fontSize: 14, fontWeight: 800, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</h5>
                            <span style={{ fontSize: 8, fontWeight: 800, color: statusColors[c.status], background: statusColors[c.status] + '15', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', flexShrink: 0 }}>{c.status}</span>
                            <span style={{ fontSize: 8, fontWeight: 800, color: priorityColors[c.priority], background: priorityColors[c.priority] + '15', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', flexShrink: 0 }}>{c.priority}</span>
                          </div>
                          <p style={{ fontSize: 11, color: T.textSub, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description || 'No description'}</p>

                          {/* Progress Bar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1, height: 6, background: T.bg, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${progress}%`, height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${statusColors[c.status]}, ${statusColors[c.status]}90)`, transition: 'width 0.5s ease' }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 800, color: statusColors[c.status], flexShrink: 0 }}>{progress}%</span>
                          </div>

                          <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                            <span style={{ fontSize: 10, color: T.textSub, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FiTarget size={10} /> {c.current_amount || 0}/{c.goal_amount || 0} items
                            </span>
                            <span style={{ fontSize: 10, color: T.textSub, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FiCalendar size={10} /> {categoryLabels[c.category] || c.category}
                            </span>
                            {daysLeft !== null && (
                              <span style={{ fontSize: 10, color: daysLeft <= 3 ? '#ef4444' : T.textSub, fontWeight: daysLeft <= 3 ? 700 : 400, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FiClock size={10} /> {daysLeft === 0 ? 'Ends today' : `${daysLeft} days left`}
                              </span>
                            )}
                            <span style={{ fontSize: 10, color: T.textSub, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FiUsers size={10} /> {c.participants_count || 0} participants
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {c.status === 'draft' && (
                            <button onClick={() => handleStatusChange(c.id, 'active')} title="Activate"
                              style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.green}30`, background: T.green + '10', color: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <FiCheckCircle size={14} />
                            </button>
                          )}
                          {c.status === 'active' && (
                            <>
                              <button onClick={() => handleStatusChange(c.id, 'paused')} title="Pause"
                                style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.amber}30`, background: T.amber + '10', color: T.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <FiClock size={14} />
                              </button>
                              <button onClick={() => handleStatusChange(c.id, 'completed')} title="Complete"
                                style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.blue}30`, background: T.blue + '10', color: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <FiCheckCircle size={14} />
                              </button>
                            </>
                          )}
                          {c.status === 'paused' && (
                            <button onClick={() => handleStatusChange(c.id, 'active')} title="Resume"
                              style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.green}30`, background: T.green + '10', color: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <FiActivity size={14} />
                            </button>
                          )}
                          <button onClick={() => {
                            setEditingCampaign(c);
                            setCampaignForm({
                              title: c.title, description: c.description || '', category: c.category || 'donation_drive',
                              donation_category: c.donation_category || 'Clothing',
                              goal_amount: c.goal_amount || '',
                              start_date: c.start_date || '', end_date: c.end_date || '',
                              priority: c.priority || 'normal', status: c.status || 'draft'
                            });
                            setShowCampaignModal(true);
                          }} title="Edit"
                            style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <FiEdit size={14} />
                          </button>
                          <button onClick={() => handleDeleteCampaign(c.id)} title="Delete"
                            style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* CREATE/EDIT CAMPAIGN MODAL */}
            <AnimatePresence>
              {showCampaignModal && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)' }}
                  onClick={() => setShowCampaignModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    style={{ background: T.surface, borderRadius: 28, width: 560, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 32px 64px rgba(0,0,0,0.2)' }}
                  >
                    <div style={{ position: 'relative', padding: '28px 32px', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.orange}, ${T.amber})` }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: T.orange + '10', color: T.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiFlag size={24} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</h3>
                          <p style={{ fontSize: 12, color: T.textSub }}>{editingCampaign ? 'Update campaign details' : 'Launch a new initiative for the community'}</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Title */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Campaign Title *</label>
                        <input value={campaignForm.title} onChange={e => setCampaignForm(p => ({ ...p, title: e.target.value }))}
                          placeholder="e.g., Winter Clothing Drive 2026"
                          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, fontSize: 13, fontWeight: 600, color: T.text, outline: 'none', boxSizing: 'border-box' }} />
                      </div>

                      {/* Description */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Description</label>
                        <textarea value={campaignForm.description} onChange={e => setCampaignForm(p => ({ ...p, description: e.target.value }))}
                          placeholder="Describe the campaign goals and impact..."
                          rows={3}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, fontSize: 13, fontWeight: 500, color: T.text, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>

                      {/* Category + Priority */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Category</label>
                          <select value={campaignForm.category} onChange={e => setCampaignForm(p => ({ ...p, category: e.target.value }))}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, fontSize: 13, fontWeight: 600, color: T.text, outline: 'none', boxSizing: 'border-box' }}>
                            <option value="donation_drive">Donation Drive</option>
                            <option value="fundraiser">Fundraiser</option>
                            <option value="awareness">Awareness</option>
                            <option value="emergency">Emergency Relief</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Priority</label>
                          <select value={campaignForm.priority} onChange={e => setCampaignForm(p => ({ ...p, priority: e.target.value }))}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, fontSize: 13, fontWeight: 600, color: T.text, outline: 'none', boxSizing: 'border-box' }}>
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>

                      {/* Target Goal */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Target Goal (Items)</label>
                        <input type="number" value={campaignForm.goal_amount} onChange={e => setCampaignForm(p => ({ ...p, goal_amount: e.target.value }))}
                          placeholder="Number of items to collect"
                          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, fontSize: 13, fontWeight: 600, color: T.text, outline: 'none', boxSizing: 'border-box' }} />
                      </div>

                      {/* Items Needed (Donation Category) */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Items Needed (Category)</label>
                        <select value={campaignForm.donation_category} onChange={e => setCampaignForm(p => ({ ...p, donation_category: e.target.value }))}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, fontSize: 13, fontWeight: 600, color: T.text, outline: 'none', boxSizing: 'border-box' }}>
                          <option value="Clothing">Clothing</option>
                          <option value="Books">Books</option>
                          <option value="Toys">Toys</option>
                          <option value="Food">Food</option>
                        </select>
                      </div>

                      {/* Start + End Date */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Start Date</label>
                          <input type="date" value={campaignForm.start_date} onChange={e => setCampaignForm(p => ({ ...p, start_date: e.target.value }))}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, fontSize: 13, fontWeight: 600, color: T.text, outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>End Date</label>
                          <input type="date" value={campaignForm.end_date} onChange={e => setCampaignForm(p => ({ ...p, end_date: e.target.value }))}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, fontSize: 13, fontWeight: 600, color: T.text, outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div style={{ padding: '16px 32px 28px', display: 'flex', gap: 12 }}>
                      <button onClick={() => { setShowCampaignModal(false); setEditingCampaign(null); }}
                        style={{ flex: 1, padding: '14px', border: `1px solid ${T.border}`, borderRadius: 14, background: T.surface, color: T.textSub, fontSize: 13, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>
                        Cancel
                      </button>
                      <button onClick={handleSaveCampaign}
                        style={{
                          flex: 2, padding: '14px', border: 'none', borderRadius: 14,
                          background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark || '#c65820'})`,
                          color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          textTransform: 'uppercase', boxShadow: `0 4px 16px ${T.orange}40`
                        }}>
                        <FiFlag size={16} /> {editingCampaign ? 'Update Campaign' : 'Launch Campaign'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          );
        })()}

        {/* ORPHAN REQUESTS VIEW */}
        {activeView === 'orphan_requests' && (
          <div style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Global Mission Requests</h3>
                <p style={{ fontSize: 13, color: T.textSub }}>Master ledger of all active and historical organizational needs</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ background: T.orangeLight, color: T.orange, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, border: `1px solid ${T.orange}20` }}>
                  {allOrphanRequests.length} Total Missions
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: T.bg }}>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Organization</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Category / Mission</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Items Breakdown</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrphanRequests.map((req, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedRequest(req)}
                      style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ fontWeight: 700, color: T.text }}>{req.orphanages?.name || 'Loading Entity...'}</div>
                        <div style={{ fontSize: 12, color: T.textSub }}>{req.orphanages?.location || 'Unknown Operations Base'}</div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                         <div style={{ marginBottom: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: T.navy + '10', color: T.navyLight, textTransform: 'uppercase' }}>
                                {req.category}
                            </span>
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase' }}>Fulfillment Squad:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                               {(() => {
                                  const missionDonors = globalDonations.filter(d => d.orphanage_id === req.orphanage_id && d.category === req.category);
                                  if (missionDonors.length === 0) return <span style={{ fontSize: 11, color: T.textMuted, fontStyle: 'italic' }}>Awaiting community response...</span>;
                                  return missionDonors.map((d, i) => {
                                     let items = d.items_json;
                                     if (typeof items === 'string') try { items = JSON.parse(items); } catch(e) {}
                                     const itemNames = (Array.isArray(items) ? items : []).map(it => it.name).join(', ');
                                     return (
                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                           <span style={{ fontSize: 10, fontWeight: 800, color: T.green, background: T.greenLight, padding: '2px 8px', borderRadius: 6, border: `1px solid ${T.green}20`, width: 'fit-content' }}>
                                              {d.donor_name}
                                           </span>
                                           <span style={{ fontSize: 9, color: T.textSub, paddingLeft: 4, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              {itemNames || 'Items specified'}
                                           </span>
                                        </div>
                                     );
                                  });
                               })()}
                            </div>
                         </div>
                      </td>
                      <td style={{ padding: '20px 32px', maxWidth: 300 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(() => {
                            let items = req.items_json;
                            if (typeof items === 'string') try { items = JSON.parse(items); } catch(e) {}
                            if (items && Array.isArray(items)) {
                              return items.map((it, i) => (
                                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: T.text, background: T.bg, padding: '2px 8px', borderRadius: 6, border: `1px solid ${T.border}` }}>
                                  {it.name} <span style={{ color: T.orange, fontWeight: 800 }}>x{it.quantity}</span>
                                </span>
                              ));
                            }
                            return <span style={{ fontSize: 12, color: T.textSub }}>Specifications Restricted</span>;
                          })()}
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: req.status === 'delivered' ? T.green : T.orange }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: req.status === 'delivered' ? T.green : T.orange }} />
                          {req.status?.replace('_', ' ') || 'Pending Allocation'}
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px', fontSize: 14, color: T.textSub }}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeView === 'verifications' && (
          <div style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Pending Verification Requests</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <button style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiFilter /> Filter
                </button>
              </div>
            </div>

            {pendingVerifications.length === 0 ? (
              <div style={{ padding: 80, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <FiCheckCircle size={32} color={T.green} />
                </div>
                <h4 style={{ fontSize: 18, fontWeight: 700, color: T.text }}>All Clear!</h4>
                <p style={{ color: T.textSub }}>No pending verification requests at the moment.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: T.bg }}>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Entity Name</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Location</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Applied On</th>
                    <th style={{ padding: '16px 32px', fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingVerifications.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ fontWeight: 700, color: T.text }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: T.textSub }}>ID: {item.id.slice(0,8)}...</div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: item.type === 'Partner' ? '#EFF6FF' : '#FFF7ED', color: item.type === 'Partner' ? T.blue : T.orange }}>
                          {item.type}
                        </span>
                      </td>
                      <td style={{ padding: '20px 32px', fontSize: 14, color: T.textSub }}>{item.location || 'N/A'}</td>
                      <td style={{ padding: '20px 32px', fontSize: 14, color: T.textSub }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiClock size={14} /> 
                            {new Date(item.created_at).toLocaleDateString()}
                         </div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            onClick={() => handleVerify(item.id, item.type, 'approve')}
                            style={{ padding: '8px 16px', borderRadius: 8, background: T.green, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleVerify(item.id, item.type, 'reject')}
                            style={{ padding: '8px 16px', borderRadius: 8, background: '#FEE2E2', color: '#EF4444', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* MISSION FULFILLMENT DOSSIER MODAL */}
        {/* RESOURCE ALLOCATION TERMINAL */}
        <AnimatePresence>
          {isAllocating && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                style={{ width: 500, background: T.surface, borderRadius: 32, padding: 40, boxShadow: '0 24px 60px rgba(0,0,0,0.15)', position: 'relative' }}
              >
                <button 
                  onClick={() => setIsAllocating(null)}
                  style={{ position: 'absolute', top: 24, right: 24, background: T.bg, border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <FiX />
                </button>

                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                   <div style={{ width: 64, height: 64, borderRadius: 20, background: T.orangeLight, color: T.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <FiPackage size={32} />
                   </div>
                   <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Tactical Resource Allocation</h3>
                   <p style={{ fontSize: 13, color: T.textSub }}>{Array.isArray(isAllocating) ? `Deploying ${isAllocating.length} selected batches` : `Deploying Batch ID: ${isAllocating.id?.slice(0,8) || 'N/A'}`}</p>
                </div>

                <div style={{ background: T.bg, padding: 20, borderRadius: 24, border: `1px solid ${T.border}`, marginBottom: 32 }}>
                   <p style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', marginBottom: 12 }}>Manifest Contents</p>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(() => {
                         const donations = Array.isArray(isAllocating) ? isAllocating : [isAllocating];
                         let allItems = [];
                         donations.forEach(d => {
                            let items = d.items_json;
                            if (typeof items === 'string') try { items = JSON.parse(items); } catch(e) {}
                            if (Array.isArray(items)) allItems = [...allItems, ...items];
                         });
                         return allItems.map((it, i) => (
                            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: T.text, background: '#fff', padding: '4px 10px', borderRadius: 8, border: `1px solid ${T.border}` }}>
                               {it.name} x{it.quantity}
                            </span>
                         ));
                      })()}
                   </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                   <label style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Target Organization</label>
                   <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                      {allUsers.filter(u => u.role === 'orphanage').map(o => (
                         <button
                           key={o.id}
                           onClick={() => handleAllocate(isAllocating, o.id)}
                           style={{ 
                             display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, border: `1px solid ${T.border}`,
                             background: T.surface, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                           }}
                           onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.orange)}
                           onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
                         >
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: T.blue + '10', color: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <FiShield size={18} />
                            </div>
                            <div>
                               <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{o.full_name}</p>
                               <p style={{ fontSize: 11, color: T.textSub }}>{o.location || 'Verified Operations Base'}</p>
                            </div>
                         </button>
                      ))}
                   </div>
                </div>

                <button 
                  onClick={() => setIsAllocating(null)}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, background: T.navy, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                >
                   Cancel Deployment
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {viewingVolunteer && <VolunteerInfoModal volunteer={viewingVolunteer} onClose={() => setViewingVolunteer(null)} />}
          {selectedOrphanageInfo && (
            <OrphanageInfoModal 
              orphanage={selectedOrphanageInfo} 
              auditHistory={orphanageAuditHistory} 
              onClose={() => setSelectedOrphanageInfo(null)} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedRequest && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                style={{ width: 650, background: T.surface, borderRadius: 32, padding: 40, boxShadow: '0 24px 60px rgba(0,0,0,0.15)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
              >
                <button 
                  onClick={() => setSelectedRequest(null)}
                  style={{ position: 'absolute', top: 24, right: 24, background: T.bg, border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <FiX />
                </button>

                <div style={{ marginBottom: 32 }}>
                   <div style={{ display: 'flex', itemsCenter: 'center', gap: 16, marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: T.orangeLight, color: T.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <FiAlertTriangle size={22} />
                      </div>
                      <div>
                         <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Mission Fulfillment Dossier</h3>
                         <p style={{ fontSize: 13, color: T.textSub }}>{selectedRequest.orphanages?.name} — {selectedRequest.category}</p>
                      </div>
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
                   <div style={{ background: T.bg, padding: 16, borderRadius: 20, border: `1px solid ${T.border}` }}>
                      <p style={{ fontSize: 10, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', marginBottom: 4 }}>Requested Items</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                         {(() => {
                            let items = selectedRequest.items_json;
                            if (typeof items === 'string') try { items = JSON.parse(items); } catch(e) {}
                            return (Array.isArray(items) ? items : []).map((it, i) => (
                               <span key={i} style={{ fontSize: 10, fontWeight: 700, background: '#fff', padding: '2px 6px', borderRadius: 6, border: `1px solid ${T.border}` }}>
                                  {it.name} x{it.quantity}
                               </span>
                            ));
                         })()}
                      </div>
                   </div>
                   <div style={{ background: T.greenLight, padding: 16, borderRadius: 20, border: `1px solid ${T.green}20`, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p style={{ fontSize: 10, fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 4 }}>Total Impact Received</p>
                      <p style={{ fontSize: 24, fontWeight: 800, color: T.green }}>
                         {globalDonations.filter(d => d.orphanage_id === selectedRequest.orphanage_id && d.category === selectedRequest.category).reduce((s, d) => s + (d.quantity || 0), 0)} Units
                      </p>
                   </div>
                </div>

                <div>
                   <h4 style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiUsers size={16} color={T.blue} /> Fulfillment Squad
                   </h4>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {(() => {
                         const missionDonors = globalDonations.filter(d => d.orphanage_id === selectedRequest.orphanage_id && d.category === selectedRequest.category);
                         if (missionDonors.length === 0) return <div style={{ padding: '32px', textAlign: 'center', background: T.bg, borderRadius: 20, color: T.textSub, fontSize: 13 }}>No donations registered for this mission yet.</div>;
                         return missionDonors.map((d, i) => (
                            <div key={i} style={{ background: T.surface, padding: 16, borderRadius: 20, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: 8, background: T.blue + '10', color: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                     <FiUser size={16} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                     <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{d.donor_name}</p>
                                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                        {(() => {
                                           let donorItems = d.items_json;
                                           if (typeof donorItems === 'string') try { donorItems = JSON.parse(donorItems); } catch(e) {}
                                           return (Array.isArray(donorItems) ? donorItems : []).map((it, idx) => (
                                              <span key={idx} style={{ fontSize: 9, fontWeight: 700, color: T.textSub, background: T.bg, padding: '1px 6px', borderRadius: 4, border: `1px solid ${T.border}` }}>
                                                 {it.name} x{it.quantity}
                                              </span>
                                           ));
                                        })()}
                                     </div>
                                  </div>
                               </div>
                               <div style={{ textAlign: 'right' }}>
                                  <p style={{ fontSize: 12, fontWeight: 800, color: T.green }}>+{d.quantity} Units</p>
                                  <p style={{ fontSize: 10, color: T.textSub, marginBottom: 2 }}>{d.status?.replace('_', ' ')}</p>
                                  <p style={{ fontSize: 9, color: T.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>{new Date(d.created_at).toLocaleDateString()}</p>
                               </div>
                            </div>
                         ));
                      })()}
                   </div>
                </div>

                <div style={{ marginTop: 32 }}>
                   <button 
                     onClick={() => setSelectedRequest(null)}
                     style={{ width: '100%', padding: '14px', borderRadius: 12, background: T.navy, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                   >
                      Acknowledge Dossier
                   </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {selectedDonation && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                style={{ width: 450, background: T.surface, borderRadius: 32, padding: 40, boxShadow: '0 24px 60px rgba(0,0,0,0.15)', position: 'relative' }}
              >
                <button 
                  onClick={() => setSelectedDonation(null)}
                  style={{ position: 'absolute', top: 24, right: 24, background: T.bg, border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <FiX />
                </button>

                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                   <div style={{ width: 64, height: 64, borderRadius: 20, background: T.blue + '10', color: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <FiActivity size={32} />
                   </div>
                   <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Logistics Intelligence</h3>
                   <p style={{ fontSize: 13, color: T.textSub }}>Assigned Courier Dossier</p>
                </div>

                {loadingVolunteer ? (
                   <div style={{ padding: 40, textAlign: 'center', color: T.textSub }}>Analyzing database...</div>
                ) : assignedVolunteer ? (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div style={{ background: T.bg, padding: 24, borderRadius: 24, border: `1px solid ${T.border}` }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: T.surface, border: `2px solid ${T.blue}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.blue, overflow: 'hidden' }}>
                               {assignedVolunteer.face_image ? (
                                 <img src={assignedVolunteer.face_image} alt={assignedVolunteer.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                               ) : (
                                 <FiUser size={24} />
                               )}
                            </div>
                            <div style={{ flex: 1 }}>
                               <h4 style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{assignedVolunteer.full_name}</h4>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <p style={{ fontSize: 10, color: T.textSub, textTransform: 'uppercase', fontWeight: 700 }}>Active Volunteer</p>
                                  {assignedVolunteer.rating && (
                                     <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.amber, fontSize: 11, fontWeight: 800 }}>
                                        <FiStar fill={T.amber} size={12} /> {assignedVolunteer.rating.toFixed(1)}
                                     </div>
                                  )}
                               </div>
                            </div>
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                               <span style={{ fontSize: 12, color: T.textSub }}>Email</span>
                               <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{assignedVolunteer.email}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                               <span style={{ fontSize: 12, color: T.textSub }}>Phone</span>
                               <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{assignedVolunteer.phone || 'N/A'}</span>
                            </div>
                         </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                         <div style={{ padding: 16, borderRadius: 16, background: T.greenLight, textAlign: 'center' }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: T.green, textTransform: 'uppercase' }}>Delivery Status</p>
                            <p style={{ fontSize: 14, fontWeight: 800, color: T.green, marginTop: 4 }}>{selectedDonation.status?.replace('_', ' ')}</p>
                         </div>
                         <div style={{ padding: 16, borderRadius: 16, background: T.orangeLight, textAlign: 'center' }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: T.orange, textTransform: 'uppercase' }}>Batch Size</p>
                            <p style={{ fontSize: 14, fontWeight: 800, color: T.orange, marginTop: 4 }}>{selectedDonation.quantity} Units</p>
                         </div>
                      </div>

                      <button 
                        onClick={() => navigate(`/admin/users/${assignedVolunteer.id}`)}
                        style={{ width: '100%', padding: '14px', borderRadius: 12, background: T.navy, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                         View Full Volunteer Dossier
                      </button>
                   </div>
                ) : (
                   <div style={{ padding: 40, textAlign: 'center', color: T.textSub }}>Volunteer profile data restricted or missing.</div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CSR REVIEW MODAL */}
        <AnimatePresence>
          {selectedCsr && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', padding: 24 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} style={{ width: 600, maxHeight: '90vh', overflowY: 'auto', background: T.surface, borderRadius: 24, padding: 32, position: 'relative' }}>
                <button onClick={() => setSelectedCsr(null)} style={{ position: 'absolute', top: 24, right: 24, background: T.bg, border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX /></button>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 8 }}>CSR Partnership Review</h3>
                <p style={{ fontSize: 14, color: T.textSub, marginBottom: 24 }}>Application ID: {selectedCsr.id}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div style={{ padding: 16, background: T.bg, borderRadius: 12, border: `1px solid ${T.border}` }}><div style={{ fontSize: 11, color: T.textSub, fontWeight: 700, textTransform: 'uppercase' }}>Organization</div><div style={{ fontSize: 15, fontWeight: 800 }}>{selectedCsr.org_name}</div></div>
                  <div style={{ padding: 16, background: T.bg, borderRadius: 12, border: `1px solid ${T.border}` }}><div style={{ fontSize: 11, color: T.textSub, fontWeight: 700, textTransform: 'uppercase' }}>Contact Person</div><div style={{ fontSize: 15, fontWeight: 800 }}>{selectedCsr.contact_person}</div></div>
                  <div style={{ padding: 16, background: T.bg, borderRadius: 12, border: `1px solid ${T.border}` }}><div style={{ fontSize: 11, color: T.textSub, fontWeight: 700, textTransform: 'uppercase' }}>Email</div><div style={{ fontSize: 15, fontWeight: 800 }}>{selectedCsr.email}</div></div>
                  <div style={{ padding: 16, background: T.bg, borderRadius: 12, border: `1px solid ${T.border}` }}><div style={{ fontSize: 11, color: T.textSub, fontWeight: 700, textTransform: 'uppercase' }}>Support Type</div><div style={{ fontSize: 15, fontWeight: 800 }}>{selectedCsr.support_type}</div></div>
                  <div style={{ padding: 16, background: T.bg, borderRadius: 12, border: `1px solid ${T.border}` }}><div style={{ fontSize: 11, color: T.textSub, fontWeight: 700, textTransform: 'uppercase' }}>Capacity</div><div style={{ fontSize: 15, fontWeight: 800 }}>{selectedCsr.estimated_capacity}</div></div>
                  <div style={{ padding: 16, background: T.bg, borderRadius: 12, border: `1px solid ${T.border}` }}><div style={{ fontSize: 11, color: T.textSub, fontWeight: 700, textTransform: 'uppercase' }}>Duration</div><div style={{ fontSize: 15, fontWeight: 800 }}>{selectedCsr.collaboration_duration}</div></div>
                </div>

                <div style={{ marginBottom: 24, padding: 16, background: T.bg, borderRadius: 12, border: `1px solid ${T.border}` }}>
                   <div style={{ fontSize: 11, color: T.textSub, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>CSR Support Interests</div>
                   <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                     {Array.isArray(selectedCsr.interests) && selectedCsr.interests.length > 0 ? (
                       selectedCsr.interests.map((interest, idx) => (
                         <span key={idx} style={{ padding: '6px 12px', background: T.orangeLight, color: T.orange, borderRadius: 20, fontSize: 12, fontWeight: 800 }}>{interest}</span>
                       ))
                     ) : (
                       <span style={{ fontSize: 13, color: T.textSub, fontStyle: 'italic' }}>No specific interests selected.</span>
                     )}
                   </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                   <div style={{ fontSize: 11, color: T.textSub, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Digital Signature</div>
                   {selectedCsr.digital_signature ? (
                     <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 8 }}>
                       <img src={selectedCsr.digital_signature} alt="Signature" style={{ maxHeight: 100, display: 'block' }} />
                     </div>
                   ) : (
                     <div style={{ color: T.textSub, fontStyle: 'italic', fontSize: 13 }}>No signature provided.</div>
                   )}
                </div>

                <div style={{ marginBottom: 24, padding: 16, background: T.bg, borderRadius: 12, border: `1px solid ${T.border}` }}>
                   <div style={{ fontSize: 11, color: T.textSub, fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Schedule Panel Meeting</div>
                   <div style={{ display: 'flex', gap: 12 }}>
                     <input type="date" value={meetingDate || (selectedCsr.meeting_scheduled ? selectedCsr.meeting_scheduled.split('T')[0] : '')} onChange={(e) => setMeetingDate(e.target.value)} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} />
                     <button onClick={() => { if(meetingDate) handleCsrUpdate(selectedCsr.id, { meeting_scheduled: meetingDate }); else toast.error('Select a date first'); }} style={{ padding: '0 20px', borderRadius: 8, background: T.navy, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Set Date</button>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                   <button onClick={() => handleDownloadCsrPdf(selectedCsr)} style={{ flex: 1, padding: 14, borderRadius: 12, background: T.bg, color: T.text, border: `1px solid ${T.border}`, fontWeight: 800, cursor: 'pointer' }}>Download PDF</button>
                   {selectedCsr.status !== 'Approved' && (
                     <button onClick={() => handleCsrUpdate(selectedCsr.id, { status: 'Approved' })} style={{ flex: 1, padding: 14, borderRadius: 12, background: T.green, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Approve</button>
                   )}
                   {selectedCsr.status !== 'Rejected' && (
                     <button onClick={() => handleCsrUpdate(selectedCsr.id, { status: 'Rejected' })} style={{ flex: 1, padding: 14, borderRadius: 12, background: '#FEE2E2', color: '#EF4444', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Reject</button>
                   )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {selectedOrphanageInfo && (
            <OrphanageInfoModal 
              orphanage={selectedOrphanageInfo} 
              auditHistory={orphanageAuditHistory} 
              onClose={() => setSelectedOrphanageInfo(null)} 
            />
          )}
        </AnimatePresence>

        {activeView === 'volunteers' && (
          <div className="space-y-6">
            <div style={{ background: T.surface, borderRadius: 24, padding: 32, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Strategic Volunteer Corps</h3>
                  <p style={{ fontSize: 14, color: T.textSub }}>Monitor deployment status and operational efficiency of the volunteer network.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ padding: '8px 16px', background: T.greenLight, borderRadius: 12, border: `1px solid ${T.greenGlow}` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{allVolunteers.filter(v => onlineVolunteers[v.user_id] && !globalDonations.some(d => d.volunteer_id === v.user_id && ['picked_up', 'transit', 'arrived'].includes(d.status))).length} Available</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-wider text-stone-400">Volunteer Name</th>
                      <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-wider text-stone-400">Contact</th>
                      <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-wider text-stone-400">Deployment Status</th>
                      <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-wider text-stone-400">Trust Rating</th>
                      <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider text-stone-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allVolunteers.map(vol => {
                      const activeMission = globalDonations.find(d => d.volunteer_id === vol.user_id && ['picked_up', 'transit', 'arrived', 'in_transit'].includes(d.status));
                      const isAssigned = !!activeMission;
                      const isOnline = !!onlineVolunteers[vol.user_id];
                      
                      let statusText = 'Not Available';
                      let statusColor = '#94a3b8';

                      if (isAssigned) {
                        statusText = 'On Mission';
                        statusColor = T.amber;
                      } else if (isOnline) {
                        statusText = 'Available';
                        statusColor = T.green;
                      }

                      return (
                        <tr key={vol.id} style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.2s' }} className="hover:bg-stone-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: T.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.orange, overflow: 'hidden' }}>
                                {vol.face_image ? <img src={vol.face_image} className="w-full h-full object-cover" /> : <FiUser size={16} />}
                              </div>
                              <span className="font-bold text-sm text-stone-900">{vol.full_name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-xs font-medium text-stone-500">{vol.phone}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, textTransform: 'uppercase' }}>
                                  {statusText}
                                </span>
                              </div>
                              {isAssigned && (
                                <div style={{ fontSize: 10, color: T.textSub, fontWeight: 700, paddingLeft: 16 }}>
                                   {activeMission.category} → {activeMission.donor_name}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1 text-stone-900 font-bold text-sm">
                              <FiStar fill={T.amber} color={T.amber} size={14} /> {vol.rating ? vol.rating.toFixed(1) : '5.0'}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button 
                              onClick={() => navigate(`/admin/users/${vol.user_id}`)}
                              className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors"
                            >
                              View Dossier
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
