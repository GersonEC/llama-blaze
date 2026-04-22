'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

const displayFont = 'font-[family-name:var(--font-fraunces)]';

export default function LandingPage() {
  return (
    <div className='bg-background text-foreground'>
      <LocalStyles />
      <AnnouncementMarquee />
      <Hero />
      <ValueStrip variant='red' />
      <Collection />
      <ValueStrip variant='stats' />
      <Reviews />
      <Support />
      <Newsletter />
      <ChatFloat />
    </div>
  );
}

function LocalStyles() {
  return (
    <style>{`
      @keyframes lb-marquee { to { transform: translateX(-50%) } }
      @keyframes lb-spin { to { transform: translate(-50%, 0) rotate(360deg) } }
      .lb-marquee-track { animation: lb-marquee 38s linear infinite; }
      .lb-value-track { animation: lb-marquee 28s linear infinite; }
      .lb-stamp { animation: lb-spin 22s linear infinite; }
      .lb-dm-track::-webkit-scrollbar { height: 6px }
      .lb-dm-track::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.3); border-radius: 4px }
    `}</style>
  );
}

/* ============================================================
   ANNOUNCEMENT MARQUEE
   ============================================================ */
function AnnouncementMarquee() {
  const items = [
    'Spedizione gratuita sopra €120',
    'Resi entro 30 giorni, senza domande',
    'Nuovo drop: Wildfire FW26',
    'Fatto a mano a Milano',
  ];
  const loop = [...items, ...items];
  return (
    <div
      aria-hidden='true'
      className='overflow-hidden border-b border-black bg-primary text-primary-foreground'
    >
      <div className='lb-marquee-track flex gap-18 whitespace-nowrap py-2.5 text-[11.5px] font-medium uppercase tracking-[0.22em]'>
        {loop.map((text, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-18 after:ml-18 after:text-[8px] after:text-accent after:content-['●']"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   HERO
   ============================================================ */
function Hero() {
  const heroBg: CSSProperties = {
    background: `
      radial-gradient(1200px 600px at 20% 30%, hsl(var(--accent) / 0.35), transparent 60%),
      radial-gradient(900px 700px at 85% 80%, hsl(var(--accent) / 0.45), transparent 55%),
      linear-gradient(180deg,#0E0E0E 0%, #1a0506 60%, #2a0308 100%)
    `,
  };
  const noiseBg: CSSProperties = {
    backgroundImage: `
      repeating-linear-gradient(90deg, rgba(255,255,255,.03) 0 1px, transparent 1px 3px),
      repeating-linear-gradient(0deg, rgba(0,0,0,.15) 0 1px, transparent 1px 4px)
    `,
  };
  return (
    <section className='relative isolate min-h-[620px] overflow-hidden bg-[#111] text-white md:h-[min(86vh,860px)]'>
      <div className='absolute inset-0 z-0' style={heroBg} />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 z-1 opacity-35 mix-blend-overlay'
        style={noiseBg}
      />

      <div
        aria-hidden='true'
        className='absolute right-5 top-1/2 z-2 hidden aspect-1116/1390 w-[min(44vh,420px)] -translate-y-1/2 md:right-16 md:block'
        style={{ filter: 'drop-shadow(0 30px 80px hsl(var(--accent) / 0.5))' }}
      >
        <Image
          src='/llamablaze-logo.png'
          alt=''
          fill
          sizes='420px'
          className='object-contain'
          priority
        />
      </div>

      <div className='relative z-2 mx-auto flex h-full max-w-[1480px] flex-col justify-between px-5 pt-12 md:px-16'>
        <h1
          className={`${displayFont} pt-6 text-[clamp(60px,13vw,220px)] font-light leading-[0.88] tracking-[-0.03em]`}
        >
          Fili
          <br />
          Aud<span className='italic font-normal text-accent'>a</span>ci,
          <br />
          <span className='italic font-normal'>senza</span>{' '}
          <span className='text-transparent [-webkit-text-stroke:2px_#fff]'>
            scuse
          </span>
          .
        </h1>
      </div>
    </section>
  );
}

function HeroButton({
  href,
  variant,
  children,
}: {
  href: string;
  variant: 'red' | 'ghost';
  children: ReactNode;
}) {
  const base =
    'inline-flex items-center gap-2.5 rounded-sm px-6 py-4 text-[12px] font-bold uppercase tracking-[0.22em] transition-all hover:-translate-y-[1px]';
  const styles =
    variant === 'red'
      ? 'bg-accent border border-accent text-white hover:bg-white hover:text-accent'
      : 'bg-transparent border border-white/40 text-white hover:bg-white hover:text-foreground hover:border-white';
  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}

/* ============================================================
   VALUE STRIP
   ============================================================ */
function ValueStrip({ variant }: { variant: 'red' | 'stats' }) {
  const items =
    variant === 'red'
      ? [
          'Tagliato a mano a Milano',
          'Spedizione a impatto zero',
          'Riparazioni a vita',
          'Mai in saldo, sempre puntuali',
        ]
      : ['● Oltre 42.000 nel branco', '★ 4,9 su Trustpilot', "Su Monocle '25"];
  const loop = [...items, ...items];
  const isRed = variant === 'red';
  return (
    <div
      className={`overflow-hidden py-[18px] text-white ${
        isRed ? 'bg-accent' : 'bg-primary text-primary-foreground'
      }`}
    >
      <div
        className={`lb-value-track flex gap-16 whitespace-nowrap ${displayFont} text-[clamp(28px,4vw,56px)] italic`}
      >
        {loop.map((text, i) => (
          <span key={i} className='inline-flex items-center gap-16'>
            {text}
            <i
              className={`mx-11 inline-block h-3.5 w-3.5 rounded-full ${
                isRed ? 'bg-primary' : 'bg-accent'
              }`}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   COLLECTION
   ============================================================ */
function Collection() {
  return (
    <section
      id='collection'
      className='px-5 pt-[clamp(80px,10vw,140px)] pb-[clamp(60px,9vw,120px)] md:px-16'
    >
      <div className='mx-auto max-w-[1480px]'>
        <SectionHead
          eyebrow='● La Collezione Wildfire'
          title={
            <>
              Quattro capitoli.{' '}
              <em className='italic text-accent'>Un guardaroba</em>
              <br />
              che invecchia con te.
            </>
          }
          meta={
            <>
              <span>014 / Autunno · Inverno &rsquo;26</span>
              <SecondaryButton href='#'>Vedi tutto →</SecondaryButton>
            </>
          }
        />

        {/* Category grid — 3 featured */}
        <div className='grid grid-cols-1 gap-0.5 md:grid-cols-3'>
          <CollectionCard
            tag='Nuovo'
            tagRed
            title={
              <>
                Capispalla
                <br />
                <em className='italic text-accent'>&amp; Cappotti</em>
              </>
            }
          >
            <OuterwearPlaceholder />
          </CollectionCard>
          <CollectionCard
            tag='Più venduti'
            title={
              <>
                Maglieria
                <br />
                <em className='italic text-accent'>&amp; Maglioni</em>
              </>
            }
          >
            <KnitwearPlaceholder />
          </CollectionCard>
          <CollectionCard
            tag='Riassortimento'
            title={
              <>
                Denim
                <br />
                <em className='italic text-accent'>&amp; Pantaloni</em>
              </>
            }
          >
            <DenimPlaceholder />
          </CollectionCard>
        </div>

        {/* Editorial split */}
        <div className='mt-0.5 grid grid-cols-1 gap-0.5 md:grid-cols-[1.35fr_1fr]'>
          <CollectionCard
            tag='Lookbook'
            aspect='big'
            title={
              <>
                La Storia <em className='italic text-accent'>Wildfire</em>
                <br />
                <span className='font-sans text-sm font-semibold uppercase tracking-[0.15em] text-white/80'>
                  Capitolo I — Sale &amp; Fumo
                </span>
              </>
            }
          >
            <LookbookPlaceholder />
          </CollectionCard>
          <div className='grid grid-rows-2 gap-0.5'>
            <CollectionCard
              tag='Limitato'
              aspect='small'
              title={
                <>
                  Scarpe
                  <br />
                  <em className='italic text-accent'>&amp; Stivali</em>
                </>
              }
            >
              <BootsPlaceholder />
            </CollectionCard>
            <CollectionCard
              tag='Essenziali'
              aspect='small'
              titleDark
              title={
                <>
                  Accessori
                  <br />
                  <em className='italic text-accent'>
                    &amp; Piccola pelletteria
                  </em>
                </>
              }
            >
              <AccessoriesPlaceholder />
            </CollectionCard>
          </div>
        </div>

        {/* Product rail */}
        <ProductRail />
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string;
  title: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className='mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-border pb-5'>
      <div>
        <div className='mb-[18px] text-[11px] font-semibold uppercase tracking-[0.22em] text-accent'>
          {eyebrow}
        </div>
        <h2
          className={`${displayFont} max-w-[720px] text-[clamp(36px,5.2vw,72px)] font-normal leading-[0.95] tracking-[-0.02em]`}
        >
          {title}
        </h2>
      </div>
      {meta && (
        <div className='flex flex-col items-end gap-2.5 text-[13px] text-muted-foreground'>
          {meta}
        </div>
      )}
    </div>
  );
}

function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className='inline-flex items-center gap-2 rounded-sm border border-border bg-secondary px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-background'
      target='_blank'
    >
      {children}
    </Link>
  );
}

function CollectionCard({
  tag,
  tagRed,
  title,
  aspect = 'default',
  titleDark,
  children,
}: {
  tag: string;
  tagRed?: boolean;
  title: ReactNode;
  aspect?: 'default' | 'big' | 'small';
  titleDark?: boolean;
  children: ReactNode;
}) {
  const aspectClass =
    aspect === 'big'
      ? 'aspect-[16/10]'
      : aspect === 'small'
        ? 'h-full min-h-[250px]'
        : 'aspect-[3/4]';
  return (
    <Link
      href='#'
      className={`group relative block overflow-hidden bg-secondary ${aspectClass} cursor-pointer`}
    >
      <div className='absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]'>
        {children}
      </div>
      <div
        className={`absolute inset-0 flex flex-col justify-between p-7 ${
          titleDark ? 'text-foreground' : 'text-white'
        }`}
        style={{
          background: titleDark
            ? 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.15) 100%)'
            : 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.55) 100%)',
        }}
      >
        <span
          className={`self-start px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] ${
            tagRed ? 'bg-accent text-white' : 'bg-white/95 text-foreground'
          }`}
        >
          {tag}
        </span>
        <div className='flex items-end justify-between gap-5'>
          <h3
            className={`${displayFont} text-[36px] font-normal leading-none tracking-[-0.01em]`}
          >
            {title}
          </h3>
          <span className='grid h-12 w-12 place-items-center rounded-full bg-white text-foreground transition-all duration-300 group-hover:-rotate-45 group-hover:bg-accent group-hover:text-white'>
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M5 12h14M13 5l7 7-7 7' />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ---------- Product rail ---------- */
type Product = {
  id: string;
  name: string;
  price: string;
  oldPrice?: string;
  rating: string;
  badge?: { label: string; red?: boolean };
  colors: string[];
  defaultFav?: boolean;
  render: () => ReactNode;
};

const products: Product[] = [
  {
    id: 'overcoat',
    name: 'Cappotto Wildfire — Lana Inchiostro',
    price: '€ 527',
    oldPrice: '€ 620',
    rating: '★ 4,9 (284)',
    badge: { label: '-15%', red: true },
    colors: ['#1a1a1a', '#5a4030', '#8a7060'],
    defaultFav: true,
    render: () => <OvercoatPlaceholder />,
  },
  {
    id: 'crew-knit',
    name: 'Maglione Blaze Girocollo — Rosso Brace',
    price: '€ 185',
    rating: '★ 4,8 (412)',
    badge: { label: 'Nuovo' },
    colors: ['#ED1B34', '#0B0B0B', '#5a4030', '#d9d0bc'],
    render: () => <CrewKnitPlaceholder />,
  },
  {
    id: 'denim',
    name: 'Denim Selvedge — Indaco Grezzo',
    price: '€ 245',
    rating: '★ 4,9 (156)',
    colors: ['#3a5a7a', '#1a2a3a', '#0B0B0B'],
    render: () => <SelvedgePlaceholder />,
  },
  {
    id: 'loafer',
    name: 'Mocassino Campo — Camoscio Espresso',
    price: '€ 295',
    rating: '★ 4,9 (892)',
    badge: { label: 'Solo 12 rimasti' },
    colors: ['#0B0B0B', '#4a2815', '#8a6a30'],
    render: () => <LoaferPlaceholder />,
  },
];

function ProductRail() {
  const [favs, setFavs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      products.filter((p) => p.defaultFav).map((p) => [p.id, true]),
    ),
  );
  const toggleFav = (id: string) =>
    setFavs((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className='mt-20'>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-6 border-b border-border pb-5'>
        <div>
          <div className='mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent'>
            ● Più desiderati della settimana
          </div>
          <h3
            className={`${displayFont} text-[clamp(28px,3.6vw,48px)] font-normal leading-[0.95] tracking-[-0.02em]`}
          >
            Tendenze
          </h3>
        </div>
        <div className='flex gap-2'>
          <button className='rounded-sm border border-border bg-secondary px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] transition-colors hover:bg-background'>
            ‹
          </button>
          <button className='rounded-sm border border-border bg-secondary px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] transition-colors hover:bg-background'>
            ›
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            fav={!!favs[p.id]}
            onToggleFav={() => toggleFav(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ProductCard({
  product,
  fav,
  onToggleFav,
}: {
  product: Product;
  fav: boolean;
  onToggleFav: () => void;
}) {
  return (
    <Link href='#' className='group flex cursor-pointer flex-col gap-3.5'>
      <div className='relative aspect-3/4 overflow-hidden border border-border bg-muted'>
        {product.badge && (
          <span
            className={`absolute left-3 top-3 z-2 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
              product.badge.red
                ? 'bg-accent text-white'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {product.badge.label}
          </span>
        )}
        <button
          type='button'
          aria-label={fav ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          aria-pressed={fav}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFav();
          }}
          className='absolute right-3 top-3 z-2 grid h-9 w-9 place-items-center rounded-full border border-border bg-background'
        >
          <svg
            viewBox='0 0 24 24'
            width='16'
            height='16'
            strokeWidth='1.8'
            stroke={fav ? 'hsl(var(--accent))' : 'currentColor'}
            fill={fav ? 'hsl(var(--accent))' : 'none'}
          >
            <path d='M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z' />
          </svg>
        </button>
        <div className='absolute inset-0 transition-transform duration-500 group-hover:scale-105'>
          {product.render()}
        </div>
      </div>
      <h4 className='text-sm font-semibold'>{product.name}</h4>
      <div className='flex items-center justify-between text-[13px] text-muted-foreground'>
        <span className='font-semibold text-foreground'>
          {product.oldPrice && (
            <s className='mr-1.5 font-normal text-muted-foreground/70'>
              {product.oldPrice}
            </s>
          )}
          {product.price}
        </span>
        <span>{product.rating}</span>
      </div>
      <div className='flex gap-1.5'>
        {product.colors.map((c) => (
          <span
            key={c}
            className='h-3.5 w-3.5 rounded-full border border-border'
            style={{ background: c }}
          />
        ))}
      </div>
    </Link>
  );
}

/* ============================================================
   REVIEWS — Instagram DM cards + scroll dot indicator
   ============================================================ */
type Bubble =
  | { kind: 'in' | 'out'; text: ReactNode; mono?: boolean; large?: boolean }
  | { kind: 'img'; thumb: ReactNode; wide?: boolean }
  | { kind: 'date'; text: string };

type DM = {
  id: string;
  bubbles: Bubble[];
};

const dms: DM[] = [
  {
    id: 'dm1',
    bubbles: [
      {
        kind: 'img',
        thumb: <DMThumbBoots />,
      },
      {
        kind: 'in',
        text: 'Appena ricevuti gli stivali Campo — wow. Calzano come un guanto 🔥',
      },
      {
        kind: 'in',
        text: (
          <>
            Questo è il mio terzo ordine da voi{' '}
            <span className='mx-1 text-accent'>❤</span>
          </>
        ),
      },
      {
        kind: 'out',
        text: 'Ma dai, bentornata nel branco 🦙 Usa HERDER10 sul prossimo ordine, offriamo noi.',
      },
      { kind: 'out', text: 'Buon divertimento!' },
    ],
  },
  {
    id: 'dm2',
    bubbles: [
      { kind: 'date', text: '8 FEB · 21:57' },
      {
        kind: 'in',
        text: 'https://llamablaze.com/p/wildfire-coat',
        mono: true,
      },
      { kind: 'date', text: '00:31' },
      { kind: 'img', thumb: <DMThumbCoat />, wide: true },
      {
        kind: 'in',
        text: 'È appena arrivato il cappotto Wildfire 😭 la qualità è pazzesca. Miglior acquisto dell\u2019anno, senza dubbio.',
      },
      {
        kind: 'in',
        text: (
          <>
            Grazie team! <span className='mx-1 text-accent'>❤</span>
          </>
        ),
      },
      {
        kind: 'out',
        text: 'Ahh ci hai illuminato la giornata. Ci vediamo al prossimo drop — ti abbiamo già salvata nella lista accesso anticipato 🙌',
      },
    ],
  },
  {
    id: 'dm3',
    bubbles: [
      { kind: 'img', thumb: <DMThumbGift /> },
      { kind: 'in', text: 'OH MIO DIOOOOO 😱😱😱', large: true },
      {
        kind: 'in',
        text: (
          <>
            Sono felicissima!!!!!
            <br />
            Il cappotto è perfetto e la qualità è una delle migliori che abbia
            mai avuto.
            <br />
            Grazie ragazziii <span className='mx-1 text-accent'>❤</span>
          </>
        ),
      },
      {
        kind: 'out',
        text: 'Leggenda! Ora sei ufficialmente una di noi. Taggaci in un fit, rilanciamo ✌️',
      },
      { kind: 'in', text: 'CI PENSO 🙌' },
    ],
  },
  {
    id: 'dm4',
    bubbles: [
      { kind: 'img', thumb: <DMThumbTag /> },
      {
        kind: 'in',
        text: 'Non mi aspettavo una spedizione COSÌ veloce. Ottimo lavoro team, avete conquistato il mio portafoglio 😅',
      },
      {
        kind: 'in',
        text: (
          <>
            Presto arriva un altro ordine, adoro la maglieria{' '}
            <span className='mx-1 text-accent'>❤</span>
          </>
        ),
      },
      {
        kind: 'out',
        text: 'Così ci piace sentirti. Il tuo codice fedeltà è appena arrivato nella casella — ci vediamo al prossimo 🦙',
      },
    ],
  },
  {
    id: 'dm5',
    bubbles: [
      {
        kind: 'in',
        text: 'Okay la vestibilità del denim selvedge è *bacio dello chef*',
      },
      {
        kind: 'in',
        text: 'Finalmente jeans che non mi fanno sembrare un cosplay del 2014',
      },
      { kind: 'img', thumb: <DMThumbJeans /> },
      {
        kind: 'out',
        text: 'Haha lo mettiamo su un cartellone 🦙 felici che ti stiano bene!',
      },
    ],
  },
];

function Reviews() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);
  const dotCount = 3;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) {
        setActiveDot(0);
        return;
      }
      const p = el.scrollLeft / max;
      setActiveDot(Math.min(dotCount - 1, Math.round(p * (dotCount - 1))));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className='bg-muted px-5 py-[clamp(60px,9vw,120px)] md:px-16'>
      <div className='mx-auto max-w-[1480px]'>
        <SectionHead
          eyebrow='● Recensioni dai DM'
          title={
            <>
              Cosa dice <em className='italic text-accent'>il branco</em>
              <br />
              su di noi.
            </>
          }
          meta={
            <>
              <span className='uppercase tracking-[0.15em]'>
                Senza filtri · Direttamente da Instagram
              </span>
              <SecondaryButton href='https://www.instagram.com/llama.blaze/'>
                Segui @llamablaze →
              </SecondaryButton>
            </>
          }
        />

        <div className='-mx-5 overflow-hidden md:-mx-16'>
          <div
            ref={trackRef}
            className='lb-dm-track flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-5 pb-2.5 md:px-16'
          >
            {dms.map((dm) => (
              <DMCard key={dm.id} dm={dm} />
            ))}
          </div>
        </div>

        <div className='mt-5 flex justify-center gap-1.5'>
          {Array.from({ length: dotCount }).map((_, i) => (
            <i
              key={i}
              className={`inline-block h-[7px] rounded-full transition-all ${
                i === activeDot
                  ? 'w-[22px] bg-foreground'
                  : 'w-[7px] bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DMCard({ dm }: { dm: DM }) {
  return (
    <div className='relative flex aspect-9/16 w-80 flex-none flex-col gap-2.5 overflow-hidden rounded-[28px] bg-black p-[18px_14px] text-white shadow-[0_30px_60px_-30px_rgba(0,0,0,.4),0_0_0_1px_#000] snap-start'>
      <div className='border-b border-[#222] pb-2 text-center text-[10px] tracking-[0.05em] text-[#8e8e93]'>
        Nuovo Messaggio
      </div>
      {dm.bubbles.map((b, i) => {
        if (b.kind === 'date') {
          return (
            <div
              key={i}
              className='my-1.5 text-center text-[11px] text-[#8e8e93]'
            >
              {b.text}
            </div>
          );
        }
        if (b.kind === 'img') {
          return (
            <div
              key={i}
              className={`overflow-hidden rounded-[14px] bg-transparent ${
                b.wide ? 'max-w-[70%]' : 'max-w-[65%]'
              } self-start`}
            >
              <div className='aspect-4/5 overflow-hidden rounded-[14px]'>
                {b.thumb}
              </div>
            </div>
          );
        }
        const isIn = b.kind === 'in';
        return (
          <div
            key={i}
            className={`max-w-[78%] rounded-[18px] px-3.5 py-2.5 leading-snug ${
              b.large ? 'text-[15px]' : 'text-[13px]'
            } ${b.mono ? 'font-mono text-[11px]' : ''} ${
              isIn
                ? 'self-start rounded-bl-[4px] bg-[#262628]'
                : 'self-end rounded-br-[4px] text-white'
            }`}
            style={
              !isIn
                ? {
                    background:
                      'linear-gradient(135deg,#A951F4 0%, #6B3BFF 100%)',
                  }
                : undefined
            }
          >
            {b.text}
          </div>
        );
      })}
      <div className='mt-auto flex items-center gap-2 rounded-full bg-[#1c1c1e] px-3.5 py-2 text-[12px] text-[#8e8e93]'>
        <span className='grid h-[22px] w-[22px] place-items-center rounded-full bg-[#333] text-[11px]'>
          🖼
        </span>
        Messaggio
        <span className='ml-auto'>🎙</span>
      </div>
    </div>
  );
}

/* ============================================================
   SUPPORT
   ============================================================ */
function Support() {
  return (
    <section
      id='support'
      className='relative overflow-hidden bg-primary px-5 py-[clamp(60px,9vw,120px)] text-primary-foreground md:px-16'
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -left-24 -top-24 h-[600px] w-[600px]'
        style={{
          background:
            'radial-gradient(circle, hsl(var(--accent) / 0.18), transparent 60%)',
        }}
      />
      <div className='relative mx-auto max-w-[1480px]'>
        <div className='grid grid-cols-1 items-center gap-10 md:grid-cols-[1fr_1.1fr] md:gap-[60px]'>
          <div>
            <div className='mb-[18px] text-[11px] font-semibold uppercase tracking-[0.22em] text-accent'>
              ● Sempre qui per te
            </div>
            <h2
              className={`${displayFont} text-[clamp(40px,6vw,84px)] font-light leading-[0.95] tracking-[-0.02em]`}
            >
              Persone dall&rsquo;altra
              <br />
              parte —{' '}
              <em className='italic font-normal text-accent'>non bot.</em>
            </h2>
            <p className='my-6 max-w-[520px] text-base leading-relaxed text-white/70'>
              Persone vere a Milano rispondono a ogni messaggio, ogni ordine,
              ogni domanda. Se qualcosa non va, lo sistemiamo — resi entro 30
              giorni, riparazioni a vita e un team che ci tiene davvero.
            </p>
            <Link
              href='#'
              className='inline-flex items-center gap-2.5 rounded-sm border border-accent bg-accent px-6 py-4 text-[12px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-accent'
            >
              Chatta con il branco
            </Link>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <SupportCard
              title='Resi gratuiti · 30 giorni'
              body={
                'Hai cambiato idea? Stampa l\u2019etichetta, consegna il pacco. Nessun dramma, nessuna penale.'
              }
              link='Come funzionano i resi'
              icon={
                <svg
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.8'
                >
                  <path d='M3 7h18M3 12h18M3 17h18' />
                </svg>
              }
            />
            <SupportCard
              title='Paga come vuoi'
              body='Klarna, Scalapay, carta, Apple Pay, bonifico. 3× e 4× senza interessi alla cassa.'
              link='Metodi di pagamento'
              icon={
                <svg
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.8'
                >
                  <rect x='3' y='5' width='18' height='14' rx='2' />
                  <path d='M3 9h18' />
                </svg>
              }
            />
            <SupportCard
              title='Consegna a impatto zero'
              body='Ogni ordine parte con DHL GoGreen. Europa in 2–3 giorni, il resto del mondo in 4–7.'
              link='Spedizione e tracking'
              icon={
                <svg
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.8'
                >
                  <path d='M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4M21 7v10l-9 4' />
                </svg>
              }
            />
            <SupportCard
              title='Riparazioni a vita'
              body='Bottone saltato, cucitura aperta, tarma fortunata? Rispediscilo. Noi lo aggiustiamo. Tu continui a indossarlo.'
              link='Richiedi una riparazione'
              icon={
                <svg
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.8'
                >
                  <circle cx='12' cy='12' r='9' />
                  <path d='M12 7v6l4 2' />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SupportCard({
  title,
  body,
  link,
  icon,
}: {
  title: string;
  body: string;
  link: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href='#'
      className='group flex flex-col gap-3.5 rounded-[14px] border border-[#242424] bg-[#161616] p-7 transition-all hover:-translate-y-[2px] hover:border-accent'
    >
      <div
        className='grid h-11 w-11 place-items-center rounded-[10px] text-accent'
        style={{ background: 'hsl(var(--accent) / 0.12)' }}
      >
        <span className='inline-block h-[22px] w-[22px] [&>svg]:h-full [&>svg]:w-full [&>svg]:stroke-accent'>
          {icon}
        </span>
      </div>
      <h4 className='text-[17px] font-semibold'>{title}</h4>
      <p className='text-[13.5px] leading-relaxed text-white/60'>{body}</p>
      <span className='mt-auto inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white after:transition-transform after:content-["→"] group-hover:after:translate-x-1'>
        {link}
      </span>
    </Link>
  );
}

/* ============================================================
   NEWSLETTER
   ============================================================ */
function Newsletter() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className='bg-muted px-5 md:px-16'>
      <div className='mx-auto grid max-w-[1480px] grid-cols-1 items-stretch gap-10 py-[clamp(60px,8vw,110px)] md:grid-cols-2 md:gap-[60px]'>
        <div>
          <div className='mb-[18px] text-[11px] font-semibold uppercase tracking-[0.22em] text-accent'>
            ● Unisciti al branco
          </div>
          <h2
            className={`${displayFont} text-[clamp(40px,5vw,72px)] font-light leading-[0.95] tracking-[-0.02em]`}
          >
            News lente,
            <br />
            <em className='italic text-accent'>storie taglienti.</em>
          </h2>
          <p className='my-5 max-w-[460px] text-[15px] leading-relaxed text-muted-foreground'>
            Una lettera ogni domenica. Nuovi drop, retroscena
            dall&rsquo;atelier, playlist e qualche battuta da quattro soldi.
            Niente spam. Disiscrizione in un click.
          </p>
          <form
            className='flex max-w-[500px] border border-border bg-background'
            onSubmit={(e) => {
              e.preventDefault();
              (e.currentTarget as HTMLFormElement).reset();
              setSubmitted(true);
            }}
          >
            <input
              type='email'
              placeholder='tua@email.com'
              required
              className='flex-1 bg-transparent px-5 py-4 font-sans text-sm outline-none placeholder:text-muted-foreground'
            />
            <button
              type='submit'
              aria-label='Iscriviti'
              className='grid w-14 place-items-center bg-accent text-white transition-colors hover:bg-primary'
            >
              <svg
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path d='M5 12h14M13 5l7 7-7 7' />
              </svg>
            </button>
          </form>
          <p className='mt-3.5 text-[12px] text-muted-foreground'>
            {submitted ? (
              <>Sei dentro. Benvenuto nel branco 🦙</>
            ) : (
              <>
                Iscrivendoti accetti la nostra{' '}
                <Link
                  href='#'
                  className='text-accent underline underline-offset-[3px]'
                >
                  privacy policy
                </Link>
                . Vantaggio della prima lettera: 10% di sconto sul tuo primo
                ordine.
              </>
            )}
          </p>
        </div>
        <div className='relative grid min-h-[380px] place-items-center overflow-hidden bg-accent'>
          <span
            className={`${displayFont} absolute -left-[6%] -top-[8%] text-[clamp(180px,28vw,420px)] font-light italic leading-[0.8] tracking-[-0.04em] text-black/15`}
          >
            L
          </span>
          <div className='relative z-2 w-[60%] max-w-[240px] drop-shadow-[0_20px_40px_rgba(0,0,0,.25)]'>
            <Image
              src='/llamablaze-logo.png'
              alt=''
              width={240}
              height={240}
              className='h-auto w-full object-contain'
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FLOATING CHAT WIDGET
   ============================================================ */
function ChatFloat() {
  return (
    <button
      type='button'
      aria-label='Chatta con noi'
      className='fixed bottom-5 left-5 z-50 grid h-[54px] w-[54px] place-items-center rounded-full bg-background shadow-[0_10px_30px_rgba(0,0,0,.18),0_0_0_1px_rgba(0,0,0,.06)] transition-transform hover:scale-[1.06]'
    >
      <svg
        viewBox='0 0 24 24'
        width='22'
        height='22'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        className='text-foreground'
      >
        <path d='M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z' />
      </svg>
      <span className='absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent' />
    </button>
  );
}

/* ============================================================
   SVG PLACEHOLDERS — stand-ins for product/editorial photos
   ============================================================ */
function OuterwearPlaceholder() {
  return (
    <svg
      className='h-full w-full'
      viewBox='0 0 400 533'
      preserveAspectRatio='xMidYMid slice'
      xmlns='http://www.w3.org/2000/svg'
    >
      <defs>
        <linearGradient id='g1' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor='#5a4a3a' />
          <stop offset='1' stopColor='#2a1f15' />
        </linearGradient>
        <pattern id='weave1' width='6' height='6' patternUnits='userSpaceOnUse'>
          <rect width='6' height='6' fill='#3d3025' />
          <path d='M0 3 L6 3 M3 0 L3 6' stroke='#4a3a2a' strokeWidth='.5' />
        </pattern>
      </defs>
      <rect width='400' height='533' fill='url(#g1)' />
      <rect width='400' height='533' fill='url(#weave1)' opacity='.6' />
      <path
        d='M120 80 L200 60 L280 80 L310 180 L300 420 L280 533 L120 533 L100 420 L90 180 Z'
        fill='#1a1208'
        opacity='.85'
      />
      <path d='M200 60 L200 520' stroke='#0a0604' strokeWidth='3' />
      <circle cx='190' cy='200' r='3' fill='#d4a574' />
      <circle cx='190' cy='260' r='3' fill='#d4a574' />
      <circle cx='190' cy='320' r='3' fill='#d4a574' />
      <rect
        x='150'
        y='120'
        width='100'
        height='40'
        fill='#f4e9d6'
        opacity='.3'
      />
    </svg>
  );
}

function KnitwearPlaceholder() {
  return (
    <svg
      className='h-full w-full'
      viewBox='0 0 400 533'
      preserveAspectRatio='xMidYMid slice'
      xmlns='http://www.w3.org/2000/svg'
    >
      <defs>
        <linearGradient id='g2' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stopColor='#7a4a2a' />
          <stop offset='1' stopColor='#3a1f10' />
        </linearGradient>
        <pattern
          id='cable'
          width='20'
          height='30'
          patternUnits='userSpaceOnUse'
        >
          <path
            d='M0 0 Q10 15 0 30 M20 0 Q10 15 20 30'
            stroke='#5a3020'
            strokeWidth='2'
            fill='none'
          />
          <circle cx='10' cy='15' r='2' fill='#8a5030' />
        </pattern>
      </defs>
      <rect width='400' height='533' fill='url(#g2)' />
      <rect width='400' height='533' fill='url(#cable)' opacity='.7' />
      <circle cx='200' cy='130' r='50' fill='#e8c4a0' opacity='.95' />
      <path
        d='M200 170 Q160 200 140 280 L140 533 L260 533 L260 280 Q240 200 200 170'
        fill='#4a2815'
      />
    </svg>
  );
}

function DenimPlaceholder() {
  return (
    <svg
      className='h-full w-full'
      viewBox='0 0 400 533'
      preserveAspectRatio='xMidYMid slice'
      xmlns='http://www.w3.org/2000/svg'
    >
      <defs>
        <linearGradient id='g3' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor='#e8d9c0' />
          <stop offset='.5' stopColor='#c9b8a0' />
          <stop offset='1' stopColor='#8a7860' />
        </linearGradient>
        <pattern id='denim' width='4' height='4' patternUnits='userSpaceOnUse'>
          <rect width='4' height='4' fill='#5a7a9a' />
          <path d='M0 2 L4 2' stroke='#4a6a8a' strokeWidth='.5' />
        </pattern>
      </defs>
      <rect width='400' height='533' fill='url(#g3)' />
      <rect x='100' y='250' width='200' height='283' fill='url(#denim)' />
      <path
        d='M100 250 L200 240 L300 250 L295 320 L200 310 L105 320 Z'
        fill='#6a8aaa'
      />
      <rect x='180' y='270' width='40' height='25' rx='3' fill='#4a6a8a' />
      <circle cx='200' cy='283' r='4' fill='#c9a050' stroke='#8a6a30' />
      <rect x='90' y='240' width='220' height='22' fill='#5a3a20' />
    </svg>
  );
}

function LookbookPlaceholder() {
  return (
    <svg
      className='h-full w-full'
      viewBox='0 0 800 500'
      preserveAspectRatio='xMidYMid slice'
      xmlns='http://www.w3.org/2000/svg'
    >
      <defs>
        <linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor='#d98a4a' />
          <stop offset='.5' stopColor='#c9623a' />
          <stop offset='1' stopColor='#6a2810' />
        </linearGradient>
      </defs>
      <rect width='800' height='300' fill='url(#sky)' />
      <rect y='300' width='800' height='200' fill='#3a2010' />
      <ellipse cx='650' cy='160' rx='80' ry='80' fill='#f4d490' opacity='.5' />
      <ellipse cx='380' cy='220' rx='18' ry='22' fill='#2a150a' />
      <rect x='350' y='240' width='60' height='140' fill='#1a0a05' />
      <rect x='360' y='380' width='40' height='100' fill='#3a2515' />
      <rect x='340' y='330' width='80' height='8' fill='#ED1B34' />
      <rect x='345' y='338' width='6' height='80' fill='#ED1B34' />
      <rect x='409' y='338' width='6' height='80' fill='#ED1B34' />
    </svg>
  );
}

function BootsPlaceholder() {
  return (
    <svg
      className='h-full w-full'
      viewBox='0 0 400 250'
      preserveAspectRatio='xMidYMid slice'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect width='400' height='250' fill='#ED1B34' />
      <ellipse cx='200' cy='140' rx='140' ry='60' fill='#0B0B0B' opacity='.2' />
      <path
        d='M140 80 L160 80 L170 170 L130 170 Z M240 80 L260 80 L270 170 L230 170 Z'
        fill='#0B0B0B'
      />
      <ellipse cx='150' cy='170' rx='25' ry='8' fill='#1a1a1a' />
      <ellipse cx='250' cy='170' rx='25' ry='8' fill='#1a1a1a' />
    </svg>
  );
}

function AccessoriesPlaceholder() {
  return (
    <svg
      className='h-full w-full'
      viewBox='0 0 400 250'
      preserveAspectRatio='xMidYMid slice'
      xmlns='http://www.w3.org/2000/svg'
    >
      <defs>
        <linearGradient id='acc' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stopColor='#f4e9d6' />
          <stop offset='1' stopColor='#c9b896' />
        </linearGradient>
      </defs>
      <rect width='400' height='250' fill='url(#acc)' />
      <rect x='40' y='110' width='320' height='30' fill='#8a5a30' rx='2' />
      <rect x='50' y='115' width='300' height='20' fill='#6a3a20' />
      <rect x='280' y='100' width='50' height='50' fill='#c9a050' rx='4' />
      <rect x='290' y='115' width='30' height='20' fill='#8a6a30' rx='2' />
    </svg>
  );
}

function OvercoatPlaceholder() {
  return (
    <svg
      className='h-full w-full'
      viewBox='0 0 300 400'
      preserveAspectRatio='xMidYMid slice'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect width='300' height='400' fill='#f0ebe0' />
      <path
        d='M60 60 L120 40 L180 40 L240 60 L260 150 L250 350 L240 400 L60 400 L50 350 L40 150 Z'
        fill='#2a1a10'
      />
      <rect x='148' y='60' width='4' height='280' fill='#1a0f08' />
      <circle cx='148' cy='140' r='3' fill='#d4a574' />
      <circle cx='148' cy='200' r='3' fill='#d4a574' />
      <circle cx='148' cy='260' r='3' fill='#d4a574' />
    </svg>
  );
}

function CrewKnitPlaceholder() {
  return (
    <svg
      className='h-full w-full'
      viewBox='0 0 300 400'
      preserveAspectRatio='xMidYMid slice'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect width='300' height='400' fill='#e8dfd0' />
      <path
        d='M90 80 L140 60 L160 60 L210 80 L220 180 L215 320 L85 320 L80 180 Z'
        fill='#c63428'
      />
      <path
        d='M125 60 L150 90 L175 60'
        fill='none'
        stroke='#8a2010'
        strokeWidth='2'
      />
    </svg>
  );
}

function SelvedgePlaceholder() {
  return (
    <svg
      className='h-full w-full'
      viewBox='0 0 300 400'
      preserveAspectRatio='xMidYMid slice'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect width='300' height='400' fill='#f4efe4' />
      <rect x='100' y='100' width='100' height='250' fill='#4a6a8a' />
      <rect x='95' y='100' width='10' height='250' fill='#3a5a7a' />
      <rect x='195' y='100' width='10' height='250' fill='#3a5a7a' />
      <rect x='90' y='95' width='120' height='15' fill='#2a3a5a' />
      <rect x='140' y='110' width='20' height='12' fill='#c9a050' />
    </svg>
  );
}

function LoaferPlaceholder() {
  return (
    <svg
      className='h-full w-full'
      viewBox='0 0 300 400'
      preserveAspectRatio='xMidYMid slice'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect width='300' height='400' fill='#ebe2d0' />
      <ellipse
        cx='150'
        cy='280'
        rx='100'
        ry='50'
        fill='#1a1a1a'
        opacity='.15'
      />
      <path
        d='M90 180 L110 180 L120 300 L80 300 Z M180 180 L200 180 L220 300 L180 300 Z'
        fill='#0B0B0B'
      />
      <ellipse cx='100' cy='300' rx='20' ry='6' fill='#2a2a2a' />
      <ellipse cx='200' cy='300' rx='20' ry='6' fill='#2a2a2a' />
      <rect x='85' y='170' width='35' height='15' fill='#1a1a1a' />
      <rect x='180' y='170' width='35' height='15' fill='#1a1a1a' />
    </svg>
  );
}

/* ---- DM thumbnail placeholders ---- */
function DMThumbBoots() {
  return (
    <div
      className='h-full w-full'
      style={{ background: 'linear-gradient(135deg,#ED1B34 0%,#7a0a14 100%)' }}
    >
      <svg
        viewBox='0 0 200 250'
        className='h-full w-full'
        xmlns='http://www.w3.org/2000/svg'
      >
        <rect width='200' height='250' fill='#ED1B34' />
        <path
          d='M50 120 L70 120 L80 220 L40 220 Z M130 120 L150 120 L160 220 L120 220 Z'
          fill='#0B0B0B'
        />
        <ellipse cx='60' cy='220' rx='22' ry='6' fill='#1a1a1a' />
        <ellipse cx='140' cy='220' rx='22' ry='6' fill='#1a1a1a' />
      </svg>
    </div>
  );
}

function DMThumbCoat() {
  return (
    <div
      className='h-full w-full'
      style={{ background: 'linear-gradient(135deg,#2a1a10,#0a0604)' }}
    >
      <svg
        viewBox='0 0 200 250'
        className='h-full w-full'
        xmlns='http://www.w3.org/2000/svg'
      >
        <rect width='200' height='250' fill='#2a1a10' />
        <path
          d='M60 40 L100 30 L140 40 L160 100 L155 240 L45 240 L40 100 Z'
          fill='#0B0B0B'
        />
        <path d='M100 30 L100 240' stroke='#1a1008' strokeWidth='2' />
        <circle cx='95' cy='100' r='2' fill='#d4a574' />
        <circle cx='95' cy='140' r='2' fill='#d4a574' />
        <circle cx='95' cy='180' r='2' fill='#d4a574' />
      </svg>
    </div>
  );
}

function DMThumbGift() {
  return (
    <div
      className='h-full w-full'
      style={{ background: 'linear-gradient(135deg,#f0e8d4,#c9b896)' }}
    >
      <svg
        viewBox='0 0 200 250'
        className='h-full w-full'
        xmlns='http://www.w3.org/2000/svg'
      >
        <rect width='200' height='250' fill='#e8dfc8' />
        <rect x='40' y='60' width='120' height='150' fill='#ED1B34' rx='4' />
        <rect x='40' y='60' width='120' height='30' fill='#0B0B0B' />
        <text
          x='100'
          y='82'
          textAnchor='middle'
          fill='#fff'
          fontFamily='serif'
          fontStyle='italic'
          fontSize='16'
        >
          LlamaBlaze
        </text>
        <circle cx='100' cy='150' r='28' fill='#0B0B0B' opacity='.2' />
      </svg>
    </div>
  );
}

function DMThumbTag() {
  return (
    <div
      className='h-full w-full'
      style={{ background: 'linear-gradient(135deg,#f8f4ec,#d4c8b0)' }}
    >
      <svg
        viewBox='0 0 200 250'
        className='h-full w-full'
        xmlns='http://www.w3.org/2000/svg'
      >
        <rect width='200' height='250' fill='#f4efe0' />
        <rect
          x='40'
          y='80'
          width='120'
          height='130'
          fill='#ED1B34'
          rx='6'
          opacity='.85'
        />
        <path
          d='M70 80 Q70 50 100 50 Q130 50 130 80'
          stroke='#ED1B34'
          strokeWidth='4'
          fill='none'
        />
        <rect x='85' y='130' width='30' height='4' fill='#0B0B0B' />
      </svg>
    </div>
  );
}

function DMThumbJeans() {
  return (
    <div
      className='h-full w-full'
      style={{ background: 'linear-gradient(135deg,#3a5a7a,#1a2a3a)' }}
    >
      <svg
        viewBox='0 0 200 250'
        className='h-full w-full'
        xmlns='http://www.w3.org/2000/svg'
      >
        <rect width='200' height='250' fill='#3a5a7a' />
        <rect x='70' y='40' width='60' height='170' fill='#2a4a6a' />
        <path d='M90 40 L100 60 L110 40' fill='#c9a050' />
      </svg>
    </div>
  );
}
