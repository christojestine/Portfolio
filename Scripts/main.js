// main.js — Futuristic scroll-driven animations (Lenis + GSAP + Three.js)

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Smooth scroll (Lenis) ───────────────────────────────────────────────────
let lenis = null;

if (!prefersReducedMotion && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.5,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
}

// ─── Custom cursor ───────────────────────────────────────────────────────────
const cursor = document.querySelector('.cursor');
const cursorTrail = document.querySelector('.cursor-trail');

if (cursor && !prefersReducedMotion) {
    let cursorX = 0;
    let cursorY = 0;
    let trailX = 0;
    let trailY = 0;

    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
    });

    gsap.ticker.add(() => {
        gsap.set(cursor, { x: cursorX, y: cursorY });
        trailX += (cursorX - trailX) * 0.15;
        trailY += (cursorY - trailY) * 0.15;
        if (cursorTrail) gsap.set(cursorTrail, { x: trailX, y: trailY });
    });

    const scaleCursor = (scale, borderColor) => {
        gsap.to(cursor, {
            scale,
            borderColor: borderColor || 'var(--accent-neon)',
            duration: 0.35,
            ease: 'power3.out',
        });
    };

    document.addEventListener('mousedown', () => scaleCursor(0.6));
    document.addEventListener('mouseup', () => scaleCursor(1));

    document.querySelectorAll('a, .btn, .project-card, .skill-tag, .glass-card').forEach((el) => {
        el.addEventListener('mouseenter', () => scaleCursor(2, 'var(--accent-glow)'));
        el.addEventListener('mouseleave', () => scaleCursor(1));
    });
}

// ─── GSAP core ─────────────────────────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.config({
    limitCallbacks: true,
    ignoreMobileResize: true,
});

if (lenis) {
    ScrollTrigger.scrollerProxy(document.documentElement, {
        scrollTop(value) {
            if (arguments.length) lenis.scrollTo(value, { immediate: true });
            return lenis.scroll;
        },
        getBoundingClientRect() {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
    });

    lenis.on('scroll', () => document.body.classList.add('is-scrolling'));
    lenis.on('scrollend', () => {
        document.body.classList.remove('is-scrolling');
        ScrollTrigger.refresh();
    });
}

// ─── Utilities ─────────────────────────────────────────────────────────────────
function splitTextToChars(element) {
    const text = element.textContent.trim();
    element.textContent = '';
    return [...text].map((char) => {
        const span = document.createElement('span');
        span.className = 'hero-char';
        span.textContent = char === ' ' ? '\u00A0' : char;
        element.appendChild(span);
        return span;
    });
}

function wrapRevealElements(selector, childSelector) {
    document.querySelectorAll(selector).forEach((parent) => {
        const targets = childSelector ? parent.querySelectorAll(childSelector) : [parent];
        targets.forEach((el) => {
            if (el.closest('.reveal-mask')) return;
            const mask = document.createElement('div');
            mask.className = 'reveal-mask';
            el.classList.add('reveal-item');
            el.parentNode.insertBefore(mask, el);
            mask.appendChild(el);
        });
    });
}

// ─── Scroll progress bar ───────────────────────────────────────────────────────
const progressBar = document.querySelector('.scroll-progress-bar');

if (progressBar) {
    gsap.to(progressBar, {
        width: '100%',
        ease: 'none',
        scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.3,
        },
    });
}

// ─── Navbar scroll state ───────────────────────────────────────────────────────
const navbar = document.querySelector('.navbar');

ScrollTrigger.create({
    start: 80,
    onUpdate: (self) => navbar?.classList.toggle('is-scrolled', self.scroll() > 80),
});

// ─── Section theme flow (background shifts between sections) ─────────────────
const themedSections = document.querySelectorAll('section[data-theme]');

themedSections.forEach((section) => {
    ScrollTrigger.create({
        trigger: section,
        start: 'top 55%',
        end: 'bottom 45%',
        onEnter: () => document.body.setAttribute('data-theme', section.dataset.theme),
        onEnterBack: () => document.body.setAttribute('data-theme', section.dataset.theme),
    });
});

