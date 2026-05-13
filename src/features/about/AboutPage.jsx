import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

/* ─── DESIGN TOKENS (Warm Charity Theme) ─── */
const T = {
  orange:       '#E8622A',
  orangeDark:   '#D4541E',
  orangeGlow:   'rgba(232,98,42,0.12)',
  orangeLight:  '#FFF0EA',
  borderWarm:   'rgba(232,98,42,0.18)',
  green:        '#2D9B6F',
  greenLight:   '#EEFAF4',
  amber:        '#F4A135',
  bg:           '#FFFDF9',
  bgAlt:        '#FFF8F3',
  surface:      '#FFFFFF',
  surfaceMid:   '#FFF5EE',
  border:       'rgba(28,25,23,0.08)',
  textPrimary:  '#1C1917',
  textSecondary:'#78716C',
  lightBg:      '#FFF8F3',
  lightBorder:  'rgba(28,25,23,0.08)',
  navy:         '#1C1917',
};

/* ─── DOT GRID ─── */
function DotGrid({ dark = true, opacity = 0.04 }) {
  const fill = dark ? '#ffffff' : '#0F172A';
  return (
    <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, pointerEvents: 'none' }}>
      <defs>
        <pattern id={`dots-${dark}`} width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill={fill} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#dots-${dark})`} />
    </svg>
  );
}

/* ─── SCROLL PROGRESS ─── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 36 });
  return (
    <motion.div
      style={{
        scaleX, position: 'fixed', top: 0, left: 0, right: 0,
        height: 2, background: `linear-gradient(90deg, ${T.blue}, ${T.emerald})`,
        transformOrigin: '0%', zIndex: 9999,
      }}
    />
  );
}

/* ─── 3D TILT CARD ─── */
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
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: sx, rotateY: sy, transformStyle: 'preserve-3d', willChange: 'transform' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── REVEAL ─── */
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

/* ─── PULSE DOT ─── */
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

