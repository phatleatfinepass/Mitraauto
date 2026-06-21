export type SupportedBookingLanguage = 'fi' | 'en';

export interface LocalizedServiceCategory {
  id: string;
  name: string;
  services: {
    id: string;
    name: string;
    price: number;
  }[];
}

export interface ServiceCatalogEntry {
  id: string;
  categoryId: string;
  name: {
    fi: string;
    en: string;
  };
  price: number;
}

export const OTHER_SERVICE_CATEGORY_ID = 'other';
export const OTHER_SERVICE_ID = 'other';

const SERVICE_ALIASES: Record<string, string> = {
  'basic service': 'annual-maintenance',
  'large service': 'annual-maintenance',
  'tire storage plan': 'tire-hotel-storage',
  'tire hotel': 'tire-hotel-storage',
  'scheduled maintenance': 'annual-maintenance',
  'määräaikaishuolto': 'annual-maintenance',
  'dpf pesu': 'dpf-cleaning-2014-newer',
  'dpf-pesu': 'dpf-cleaning-2014-newer',
  'hiukkassuodattimen pesu': 'dpf-cleaning-2014-newer',
  'pakkopoltto': 'dpf-forced-regeneration',
  'pakotettu regenerointi': 'dpf-forced-regeneration',
  'muu': OTHER_SERVICE_ID,
  'other': OTHER_SERVICE_ID,
};

export function detectStoredServiceLanguage(
  storedServiceName: string | null | undefined,
): SupportedBookingLanguage | null {
  if (!storedServiceName) return null;

  const parts = storedServiceName
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;

  let fiMatches = 0;
  let enMatches = 0;

  for (const part of parts) {
    const normalizedPart = normalizeServiceName(part);
    const service = SERVICE_CATALOG.find((entry) =>
      normalizeServiceName(entry.name.fi) === normalizedPart ||
      normalizeServiceName(entry.name.en) === normalizedPart,
    );

    if (!service) continue;
    if (normalizeServiceName(service.name.fi) === normalizedPart) fiMatches += 1;
    if (normalizeServiceName(service.name.en) === normalizedPart) enMatches += 1;
  }

  if (fiMatches === 0 && enMatches === 0) return null;
  return enMatches > fiMatches ? 'en' : 'fi';
}

export const CATEGORY_NAMES: Record<string, { fi: string; en: string }> = {
  'car-care': { fi: 'Autonhoitopalvelut', en: 'Car Care' },
  'tire-services': { fi: 'Rengaspalvelut', en: 'Tire Services' },
  'diagnostics-maintenance': { fi: 'Diagnostiikka & huoltopalvelut', en: 'Diagnostics & Maintenance' },
  'ac-service': { fi: 'Ilmastointihuolto', en: 'AC Service' },
  'dpf-service': { fi: 'DPF- ja päästöjärjestelmäpalvelut', en: 'DPF & Emissions Service' },
  [OTHER_SERVICE_CATEGORY_ID]: { fi: 'Muu', en: 'Other' },
};