document.body.setAttribute('data-theme', 'cyan');

// ─── Nav active indicator ──────────────────────────────────────────────────────
const navLinks = document.querySelectorAll('.nav-links a');
const navIndicator = document.querySelector('.nav-indicator');

function updateNavIndicator(activeLink) {
    if (!navIndicator || !activeLink) return;
    const linkRect = activeLink.getBoundingClientRect();
    const navRect = activeLink.closest('.navbar').getBoundingClientRect();
    gsap.to(navIndicator, {
        left: linkRect.left - navRect.left,
        width: linkRect.width,
        duration: 0.5,
        ease: 'power3.out',
    });
    navIndicator.classList.add('is-visible');
}

function smoothScrollTo(target, offset = -80) {
    if (!target) return;
    if (lenis) {
        lenis.scrollTo(target, { offset, duration: 1.8 });
    } else {
        target.scrollIntoView({ behavior: 'smooth' });
    }
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;

    link.addEventListener('click', (e) => {
        e.preventDefault();
        smoothScrollTo(target);
    });
});

navLinks.forEach((link) => {
    const section = document.getElementById(link.getAttribute('href').slice(1));
    if (!section) return;

    ScrollTrigger.create({
        trigger: section,
        start: 'top 50%',
        end: 'bottom 50%',
        onEnter: () => {
            navLinks.forEach((l) => l.classList.remove('is-active'));
            link.classList.add('is-active');
            updateNavIndicator(link);
        },
        onEnterBack: () => {
            navLinks.forEach((l) => l.classList.remove('is-active'));
            link.classList.add('is-active');
            updateNavIndicator(link);
        },
    });
});

// ─── Hero entrance ─────────────────────────────────────────────────────────────
const heroTitle = document.querySelector('.hero-title .char-wrap');
let heroChars = [];

if (heroTitle) {
    heroChars = splitTextToChars(heroTitle);
}

const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });

heroTl
    .from('.navbar', { y: -40, opacity: 0, duration: 1.1 })
    .from('.subtitle', { y: 30, opacity: 0, duration: 0.9 }, '-=0.7')
    .from(
        heroChars.length ? heroChars : '.glitch-text',
        {
            y: 80,
            opacity: 0,
            rotateX: -40,
            stagger: { each: 0.03, from: 'center' },
            duration: 1,
            ease: 'power4.out',
        },
        '-=0.6'
    )
    .from('.description', { y: 24, opacity: 0, duration: 0.8 }, '-=0.5')
    .from('.hero-cta .btn', { y: 20, opacity: 0, stagger: 0.12, duration: 0.7 }, '-=0.5');

// Periodic glitch on hero title
const glitchEl = document.querySelector('.glitch-text');
if (glitchEl && !prefersReducedMotion) {
    const triggerGlitch = () => {
        glitchEl.classList.add('is-glitching');
        setTimeout(() => glitchEl.classList.remove('is-glitching'), 350);
    };
    setInterval(triggerGlitch, 4500);
    setTimeout(triggerGlitch, 2000);
}

// ─── Section headers — coordinated reveal ──────────────────────────────────────
document.querySelectorAll('.section-header').forEach((header) => {
    const index = header.querySelector('.section-index');
    const title = header.querySelector('.section-title, h2');
    const line = header.querySelector('.line');

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: header,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
        },
    });

    if (index) tl.from(index, { x: -20, opacity: 0, duration: 0.6 });
    if (title) tl.from(title, { y: 40, opacity: 0, duration: 0.9 }, '-=0.35');
    if (line) {
        tl.to(line, { width: 80, duration: 1, ease: 'power3.inOut' }, '-=0.5');
    }
});

// ─── Section content reveals ───────────────────────────────────────────────────
const revealSections = [
    { section: '#about', items: '.about-text p, .certifications, .skills-container h3, .skill-tag' },
    { section: '#publications', items: '.publication-card' },
    { section: '#contact', items: '.contact-content > *' },
];

