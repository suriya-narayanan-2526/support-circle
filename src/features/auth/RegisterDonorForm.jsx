import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiHeart, FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { ROLES, DONATION_CATEGORIES } from '../../utils/constants';
import { supabase } from '../../lib/supabase';
import { hashPassword } from '../../utils/hashPassword';

/* ─── DESIGN TOKENS (Warm Charity Theme) ─── */
const T = {
  orange:       '#E8622A',
  orangeDark:   '#D4541E',
  orangeGlow:   'rgba(232,98,42,0.12)',
  orangeLight:  '#FFF0EA',
  green:        '#2D9B6F',
  bg:           '#FFFDF9',
  surface:      '#FFFFFF',
  border:       'rgba(28,25,23,0.08)',
  borderWarm:   'rgba(232,98,42,0.18)',
  textPrimary:  '#1C1917',
  textSecondary:'#78716C',
};

/* ─── DOT GRID ─── */
function DotGrid({ opacity = 0.025 }) {
  return (
    <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, pointerEvents: 'none' }}>
      <defs>
        <pattern id="register-dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#1C1917" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#register-dots)" />
    </svg>
  );
}

const donorSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  preferredCategories: z.array(z.string()).min(1, 'Select at least one category'),
});

export const RegisterDonorForm = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(donorSchema),
    defaultValues: {
      preferredCategories: [],
    }
  });

  const preferredCategories = watch('preferredCategories');

  const toggleCategory = (category) => {
    if (preferredCategories.includes(category)) {
      setValue('preferredCategories', preferredCategories.filter(c => c !== category));
    } else {
      setValue('preferredCategories', [...preferredCategories, category]);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const { data: authData, error: authError } = await signUp(data.email, data.password, {
        full_name: data.fullName,
        role: ROLES.DONOR,
      });

      if (authError) throw authError;

      const hashedPwd = await hashPassword(data.password);

      try {
        await supabase.from('users').insert({
          id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          role: ROLES.DONOR,
        });

        await supabase.from('donors').insert({
          user_id: authData.user.id,
          full_name: data.fullName,
          email: data.email,
          password_hash: hashedPwd,
          preferred_categories: data.preferredCategories || [],
        });
      } catch (e) {
        console.warn("Profile creation failed:", e);
      }

      toast.success('Registration successful! Please log in to continue.');
      navigate('/auth/login');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <DotGrid />

      {/* Ambient Glows */}
      <div style={{ position: 'absolute', top: '-10%', right: '10%', width: '40vw', height: '40vw', background: `radial-gradient(ellipse, ${T.orangeGlow} 0%, transparent 70%)`, filter: 'blur(110px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '10%', width: '40vw', height: '40vw', background: `radial-gradient(ellipse, rgba(45,155,111,0.05) 0%, transparent 70%)`, filter: 'blur(110px)', pointerEvents: 'none' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          width: '100%', maxWidth: 520, background: T.surface, 
          borderRadius: 24, border: `1px solid ${T.border}`,
          padding: 40, boxShadow: '0 20px 40px rgba(28,25,23,0.08)',
          position: 'relative', zIndex: 10,
        }}
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            style={{ 
              width: 56, height: 56, borderRadius: 16, background: T.orangeLight, 
              border: `1px solid ${T.borderWarm}`, display: 'flex', 
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' 
            }}
          >
            <FiHeart size={28} color={T.orange} />
          </motion.div>
          <h1 className="font-display text-3xl font-bold" style={{ color: T.textPrimary }}>Donor Registration</h1>
          <p style={{ marginTop: 8, color: T.textSecondary, fontSize: 15 }}>Start your journey of making a difference</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginLeft: 4 }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <FiUser style={{ position: 'absolute', left: 16, top: 16, color: T.textSecondary }} />
              <input
                placeholder="John Doe"
                {...register('fullName')}
                style={{
                  width: '100%', padding: '14px 14px 14px 44px', background: T.bg,
                  border: `1px solid ${errors.fullName ? '#ef4444' : T.border}`, borderRadius: 12,
                  color: T.textPrimary, outline: 'none', transition: 'all 0.2s', fontSize: 15
                }}
              />
            </div>
            {errors.fullName && <p style={{ fontSize: 12, color: '#ef4444', marginLeft: 4 }}>{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <label style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginLeft: 4 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: 16, top: 16, color: T.textSecondary }} />
              <input
                type="email"
                placeholder="john@example.com"
                {...register('email')}
                style={{
                  width: '100%', padding: '14px 14px 14px 44px', background: T.bg,
                  border: `1px solid ${errors.email ? '#ef4444' : T.border}`, borderRadius: 12,
                  color: T.textPrimary, outline: 'none', transition: 'all 0.2s', fontSize: 15
                }}
              />
            </div>
            {errors.email && <p style={{ fontSize: 12, color: '#ef4444', marginLeft: 4 }}>{errors.email.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginLeft: 4 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: 16, top: 16, color: T.textSecondary }} />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                style={{
                  width: '100%', padding: '14px 14px 14px 44px', background: T.bg,
                  border: `1px solid ${errors.password ? '#ef4444' : T.border}`, borderRadius: 12,
                  color: T.textPrimary, outline: 'none', transition: 'all 0.2s', fontSize: 15
                }}
              />
            </div>
            {errors.password && <p style={{ fontSize: 12, color: '#ef4444', marginLeft: 4 }}>{errors.password.message}</p>}
          </div>

          <div className="space-y-4 pt-2">
            <label style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginLeft: 4 }}>Preferred Categories</label>
            <div className="grid grid-cols-2 gap-3">
              {DONATION_CATEGORIES.map(category => (
                <button
                  type="button"
                  key={category}
                  onClick={() => toggleCategory(category)}
                  style={{
                    padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    transition: 'all 0.2s', textAlign: 'center', border: '1px solid',
                    background: preferredCategories.includes(category) ? T.orangeLight : T.bg,
                    borderColor: preferredCategories.includes(category) ? T.orange : T.border,
                    color: preferredCategories.includes(category) ? T.orange : T.textSecondary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  {preferredCategories.includes(category) && <FiCheck size={14} />}
                  {category}
                </button>
              ))}
            </div>
            {errors.preferredCategories && <p style={{ fontSize: 12, color: '#ef4444', marginLeft: 4 }}>{errors.preferredCategories.message}</p>}
          </div>

          <div className="pt-6">
            <motion.button 
              type="submit" 
              whileHover={{ scale: 1.02, boxShadow: '0 12px 24px rgba(232,98,42,0.25)' }} 
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '16px', 
                background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`,
                color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer', boxShadow: `0 8px 16px rgba(232,98,42,0.15)`,
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Creating Account...' : 'Continue to Circle'} <FiArrowRight />
            </motion.button>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t" style={{ borderColor: T.border, textAlign: 'center' }}>
          <Link to="/auth/register" style={{ color: T.textSecondary, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} className="hover:text-stone-900">
            <FiArrowLeft size={16} /> Back to role selection
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