/* ─── SVG ICONS ─── */
const Icon = {
  Target:   (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>,
  Eye:      (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Cpu:      (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M9 7V5M12 7V5M15 7V5M9 19v-2M12 19v-2M15 19v-2M7 9H5M7 12H5M7 15H5M19 9h-2M19 12h-2M19 15h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Shield:   (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M12 22s-8-4-8-11V5l8-3 8 3v6c0 7-8 11-8 11z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Users:    (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M23 21v-2c0-1.9-1.1-3.4-2.7-4M16 3a4 4 0 0 1 0 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Heart:    (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M12 21s-9-6.5-9-12.5C3 5.4 5.4 3 8.5 3c1.7 0 3.3.8 3.5 2 .2-1.2 1.8-2 3.5-2C18.6 3 21 5.4 21 8.5 21 14.5 12 21 12 21z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  Globe:    (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Award:    (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M15.5 21.5 12 19l-3.5 2.5 1-4.5-3.5-3h4.5L12 10l1.5 4h4.5l-3.5 3 1 4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  ArrowRight: (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

/* ─── TIMELINE ITEM ─── */
function TimelineItem({ item, index, last }) {
  return (
    <Reveal delay={index * 0.1}>
      <div style={{ display: 'flex', gap: 24 }}>
        {/* Line + dot */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 + index * 0.1, type: 'spring' }}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: T.blueGlow,
              border: `1px solid rgba(79,126,250,0.3)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              zIndex: 1,
            }}
          >
            <item.Icon width={16} height={16} color={T.blue} />
          </motion.div>
          {!last && (
            <motion.div
              style={{ width: 1, flex: 1, minHeight: 40, background: T.border, marginTop: 8 }}
              initial={{ scaleY: 0, originY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
            />
          )}
        </div>

        {/* Content */}
        <TiltCard intensity={5} className="flex-1 pb-10">
          <motion.div
            className="rounded-2xl p-6"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
            }}
            whileHover={{ borderColor: 'rgba(79,126,250,0.28)', y: -3 }}
            transition={{ duration: 0.2 }}
          >
            <span
              style={{ fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: '0.12em', textTransform: 'uppercase' }}
            >
              {item.year}
            </span>
            <h3
              className="font-display font-bold"
              style={{ fontSize: 18, color: T.textPrimary, marginTop: 6, letterSpacing: '-0.01em' }}
            >
              {item.title}
            </h3>
            <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.7, marginTop: 8 }}>
              {item.desc}
            </p>
          </motion.div>
        </TiltCard>
      </div>
    </Reveal>
  );
}

/* ═══════════════════════════════════════
   ABOUT PAGE
═══════════════════════════════════════ */
export const AboutPage = () => {
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 400], [0, 60]);

  const values = [
    { title: 'Our Mission',  Icon: Icon.Target, desc: 'We believe every child deserves access to basic essentials — clothing, books, toys, and food. Support Circle exists to ensure contributions are intelligently allocated and securely delivered to where they matter most.' },
    { title: 'Our Vision',   Icon: Icon.Eye,    desc: 'A world where no orphanage goes under-resourced, and no donation goes to waste. We envision a fully transparent, AI-driven supply chain between generosity and genuine need.' },
    { title: 'Our Impact',   Icon: Icon.Award,  desc: 'Since launch, Support Circle has served 48 verified orphanages, facilitated over 1,200 donations, and helped reach more than 3,800 children across multiple districts.' },
  ];

  const differentiators = [
    { title: 'AI Priority Scoring',      Icon: Icon.Cpu,    desc: 'Our custom algorithm evaluates urgency, beneficiary count, and inventory deficit to route donations with maximum fairness and speed.' },
    { title: 'Biometric Verification',   Icon: Icon.Shield, desc: 'Face recognition onboarding for volunteers and digital signatures on every delivery create an unbroken chain of custody.' },
    { title: 'Real-Time Dashboards',     Icon: Icon.Globe,  desc: 'Every stakeholder — donor, volunteer, orphanage — gets a live view of their contributions, assignments, and impact metrics.' },
    { title: 'Community of Care',        Icon: Icon.Users,  desc: 'A growing network of vetted volunteers and compassionate donors united by a single purpose: children\'s welfare.' },
  ];

  const timeline = [
    { year: 'Foundation',   title: 'Platform Conceived',         desc: 'Support Circle started as a final-year engineering project aimed at solving real resource-allocation inefficiencies in the NGO sector.',  Icon: Icon.Heart },
    { year: 'Development',  title: 'AI Scoring Engine Built',     desc: 'We developed and trained our proprietary Priority Scoring model using real orphanage data, achieving 94% allocation accuracy.',           Icon: Icon.Cpu },
    { year: 'Beta Launch',  title: 'First 10 Orphanages Onboard', desc: 'Our closed beta served 10 orphanages, processed 120 donations, and proved the platform\'s end-to-end viability.',                        Icon: Icon.Globe },
    { year: 'Today',        title: '48 Orphanages & 3,800+ Kids', desc: 'Support Circle now operates at scale with a verified volunteer fleet, biometric delivery confirmation, and live impact dashboards.',     Icon: Icon.Award },
  ];

  return (
    <>
      <ScrollProgress />

      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

        {/* ── HERO ── */}
        <section
          style={{
            background: T.bg,
            position: 'relative',
            overflow: 'hidden',
            paddingTop: 100,
            paddingBottom: 100,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <DotGrid dark opacity={0.04} />
          <div
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `radial-gradient(ellipse 70% 60% at 50% 0%, rgba(79,126,250,0.12) 0%, transparent 65%)`,
            }}
          />
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 100, pointerEvents: 'none',
              background: `linear-gradient(to bottom, transparent, ${T.bg})`,
            }}
          />

          <motion.div
            style={{ y: parallaxY, maxWidth: 896, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10, textAlign: 'center' }}
          >
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
                Our Story
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="font-display font-bold"
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
                lineHeight: 1.08,
                color: T.textPrimary,
                letterSpacing: '-0.025em',
              }}
            >
              Built with purpose.{' '}
              <span
                style={{
                  backgroundImage: `linear-gradient(135deg, ${T.orange} 20%, ${T.amber} 85%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Driven by compassion.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ marginTop: 20, fontSize: 16.5, color: T.textSecondary, lineHeight: 1.75, maxWidth: 560, margin: '20px auto 0' }}
            >
              Support Circle is an AI-powered platform bridging the gap between donors with
              surplus resources and orphanages with critical needs — with full transparency
              and accountability at every step.
            </motion.p>
          </motion.div>
        </section>

        {/* ── 3 VALUES CARDS ── */}
        <section style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '72px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {values.map((v, i) => (
                <Reveal key={v.title} delay={i * 0.1}>
                  <TiltCard intensity={7}>
                    <div
                      style={{
                        background: T.surfaceMid,
                        border: `1px solid ${T.border}`,
                        borderRadius: 20,
                        padding: '28px 24px',
                        position: 'relative',
                        overflow: 'hidden',
                        height: '100%',
                      }}
                    >
                      {/* Top shimmer */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                        background: `linear-gradient(90deg, transparent, ${T.blue}55, transparent)`,
                      }} />

                      <div style={{
                        width: 40, height: 40, borderRadius: 12, marginBottom: 20,
                        background: T.blueGlow, border: `1px solid rgba(79,126,250,0.2)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <v.Icon width={18} height={18} color={T.blue} />
                      </div>

                      <h3 className="font-display font-bold" style={{ fontSize: 18, color: T.textPrimary, marginBottom: 10, letterSpacing: '-0.01em' }}>
                        {v.title}
                      </h3>
                      <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.72 }}>{v.desc}</p>

                      <motion.div
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, scaleX: 0, originX: 0, background: T.blue }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.12 }}
                      />
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW WE'RE DIFFERENT ── */}
        <section style={{ background: '#F9FAFB', position: 'relative', overflow: 'hidden' }}>
          <DotGrid dark={false} opacity={0.035} />

          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '88px 24px', position: 'relative', zIndex: 10 }}>
            <Reveal>
              <div style={{ maxWidth: 520, marginBottom: 56 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Differentiators
                </p>
                <h2 className="font-display font-bold text-navy" style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.8rem)', lineHeight: 1.12, letterSpacing: '-0.02em' }}>
                  What makes us different
                </h2>
                <p style={{ marginTop: 14, fontSize: 15, color: '#64748B', lineHeight: 1.72 }}>
                  We didn't just build a donation portal. We engineered a full accountability
                  layer from pledge to confirmed receipt.
                </p>
              </div>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {differentiators.map((d, i) => (
                <Reveal key={d.title} delay={i * 0.08}>
                  <TiltCard intensity={6}>
                    <motion.div
                      style={{
                        background: '#FFFFFF',
                        border: `1px solid ${T.lightBorder}`,
                        borderRadius: 20,
                        padding: '24px',
                        height: '100%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      whileHover={{ y: -4, boxShadow: '0 20px 48px rgba(0,0,0,0.09)' }}
                      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, marginBottom: 16,
                        background: T.blueGlow, border: `1px solid rgba(79,126,250,0.18)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <d.Icon width={18} height={18} color={T.blue} />
                      </div>

                      <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{d.title}</h3>
                      <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.68 }}>{d.desc}</p>

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

        {/* ── TIMELINE ── */}
        <section style={{ background: T.bg, position: 'relative', overflow: 'hidden' }}>
          <DotGrid dark opacity={0.04} />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 200, pointerEvents: 'none',
            background: `radial-gradient(ellipse 60% 80% at 50% 0%, ${T.blueGlow} 0%, transparent 100%)`,
          }} />

          <div style={{ maxWidth: 720, margin: '0 auto', padding: '88px 24px', position: 'relative', zIndex: 10 }}>
            <Reveal>
              <div style={{ marginBottom: 56 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Journey
                </p>
                <h2 className="font-display font-bold" style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.8rem)', lineHeight: 1.12, color: T.textPrimary, letterSpacing: '-0.02em' }}>
                  Our story so far
                </h2>
              </div>
            </Reveal>

            <div>
              {timeline.map((item, i) => (
                <TimelineItem key={item.title} item={item} index={i} last={i === timeline.length - 1} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ background: '#F9FAFB', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, ${T.blue}80, transparent)`,
          }} />

          <div style={{ maxWidth: 640, margin: '0 auto', padding: '88px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <Reveal>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
                Get Involved
              </p>
              <h2 className="font-display font-bold" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.025em', color: T.textPrimary }}>
                Be part of the{' '}
                <span style={{ backgroundImage: `linear-gradient(135deg, ${T.orange} 20%, ${T.amber} 85%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  solution.
                </span>
              </h2>
              <p style={{ marginTop: 16, fontSize: 15.5, color: '#64748B', lineHeight: 1.72 }}>
                Whether you donate, volunteer, or register an orphanage — every role in our
                ecosystem has direct, traceable impact on children's lives.
              </p>

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
                <Link to="/donor/donate">
                  <motion.button
                    whileHover={{ scale: 1.025, boxShadow: `0 14px 32px rgba(232,98,42,0.38)` }}
                    whileTap={{ scale: 0.975 }}
                    style={{
                      padding: '12px 26px', borderRadius: 12, fontWeight: 700, fontSize: 14,
                      color: '#fff',
                      background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`,
                      border: 'none', cursor: 'pointer', outline: 'none',
                      boxShadow: `0 6px 20px rgba(232,98,42,0.30)`,
                      letterSpacing: '0.01em',
                    }}
                  >
                    Donate Now
                  </motion.button>
                </Link>
                <Link to="/auth/register/volunteer">
                  <motion.button
                    whileHover={{ scale: 1.025 }}
                    whileTap={{ scale: 0.975 }}
                    style={{
                      padding: '12px 26px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                      color: T.navy, background: 'transparent', border: `1px solid rgba(15,23,42,0.14)`,
                      cursor: 'pointer', outline: 'none', letterSpacing: '0.01em',
                    }}
                  >
                    Become a Volunteer
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