revealSections.forEach(({ section, items }) => {
    const root = document.querySelector(section);
    if (!root) return;

    gsap.utils.toArray(items, root).forEach((el, i) => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none reverse',
            },
            y: 50,
            opacity: 0,
            duration: 0.9,
            delay: (i % 4) * 0.05,
            ease: 'power3.out',
        });
    });
});

// Glass panels — scale + fade with clip feel
document.querySelectorAll('.glass-panel').forEach((panel) => {
    gsap.from(panel, {
        scrollTrigger: {
            trigger: panel,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
        },
        y: 60,
        opacity: 0,
        scale: 0.98,
        duration: 1.1,
        ease: 'power3.out',
    });
});

// ─── Timeline — scroll-linked progress + staggered cards ───────────────────────
const timeline = document.querySelector('.timeline');
const timelineProgress = document.querySelector('.timeline-progress');

if (timeline && timelineProgress) {
    gsap.to(timelineProgress, {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
            trigger: timeline,
            start: 'top 70%',
            end: 'bottom 80%',
            scrub: 0.5,
        },
    });
}

gsap.from('.timeline-item', {
    scrollTrigger: {
        trigger: '.timeline',
        start: 'top 72%',
    },
    x: -60,
    opacity: 0,
    duration: 1,
    stagger: {
        each: 0.18,
        ease: 'power2.out',
    },
    ease: 'power3.out',
});

gsap.utils.toArray('.timeline-dot').forEach((dot) => {
    gsap.from(dot, {
        scrollTrigger: {
            trigger: dot,
            start: 'top 85%',
        },
        scale: 0,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(2)',
    });
});

// ─── Projects — staggered grid with subtle 3D tilt on scroll ───────────────────
gsap.from('.project-card', {
    scrollTrigger: {
        trigger: '.project-carousel',
        start: 'top 78%',
    },
    y: 70,
    opacity: 0,
    rotateX: 8,
    transformPerspective: 800,
    duration: 0.95,
    stagger: {
        each: 0.1,
        grid: 'auto',
        from: 'start',
    },
    ease: 'power3.out',
});

document.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('mouseenter', () => card.classList.add('is-hovered'));
    card.addEventListener('mouseleave', () => card.classList.remove('is-hovered'));

    if (prefersReducedMotion) return;

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, {
            rotateY: x * 10,
            rotateX: -y * 10,
            transformPerspective: 600,
            duration: 0.4,
            ease: 'power2.out',
        });
    });

    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.6,
            ease: 'power3.out',
        });
    });
});

// ─── Parallax AI background layers on scroll ───────────────────────────────────
if (!prefersReducedMotion) {
    const parallaxLayers = [
        { el: '.orb-1', y: -140 },
        { el: '.orb-2', y: 120 },
        { el: '.orb-3', y: -80 },
        { el: '.ai-aurora-1', y: -60 },
        { el: '.ai-aurora-2', y: 40 },
        { el: '.ai-nucleus', y: -30 },
        { el: '.cyber-grid', y: 80, bg: true },
        { el: '.ai-perspective-grid', y: 120, bg: true },
    ];

    parallaxLayers.forEach(({ el, y, bg }) => {
        const target = document.querySelector(el);
        if (!target) return;
        const anim = bg ? { backgroundPosition: `${y}px ${y}px` } : { y };
        gsap.to(target, {
            ...anim,
            ease: 'none',
            scrollTrigger: { scrub: 1.5, start: 'top top', end: 'bottom bottom' },
        });
    });
}

// ─── Magnetic buttons ────────────────────────────────────────────────────────────
document.querySelectorAll('.btn').forEach((btn) => {
    if (prefersReducedMotion) return;

    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, {
            x: x * 0.25,
            y: y * 0.25,
            duration: 0.3,
            ease: 'power2.out',
        });
    });

    btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    });
});

// Refresh ScrollTrigger after fonts/layout settle
window.addEventListener('load', () => {
    ScrollTrigger.refresh();
});
