import Image from 'next/image';
import Link from 'next/link';

const displayFont = 'font-[family-name:var(--font-fraunces)]';

const footerCols = [
  {
    title: 'Negozio',
    items: [
      'Nuovi Arrivi',
      'Capispalla',
      'Maglieria',
      'Denim',
      'Scarpe',
      'Accessori',
      'Saldi Archivio',
    ],
  },
  {
    title: 'Aiuto',
    items: [
      'Contatta il branco',
      'Spedizioni e resi',
      'Guida taglie',
      'Cura e riparazioni',
      'FAQ',
      'Gift card',
    ],
  },
  {
    title: 'Azienda',
    items: [
      'La nostra storia',
      "L'atelier",
      'Artigianalità',
      "Report impatto '25",
      'Stampa',
      'Lavora con noi',
    ],
  },
  {
    title: 'Negozi',
    items: [
      'Milano — Brera',
      'Roma — Monti',
      'Paris — Marais',
      'London — Soho',
      'Tutte le sedi',
      'Prenota un appuntamento',
    ],
  },
];

const socialIcons = [
  {
    label: 'Instagram',
    path: 'M12 2c2.7 0 3 0 4.1.1 2.6.1 3.8 1.4 3.9 3.9C20 7 20 7.3 20 12s0 5-.1 6c-.1 2.5-1.3 3.8-3.9 3.9-1 .1-1.4.1-4 .1s-3 0-4-.1c-2.6-.1-3.8-1.4-3.9-3.9C4 17 4 16.7 4 12s0-5 .1-6c.1-2.5 1.3-3.8 3.9-3.9C9 2 9.3 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm5.3-3.3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z',
    href: 'https://www.instagram.com/llama.blaze/',
  },
  {
    label: 'TikTok',
    path: 'M19 8.5a6.5 6.5 0 0 1-3.8-1.2V16a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V2h3a3.5 3.5 0 0 0 3.8 3.5v3z',
    href: '#',
  },
];

export default function SiteFooter() {
  return (
    <footer className='bg-primary text-primary-foreground/70'>
      <div className='border-b border-[#222] px-5 pb-10 pt-20 md:px-16'>
        <div className='mx-auto grid max-w-[1480px] grid-cols-1 gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]'>
          <div>
            <Link href='/' className='flex items-center gap-2.5'>
              <span className='grid h-10 w-10 place-items-center overflow-hidden rounded-md bg-accent'>
                <Image
                  src='/llamablaze-logo.png'
                  alt=''
                  width={40}
                  height={40}
                  className='h-full w-full object-cover'
                />
              </span>
              <span
                className={`${displayFont} text-[26px] font-medium italic tracking-[-0.01em] text-white`}
              >
                Llama<em className='italic font-semibold text-accent'>Blaze</em>
              </span>
            </Link>
            <p className='my-5 max-w-[320px] text-[13.5px] leading-relaxed'>
              Premium Sneakers & Accessories Quality Checked
            </p>
            <div className='flex gap-2.5'>
              {socialIcons.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className='grid h-10 w-10 place-items-center rounded-full border border-[#2a2a2a] transition-all hover:border-accent hover:bg-accent'
                  target='_blank'
                >
                  <svg viewBox='0 0 24 24' width='16' height='16' fill='#fff'>
                    <path d={s.path} />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {footerCols.map((col) => (
            <div key={col.title}>
              <h5 className='mb-[18px] text-[11px] font-bold uppercase tracking-[0.22em] text-white'>
                {col.title}
              </h5>
              <ul className='flex list-none flex-col gap-3'>
                {col.items.map((item) => (
                  <li key={item}>
                    <Link
                      href='#'
                      className='text-[13.5px] text-white/65 transition-colors hover:text-accent'
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className='px-5 py-6 md:px-16'>
        <div className='mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4 text-[12px] text-white/50'>
          <div>
            © 2026 LlamaBlaze S.r.l. · P.IVA IT09876543210 · Via Brera 14,
            Milano
          </div>

          <div className='flex gap-4'>
            <Link href='#' className='hover:text-accent'>
              Privacy
            </Link>
            <Link href='#' className='hover:text-accent'>
              Cookie
            </Link>
            <Link href='#' className='hover:text-accent'>
              Termini
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
