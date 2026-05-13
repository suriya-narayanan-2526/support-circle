import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
  AnimatePresence,
} from 'framer-motion';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────
   WARM CHARITY DESIGN TOKENS
   Primary:   #E8622A   — warm amber-orange (compassion, energy)
   Secondary: #2D9B6F   — sage green (growth, hope, community)
   Accent:    #F4A135   — golden amber (warmth, generosity)
   BG:        #FFFDF9   — soft warm cream
   Surface:   #FFFFFF   — pure white cards
   Dark:      #1C1917   — warm near-black for text
───────────────────────────────────────────── */
const T = {
  orange: '#E8622A',
  orangeLight: '#FFF0EA',
  orangeGlow: 'rgba(232,98,42,0.12)',
  orangeMid: 'rgba(232,98,42,0.08)',
  green: '#2D9B6F',
  greenLight: '#EEFAF4',
  greenGlow: 'rgba(45,155,111,0.12)',
  amber: '#F4A135',
  amberLight: '#FFF8EC',
  bg: '#FFFDF9',
  bgAlt: '#FFF8F3',
  surface: '#FFFFFF',
  surfaceWarm: '#FFF5EE',
  border: 'rgba(28,25,23,0.07)',
  borderWarm: 'rgba(232,98,42,0.15)',
  textPrimary: '#1C1917',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
  dark: '#1C1917',
};

