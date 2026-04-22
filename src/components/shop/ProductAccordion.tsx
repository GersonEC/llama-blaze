import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface AccordionSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/**
 * Shared static copy for every product page — we don't persist these fields
 * per product today. Tweak this array to update the content site-wide.
 */
const SECTIONS: readonly AccordionSection[] = [
  {
    id: 'materiali',
    title: 'Materiali & fattura',
    body: (
      <ul className='list-disc space-y-1 pl-5'>
        <li>Pelle bovina italiana, conciata al vegetale</li>
        <li>Fodera in cotone grezzo, cuciture rinforzate</li>
        <li>Fibbia in ottone massiccio, brunita a mano</li>
        <li>Dimensioni indicative: 32 × 26 × 12 cm — peso 680g</li>
      </ul>
    ),
  },
  {
    id: 'cura',
    title: 'Cura del prodotto',
    body: (
      <p>
        La pelle al vegetale si scurisce col tempo e prende carattere. Nutrila
        due volte l&apos;anno con il nostro balsamo dedicato. Evita pioggia
        prolungata e fonti di calore dirette.
      </p>
    ),
  },
  {
    id: 'spedizione',
    title: 'Spedizione & resi',
    body: (
      <p>
        Spedizione gratuita sopra €120, consegna in 2 giorni lavorativi in
        Italia. 30 giorni di tempo per il reso, etichetta prepagata inclusa.
      </p>
    ),
  },
  {
    id: 'riparazioni',
    title: 'Riparazioni a vita',
    body: (
      <p>
        Se qualcosa si rompe — una cucitura, la fibbia, la fodera — te la
        aggiustiamo gratis. Sempre. Basta spedircela.
      </p>
    ),
  },
];

export function ProductAccordion() {
  return (
    <Accordion
      type='single'
      collapsible
      defaultValue='materiali'
      className='rounded-none border-0 border-t border-border'
    >
      {SECTIONS.map((section) => (
        <AccordionItem
          key={section.id}
          value={section.id}
          className='border-0 border-b border-border data-open:bg-transparent'
        >
          <AccordionTrigger className='border-0 px-0 py-6 text-[13px] font-bold uppercase tracking-[0.12em] hover:no-underline'>
            {section.title}
          </AccordionTrigger>
          <AccordionContent className='px-0 pb-6 text-[14px] leading-[1.7] text-muted-foreground'>
            {section.body}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