export const SERVICE_CATALOG: ServiceCatalogEntry[] = [
  { id: 'basic-hand-wash-car', categoryId: 'car-care', name: { fi: 'Perus käsipesu · Henkilöauto', en: 'Basic hand wash · Passenger car' }, price: 25 },
  { id: 'basic-hand-wash-suv', categoryId: 'car-care', name: { fi: 'Perus käsipesu · Maasturi', en: 'Basic hand wash · SUV' }, price: 30 },
  { id: 'quick-wax-car', categoryId: 'car-care', name: { fi: 'Käsinpesu + pikavaha · Henkilöauto', en: 'Hand wash + quick wax · Passenger car' }, price: 30 },
  { id: 'quick-wax-suv', categoryId: 'car-care', name: { fi: 'Käsinpesu + pikavaha · Maasturi', en: 'Hand wash + quick wax · SUV' }, price: 40 },
  { id: 'interior-cleaning-car', categoryId: 'car-care', name: { fi: 'Sisäpuhdistus · Henkilöauto', en: 'Interior cleaning · Passenger car' }, price: 40 },
  { id: 'interior-cleaning-suv', categoryId: 'car-care', name: { fi: 'Sisäpuhdistus · Maasturi', en: 'Interior cleaning · SUV' }, price: 50 },
  { id: 'super-exterior-wash-car', categoryId: 'car-care', name: { fi: 'Super ulkopesu · Henkilöauto', en: 'Premium exterior wash · Passenger car' }, price: 45 },
  { id: 'super-exterior-wash-suv', categoryId: 'car-care', name: { fi: 'Super ulkopesu · Maasturi', en: 'Premium exterior wash · SUV' }, price: 55 },
  { id: 'hard-wax-car', categoryId: 'car-care', name: { fi: 'Kovavahaus · Henkilöauto', en: 'Hard wax protection · Passenger car' }, price: 110 },
  { id: 'hard-wax-suv', categoryId: 'car-care', name: { fi: 'Kovavahaus · Maasturi', en: 'Hard wax protection · SUV' }, price: 130 },
  { id: 'engine-wash', categoryId: 'car-care', name: { fi: 'Moottoripesu', en: 'Engine wash' }, price: 60 },
  { id: 'wheel-wash-set', categoryId: 'car-care', name: { fi: 'Vanteiden pesu', en: 'Wheel wash' }, price: 10 },
  { id: 'tire-change-car', categoryId: 'tire-services', name: { fi: 'Renkaiden vaihto – Henkilöauto', en: 'Tire change – Passenger car' }, price: 30 },
  { id: 'tire-change-suv', categoryId: 'tire-services', name: { fi: 'Renkaiden vaihto – Maasturi', en: 'Tire change – SUV' }, price: 35 },
  { id: 'tire-change-van', categoryId: 'tire-services', name: { fi: 'Renkaiden vaihto – Pakettiauto', en: 'Tire change – Van' }, price: 45 },
  { id: 'wheel-balancing', categoryId: 'tire-services', name: { fi: 'Tasapainotus', en: 'Wheel balancing' }, price: 20 },
  { id: 'tire-repair-outside', categoryId: 'tire-services', name: { fi: 'Rengaspaikkaus ulkopuolelta', en: 'External tire repair' }, price: 25 },
  { id: 'tire-repair-inside', categoryId: 'tire-services', name: { fi: 'Rengaspaikkaus sisäpuolelta', en: 'Internal tire repair' }, price: 50 },
  { id: 'tire-work-up-to-17', categoryId: 'tire-services', name: { fi: 'Rengastyö – Henkilöauto max. 17"', en: 'Tire work – Passenger car up to 17"' }, price: 80 },
  { id: 'tire-work-18-19', categoryId: 'tire-services', name: { fi: 'Rengastyö – Henkilöauto 18"–19"', en: 'Tire work – Passenger car 18"–19"' }, price: 90 },
  { id: 'tire-work-20-21', categoryId: 'tire-services', name: { fi: 'Rengastyö – Henkilöauto 20"–21"', en: 'Tire work – Passenger car 20"–21"' }, price: 100 },
  { id: 'tire-hotel-storage', categoryId: 'tire-services', name: { fi: 'Rengashotelli', en: 'Tire hotel storage' }, price: 60 },
  { id: 'error-code-reading', categoryId: 'diagnostics-maintenance', name: { fi: 'Vikakoodien luku', en: 'Error code reading' }, price: 20 },
  { id: 'troubleshooting', categoryId: 'diagnostics-maintenance', name: { fi: 'Vianetsintä', en: 'Troubleshooting' }, price: 80 },
  { id: 'engine-oil-change', categoryId: 'diagnostics-maintenance', name: { fi: 'Moottoriöljynvaihto', en: 'Engine oil change' }, price: 80 },
  { id: 'seasonal-maintenance', categoryId: 'diagnostics-maintenance', name: { fi: 'Kausihuolto', en: 'Seasonal maintenance' }, price: 120 },
  { id: 'annual-maintenance', categoryId: 'diagnostics-maintenance', name: { fi: 'Määräaikaishuolto', en: 'Scheduled maintenance' }, price: 170 },
  { id: 'manual-gearbox-oil', categoryId: 'diagnostics-maintenance', name: { fi: 'Manuaalivaihteiston öljyn vaihto', en: 'Manual gearbox oil change' }, price: 80 },
  { id: 'automatic-gearbox-oil', categoryId: 'diagnostics-maintenance', name: { fi: 'Automaattivaihteiston öljyn vaihto', en: 'Automatic gearbox oil change' }, price: 180 },
  { id: 'automatic-gearbox-flush', categoryId: 'diagnostics-maintenance', name: { fi: 'Automaattivaihteiston öljyn vaihto huuhtelulla', en: 'Automatic gearbox oil change with flush' }, price: 220 },
  { id: 'brake-fluid', categoryId: 'diagnostics-maintenance', name: { fi: 'Jarrunesteen vaihto', en: 'Brake fluid change' }, price: 65 },
  { id: 'pedal-installation', categoryId: 'diagnostics-maintenance', name: { fi: 'Opetuspoljin asennus', en: 'Pedal installation for learner cars' }, price: 260 },
  { id: 'rust-repair', categoryId: 'diagnostics-maintenance', name: { fi: 'Ruostekorjaukset / hitsaustyöt', en: 'Rust repair / welding work' }, price: 80 },
  { id: 'ac-service-r134a', categoryId: 'ac-service', name: { fi: 'Ilmastointihuolto (R134a)', en: 'AC service (R134a)' }, price: 60 },
  { id: 'ac-extra-refrigerant', categoryId: 'ac-service', name: { fi: 'Ylimenevä kylmäaine', en: 'Extra refrigerant' }, price: 10 },
  { id: 'ac-hybrid-extra-r134a', categoryId: 'ac-service', name: { fi: 'Hybridiauto lisä', en: 'Hybrid surcharge' }, price: 15 },
  { id: 'ac-service-r1234yf', categoryId: 'ac-service', name: { fi: 'Ilmastointihuolto (R1234yf)', en: 'AC service (R1234yf)' }, price: 70 },
  { id: 'ac-hybrid-extra-r1234yf', categoryId: 'ac-service', name: { fi: 'Hybridiauto lisä', en: 'Hybrid surcharge' }, price: 15 },
  { id: 'ac-service-electric', categoryId: 'ac-service', name: { fi: 'Ilmastointihuolto (sähköauto)', en: 'AC service (electric vehicle)' }, price: 120 },
  { id: 'ac-diagnostics', categoryId: 'ac-service', name: { fi: 'Ilmastoinnin vianetsintä / vuototarkastus', en: 'AC diagnostics / leak check' }, price: 80 },
  { id: 'dpf-diagnosis', categoryId: 'dpf-service', name: { fi: 'DPF-diagnoosipaketti', en: 'DPF diagnosis package' }, price: 80 },
  { id: 'dpf-forced-regeneration', categoryId: 'dpf-service', name: { fi: 'Pakkopoltto / pakotettu regenerointi', en: 'Forced DPF regeneration' }, price: 160 },
  { id: 'dpf-cleaning-2002-2008', categoryId: 'dpf-service', name: { fi: 'DPF-pesu · vuosimallit 2002–2008', en: 'DPF cleaning · model years 2002–2008' }, price: 160 },
  { id: 'dpf-cleaning-2009-2013', categoryId: 'dpf-service', name: { fi: 'DPF-pesu · vuosimallit 2009–2013', en: 'DPF cleaning · model years 2009–2013' }, price: 240 },
  { id: 'dpf-cleaning-2014-newer', categoryId: 'dpf-service', name: { fi: 'DPF-pesu · vuosimalli 2014 ja uudemmat', en: 'DPF cleaning · model year 2014 and newer' }, price: 340 },
  { id: 'dpf-removal-installation-estimate', categoryId: 'dpf-service', name: { fi: 'DPF irrotus ja asennus · autokohtainen arvio', en: 'DPF removal and installation · vehicle-specific estimate' }, price: 0 },
  { id: OTHER_SERVICE_ID, categoryId: OTHER_SERVICE_CATEGORY_ID, name: { fi: 'Muu', en: 'Other' }, price: 0 },
];

