import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

/* ─── DESIGN TOKENS (Warm Charity Theme) ─── */
const T = {
  orange: '#E8622A',
  orangeDark: '#D4541E',
  orangeGlow: 'rgba(232,98,42,0.12)',
  orangeLight: '#FFF0EA',
  borderWarm: 'rgba(232,98,42,0.18)',
  green: '#2D9B6F',
  greenLight: '#EEFAF4',
  amber: '#F4A135',
  bg: '#FFFDF9',
  bgAlt: '#FFF8F3',
  surface: '#FFFFFF',
  surfaceMid: '#FFF5EE',
  border: 'rgba(28,25,23,0.08)',
  textPrimary: '#1C1917',
  textSecondary: '#78716C',
  lightBg: '#FFF8F3',
  lightBorder: 'rgba(28,25,23,0.08)',
  navy: '#1C1917',
  /* keep these aliases so role-card per-role colors still work */
  blue: '#E8622A',
  blueGlow: 'rgba(232,98,42,0.12)',
  emerald: '#2D9B6F',
  emeraldDim: 'rgba(45,155,111,0.10)',
};

/* ─── REUSABLES ─── */
function DotGrid({ dark = true, opacity = 0.04 }) {
  const fill = dark ? '#ffffff' : '#0F172A';
  const id = dark ? 'cdots-dark' : 'cdots-light';
  return (
    <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, pointerEvents: 'none' }}>
      <defs>
        <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill={fill} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 36 });
  return (
    <motion.div style={{
      scaleX, position: 'fixed', top: 0, left: 0, right: 0,
      height: 2, background: `linear-gradient(90deg, ${T.blue}, ${T.emerald})`,
      transformOrigin: '0%', zIndex: 9999,
    }} />
  );
}

function TiltCard({ children, className = '', intensity = 8 }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const sx = useSpring(rx, { stiffness: 240, damping: 24 });
  const sy = useSpring(ry, { stiffness: 240, damping: 24 });
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    rx.set(((e.clientY - top) / height - 0.5) * -intensity);
    ry.set(((e.clientX - left) / width - 0.5) * intensity);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ rotateX: sx, rotateY: sy, transformStyle: 'preserve-3d', willChange: 'transform' }}
      className={className}>
      {children}
    </motion.div>
  );
}

const Reveal = ({ children, delay = 0, className = '' }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

function PulseDot({ color = T.emerald }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
      <motion.span
        style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: color, opacity: 0.5 }}
        animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span style={{ position: 'relative', width: 6, height: 6, borderRadius: '50%', background: color }} />
    </span>
  );
}

/* ─── ICONS ─── */
const Icon = {
  Heart: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M12 21s-9-6.5-9-12.5C3 5.4 5.4 3 8.5 3c1.7 0 3.3.8 3.5 2 .2-1.2 1.8-2 3.5-2C18.6 3 21 5.4 21 8.5 21 14.5 12 21 12 21z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  Users: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M23 21v-2c0-1.9-1.1-3.4-2.7-4M16 3a4 4 0 0 1 0 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  Building: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M16 8V6a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 13v4M9 13v4M15 13v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  Shield: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M12 22s-8-4-8-11V5l8-3 8 3v6c0 7-8 11-8 11z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Truck: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><rect x="1" y="6" width="13" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" /><path d="M14 9h4l3 3v5h-7V9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="5.5" cy="18.5" r="1.5" stroke="currentColor" strokeWidth="1.5" /><circle cx="17.5" cy="18.5" r="1.5" stroke="currentColor" strokeWidth="1.5" /></svg>,
  Star: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  Map: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13V7m0 13l6-3M9 7l6-3m0 17l4.553 2.276A1 1 0 0 0 21 20.382V9.618a1 1 0 0 0-.553-.894L15 6m0 15V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Check: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Zap: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  Globe: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" stroke="currentColor" strokeWidth="1.5" /></svg>,
};

