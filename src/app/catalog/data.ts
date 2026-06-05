export interface CatalogItem {
  /** Two-digit index shown in the layout, e.g. "01". */
  number: string;
  name: string;
  /** Pre-formatted price we offer, edited by hand (no currency math here). */
  price: string;
  /**
   * Optional original/list price. When set, it's shown struck through next to
   * `price` to signal the discount. Omit it for items sold at full price.
   */
  realPrice?: string;
  /** One-line description. */
  description: string;
  /**
   * One or more photo paths under /public, e.g. ["/catalog/01.jpg"]. The first
   * entry is used as the cover; the rest are browsable in the lightbox. Add
   * more by dropping files in `public/catalog/` and appending their paths.
   */
  images: readonly string[];
  /** Image alt text for accessibility. */
  alt: string;
}

/** Brand / page chrome copy, kept beside the items so it's easy to edit. */
export const CATALOG_META = {
  brand: 'Llamablaze',
  collection: 'La collezione',
  title: 'Louis Vuitton',
  intro:
    'Una collezione di borse Louis Vuitton in stile Art Déco, realizzate in tela Monogram e impreziosite da dettagli d\'intramontabile eleganza.',
  caption: '',
  footerLocation: 'Llamablaze, Milano',
  footerYear: '© 2026',
} as const;

/**
 * Hardcoded catalog. Edit freely: text, prices, and image paths all live here.
 * Drop matching photos into `public/catalog/` and list them in `images` — the
 * first is the cover, the rest are browsable in the lightbox.
 */
export const CATALOG_ITEMS: readonly CatalogItem[] = [
  {
    number: '01',
    name: 'Alma bb',
    price: '€ 180',
    realPrice: '€ 1.600',
    description: 'La borsa Alma BB rivisita l\'intramontabile design in stile Art Déco creato nel 1934. Il sofisticato accessorio, realizzato in tela Monogram, è arricchito da raffinati dettagli, tra cui l\'iconico lucchetto con chiavi, i manici Toron e il delicato portachiavi a clochette in pelle. La versatile tracolla, amovibile e regolabile, consente di indossare l\'esclusivo modello compatto con estrema facilità.23.5 x 17.5 x 11.5 cm (Lunghezza x Altezza x Larghezza )',
    images: ['/catalog/alma-bb-1.jpg', '/catalog/almba-bb-2.jpg', '/catalog/alma-bb-3.jpg', '/catalog/alma-bb-4.jpg'],
    alt: 'Alma bb',
  },
  {
    number: '02',
    name: 'Speedy Bandoulière 25',
    price: '€ 180',
    realPrice: '€ 1.600',
    description: 'La borsa Speedy Bandoulière 25, realizzata in tela Monogram, è un raffinato accessorio ideale per tutti i giorni. L\'esclusivo modello rivisita in chiave contemporanea un classico della Maison, originariamente creato per i viaggiatori degli anni Trenta. Le linee inconfondibili, i manici in pelle, il lucchetto con incisione e la tracolla amovibile sono dettagli d\'intramontabile eleganza. 25 x 19 x 15 cm (Lunghezza x Altezza x Larghezza )',
    images: ['/catalog/speedy-25-1.jpg', '/catalog/speedy-25-2.jpg', '/catalog/speedy-25-3.jpg', '/catalog/speedy-25-4.jpg'],
    alt: 'Speedy Bandoulière 25',
  },
  {
    number: '03',
    name: 'CarryAll bb',
    price: '€ 240',
    realPrice: '€ 2.500',
    description: 'La borsa CarryAll BB viene rivisitata per la stagione in un\'elegante versione ideale per il giorno o la sera. Il modello, realizzato in tela Monogram, è impreziosito dalla catenella dorata, ornata dagli iconici fiori della Maison. L\'esclusivo accessorio, completato da dettagli emblematici come il porte adresse, presenta una tasca interna con zip che permette di accedere facilmente agli oggetti essenziali. 26 x 17 x 10 cm (Lunghezza x Altezza x Larghezza )',
    images: ['/catalog/carryall-bb-1.jpg', '/catalog/carryall-bb-2.jpg', '/catalog/carryall-bb-3.jpg', '/catalog/carryall-bb-4.jpg'],
    alt: 'Carryall bb',
  },
  {
    number: '04',
    name: 'Borsa Boulogne PM',
    price: '€ 220',
    realPrice: '€ 2.200',
    description: 'La borsa Boulogne PM, realizzata nella classica tela Monogram, si distingue per l\'elegante catenella e la pratica tracolla regolabile e amovibile, che permettono di portarla in svariati modi. L\'esclusivo modello è ideale anche come piccola pochette per occasioni più formali. L\'accessorio presenta una chiusura con zip a doppio cursore e una tasca piatta interna che può contenere uno smartphone. 26 x 16 x 9.5 cm (Lunghezza x Altezza x Larghezza )',
    images: ['/catalog/boulogne-pm-1.jpg', '/catalog/boulogne-pm-2.jpg', '/catalog/boulogne-pm-3.jpg'],
    alt: 'Borsa Boulogne PM',
  },
  {
    number: '05',
    name: 'CarryAll MM',
    price: '€ 240',
    realPrice: '€ 2.600',
    description: 'La borsa CarryAll MM, dal design femminile e moderno, è realizzata in tela Monogram e rifinita in pelle naturale. Il comodo modello risulta abbastanza capiente da contenere gli oggetti essenziali in maniera ben organizzata, grazie alle pratiche tasche interne e alla pochette amovibile. Il manico, regolabile mediante un\'elegante fibbia con finitura dorata, consente molteplici opzioni di utilizzo. 39 x 30 x 15 cm (Lunghezza x Altezza x Larghezza )',
    images: ['/catalog/carryall-mm-1.jpeg', '/catalog/carryall-mm-2.jpeg', '/catalog/carryall-mm-3.jpeg'],
    alt: 'CarryAll MM',
  },
];
