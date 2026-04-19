export default function Home() {
  return (
    <>
      <style>{`
        /* Google Font: Space Grotesk — modern geometric sans-serif */
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&display=swap');

        /* Reset the Next.js wrapper so the page fills the viewport with no scroll */
        html, body { height: 100%; margin: 0; overflow: hidden; background: #0a0a0a; }
        body > div, main { display: contents; }

        :root {
          --bg: #0a0a0a;            /* near-black base */
          --accent: #ff1f3d;         /* electric red */
          --accent-soft: #ff4d66;    /* softer red for layered glow */
          --ink: #f5f5f5;            /* text */
        }

        .stage {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: var(--bg);
          color: var(--ink);
          font-family: 'Space Grotesk', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          overflow: hidden;
          isolation: isolate; /* keep blend/overlay stacks local */
        }

        /* Full-bleed hero image */
        .hero {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
          /* subtle desaturation + darken so the red palette dominates */
          filter: saturate(0.85) brightness(0.7) contrast(1.05);
        }

        /* Vignette: transparent center → dark edges for depth and focus */
        .vignette {
          position: absolute;
          inset: 0;
          z-index: 1;
          background:
            radial-gradient(ellipse at center,
              rgba(10,10,10,0.0) 0%,
              rgba(10,10,10,0.55) 55%,
              rgba(10,10,10,0.95) 100%);
          pointer-events: none;
        }

        /* Grain / noise overlay — SVG data URI, ~5% opacity */
        .grain {
          position: absolute;
          inset: -50%;
          z-index: 4;
          opacity: 0.05;
          pointer-events: none;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
          animation: grain 1.2s steps(6) infinite;
        }

        @keyframes grain {
          0%   { transform: translate(0,0); }
          20%  { transform: translate(-3%, 2%); }
          40%  { transform: translate(2%, -3%); }
          60%  { transform: translate(-2%, 3%); }
          80%  { transform: translate(3%, -2%); }
          100% { transform: translate(0,0); }
        }

        /* Tasteful scanlines for the electric vibe */
        .scanlines {
          position: absolute;
          inset: 0;
          z-index: 5;
          pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.03) 0px,
            rgba(255,255,255,0.03) 1px,
            transparent 1px,
            transparent 3px
          );
          mix-blend-mode: overlay;
          opacity: 0.5;
        }

        /* Very subtle global flicker */
        .stage::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 6;
          pointer-events: none;
          background: rgba(255, 31, 61, 0.02);
          animation: flicker 5.5s infinite;
        }

        @keyframes flicker {
          0%, 100%  { opacity: 0.6; }
          48%       { opacity: 0.6; }
          50%       { opacity: 0.25; }
          52%       { opacity: 0.6; }
          84%       { opacity: 0.6; }
          86%       { opacity: 0.4; }
          88%       { opacity: 0.6; }
        }

        /* Centered content — stacks logo and headline in the same spot */
        .content {
          position: relative;
          z-index: 10;
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          padding: 24px;
          box-sizing: border-box;
          text-align: center;
        }

        /* Inner stack: logo on the left, headline on the right — both vertically centered */
        .stack {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: clamp(24px, 5vw, 72px);
          max-width: min(1200px, 92vw);
        }

        /* On narrow screens, stack vertically so nothing gets cramped */
        @media (max-width: 720px) {
          .stack {
            flex-direction: column;
            gap: clamp(16px, 4vh, 32px);
          }
        }

        /* Logo wrapper hosts the rotating aurora halo + shine sweep as pseudo-elements */
        .logo-wrap {
          position: relative;
          width: clamp(260px, 52vmin, 560px);
          aspect-ratio: 1 / 1;
          border-radius: 76px;
          isolation: isolate;
          /* Gentle breathing: subtle scale + drift — 9s loop */
          animation: breathe 9s ease-in-out infinite;
        }

        /* Rotating aurora halo behind the logo */
        .logo-wrap::before {
          content: "";
          position: absolute;
          inset: -14%;
          z-index: 0;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            rgba(255, 31, 61, 0.0) 0%,
            rgba(255, 31, 61, 0.55) 18%,
            rgba(255, 138, 156, 0.35) 32%,
            rgba(255, 31, 61, 0.0) 50%,
            rgba(255, 31, 61, 0.45) 68%,
            rgba(255, 77, 102, 0.3) 82%,
            rgba(255, 31, 61, 0.0) 100%
          );
          filter: blur(36px);
          opacity: 0.9;
          animation: spin 18s linear infinite;
          pointer-events: none;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes breathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-6px) scale(1.02); }
        }

        /* Logo — treated like a hero: big, rounded, softly translucent */
        .logo {
          position: relative;
          z-index: 1; /* above the halo */
          width: 100%;
          height: 100%;
          display: block;
          border-radius: inherit;
          opacity: 0; /* starts hidden for the rise-in animation */
          /* Soft red halo so it reads as a glowing hero piece */
          box-shadow:
            0 0 20px rgba(255, 31, 61, 0.25),
            0 0 80px rgba(255, 31, 61, 0.18),
            0 10px 30px rgba(0, 0, 0, 0.55);
          transition:
            transform 600ms cubic-bezier(.2,.8,.2,1),
            box-shadow 600ms ease,
            opacity 400ms ease;
          transform: translateY(16px);
          animation: riseLogo 900ms cubic-bezier(.2,.8,.2,1) 200ms forwards;
          will-change: transform, opacity;
        }

        /* Shine sweep: a soft diagonal highlight that crosses the logo every 7s */
        .logo-wrap::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 2;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(
            115deg,
            transparent 30%,
            rgba(255, 255, 255, 0.18) 45%,
            rgba(255, 255, 255, 0.35) 50%,
            rgba(255, 255, 255, 0.18) 55%,
            transparent 70%
          );
          background-size: 250% 250%;
          background-position: -100% -100%;
          mix-blend-mode: screen;
          opacity: 0;
          animation: shine 7s ease-in-out 1.2s infinite;
        }

        @keyframes shine {
          0%, 70%, 100% { background-position: -100% -100%; opacity: 0; }
          80%           { opacity: 0.9; }
          90%           { background-position: 200% 200%; opacity: 0; }
        }

        /* Hover intensifies everything on the wrapper */
        .logo-wrap:hover .logo {
          transform: scale(1.03);
          opacity: 1;
          box-shadow:
            0 0 120px rgba(255, 31, 61, 0.55),
            0 0 260px rgba(255, 31, 61, 0.35),
            0 20px 60px rgba(0, 0, 0, 0.55);
        }
        .logo-wrap:hover::before {
          filter: blur(28px);
          opacity: 1;
          animation-duration: 9s; /* spin halo faster on hover */
        }

        /* Logo lands at 50% opacity — ghostly hero-image feel */
        @keyframes riseLogo {
          to { opacity: 0.5; transform: translateY(0); }
        }

        /* Headline — bold, large, with an animated red gradient fill */
        .headline {
          margin: 0;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: clamp(1.6rem, 8vw, 5rem);
          line-height: 1;
          text-align: left;
          /* Gradient text via background-clip */
          background: linear-gradient(
            100deg,
            #ffffff 0%,
            #ff8a9c 35%,
            #ff1f3d 65%,
            #8a0f1f 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
                  background-clip: text;
          -webkit-text-fill-color: transparent;
                  color: transparent;
          animation:
            rise 900ms cubic-bezier(.2,.8,.2,1) 400ms forwards,
            shimmer 8s ease-in-out infinite;
          opacity: 0;
          transform: translateY(16px);
          /* Compensate last letter's tracking so text remains optically aligned */
          padding-left: 0.12em;
        }

        /* Slowly slides the gradient across the text */
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }

        @media (max-width: 720px) {
          .headline { text-align: center; }
        }

        @keyframes rise {
          to { opacity: 1; transform: translateY(0); }
        }

        /* Respect users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .grain, .stage::after, .logo, .headline,
          .logo-wrap, .logo-wrap::before, .logo-wrap::after {
            animation: none !important;
          }
          .headline { opacity: 1; transform: none; }
          .logo { opacity: 0.5; transform: none; }
        }
      `}</style>

      <main className='stage' aria-label='Llamablaze — Coming Soon'>
        {/* Full-bleed hero background — swap src later */}
        <img className='hero' src='/hero.jpg' alt='' aria-hidden='true' />

        <div className='vignette' aria-hidden='true' />

        <div className='content'>
          <div className='stack'>
            <div className='logo-wrap'>
              <img
                className='logo'
                src='/llamablaze-logo.png'
                alt='Llamablaze logo'
              />
            </div>
            <h1 className='headline'>Coming Soon</h1>
          </div>
        </div>

        <div className='scanlines' aria-hidden='true' />
        <div className='grain' aria-hidden='true' />
      </main>
    </>
  );
}