/* ─── ROLE CARD ─── */
function RoleCard({ role, index }) {
  return (
    <Reveal delay={index * 0.1}>
      <TiltCard intensity={7}>
        <motion.div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${T.lightBorder}`,
            borderRadius: 20,
            padding: '28px 24px',
            height: '100%',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            position: 'relative',
            overflow: 'hidden',
          }}
          whileHover={{ y: -5, boxShadow: '0 24px 56px rgba(0,0,0,0.1)' }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          {/* Colour accent header bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: role.gradient, borderRadius: '20px 20px 0 0',
          }} />

          <div style={{
            width: 44, height: 44, borderRadius: 14, marginBottom: 18,
            background: role.bgGlow, border: `1px solid ${role.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <role.Icon width={20} height={20} color={role.color} />
          </div>

          <div style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 9999,
            background: role.bgGlow, border: `1px solid ${role.border}`,
            fontSize: 11, fontWeight: 700, color: role.color,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
          }}>
            {role.tag}
          </div>

          <h3 className="font-display font-bold" style={{ fontSize: 19, color: T.navy, letterSpacing: '-0.01em', marginBottom: 10 }}>
            {role.title}
          </h3>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.72, marginBottom: 20 }}>{role.desc}</p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {role.perks.map((perk) => (
              <li key={perk} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#64748B' }}>
                <Icon.Check width={14} height={14} color={role.color} style={{ marginTop: 2, flexShrink: 0 }} />
                {perk}
              </li>
            ))}
          </ul>

          <Link to={role.href}>
            <motion.button
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.97 }}
              style={{
                marginTop: 24, width: '100%', padding: '11px 0', borderRadius: 12,
                fontWeight: 600, fontSize: 14, letterSpacing: '0.01em', cursor: 'pointer',
                background: role.gradient, color: '#fff', border: 'none', outline: 'none',
                boxShadow: `0 6px 18px ${role.shadow}`,
              }}
            >
              {role.cta}
            </motion.button>
          </Link>

          <motion.div
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, scaleX: 0, originX: 0, background: role.color }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.3 + index * 0.1 }}
          />
        </motion.div>
      </TiltCard>
    </Reveal>
  );
}

