import { PackageIcon, RotateCcwIcon, WrenchIcon } from 'lucide-react';

interface Perk {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

const PERKS: readonly Perk[] = [
  {
    id: 'spedizione',
    icon: PackageIcon,
    title: 'Spedizione gratuita',
    body: 'Sopra €120 in tutta Italia. Consegna in 2 giorni lavorativi.',
  },
  {
    id: 'resi',
    icon: RotateCcwIcon,
    title: 'Resi senza domande',
    body: '30 giorni di tempo, etichetta prepagata nel pacco.',
  },
  {
    id: 'riparazioni',
    icon: WrenchIcon,
    title: 'Riparazioni a vita',
    body: 'Se si rompe, lo aggiustiamo. Sempre, gratis.',
  },
];

/**
 * Dark 3-card strip shown at the very bottom of the PDP body. Rendered
 * full-bleed via a negative horizontal margin that cancels the shop layout's
 * padding, so the background stretches edge-to-edge regardless of the
 * container width.
 */
export function ProductFooterStrip() {
  return (
    <section className='-mx-4 mt-16 bg-primary text-primary-foreground sm:-mx-6 lg:-mx-8'>
      <div className='mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8 lg:py-18'>
        {PERKS.map(({ id, icon: Icon, title, body }) => (
          <div key={id} className='flex items-start gap-3.5'>
            <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-accent/15'>
              <Icon className='size-5 text-accent' />
            </span>
            <div>
              <h5 className='text-[14px] font-semibold'>{title}</h5>
              <p className='mt-1 text-[12px] leading-normal text-primary-foreground/60'>
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
