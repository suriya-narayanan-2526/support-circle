import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiArrowRight, FiUserPlus } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

/* ─── DESIGN TOKENS (Warm Charity Theme) ─── */
const T = {
  orange:        '#E8622A',
  orangeDark:    '#D4541E',
  orangeGlow:    'rgba(232,98,42,0.12)',
  orangeLight:   '#FFF0EA',
  green:         '#2D9B6F',
  bg:            '#FFFDF9',
  surface:       '#FFFFFF',
  border:        'rgba(28,25,23,0.08)',
  borderWarm:    'rgba(232,98,42,0.18)',
  textPrimary:   '#1C1917',
  textSecondary: '#78716C',
};

/* ─── DOT GRID ─── */
function DotGrid({ opacity = 0.025 }) {
  return (
    <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, pointerEvents: 'none' }}>
      <defs>
        <pattern id="login-dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#1C1917" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#login-dots)" />
    </svg>
  );
}

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginPage = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) throw error;
      
      toast.success('Successfully logged in!');
      setTimeout(() => {
        window.location.href = '/home';
      }, 500);
    } catch (error) {
      toast.error(error.message || 'Failed to login');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <DotGrid />

      {/* Decorative Glows */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '30vw', height: '30vw', background: `radial-gradient(ellipse, ${T.orangeGlow} 0%, transparent 70%)`, filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '30vw', height: '30vw', background: `radial-gradient(ellipse, rgba(45,155,111,0.1) 0%, transparent 70%)`, filter: 'blur(100px)', pointerEvents: 'none' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          width: '100%', maxWidth: 440, background: T.surface, 
          borderRadius: 24, border: `1px solid ${T.border}`,
          padding: 40, boxShadow: '0 8px 32px rgba(28,25,23,0.10), 0 2px 8px rgba(28,25,23,0.06)',
          position: 'relative', zIndex: 10,
        }}
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            style={{ 
              width: 56, height: 56, borderRadius: 16, background: T.orangeLight, 
              border: `1px solid ${T.borderWarm}`, display: 'flex', 
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' 
            }}
          >
            <FiLock size={26} color={T.orange} />
          </motion.div>
          <h1 className="font-display text-3xl font-bold" style={{ color: T.textPrimary }}>Welcome Back</h1>
          <p style={{ marginTop: 8, color: T.textSecondary, fontSize: 15 }}>Sign in to continue your giving journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginLeft: 4 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: 16, top: 16, color: T.textSecondary }} />
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                style={{
                  width: '100%', padding: '14px 14px 14px 44px', background: '#FFFDF9',
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
                  width: '100%', padding: '14px 14px 14px 44px', background: '#FFFDF9',
                  border: `1px solid ${errors.password ? '#ef4444' : T.border}`, borderRadius: 12,
                  color: T.textPrimary, outline: 'none', transition: 'all 0.2s', fontSize: 15
                }}
              />
            </div>
            {errors.password && <p style={{ fontSize: 12, color: '#ef4444', marginLeft: 4 }}>{errors.password.message}</p>}
          </div>

          <div className="pt-4">
            <motion.button 
              type="submit" 
              whileHover={{ scale: 1.02, boxShadow: `0 14px 32px rgba(232,98,42,0.35)` }} 
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '16px',
                background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`,
                color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer', boxShadow: `0 8px 22px rgba(232,98,42,0.28)`,
                opacity: isSubmitting ? 0.75 : 1, transition: 'opacity 0.2s'
              }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'} <FiArrowRight />
            </motion.button>
          </div>
        </form>

        <div className="mt-10 pt-8 border-t" style={{ borderColor: T.border, textAlign: 'center' }}>
          <p style={{ color: T.textSecondary, fontSize: 14 }}>
            Don't have an account?{' '}
            <Link to="/auth/register/donor" style={{ color: T.orange, fontWeight: 600, textDecoration: 'none' }} className="hover:underline">
              Join Support Circle <FiUserPlus style={{ display: 'inline', marginLeft: 4 }} />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