/* ─── SCROLL PROGRESS ─── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 36 });
  return (
    <motion.div
      style={{
        scaleX,
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${T.orange}, ${T.amber}, ${T.green})`,
        transformOrigin: '0%',
        zIndex: 9999,
      }}
    />
  );
}

/* ─── SECTION REVEAL ─── */
const Reveal = ({ children, delay = 0, className = '' }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

/* ─── ANIMATED COUNTER ─── */
function AnimatedCounter({ end, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 2000;
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setVal(Math.floor(eased * end));
      if (t < 1) requestAnimationFrame(tick);
      else setVal(end);
    };
    requestAnimationFrame(tick);
  }, [inView, end]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── PULSE DOT ─── */
function PulseDot({ color = T.green }) {
  return (
    <span className="relative flex items-center justify-center" style={{ width: 8, height: 8, flexShrink: 0 }}>
      <motion.span
        className="absolute rounded-full"
        style={{ width: 8, height: 8, background: color, opacity: 0.5 }}
        animate={{ scale: [1, 2.4, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="relative rounded-full" style={{ width: 6, height: 6, background: color }} />
    </span>
  );
}

/* ─── SVG ICONS ─── */
const Icon = {
  Heart: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M12 21s-9-6.5-9-12.5C3 5.4 5.4 3 8.5 3c1.7 0 3.3.8 3.5 2 .2-1.2 1.8-2 3.5-2C18.6 3 21 5.4 21 8.5 21 14.5 12 21 12 21z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>,
  Building: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M16 8V6a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 13v4M9 13v4M15 13v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  Users: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M23 21v-2c0-1.9-1.1-3.4-2.7-4M16 3a4 4 0 0 1 0 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  Shield: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M12 22s-8-4-8-11V5l8-3 8 3v6c0 7-8 11-8 11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Truck: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><rect x="1" y="6" width="13" height="11" rx="1" stroke="currentColor" strokeWidth="1.8" /><path d="M14 9h4l3 3v5h-7V9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="5.5" cy="18.5" r="1.5" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.5" cy="18.5" r="1.5" stroke="currentColor" strokeWidth="1.8" /></svg>,
  Cpu: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.8" /><path d="M9 7V5M12 7V5M15 7V5M9 19v-2M12 19v-2M15 19v-2M7 9H5M7 12H5M7 15H5M19 9h-2M19 12h-2M19 15h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  Arrow: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  BarChart: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><rect x="3" y="13" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.8" /><rect x="10" y="8" width="4" height="13" rx="1" stroke="currentColor" strokeWidth="1.8" /><rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.8" /></svg>,
  Check: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Star: (p) => <svg {...p} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
  Sparkle: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
};

/* ─── HERO VISUAL — warm charity cards ─── */
function HeroVisual() {
  const cards = [
    {
      icon: '🎁',
      label: 'DONATION RECEIVED',
      value: '₹18,400',
      sub: 'St. Mary\'s Orphanage — Clothing & Books',
      pct: 78,
      color: T.orange,
      bg: T.orangeLight,
      delay: 0,
    },
    {
      icon: '🚗',
      label: 'VOLUNTEER EN ROUTE',
      value: 'Arjun S.',
      sub: 'Arriving in 8 min · 2.4 km away',
      pct: 62,
      color: T.green,
      bg: T.greenLight,
      delay: 0.12,
    },
    {
      icon: '👧',
      label: 'CHILDREN SERVED TODAY',
      value: '34 children',
      sub: 'Erode District · Batch #7 complete',
      pct: 91,
      color: T.amber,
      bg: T.amberLight,
      delay: 0.22,
    },
  ];

  return (
    <div style={{ perspective: 1100, width: 380, height: 340 }} className="relative">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          className="absolute w-80 rounded-3xl overflow-hidden"
          style={{
            background: '#FFFFFF',
            border: `1px solid ${T.border}`,
            boxShadow: `0 8px 32px rgba(28,25,23,0.10), 0 2px 8px rgba(28,25,23,0.06)`,
            top: i * 40,
            left: i * -16,
            zIndex: cards.length - i,
          }}
          initial={{ opacity: 0, y: 40, rotateX: -6 }}
          animate={{ opacity: 1 - i * 0.12, y: 0, rotateX: -2 + i * 0.5 }}
          transition={{ duration: 0.9, delay: 0.5 + card.delay, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -10, rotateX: 0, opacity: 1, zIndex: 10 }}
        >
          <div className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${T.border}`, background: card.bg }}>
            <div className="flex items-center gap-2.5">
              <PulseDot color={card.color} />
              <span style={{ fontSize: 10, fontWeight: 700, color: card.color, letterSpacing: '0.1em' }}>
                {card.label}
              </span>
            </div>
            <span style={{ fontSize: 18 }}>{card.icon}</span>
          </div>
          <div className="px-5 py-5">
            <p className="font-bold text-stone-800" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
              {card.value}
            </p>
            <p style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>{card.sub}</p>
            <div style={{ marginTop: 16, height: 4, borderRadius: 9999, background: `rgba(28,25,23,0.07)` }}>
              <motion.div
                style={{ height: '100%', borderRadius: 9999, background: card.color }}
                initial={{ width: 0 }}
                animate={{ width: `${card.pct}%` }}
                transition={{ duration: 1.5, delay: 1 + card.delay, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span style={{ fontSize: 10, color: T.textMuted }}>Progress</span>
              <span style={{ fontSize: 10, color: card.color, fontWeight: 700 }}>{card.pct}%</span>
            </div>
          </div>
        </motion.div>
      ))}
      {/* Warm ambient glow */}
      <div style={{
        position: 'absolute', borderRadius: '50%',
        width: 280, height: 280,
        background: `radial-gradient(ellipse, ${T.orangeGlow} 0%, transparent 70%)`,
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        filter: 'blur(32px)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

/* ─── STAT CARD ─── */
function StatCard({ stat, index }) {
  return (
    <Reveal delay={index * 0.1}>
      <motion.div
        className="relative rounded-2xl p-8 text-center overflow-hidden"
        style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(28,25,23,0.05)' }}
        whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(232,98,42,0.12)' }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: T.orangeLight, border: `1px solid ${T.borderWarm}` }}>
          <stat.Icon width={22} height={22} color={T.orange} />
        </div>
        <p className="font-bold text-stone-800" style={{ fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1 }}>
          <AnimatedCounter end={stat.end} suffix={stat.suffix} />
        </p>
        <p style={{ fontSize: 12, color: T.textSecondary, marginTop: 8, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          {stat.label}
        </p>
        {/* Bottom accent line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-2xl"
          style={{ scaleX: 0, originX: 0, background: `linear-gradient(90deg, ${T.orange}, ${T.amber})` }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 + index * 0.12 }}
        />
      </motion.div>
    </Reveal>
  );
}

/* ─── STEP CARD ─── */
function StepCard({ step, index }) {
  const colors = [T.orange, T.green, T.amber];
  const lightBgs = [T.orangeLight, T.greenLight, T.amberLight];
  const color = colors[index % 3];
  const lightBg = lightBgs[index % 3];

  return (
    <Reveal delay={index * 0.12}>
      <motion.div
        className="relative h-full rounded-3xl overflow-hidden p-8"
        style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(28,25,23,0.04)' }}
        whileHover={{ y: -6, boxShadow: `0 20px 48px rgba(28,25,23,0.10)` }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {/* Step number watermark */}
        <span
          className="absolute top-6 right-6 font-black select-none"
          style={{ fontSize: 72, color: `${color}0D`, lineHeight: 1 }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        {/* Step badge */}
        <span style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: color, background: lightBg,
          padding: '4px 12px', borderRadius: 999, marginBottom: 20,
          border: `1px solid ${color}25`
        }}>
          Step {String(index + 1).padStart(2, '0')}
        </span>

        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: lightBg, border: `1px solid ${color}25` }}>
          <step.Icon width={22} height={22} color={color} />
        </div>

        <h3 className="font-bold text-stone-800 leading-snug mb-3" style={{ fontSize: 20 }}>
          {step.title}
        </h3>
        <p style={{ fontSize: 14.5, color: T.textSecondary, lineHeight: 1.72 }}>{step.desc}</p>

        {/* Bottom accent */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[3px]"
          style={{ scaleX: 0, originX: 0, background: color }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.35 + index * 0.12 }}
        />
      </motion.div>
    </Reveal>
  );
}

/* ─── FEATURE CARD ─── */
function FeatureCard({ feat, index }) {
  return (
    <Reveal delay={index * 0.07}>
      <motion.div
        className="relative rounded-2xl p-6 h-full group overflow-hidden"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
        whileHover={{ borderColor: T.borderWarm, y: -3, boxShadow: '0 12px 32px rgba(232,98,42,0.08)' }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(200px at 10% 50%, ${T.orangeGlow} 0%, transparent 100%)` }} />

        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 relative z-10"
          style={{ background: T.orangeLight, border: `1px solid ${T.borderWarm}` }}>
          <feat.Icon width={18} height={18} color={T.orange} />
        </div>

        <h3 className="font-semibold text-stone-800 mb-2 relative z-10" style={{ fontSize: 15 }}>
          {feat.title}
        </h3>
        <p style={{ fontSize: 13.5, color: T.textSecondary, lineHeight: 1.68 }} className="relative z-10">
          {feat.desc}
        </p>
      </motion.div>
    </Reveal>
  );
}

/* ─── TESTIMONIAL CARD ─── */
function TestimonialCard({ item, index }) {
  return (
    <Reveal delay={index * 0.1}>
      <motion.div
        className="relative rounded-3xl p-7 h-full"
        style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(28,25,23,0.04)' }}
        whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(28,25,23,0.09)' }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {/* Stars */}
        <div className="flex gap-1 mb-5">
          {[1, 2, 3, 4, 5].map(s => (
            <Icon.Star key={s} width={14} height={14} color={T.amber} />
          ))}
        </div>
        <p style={{ fontSize: 14.5, color: T.textPrimary, lineHeight: 1.72, fontStyle: 'italic', marginBottom: 20 }}>
          "{item.quote}"
        </p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
            style={{ background: `linear-gradient(135deg, ${T.orange}, ${T.amber})` }}>
            {item.name[0]}
          </div>
          <div>
            <p className="font-semibold text-stone-800" style={{ fontSize: 13 }}>{item.name}</p>
            <p style={{ fontSize: 11, color: T.textMuted }}>{item.role}</p>
          </div>
        </div>
      </motion.div>
    </Reveal>
  );
}

/* ══════════════════════════════════════════════
   MAIN LANDING PAGE
══════════════════════════════════════════════ */
export const LandingPage = () => {
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 600], [0, 60]);

  const stats = [
    { label: 'Donations Completed', end: 1245, suffix: '+', Icon: Icon.Heart },
    { label: 'Orphanages Supported', end: 48, suffix: '', Icon: Icon.Building },
    { label: 'Children Reached', end: 3800, suffix: '+', Icon: Icon.Users },
  ];

  const steps = [
    {
      title: 'Select & Donate',
      desc: 'Choose the items you want to donate — clothing, food, books, or toys. Even a small contribution of 3 or more items creates a meaningful impact for a child in need.',
      Icon: Icon.Heart,
    },
    {
      title: 'Smart Matching',
      desc: 'Our platform intelligently matches your donation to the orphanage with the highest need, ensuring every item reaches children who need it most.',
      Icon: Icon.Cpu,
    },
    {
      title: 'Verified Delivery',
      desc: 'A background-verified volunteer collects and delivers your donation, with full tracking from pickup to final handoff — giving you complete peace of mind.',
      Icon: Icon.Truck,
    },
  ];

  const features = [
    { title: 'Smart Donation Matching', desc: 'Advanced priority scoring matches your donation to orphanages with the most urgent needs.', Icon: Icon.Cpu },
    { title: 'Volunteer Verification', desc: 'Every volunteer undergoes background checks and face recognition for donor safety.', Icon: Icon.Shield },
    { title: 'Full Donation Tracking', desc: 'Track your donation from submission to final delivery with real-time status updates.', Icon: Icon.Truck },
    { title: 'Role-Based Dashboards', desc: 'Dedicated portals for donors, volunteers, and orphanage administrators.', Icon: Icon.BarChart },
    { title: 'Zero Platform Fees', desc: '100% of your donation value goes directly to children. No hidden charges, ever.', Icon: Icon.Heart },
    { title: 'Transparent Impact Reports', desc: 'See exactly how many lives your contribution touched, with detailed reports.', Icon: Icon.Users },
  ];

  const testimonials = [
    {
      quote: "I donated clothes last month. Within a day, a volunteer picked them up and I got a confirmation that 12 children received them. It felt amazing.",
      name: 'Priya Ramesh', role: 'Donor — Chennai',
    },
    {
      quote: "As a volunteer, Support Circle connects me with donors effortlessly. The verification process builds trust with everyone involved.",
      name: 'Karthik S.', role: 'Volunteer — Coimbatore',
    },
    {
      quote: "We receive timely donations that match our exact needs. This platform has transformed how we manage supplies for our 60 children.",
      name: 'Sister Anitha', role: 'St. Mary\'s Orphanage — Erode',
    },
  ];

  const trustBadges = ['Verified NGOs', 'SSL Secured', 'No Platform Fees', 'AI Powered'];

  return (
    <>
      <ScrollProgress />

      <div className="flex w-full flex-col" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

        {/* ═══════ HERO ═══════ */}
        <section
          ref={heroRef}
          className="relative overflow-hidden"
          style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center' }}
        >
          {/* Warm radial glow top-right */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse 60% 60% at 80% 10%, ${T.orangeGlow} 0%, transparent 65%)`
          }} />
          {/* Subtle warm glow bottom-left */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse 50% 50% at 10% 90%, ${T.greenGlow} 0%, transparent 65%)`
          }} />

          {/* Soft dot pattern */}
          <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025, pointerEvents: 'none' }}>
            <defs><pattern id="warm-dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#1C1917" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#warm-dots)" />
          </svg>

          <motion.div style={{ y: parallaxY }} className="mx-auto max-w-7xl px-6 lg:px-10 w-full relative z-10 py-24">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* LEFT — copy */}
              <div>
                {/* Live badge */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 mb-8"
                  style={{ background: T.greenLight, border: `1px solid rgba(45,155,111,0.25)` }}
                >
                  <PulseDot color={T.green} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.green, letterSpacing: '0.02em' }}>
                    Donations delivered daily · Live platform
                  </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="font-bold"
                  style={{
                    fontSize: 'clamp(2.6rem, 5.5vw, 4rem)',
                    lineHeight: 1.08,
                    color: T.textPrimary,
                    letterSpacing: '-0.028em',
                  }}
                >
                  Every child deserves{' '}
                  <span style={{
                    backgroundImage: `linear-gradient(135deg, ${T.orange} 20%, ${T.amber} 80%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    care & kindness.
                  </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  style={{ marginTop: 22, fontSize: 17, color: T.textSecondary, lineHeight: 1.78, maxWidth: 480 }}
                >
                  Support Circle connects compassionate donors with verified orphanages and
                  trusted volunteers — making sure every donation reaches a child who needs it most.
                </motion.p>

                {/* CTA row */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
                  style={{ marginTop: 36, display: 'flex', flexWrap: 'wrap', gap: 12 }}
                >
                  <Link to="/donor/donate">
                    <motion.button
                      id="hero-donate-btn"
                      whileHover={{ scale: 1.03, boxShadow: `0 12px 32px rgba(232,98,42,0.35)` }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: '14px 32px', borderRadius: 14,
                        fontWeight: 700, fontSize: 15,
                        color: '#fff', cursor: 'pointer',
                        background: `linear-gradient(135deg, ${T.orange}, #D4541E)`,
                        boxShadow: `0 6px 20px rgba(232,98,42,0.30)`,
                        border: 'none', outline: 'none',
                        letterSpacing: '0.01em',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <Icon.Heart width={17} height={17} color="#fff" />
                      Donate Now
                    </motion.button>
                  </Link>
                  <Link to="/auth/register/orphanage">
                    <motion.button
                      id="hero-register-orphanage-btn"
                      whileHover={{ scale: 1.03, background: T.orangeLight, borderColor: T.orange }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: '14px 28px', borderRadius: 14,
                        fontWeight: 600, fontSize: 15,
                        color: T.textPrimary, cursor: 'pointer',
                        background: T.surface,
                        border: `1.5px solid ${T.border}`,
                        outline: 'none',
                        transition: 'all 0.2s',
                        letterSpacing: '0.01em',
                      }}
                    >
                      Register Orphanage
                    </motion.button>
                  </Link>
                </motion.div>

                {/* Trust strip */}
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.55 }}
                  style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: '6px 20px' }}
                >
                  {trustBadges.map((t) => (
                    <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: T.textSecondary, fontWeight: 500 }}>
                      <Icon.Check width={13} height={13} color={T.green} />
                      {t}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* RIGHT — warm hero visual */}
              <div className="hidden lg:flex justify-center items-center">
                <HeroVisual />
              </div>
            </div>
          </motion.div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{ height: 100, background: `linear-gradient(to bottom, transparent, ${T.bg})` }} />
        </section>

        {/* ═══════ IMPACT STATS ═══════ */}
        <section style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
          <div className="mx-auto max-w-5xl px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {stats.map((s, i) => <StatCard key={s.label} stat={s} index={i} />)}
            </div>
          </div>
        </section>

        {/* ═══════ COMMUNITY IMPACT BANNER ═══════ */}
        <section style={{ background: `linear-gradient(135deg, ${T.orange} 0%, #D4541E 40%, #C44B1A 100%)` }} className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="mx-auto max-w-5xl px-6 lg:px-10 py-16 relative z-10 text-center">
            <Reveal>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.4, maxWidth: 680, margin: '0 auto' }}>
                "Small acts of kindness, when multiplied by thousands of people, can transform the world."
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 12, fontStyle: 'italic' }}>— The spirit of Support Circle</p>
            </Reveal>
          </div>
        </section>

        {/* ═══════ HOW IT WORKS ═══════ */}
        <section className="relative overflow-hidden" style={{ background: T.bgAlt }}>
          <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025, pointerEvents: 'none' }}>
            <defs><pattern id="ldots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="#1C1917" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#ldots)" />
          </svg>

          <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 relative z-10">
            <Reveal>
              <div style={{ maxWidth: 580, marginBottom: 52 }}>
                <span style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: T.orange, background: T.orangeLight,
                  padding: '5px 14px', borderRadius: 999, marginBottom: 16, border: `1px solid ${T.borderWarm}`,
                }}>
                  How It Works
                </span>
                <h2 className="font-bold text-stone-800" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', lineHeight: 1.13, letterSpacing: '-0.022em' }}>
                  Simple, transparent, and impactful giving
                </h2>
                <p style={{ marginTop: 14, fontSize: 15.5, color: T.textSecondary, lineHeight: 1.72 }}>
                  From your doorstep to a child's hands — every step is tracked, verified, and fully accountable.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {steps.map((step, i) => <StepCard key={step.title} step={step} index={i} />)}
            </div>
          </div>
        </section>

        {/* ═══════ TESTIMONIALS ═══════ */}
        <section style={{ background: T.surface }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24">
            <Reveal>
              <div className="text-center mb-14">
                <span style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: T.green, background: T.greenLight,
                  padding: '5px 14px', borderRadius: 999, marginBottom: 16, border: `1px solid rgba(45,155,111,0.2)`,
                }}>
                  What People Say
                </span>
                <h2 className="font-bold text-stone-800" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', lineHeight: 1.14, letterSpacing: '-0.022em' }}>
                  Stories of real impact
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {testimonials.map((t, i) => <TestimonialCard key={t.name} item={t} index={i} />)}
            </div>
          </div>
        </section>

        {/* ═══════ PLATFORM FEATURES ═══════ */}
        <section className="relative overflow-hidden" style={{ background: T.bgAlt }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 relative z-10">
            <Reveal>
              <div className="text-center" style={{ maxWidth: 560, margin: '0 auto 52px' }}>
                <span style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: T.orange, background: T.orangeLight,
                  padding: '5px 14px', borderRadius: 999, marginBottom: 16, border: `1px solid ${T.borderWarm}`,
                }}>
                  Platform Features
                </span>
                <h2 className="font-bold text-stone-800" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', lineHeight: 1.13, letterSpacing: '-0.022em' }}>
                  Built for trust.{' '}
                  <span style={{
                    backgroundImage: `linear-gradient(135deg, ${T.orange} 20%, ${T.amber} 80%)`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>
                    Driven by heart.
                  </span>
                </h2>
                <p style={{ marginTop: 14, fontSize: 15, color: T.textSecondary, lineHeight: 1.72 }}>
                  Every feature is designed to make giving safe, transparent, and deeply meaningful.
                </p>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f, i) => <FeatureCard key={f.title} feat={f} index={i} />)}
            </div>
          </div>
        </section>

        {/* ═══════ CTA ═══════ */}
        <section className="relative overflow-hidden" style={{ background: T.bg }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse 70% 70% at 50% 50%, ${T.orangeGlow} 0%, transparent 70%)`
          }} />

          <div className="mx-auto max-w-3xl px-6 text-center py-28 relative z-10">
            <Reveal>
              {/* Big Icon */}
              <motion.div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
                style={{ background: T.orangeLight, border: `1px solid ${T.borderWarm}`, boxShadow: `0 12px 32px rgba(232,98,42,0.15)` }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Icon.Heart width={36} height={36} color={T.orange} />
              </motion.div>

              <h2 className="font-bold text-stone-800" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.1rem)', lineHeight: 1.11, letterSpacing: '-0.025em' }}>
                Ready to make a{' '}
                <span style={{
                  backgroundImage: `linear-gradient(135deg, ${T.orange} 20%, ${T.amber} 80%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  child smile today?
                </span>
              </h2>

              <p style={{ marginTop: 18, fontSize: 16, color: T.textSecondary, lineHeight: 1.75, maxWidth: 460, margin: '18px auto 0' }}>
                Join thousands of compassionate donors, dedicated volunteers, and supported orphanages — all united under one platform.
              </p>

              <div style={{ marginTop: 38, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                <Link to="/donor/donate">
                  <motion.button
                    id="cta-donate-btn"
                    whileHover={{ scale: 1.04, boxShadow: `0 16px 40px rgba(232,98,42,0.35)` }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '14px 32px', borderRadius: 14,
                      fontWeight: 700, fontSize: 15,
                      color: '#fff', cursor: 'pointer',
                      background: `linear-gradient(135deg, ${T.orange}, #D4541E)`,
                      boxShadow: `0 6px 20px rgba(232,98,42,0.28)`,
                      border: 'none', outline: 'none',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <Icon.Heart width={16} height={16} color="#fff" />
                    Start Donating
                  </motion.button>
                </Link>
                <Link to="/auth/register/volunteer">
                  <motion.button
                    id="cta-volunteer-btn"
                    whileHover={{ scale: 1.04, background: T.greenLight, borderColor: T.green }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '14px 28px', borderRadius: 14,
                      fontWeight: 600, fontSize: 15,
                      color: T.textPrimary, cursor: 'pointer',
                      background: T.surface, border: `1.5px solid ${T.border}`,
                      outline: 'none', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <Icon.Users width={16} height={16} color={T.green} />
                    Become a Volunteer
                  </motion.button>
                </Link>
              </div>

              {/* Social proof mini row */}
              <div style={{
                marginTop: 56, paddingTop: 28,
                borderTop: `1px solid ${T.border}`,
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
              }}>
                {[
                  { n: '48', l: 'Orphanages' },
                  { n: '1,200+', l: 'Volunteers' },
                  { n: '3,800+', l: 'Children Helped' },
                ].map((item) => (
                  <div key={item.l}>
                    <p className="font-bold text-stone-800" style={{ fontSize: 28, letterSpacing: '-0.025em' }}>{item.n}</p>
                    <p style={{ fontSize: 11, color: T.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{item.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

      </div>
    </>
  );
};
