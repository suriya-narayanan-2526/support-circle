import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const AuthContext = createContext({
  user: null,
  profile: null,
  role: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mockRole, setMockRoleState] = useState(
    () => localStorage.getItem('dev_mock_role') || 'donor'
  );

  const setMockRole = (role) => {
    localStorage.setItem('dev_mock_role', role);
    setMockRoleState(role);
    setProfile(prev => prev ? { ...prev, role } : prev);
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // 1. Initial session check
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Fetch profile in background, don't block loading
          fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Presence Tracking for Volunteers
  useEffect(() => {
    if (!user || (profile?.role !== 'volunteer' && user?.user_metadata?.role !== 'volunteer')) return;

    const channel = supabase.channel('volunteers-presence', {
      config: { presence: { key: user.id } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence sync:', channel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            user_id: user.id,
            name: profile?.full_name || user.user_metadata?.full_name
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user, profile]);

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email, password, metadata) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    profile,
    role: profile?.role || user?.user_metadata?.role || null,
    loading,
    signIn,
    signUp,
    signOut,
    setMockRole, // exposed for DevRoleSwitcher only
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