export function getLocalizedServiceCategories(language: SupportedBookingLanguage): LocalizedServiceCategory[] {
  return Object.entries(CATEGORY_NAMES).map(([id, names]) => ({
    id,
    name: names[language],
    services: SERVICE_CATALOG
      .filter((service) => service.categoryId === id)
      .map((service) => ({
        id: service.id,
        name: service.name[language],
        price: service.price,
      })),
  }));
}

export function getLocalizedServiceNameById(serviceId: string, language: SupportedBookingLanguage): string | null {
  const service = SERVICE_CATALOG.find((entry) => entry.id === serviceId);
  return service ? service.name[language] : null;
}

export function getServiceCatalogEntryById(serviceId: string): ServiceCatalogEntry | null {
  return SERVICE_CATALOG.find((entry) => entry.id === serviceId) ?? null;
}

function normalizeServiceName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/\s*·\s*/g, ' · ')
    .replace(/\s*-\s*/g, ' - ');
}

function findServiceByAnyLocalizedName(name: string): ServiceCatalogEntry | null {
  const normalizedName = normalizeServiceName(name);
  const aliasId = SERVICE_ALIASES[normalizedName];
  if (aliasId) {
    return SERVICE_CATALOG.find((service) => service.id === aliasId) || null;
  }
  return (
    SERVICE_CATALOG.find((service) =>
      normalizeServiceName(service.name.fi) === normalizedName ||
      normalizeServiceName(service.name.en) === normalizedName,
    ) || null
  );
}

export function getServiceIdsFromStoredServiceName(
  storedServiceName: string | null | undefined,
): string[] {
  if (!storedServiceName) return [];

  return storedServiceName
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => findServiceByAnyLocalizedName(part)?.id || null)
    .filter((id): id is string => Boolean(id));
}

export function localizeStoredServiceName(
  storedServiceName: string | null | undefined,
  language: SupportedBookingLanguage,
): string {
  if (!storedServiceName) return '';

  return storedServiceName
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => findServiceByAnyLocalizedName(part)?.name[language] || part)
    .join(', ');
}