/* ─── STAT CARD (dark variant) ─── */
function StatCard({ stat, index }) {
  return (
    <Reveal delay={index * 0.08}>
      <TiltCard intensity={6}>
        <div style={{
          background: T.surfaceMid, border: `1px solid ${T.border}`,
          borderRadius: 20, padding: '24px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, ${T.blue}50, transparent)`,
          }} />
          <p className="font-display font-bold" style={{ fontSize: 34, color: T.textPrimary, letterSpacing: '-0.03em' }}>
            {stat.value}
          </p>
          <p style={{ fontSize: 12, color: T.textSecondary, marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {stat.label}
          </p>
          <p style={{ fontSize: 13, color: T.textSecondary, marginTop: 10, lineHeight: 1.6 }}>{stat.note}</p>
        </div>
      </TiltCard>
    </Reveal>
  );
}

/* ─── TESTIMONIAL CARD ─── */
function TestimonialCard({ t, index }) {
  return (
    <Reveal delay={index * 0.1}>
      <TiltCard intensity={5}>
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 20, padding: '28px 24px', height: '100%', position: 'relative',
        }}>
          {/* Quote mark */}
          <div style={{
            fontSize: 48, lineHeight: 1, color: T.blue, opacity: 0.25,
            fontFamily: 'Georgia, serif', marginBottom: 12, marginTop: -6,
          }}>
            "
          </div>

          <p style={{ fontSize: 14.5, color: '#94A3B8', lineHeight: 1.76, fontStyle: 'italic' }}>
            {t.quote}
          </p>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Avatar initials */}
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: T.blueGlow, border: `1px solid rgba(79,126,250,0.25)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: T.blue,
            }}>
              {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{t.name}</p>
              <p style={{ fontSize: 12, color: T.textSecondary, marginTop: 1 }}>{t.role}</p>
            </div>
          </div>
        </div>
      </TiltCard>
    </Reveal>
  );
}

/* ════════════════════════════════════
   COMMUNITY PAGE
════════════════════════════════════ */
export const CommunityPage = () => {
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 400], [0, 60]);

  const roles = [
    {
      tag: 'Donor',
      title: 'Make a Lasting Impact',
      desc: 'Choose what you give, track where it goes, and see the real-world difference your donation makes — in real time.',
      Icon: Icon.Heart,
      color: '#E8622A',
      gradient: 'linear-gradient(135deg, #E8622A, #D4541E)',
      bgGlow: 'rgba(232,98,42,0.10)',
      border: 'rgba(232,98,42,0.22)',
      shadow: 'rgba(232,98,42,0.22)',
      href: '/auth/register',
      cta: 'Start Donating',
      perks: [
        'Live donation tracking dashboard',
        'AI-matched allocation to urgent needs',
        'Verified confirmation receipts',
      ],
    },
    {
      tag: 'Volunteer',
      title: 'Deliver Hope Directly',
      desc: 'Join a verified fleet of delivery heroes. Every route you complete moves essential supplies from generous hands to children who need them.',
      Icon: Icon.Truck,
      color: '#2D9B6F',
      gradient: 'linear-gradient(135deg, #2D9B6F, #1E7D55)',
      bgGlow: 'rgba(45,155,111,0.10)',
      border: 'rgba(45,155,111,0.22)',
      shadow: 'rgba(45,155,111,0.20)',
      href: '/auth/register/volunteer',
      cta: 'Become a Volunteer',
      perks: [
        'Background-verified onboarding',
        'Smart route assignment system',
        'GPS tracking & digital sign-off',
      ],
    },
    {
      tag: 'Orphanage',
      title: 'Connect With Resources',
      desc: 'Register your facility to receive AI-matched donations. Post requests, track incoming deliveries, and manage your inventory — all in one place.',
      Icon: Icon.Building,
      color: '#B45309',
      gradient: 'linear-gradient(135deg, #F4A135, #B45309)',
      bgGlow: 'rgba(244,161,53,0.12)',
      border: 'rgba(244,161,53,0.30)',
      shadow: 'rgba(244,161,53,0.22)',
      href: '/auth/register/orphanage',
      cta: 'Register Orphanage',
      perks: [
        'Priority-scored donation matching',
        'Real-time inventory management',
        'Verified delivery confirmation',
      ],
    },
  ];

  const stats = [
    { value: '1,200+', label: 'Active Volunteers', note: 'Background-checked, trained, and GPS-tracked on every delivery.' },
    { value: '48', label: 'Orphanages Registered', note: 'Verified facilities across multiple states receiving regular support.' },
    { value: '3,800+', label: 'Children Reached', note: 'And growing — every donation helps us expand our reach.' },
    { value: '94%', label: 'Allocation Accuracy', note: 'Our AI engine matches donations to the right facility in under 3 seconds.' },
  ];

  const testimonials = [
    {
      quote: "Before Support Circle, we spent weeks coordinating donations manually. Now, supplies arrive within days and I can track everything in our dashboard. It\'s transformed how we operate.",
      name: 'Sister Mary Anand',
      role: 'Administrator, St. Joseph\'s Home, Erode',
    },
    {
      quote: "I donated once, saw on my dashboard exactly which orphanage received it and when it was delivered. That transparency made me a monthly donor. I\'ve never trusted a platform this much.",
      name: 'Rohan Iyer',
      role: 'Donor, Chennai',
    },
    {
      quote: "The volunteer onboarding was smooth and the route assignments are precise. I know every delivery counts. In 3 months I\'ve helped deliver to 12 different orphanages.",
      name: 'Priya Venkataraman',
      role: 'Verified Volunteer, Coimbatore',
    },
  ];

  const values = [
    { Icon: Icon.Shield, title: 'Trust First', desc: 'Every user — donor, volunteer, and orphanage — is verified before they can participate in our ecosystem.' },
    { Icon: Icon.Globe, title: 'Full Transparency', desc: 'No black boxes. Every donation is tracked end-to-end. Every child helped is a data point we publish.' },
    { Icon: Icon.Zap, title: 'Speed Matters', desc: 'Our AI allocation engine processes donation-to-match in under 3 seconds. Urgency is our default mode.' },
    { Icon: Icon.Star, title: 'Zero Waste Policy', desc: 'Intelligent matching eliminates donation redundancy. Supplies go exactly where they\'re needed most.' },
  ];

  return (
    <>
      <ScrollProgress />

      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

        {/* ── HERO ── */}
        <section style={{
          background: T.bg, position: 'relative', overflow: 'hidden',
          paddingTop: 100, paddingBottom: 108, display: 'flex', alignItems: 'center',
        }}>
          <DotGrid dark opacity={0.04} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 70% 55% at 50% 0%, rgba(79,126,250,0.12) 0%, transparent 65%)`,
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, pointerEvents: 'none',
            background: `linear-gradient(to bottom, transparent, ${T.bg})`,
          }} />

          <div style={{ maxWidth: 768, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                borderRadius: 9999, padding: '6px 16px', marginBottom: 28,
                background: T.emeraldDim, border: '1px solid rgba(16,185,129,0.22)',
              }}
            >
              <PulseDot color={T.emerald} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#34D399', letterSpacing: '0.03em' }}>
                Growing community — join today
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="font-display font-bold"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', lineHeight: 1.06, color: T.textPrimary, letterSpacing: '-0.025em' }}
            >
              A community united
              <br />
              <span style={{
                backgroundImage: `linear-gradient(135deg, ${T.blue} 25%, #818CF8 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                by one purpose.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ marginTop: 20, fontSize: 16.5, color: T.textSecondary, lineHeight: 1.75, maxWidth: 540, margin: '20px auto 0' }}
            >
              Donors, volunteers, and orphanages — each playing a vital role in an intelligent,
              accountable, and compassionate ecosystem designed to serve children in need.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.35 }}
              style={{ marginTop: 36, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}
            >
              <Link to="/auth/register">
                <motion.button
                  whileHover={{ scale: 1.025, boxShadow: `0 0 0 1px ${T.blue}, 0 12px 28px rgba(79,126,250,0.28)` }}
                  whileTap={{ scale: 0.975 }}
                  style={{
                    padding: '12px 28px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                    color: '#fff', background: T.blue, border: 'none', cursor: 'pointer', outline: 'none',
                    boxShadow: `0 8px 20px rgba(79,126,250,0.22)`, letterSpacing: '0.01em',
                  }}
                >
                  Join the Community
                </motion.button>
              </Link>
              <Link to="/about">
                <motion.button
                  whileHover={{ scale: 1.025 }}
                  whileTap={{ scale: 0.975 }}
                  style={{
                    padding: '12px 28px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                    color: T.textPrimary, background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${T.border}`, cursor: 'pointer', outline: 'none', letterSpacing: '0.01em',
                  }}
                >
                  Learn More
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── IMPACT STATS ── */}
        <section style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '64px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {stats.map((s, i) => <StatCard key={s.label} stat={s} index={i} />)}
            </div>
          </div>
        </section>

        {/* ── ROLE CARDS ── */}
        <section style={{ background: '#F9FAFB', position: 'relative', overflow: 'hidden' }}>
          <DotGrid dark={false} opacity={0.03} />
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '88px 24px', position: 'relative', zIndex: 10 }}>
            <Reveal>
              <div style={{ textAlign: 'center', maxWidth: 540, margin: '0 auto 56px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Pick Your Role
                </p>
                <h2 className="font-display font-bold text-navy" style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)', lineHeight: 1.12, letterSpacing: '-0.02em' }}>
                  Everyone has a role to play
                </h2>
                <p style={{ marginTop: 14, fontSize: 15, color: '#64748B', lineHeight: 1.72 }}>
                  No matter how you join, your contribution is tracked, verified, and impactful.
                </p>
              </div>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
              {roles.map((r, i) => <RoleCard key={r.tag} role={r} index={i} />)}
            </div>
          </div>
        </section>

        {/* ── COMMUNITY VALUES ── */}
        <section style={{ background: T.bg, position: 'relative', overflow: 'hidden' }}>
          <DotGrid dark opacity={0.04} />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 220, pointerEvents: 'none',
            background: `radial-gradient(ellipse 60% 80% at 50% 0%, ${T.blueGlow} 0%, transparent 100%)`,
          }} />

          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '88px 24px', position: 'relative', zIndex: 10 }}>
            <Reveal>
              <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 56px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Our Values
                </p>
                <h2 className="font-display font-bold" style={{
                  fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)', lineHeight: 1.12,
                  color: T.textPrimary, letterSpacing: '-0.02em',
                }}>
                  What we stand for
                </h2>
              </div>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {values.map((v, i) => (
                <Reveal key={v.title} delay={i * 0.08}>
                  <TiltCard intensity={6}>
                    <motion.div
                      style={{
                        background: T.surfaceMid, border: `1px solid ${T.border}`,
                        borderRadius: 20, padding: '24px', height: '100%', position: 'relative', overflow: 'hidden',
                      }}
                      whileHover={{ borderColor: 'rgba(79,126,250,0.3)', y: -3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, marginBottom: 16,
                        background: T.blueGlow, border: `1px solid rgba(79,126,250,0.2)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <v.Icon width={18} height={18} color={T.blue} />
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>{v.title}</h3>
                      <p style={{ fontSize: 13.5, color: T.textSecondary, lineHeight: 1.68 }}>{v.desc}</p>
                      <motion.div
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, scaleX: 0, originX: 0, background: T.blue }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.3 + i * 0.1 }}
                      />
                    </motion.div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section style={{ background: '#F9FAFB', position: 'relative', overflow: 'hidden' }}>
          <DotGrid dark={false} opacity={0.03} />
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '88px 24px', position: 'relative', zIndex: 10 }}>
            <Reveal>
              <div style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 52px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Voices
                </p>
                <h2 className="font-display font-bold text-navy" style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)', lineHeight: 1.12, letterSpacing: '-0.02em' }}>
                  Stories from the community
                </h2>
              </div>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {testimonials.map((t, i) => (
                <TestimonialCard key={t.name} t={t} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ background: T.bg, position: 'relative', overflow: 'hidden' }}>
          <DotGrid dark opacity={0.04} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 60% 70% at 50% 50%, rgba(79,126,250,0.08) 0%, transparent 70%)`,
          }} />

          <div style={{ maxWidth: 640, margin: '0 auto', padding: '88px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <Reveal>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
                Ready?
              </p>
              <h2 className="font-display font-bold" style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1,
                color: T.textPrimary, letterSpacing: '-0.025em',
              }}>
                Join thousands making{' '}
                <span style={{
                  backgroundImage: `linear-gradient(135deg, ${T.blue} 20%, #818CF8 80%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  a real difference.
                </span>
              </h2>
              <p style={{ marginTop: 16, fontSize: 15.5, color: T.textSecondary, lineHeight: 1.72 }}>
                Every role — donor, volunteer, orphanage — is essential. Pick yours and start
                creating impact today.
              </p>

              <div style={{ marginTop: 36, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
                <Link to="/auth/register">
                  <motion.button
                    whileHover={{ scale: 1.025, boxShadow: `0 0 0 1px ${T.blue}, 0 14px 32px rgba(79,126,250,0.28)` }}
                    whileTap={{ scale: 0.975 }}
                    style={{
                      padding: '13px 30px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                      color: '#fff', background: T.blue, border: 'none', cursor: 'pointer', outline: 'none',
                      boxShadow: `0 8px 22px rgba(79,126,250,0.2)`, letterSpacing: '0.01em',
                    }}
                  >
                    Create Your Account
                  </motion.button>
                </Link>
                <Link to="/donor/donate">
                  <motion.button
                    whileHover={{ scale: 1.025 }}
                    whileTap={{ scale: 0.975 }}
                    style={{
                      padding: '13px 30px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                      color: T.textPrimary, background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${T.border}`, cursor: 'pointer', outline: 'none', letterSpacing: '0.01em',
                    }}
                  >
                    Donate Now
                  </motion.button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

      </div>
    </>
  );
};
