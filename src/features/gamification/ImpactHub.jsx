import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAward, FiHeart, FiTruck, FiStar, FiShare2, FiTrendingUp, FiRefreshCw, FiMoon } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import html2canvas from 'html2canvas';
import { supabase } from '../../lib/supabase';
import { PageLoader } from '../../components/PageLoader';

const ICON_MAP = {
  FiAward: FiAward,
  FiHeart: FiHeart,
  FiTruck: FiTruck,
  FiStar: FiStar,
  FiMoon: FiMoon
};

export const ImpactHub = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isExporting, setIsExporting] = useState(false);
  
  const [stats, setStats] = useState({ points: 0, level: 1, items: 0, deliveries: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGamificationData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // 1. Fetch User Stats
        const { data: userStats, error: statsError } = await supabase
          .from('gamification_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!statsError && userStats) {
          setStats({
            points: userStats.total_points || 0,
            level: userStats.current_level || 1,
            items: userStats.items_donated || 0,
            deliveries: userStats.missions_completed || 0
          });
        }

        // 2. Fetch Leaderboard
        const { data: leaderData, error: leaderError } = await supabase
          .from('gamification_stats')
          .select(`
            user_id, role, total_points, items_donated, missions_completed,
            users ( full_name )
          `)
          .order('total_points', { ascending: false })
          .limit(10);
        
        if (!leaderError && leaderData) {
          const formattedLeaderboard = leaderData.map((item, idx) => ({
            id: item.user_id,
            name: item.users?.full_name || 'Anonymous',
            role: item.role,
            points: item.total_points || 0,
            items: item.items_donated || 0,
            deliveries: item.missions_completed || 0,
            rank: idx + 1
          }));
          setLeaderboard(formattedLeaderboard);
        }

        // 3. Fetch Badges
        const { data: allBadges, error: badgesError } = await supabase
          .from('badges')
          .select('*')
          .order('points_required', { ascending: true });

        const { data: userBadgesData } = await supabase
          .from('user_badges')
          .select('badge_id')
          .eq('user_id', user.id);

        const earnedBadgeIds = userBadgesData?.map(b => b.badge_id) || [];

        if (!badgesError && allBadges) {
          setBadges(allBadges.map(b => ({
            id: b.id,
            name: b.name,
            description: b.description,
            iconName: b.icon_name,
            color: b.color,
            earned: earnedBadgeIds.includes(b.id)
          })));
        }

      } catch (e) {
        console.error('Gamification fetch error', e);
      } finally {
        setLoading(false);
      }
    };

    fetchGamificationData();
  }, [user]);

  const exportImpactCard = async () => {
    setIsExporting(true);
    const card = document.getElementById('impact-card');
    if (card) {
      try {
        const canvas = await html2canvas(card, { scale: 2, backgroundColor: null });
        const link = document.createElement('a');
        link.download = `impact-card-${user?.full_name?.replace(/\s+/g, '-').toLowerCase() || 'user'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Failed to export card', err);
      }
    }
    setIsExporting(false);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold text-[#E8622A] w-max mb-4">
              <FiAward className="mr-2" /> Community Impact Hub
            </div>
            <h1 className="text-4xl font-display font-bold text-stone-900">Your Journey of Giving</h1>
            <p className="text-stone-500 mt-2">Track your progress, earn badges, and see your community ranking.</p>
          </div>

          <div className="flex bg-stone-100 p-1 rounded-xl w-max">
            {['profile', 'leaderboard'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${
                  activeTab === tab ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Shareable Impact Card */}
              <div className="lg:col-span-1 space-y-4">
                <div 
                  id="impact-card"
                  className="bg-gradient-to-br from-[#E8622A] to-[#D4541E] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-12">
                      <div>
                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Official Impact Card</p>
                        <h2 className="text-2xl font-display font-bold">{user?.full_name || 'Community Member'}</h2>
                        <p className="text-white/90 capitalize">{role || 'Supporter'}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <FiHeart size={24} className="text-white" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-white/70 text-sm mb-1">Total Impact Score</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold font-display">{stats.points}</span>
                          <span className="text-white/80 font-medium">pts</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                        <div>
                          <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Level</p>
                          <p className="font-bold text-lg">Level {stats.level}</p>
                        </div>
                        <div>
                          <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Impact</p>
                          <p className="font-bold text-lg">
                            {role === 'volunteer' ? `${stats.deliveries} Drops` : `${stats.items} Items`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={exportImpactCard}
                  disabled={isExporting}
                  className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isExporting ? <FiRefreshCw className="animate-spin" /> : <FiShare2 />}
                  {isExporting ? 'Generating...' : 'Share Impact Card'}
                </button>
              </div>

              {/* Badges & Stats */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="p-8 border-t-4 border-t-[#2D9B6F]">
                  <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                    <FiAward className="text-[#2D9B6F]" /> Earned Badges
                  </h3>
                  {badges.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {badges.map((badge, idx) => {
                        const Icon = ICON_MAP[badge.iconName] || FiStar;
                        return (
                          <div 
                            key={badge.id || `badge-${idx}`}
                            className={`p-4 rounded-2xl border text-center transition-all ${
                              badge.earned 
                                ? 'bg-white border-stone-200 shadow-sm' 
                                : 'bg-stone-50 border-transparent opacity-60 grayscale'
                            }`}
                          >
                            <div 
                              className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
                              style={{ backgroundColor: `${badge.color}15`, color: badge.color }}
                            >
                              <Icon size={24} />
                            </div>
                            <h4 className="text-sm font-bold text-stone-900">{badge.name}</h4>
                            <p className="text-xs text-stone-500 mt-1">{badge.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-stone-500">
                      No badges available yet. Complete missions to unlock them!
                    </div>
                  )}
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Card className="p-6 bg-orange-50 border-none shadow-none">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-[#E8622A]">
                        <FiTrendingUp size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-orange-800 font-medium mb-1">Current Streak</p>
                        <h4 className="text-2xl font-bold text-[#E8622A]">1 Week</h4>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6 bg-emerald-50 border-none shadow-none">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-[#2D9B6F]">
                        <FiStar size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-emerald-800 font-medium mb-1">Total Points</p>
                        <h4 className="text-2xl font-bold text-[#2D9B6F]">{stats.points} pts</h4>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="overflow-hidden">
                <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-stone-900">Global Leaderboard</h3>
                  <select className="bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm outline-none">
                    <option>This Month</option>
                    <option>All Time</option>
                  </select>
                </div>
                <div className="divide-y divide-stone-100">
                  {leaderboard.length > 0 ? leaderboard.map((item, idx) => (
                    <div key={item.id || `leaderboard-${idx}`} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className={`text-2xl font-display font-black w-8 text-center ${
                          idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-stone-400' : idx === 2 ? 'text-orange-400' : 'text-stone-300'
                        }`}>
                          #{item.rank}
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-900">{item.name}</h4>
                          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">{item.role}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-[#E8622A]">{item.points} pts</div>
                        <div className="text-sm text-stone-500">
                          {item.role === 'volunteer' ? `${item.deliveries} deliveries` : `${item.items} items`}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-stone-500">
                      No leaderboard data available. Be the first to earn points!
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
