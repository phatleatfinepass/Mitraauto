import { CATEGORY_NAMES, SERVICE_CATALOG, getServiceCatalogEntryById } from '../../utils/serviceCatalog';

export type ServiceSeoPageId =
  | 'car-service'
  | 'tire-change'
  | 'tire-hotel'
  | 'diagnostics'
  | 'car-wash'
  | 'ac-service'
  | 'dpf-service'
  | 'oil-change'
  | 'wheel-balancing'
  | 'tire-repair';

export type ServiceSeoLanguage = 'fi' | 'en';

export type ServiceSeoPage = {
  id: ServiceSeoPageId;
  primaryServiceId: string;
  relatedServiceIds: string[];
  imageKey: 'maintenance' | 'tires' | 'wash';
  paths: string[];
  copy: Record<ServiceSeoLanguage, {
    title: string;
    metaTitle: string;
    metaDescription: string;
    eyebrow: string;
    subtitle: string;
    summary: string;
    priceLabel: string;
    durationLabel: string;
    cta: string;
    secondaryCta: string;
    includedTitle: string;
    included: string[];
    processTitle: string;
    process: string[];
    pricingTitle: string;
    pricing: Array<{ name: string; price: string; note: string }>;
    faqTitle: string;
    faq: Array<{ question: string; answer: string }>;
    relatedTitle: string;
  }>;
};

export type ServiceSeoEvidence = {
  durationValue: string;
  notIncludedTitle: string;
  notIncluded: string[];
  eligibilityTitle: string;
  eligibility: string[];
  safetyTitle: string;
  safetyLimitations: string[];
  aftercareTitle: string;
  aftercare: string[];
};

export type ResolvedServiceDetail =
  | { kind: 'bespoke'; pageId: ServiceSeoPageId; language: ServiceSeoLanguage }
  | { kind: 'generated'; serviceId: string; language: ServiceSeoLanguage };

export type ServiceSeoRouteRegistryEntry = {
  serviceId: string;
  pageId: ServiceSeoPageId | null;
  publicRouteKind: 'bespoke_indexable' | 'generated_noindex';
  promotedInPublicNavigation: boolean;
  sitemapIncluded: boolean;
  canonicalPolicy: string;
};

export const serviceSeoPages: ServiceSeoPage[] = [
  {
    id: 'car-service',
    primaryServiceId: 'annual-maintenance',
    relatedServiceIds: ['seasonal-maintenance', 'engine-oil-change', 'brake-fluid', 'error-code-reading'],
    imageKey: 'maintenance',
    paths: ['/palvelut/autohuolto', '/helsinki/autohuolto', '/en/services/car-service', '/en/helsinki/car-service'],
    copy: {
      fi: {
        title: 'Autohuolto Helsingissä',
        metaTitle: 'Autohuolto Helsinki | Määräaikaishuolto ja korjaamo | Mitra Auto',
        metaDescription: 'Varaa autohuolto Helsingissä Mitra Autolta. Määräaikaishuolto, öljynvaihto, jarrut, diagnostiikka ja kausihuolto samasta korjaamosta.',
        eyebrow: 'Korjaamo Helsingissä',
        subtitle: 'Selkeä autohuolto, jossa tarkistamme auton kunnon, huollamme tärkeät järjestelmät ja kerromme ennen lisätöitä mitä autolle kannattaa tehdä.',
        summary: 'Mitra Auto tekee henkilöautojen huollot ja korjaukset Helsingissä. Palvelu sopii määräaikaishuoltoon, kausihuoltoon, öljynvaihtoon, vikojen selvitykseen ja jarrujen tarkastukseen.',
        priceLabel: 'Hinnat alkaen',
        durationLabel: 'Tyypillinen kesto',
        cta: 'Varaa autohuolto',
        secondaryCta: 'Katso hinnat',
        includedTitle: 'Mitä autohuoltoon voi sisältyä',
        included: ['Huoltokohteiden tarkastus auton tarpeen mukaan', 'Moottoriöljyn ja suodattimen vaihto', 'Jarrujen, valojen, renkaiden ja nesteiden tarkastus', 'Selkeä arvio lisätöistä ennen korjausta'],
        processTitle: 'Näin huolto etenee',
        process: ['Varaa aika ja kerro auton tiedot sekä oireet.', 'Tarkistamme auton ja vahvistamme tarvittavat työt.', 'Teemme sovitut huollot ja ilmoitamme, jos löytyy lisätarpeita.', 'Saat auton takaisin selkeän yhteenvedon kanssa.'],
        pricingTitle: 'Autohuollon hinnat',
        pricing: [
          { name: 'Moottoriöljynvaihto', price: 'alkaen 80 €', note: 'öljy ja suodatin auton mukaan' },
          { name: 'Kausihuolto', price: 'alkaen 120 €', note: 'tarkastus ennen talvea tai kesää' },
          { name: 'Määräaikaishuolto', price: 'alkaen 170 €', note: 'laajempi huolto auton huolto-ohjelman mukaan' },
        ],
        faqTitle: 'Usein kysyttyä autohuollosta',
        faq: [
          { question: 'Voinko varata huollon ilman tarkkaa vikakuvausta?', answer: 'Kyllä. Voit kertoa oireen lyhyesti, ja tarkennamme huoltotarpeen paikan päällä.' },
          { question: 'Ilmoitatteko ennen lisätöitä?', answer: 'Kyllä. Jos huollossa löytyy muuta korjattavaa, kerromme vaihtoehdot ja hinnan ennen työn jatkamista.' },
          { question: 'Huollatteko myös vanhempia autoja?', answer: 'Kyllä. Huollamme sekä uudempia että vanhempia henkilöautoja.' },
        ],
        relatedTitle: 'Muita huoltopalveluita',
      },
      en: {
        title: 'Car Service in Helsinki',
        metaTitle: 'Car Service Helsinki | Maintenance and Garage | Mitra Auto',
        metaDescription: 'Book car service in Helsinki with Mitra Auto. Scheduled maintenance, oil change, brakes, diagnostics and seasonal checks from one garage.',
        eyebrow: 'Garage in Helsinki',
        subtitle: 'Clear car maintenance where we inspect the vehicle, service the important systems and explain any extra work before we continue.',
        summary: 'Mitra Auto provides car maintenance and repairs in Helsinki. The service fits scheduled maintenance, seasonal checks, oil changes, fault finding and brake inspection.',
        priceLabel: 'Prices from',
        durationLabel: 'Typical duration',
        cta: 'Book car service',
        secondaryCta: 'See prices',
        includedTitle: 'What car service can include',
        included: ['Inspection based on the vehicle need', 'Engine oil and filter change', 'Brake, light, tire and fluid checks', 'Clear estimate before additional repairs'],
        processTitle: 'How the service works',
        process: ['Book a time and share the car details or symptoms.', 'We inspect the car and confirm the needed work.', 'We complete the agreed service and contact you if anything else is found.', 'You get the car back with a clear summary.'],
        pricingTitle: 'Car service prices',
        pricing: [
          { name: 'Engine oil change', price: 'from 80 €', note: 'oil and filter depend on vehicle' },
          { name: 'Seasonal maintenance', price: 'from 120 €', note: 'check before winter or summer' },
          { name: 'Scheduled maintenance', price: 'from 170 €', note: 'larger service based on vehicle program' },
        ],
        faqTitle: 'Car service FAQ',
        faq: [
          { question: 'Can I book service without knowing the exact problem?', answer: 'Yes. Tell us the symptom briefly and we will refine the service need at the garage.' },
          { question: 'Do you confirm extra work first?', answer: 'Yes. If we find additional repairs, we explain the options and price before continuing.' },
          { question: 'Do you service older cars?', answer: 'Yes. We service both newer and older passenger cars.' },
        ],
        relatedTitle: 'Related maintenance services',
      },
    },
  },
  {
    id: 'tire-change',
    primaryServiceId: 'tire-change-car',
    relatedServiceIds: ['tire-change-suv', 'tire-change-van', 'wheel-balancing', 'tire-hotel-storage'],
    imageKey: 'tires',
    paths: ['/palvelut/renkaanvaihto', '/helsinki/renkaanvaihto', '/en/services/tire-change', '/en/helsinki/tire-change'],
    copy: {
      fi: {
        title: 'Renkaanvaihto Helsingissä',
        metaTitle: 'Renkaanvaihto Helsinki | Henkilöauto, SUV ja pakettiauto | Mitra Auto',
        metaDescription: 'Varaa renkaanvaihto Helsingissä. Henkilöauto, SUV, pakettiauto, tasapainotus ja rengashotelli Mitra Autolta.',
        eyebrow: 'Rengaspalvelut',
        subtitle: 'Nopea renkaanvaihto henkilöautoille, maastureille ja pakettiautoille. Tarkistamme samalla renkaiden kunnon ja ilmanpaineet.',
        summary: 'Renkaanvaihto sopii kausivaihtoon, uusien renkaiden asennukseen ja tilanteisiin, joissa haluat tarkistaa renkaiden turvallisuuden ennen ajoa.',
        priceLabel: 'Hinnat alkaen',
        durationLabel: 'Tyypillinen kesto',
        cta: 'Varaa renkaanvaihto',
        secondaryCta: 'Katso rengaspalvelut',
        includedTitle: 'Mitä renkaanvaihdossa tarkistetaan',
        included: ['Renkaiden vaihto auton alle', 'Ilmanpaineiden tarkistus', 'Renkaiden ja vanteiden silmämääräinen tarkastus', 'Kiristyksen varmistus työn jälkeen'],
        processTitle: 'Näin renkaanvaihto etenee',
        process: ['Varaa aika sopivalle ajankohdalle.', 'Tuo renkaat mukana tai käytä rengashotellissa säilytettyjä renkaita.', 'Vaihdamme renkaat ja tarkistamme peruskunnon.', 'Saat suosituksen, jos renkaissa näkyy kulumaa tai vaurioita.'],
        pricingTitle: 'Renkaanvaihdon hinnat',
        pricing: [
          { name: 'Henkilöauto', price: '30 €', note: '4 renkaan vaihto' },
          { name: 'Maasturi / SUV', price: '35 €', note: 'suuremmat pyörät' },
          { name: 'Pakettiauto', price: 'alkaen 45 €', note: 'ajoneuvon mukaan' },
        ],
        faqTitle: 'Usein kysyttyä renkaanvaihdosta',
        faq: [
          { question: 'Tarvitsenko tasapainotuksen joka kerta?', answer: 'Tasapainotus kannattaa tehdä, jos renkaat täristävät, renkaat ovat uudet tai vanteissa on tehty rengastyötä.' },
          { question: 'Voinko tuoda omat renkaat?', answer: 'Kyllä. Voit tuoda omat renkaat tai käyttää rengashotellissa olevia renkaita.' },
          { question: 'Tarkistatteko renkaiden kunnon?', answer: 'Kyllä. Tarkistamme silmämääräisesti kuluman ja vauriot vaihdon yhteydessä.' },
        ],
        relatedTitle: 'Muita rengaspalveluita',
      },
      en: {
        title: 'Tire Change in Helsinki',
        metaTitle: 'Tire Change Helsinki | Passenger Car, SUV and Van | Mitra Auto',
        metaDescription: 'Book tire change in Helsinki. Passenger car, SUV, van, wheel balancing and tire hotel storage from Mitra Auto.',
        eyebrow: 'Tire services',
        subtitle: 'Fast tire change for passenger cars, SUVs and vans. We also check tire condition and air pressures.',
        summary: 'Tire change fits seasonal swaps, new tire installation and situations where you want a safety check before driving.',
        priceLabel: 'Prices from',
        durationLabel: 'Typical duration',
        cta: 'Book tire change',
        secondaryCta: 'See tire services',
        includedTitle: 'What we check during tire change',
        included: ['Changing wheels onto the car', 'Air pressure check', 'Visual tire and rim inspection', 'Final tightening after the work'],
        processTitle: 'How tire change works',
        process: ['Book a suitable time.', 'Bring your tires or use tires stored in our tire hotel.', 'We change the tires and check basic condition.', 'You get a recommendation if we see wear or damage.'],
        pricingTitle: 'Tire change prices',
        pricing: [
          { name: 'Passenger car', price: '30 €', note: '4 wheel change' },
          { name: 'SUV', price: '35 €', note: 'larger wheels' },
          { name: 'Van', price: 'from 45 €', note: 'depends on vehicle' },
        ],
        faqTitle: 'Tire change FAQ',
        faq: [
          { question: 'Do I need balancing every time?', answer: 'Balancing is recommended if the tires vibrate, the tires are new or tire work has been done on the rims.' },
          { question: 'Can I bring my own tires?', answer: 'Yes. You can bring your own tires or use tires stored in our tire hotel.' },
          { question: 'Do you check tire condition?', answer: 'Yes. We visually check wear and damage during the tire change.' },
        ],
        relatedTitle: 'Related tire services',
      },
    },
  },
  {
    id: 'tire-hotel',
    primaryServiceId: 'tire-hotel-storage',
    relatedServiceIds: ['tire-change-car', 'wheel-balancing', 'wheel-wash-set'],
    imageKey: 'tires',
    paths: ['/palvelut/rengashotelli', '/helsinki/rengashotelli', '/en/services/tire-hotel', '/en/helsinki/tire-hotel'],
    copy: {
      fi: {
        title: 'Rengashotelli Helsingissä',
        metaTitle: 'Rengashotelli Helsinki | Renkaiden kausisäilytys | Mitra Auto',
        metaDescription: 'Rengashotelli Helsingissä. Säilytä renkaat turvallisesti ja varaa kausivaihto samasta paikasta.',
        eyebrow: 'Renkaiden säilytys',
        subtitle: 'Rengashotelli vapauttaa tilaa kotona ja tekee kausivaihdosta helpomman. Säilytämme renkaat ja autamme seuraavassa vaihdossa.',
        summary: 'Palvelu sopii, jos et halua kuljettaa renkaita itse tai säilyttää niitä kotona. Voit yhdistää säilytyksen renkaanvaihtoon ja pesuun.',
        priceLabel: 'Säilytys',
        durationLabel: 'Kausi',
        cta: 'Varaa rengashotelli',
        secondaryCta: 'Katso palvelu',
        includedTitle: 'Mitä rengashotelli sisältää',
        included: ['Renkaiden kausisäilytys', 'Renkaiden tunnistus ja kirjaus', 'Mahdollisuus yhdistää renkaanvaihtoon', 'Mahdollisuus vanteiden pesuun'],
        processTitle: 'Näin rengashotelli toimii',
        process: ['Tuo renkaat tai jätä ne renkaanvaihdon yhteydessä.', 'Kirjaamme renkaat ja säilytyspaikan.', 'Säilytämme renkaat seuraavaan kauteen.', 'Varaa seuraava vaihto, kun kausi vaihtuu.'],
        pricingTitle: 'Rengashotellin hinnat',
        pricing: [
          { name: 'Renkaiden säilytys', price: '60 € / kausi', note: '4 renkaan sarja' },
          { name: 'Renkaanvaihto', price: 'alkaen 30 €', note: 'ajoneuvon mukaan' },
          { name: 'Vanteiden pesu', price: '10 € / sarja', note: 'lisäpalvelu' },
        ],
        faqTitle: 'Usein kysyttyä rengashotellista',
        faq: [
          { question: 'Voinko yhdistää säilytyksen ja renkaanvaihdon?', answer: 'Kyllä. Rengashotelli toimii parhaiten yhdessä kausivaihdon kanssa.' },
          { question: 'Säilytättekö renkaat vanteilla?', answer: 'Kyllä. Säilytys on tarkoitettu tavalliselle neljän renkaan sarjalle vanteilla tai ilman.' },
          { question: 'Miten saan renkaat takaisin?', answer: 'Varaa aika etukäteen, niin renkaat ovat valmiina vaihtoa tai noutoa varten.' },
        ],
        relatedTitle: 'Rengashotelliin liittyvät palvelut',
      },
      en: {
        title: 'Tire Hotel in Helsinki',
        metaTitle: 'Tire Hotel Helsinki | Seasonal Tire Storage | Mitra Auto',
        metaDescription: 'Tire hotel in Helsinki. Store your tires safely and book seasonal tire change from the same garage.',
        eyebrow: 'Tire storage',
        subtitle: 'Tire hotel frees up space at home and makes seasonal tire changes easier. We store the tires and help with the next swap.',
        summary: 'This service fits drivers who do not want to transport or store tires at home. You can combine storage with tire change and wheel wash.',
        priceLabel: 'Storage',
        durationLabel: 'Season',
        cta: 'Book tire hotel',
        secondaryCta: 'See service',
        includedTitle: 'What tire hotel includes',
        included: ['Seasonal tire storage', 'Tire identification and registration', 'Option to combine with tire change', 'Option to add wheel wash'],
        processTitle: 'How tire hotel works',
        process: ['Bring the tires or leave them during tire change.', 'We register the tire set and storage location.', 'We store the tires until the next season.', 'Book the next change when the season turns.'],
        pricingTitle: 'Tire hotel prices',
        pricing: [
          { name: 'Tire storage', price: '60 € / season', note: 'set of 4 tires' },
          { name: 'Tire change', price: 'from 30 €', note: 'depends on vehicle' },
          { name: 'Wheel wash', price: '10 € / set', note: 'add-on service' },
        ],
        faqTitle: 'Tire hotel FAQ',
        faq: [
          { question: 'Can I combine storage and tire change?', answer: 'Yes. Tire hotel works best together with seasonal tire change.' },
          { question: 'Do you store tires with rims?', answer: 'Yes. Storage is for a normal set of four tires, with or without rims.' },
          { question: 'How do I get my tires back?', answer: 'Book a time in advance so the tires are ready for change or pickup.' },
        ],
        relatedTitle: 'Related tire hotel services',
      },
    },
  },
  {
    id: 'diagnostics',
    primaryServiceId: 'error-code-reading',
    relatedServiceIds: ['troubleshooting', 'annual-maintenance', 'engine-oil-change'],
    imageKey: 'maintenance',
    paths: ['/palvelut/vikadiagnostiikka', '/en/services/diagnostics'],
    copy: {
      fi: {
        title: 'Vikadiagnostiikka Helsingissä',
        metaTitle: 'Vikadiagnostiikka Helsinki | Vikakoodien luku ja vianetsintä | Mitra Auto',
        metaDescription: 'Vikadiagnostiikka Helsingissä. Vikakoodien luku, vianetsintä ja selkeä arvio jatkokorjauksista Mitra Autolta.',
        eyebrow: 'Vianetsintä',
        subtitle: 'Kun autossa palaa vikavalo tai oire tuntuu epäselvältä, diagnostiikka auttaa löytämään oikean korjaussuunnan.',
        summary: 'Teemme vikakoodien luvun ja tarvittaessa laajemman vianetsinnän. Kerromme löydökset selkeästi ja sovimme jatkotoimet ennen korjausta.',
        priceLabel: 'Hinnat alkaen',
        durationLabel: 'Tyypillinen kesto',
        cta: 'Varaa diagnostiikka',
        secondaryCta: 'Katso vianetsintä',
        includedTitle: 'Mitä diagnostiikka sisältää',
        included: ['Vikakoodien luku', 'Oireen tarkistus', 'Mahdollinen koestus tai lisämittaus', 'Jatkotoimenpiteiden suositus'],
        processTitle: 'Näin diagnostiikka etenee',
        process: ['Kerro oire tai vikavalo varauksen yhteydessä.', 'Luemme vikakoodit ja tarkistamme oireen.', 'Arvioimme todennäköisen syyn ja korjaustarpeen.', 'Sovimme jatkokorjauksen erikseen, jos sitä tarvitaan.'],
        pricingTitle: 'Diagnostiikan hinnat',
        pricing: [
          { name: 'Vikakoodien luku', price: '20 €', note: 'nopea perustarkistus' },
          { name: 'Vianetsintä', price: '80 € / h', note: 'laajempi selvitys' },
        ],
        faqTitle: 'Usein kysyttyä vikadiagnostiikasta',
        faq: [
          { question: 'Korjaako vikakoodien poisto ongelman?', answer: 'Yleensä ei. Vikakoodi kertoo suunnan, mutta syy pitää tarkistaa ennen pysyvää korjausta.' },
          { question: 'Voinko ajaa vikavalon palaessa?', answer: 'Se riippuu oireesta ja valosta. Jos auto käy huonosti tai punainen varoitusvalo palaa, ajoa kannattaa välttää.' },
          { question: 'Saanko hinta-arvion korjauksesta?', answer: 'Kyllä. Kerromme diagnostiikan löydökset ja arvion ennen jatkotöitä.' },
        ],
        relatedTitle: 'Vianetsintään liittyvät palvelut',
      },
      en: {
        title: 'Car Diagnostics in Helsinki',
        metaTitle: 'Car Diagnostics Helsinki | Error Code Reading and Troubleshooting | Mitra Auto',
        metaDescription: 'Car diagnostics in Helsinki. Error code reading, troubleshooting and clear repair recommendations from Mitra Auto.',
        eyebrow: 'Troubleshooting',
        subtitle: 'When a warning light is on or the symptom is unclear, diagnostics helps find the right repair direction.',
        summary: 'We read error codes and perform deeper troubleshooting when needed. You get a clear explanation before repair work continues.',
        priceLabel: 'Prices from',
        durationLabel: 'Typical duration',
        cta: 'Book diagnostics',
        secondaryCta: 'See troubleshooting',
        includedTitle: 'What diagnostics includes',
        included: ['Error code reading', 'Symptom check', 'Possible test drive or measurements', 'Recommended next steps'],
        processTitle: 'How diagnostics works',
        process: ['Tell us the symptom or warning light when booking.', 'We read error codes and verify the symptom.', 'We assess the likely cause and repair need.', 'Any follow-up repair is agreed separately.'],
        pricingTitle: 'Diagnostics prices',
        pricing: [
          { name: 'Error code reading', price: '20 €', note: 'quick basic check' },
          { name: 'Troubleshooting', price: '80 € / h', note: 'deeper diagnosis' },
        ],
        faqTitle: 'Diagnostics FAQ',
        faq: [
          { question: 'Does clearing codes fix the problem?', answer: 'Usually no. The code gives direction, but the cause should be checked for a lasting repair.' },
          { question: 'Can I drive with a warning light?', answer: 'It depends on the symptom and warning. Avoid driving if the car runs badly or a red warning light is on.' },
          { question: 'Will I get a repair estimate?', answer: 'Yes. We explain the findings and estimate before follow-up work.' },
        ],
        relatedTitle: 'Related troubleshooting services',
      },
    },
  },
  {
    id: 'car-wash',
    primaryServiceId: 'basic-hand-wash-car',
    relatedServiceIds: ['quick-wax-car', 'interior-cleaning-car', 'hard-wax-car', 'wheel-wash-set'],
    imageKey: 'wash',
    paths: ['/palvelut/autopesu', '/en/services/car-wash'],
    copy: {
      fi: {
        title: 'Autopesu Helsingissä',
        metaTitle: 'Autopesu Helsinki | Käsinpesu, sisäpuhdistus ja vahaus | Mitra Auto',
        metaDescription: 'Autopesu Helsingissä. Käsinpesu, sisäpuhdistus, pikavaha, kovavaha ja vanteiden pesu Mitra Autolta.',
        eyebrow: 'Autonhoito',
        subtitle: 'Käsin tehty auton pesu ja puhdistus, kun haluat siistin lopputuloksen ilman automaattipesun kiirettä.',
        summary: 'Autonhoitopalveluihin kuuluvat käsinpesu, sisäpuhdistus, pikavaha, kovavaha, moottoripesu ja vanteiden pesu.',
        priceLabel: 'Hinnat alkaen',
        durationLabel: 'Tyypillinen kesto',
        cta: 'Varaa autopesu',
        secondaryCta: 'Katso autonhoito',
        includedTitle: 'Autopesun vaihtoehdot',
        included: ['Ulkopesu käsin', 'Sisäpuhdistus', 'Pikavaha tai kovavaha', 'Vanteiden pesu lisäpalveluna'],
        processTitle: 'Näin autopesu etenee',
        process: ['Valitse pesu tai puhdistuspalvelu.', 'Tuot auton sovittuun aikaan.', 'Puhdistamme auton valitun palvelun mukaan.', 'Saat auton takaisin siistinä ja valmiina ajoon.'],
        pricingTitle: 'Autopesun hinnat',
        pricing: [
          { name: 'Perus käsipesu', price: 'alkaen 25 €', note: 'henkilöauto' },
          { name: 'Sisäpuhdistus', price: 'alkaen 40 €', note: 'henkilöauto' },
          { name: 'Kovavahaus', price: 'alkaen 110 €', note: 'henkilöauto' },
        ],
        faqTitle: 'Usein kysyttyä autopesusta',
        faq: [
          { question: 'Pesettekö auton käsin?', answer: 'Kyllä. Palvelut perustuvat käsin tehtävään pesuun ja puhdistukseen.' },
          { question: 'Voiko pesuun yhdistää vahauksen?', answer: 'Kyllä. Voit valita pikavahan tai kovavahauksen tarpeen mukaan.' },
          { question: 'Pesettekö myös vanteet?', answer: 'Kyllä. Vanteiden pesu on saatavilla erillisenä lisäpalveluna.' },
        ],
        relatedTitle: 'Muita autonhoitopalveluita',
      },
      en: {
        title: 'Car Wash in Helsinki',
        metaTitle: 'Car Wash Helsinki | Hand Wash, Interior Cleaning and Wax | Mitra Auto',
        metaDescription: 'Car wash in Helsinki. Hand wash, interior cleaning, quick wax, hard wax and wheel wash from Mitra Auto.',
        eyebrow: 'Car care',
        subtitle: 'Hand car wash and cleaning for drivers who want a clean result without a rushed automatic wash.',
        summary: 'Car care services include hand wash, interior cleaning, quick wax, hard wax, engine wash and wheel wash.',
        priceLabel: 'Prices from',
        durationLabel: 'Typical duration',
        cta: 'Book car wash',
        secondaryCta: 'See car care',
        includedTitle: 'Car wash options',
        included: ['Exterior hand wash', 'Interior cleaning', 'Quick wax or hard wax', 'Wheel wash as add-on'],
        processTitle: 'How car wash works',
        process: ['Choose the wash or cleaning service.', 'Bring the car at the booked time.', 'We clean the car according to the selected service.', 'You get the car back clean and ready to drive.'],
        pricingTitle: 'Car wash prices',
        pricing: [
          { name: 'Basic hand wash', price: 'from 25 €', note: 'passenger car' },
          { name: 'Interior cleaning', price: 'from 40 €', note: 'passenger car' },
          { name: 'Hard wax protection', price: 'from 110 €', note: 'passenger car' },
        ],
        faqTitle: 'Car wash FAQ',
        faq: [
          { question: 'Do you wash cars by hand?', answer: 'Yes. The services are based on hand washing and cleaning.' },
          { question: 'Can I add waxing?', answer: 'Yes. You can choose quick wax or hard wax protection.' },
          { question: 'Do you wash wheels too?', answer: 'Yes. Wheel wash is available as a separate add-on.' },
        ],
        relatedTitle: 'Related car care services',
      },
    },
  },
  {
    id: 'ac-service',
    primaryServiceId: 'ac-service-r134a',
    relatedServiceIds: ['ac-service-r1234yf', 'ac-service-electric', 'ac-diagnostics'],
    imageKey: 'maintenance',
    paths: ['/palvelut/ilmastointihuolto', '/en/services/ac-service'],
    copy: {
      fi: {
        title: 'Ilmastointihuolto Helsingissä',
        metaTitle: 'Ilmastointihuolto Helsinki | R134a, R1234yf ja sähköauto | Mitra Auto',
        metaDescription: 'Ilmastointihuolto Helsingissä. R134a, R1234yf, sähköautot, lisäkylmäaine ja ilmastoinnin vianetsintä Mitra Autolta.',
        eyebrow: 'Ilmastointi',
        subtitle: 'Huollamme auton ilmastoinnin, lisäämme kylmäaineen ja selvitämme vuodot tai jäähdytysongelmat tarvittaessa.',
        summary: 'Ilmastointihuolto auttaa pitämään matkustamon viileänä ja järjestelmän toimintakunnossa. Palvelemme myös hybridit ja sähköautot.',
        priceLabel: 'Hinnat alkaen',
        durationLabel: 'Tyypillinen kesto',
        cta: 'Varaa ilmastointihuolto',
        secondaryCta: 'Katso AC-palvelut',
        includedTitle: 'Mitä ilmastointihuollossa tehdään',
        included: ['Järjestelmän huolto kylmäainetyypin mukaan', 'Kylmäaineen lisäys hinnaston mukaan', 'Perustoiminnan tarkistus', 'Vianetsintä erikseen tarvittaessa'],
        processTitle: 'Näin ilmastointihuolto etenee',
        process: ['Selvitämme auton kylmäainetyypin.', 'Teemme sovitun ilmastointihuollon.', 'Lisäämme kylmäaineen hinnaston mukaan.', 'Jos järjestelmässä on vika, sovimme vianetsinnästä.'],
        pricingTitle: 'Ilmastointihuollon hinnat',
        pricing: [
          { name: 'AC R134a', price: '60 €', note: 'sis. 100 g kylmäainetta' },
          { name: 'AC R1234yf', price: '70 €', note: 'sis. 100 g kylmäainetta' },
          { name: 'Sähköauto', price: '120 €', note: 'R1234yf, sis. 100 g' },
        ],
        faqTitle: 'Usein kysyttyä ilmastointihuollosta',
        faq: [
          { question: 'Mistä tiedän kylmäainetyypin?', answer: 'Tarkistamme sen auton tiedoista tai järjestelmän merkinnöistä ennen huoltoa.' },
          { question: 'Miksi ilmastointi ei kylmennä?', answer: 'Syynä voi olla vähäinen kylmäaine, vuoto tai järjestelmävika. Tarvittaessa teemme vianetsinnän.' },
          { question: 'Huollatteko sähköautojen ilmastointeja?', answer: 'Kyllä. Sähköautojen ilmastointihuolto on omana palvelunaan.' },
        ],
        relatedTitle: 'Muita ilmastointipalveluita',
      },
      en: {
        title: 'AC Service in Helsinki',
        metaTitle: 'AC Service Helsinki | R134a, R1234yf and Electric Cars | Mitra Auto',
        metaDescription: 'AC service in Helsinki. R134a, R1234yf, electric cars, extra refrigerant and AC diagnostics from Mitra Auto.',
        eyebrow: 'Air conditioning',
        subtitle: 'We service car air conditioning, add refrigerant and troubleshoot leaks or cooling issues when needed.',
        summary: 'AC service helps keep the cabin cool and the system working. We also service hybrids and electric cars.',
        priceLabel: 'Prices from',
        durationLabel: 'Typical duration',
        cta: 'Book AC service',
        secondaryCta: 'See AC services',
        includedTitle: 'What AC service includes',
        included: ['Service based on refrigerant type', 'Refrigerant fill according to price list', 'Basic function check', 'Separate diagnostics if needed'],
        processTitle: 'How AC service works',
        process: ['We confirm the refrigerant type.', 'We perform the agreed AC service.', 'We add refrigerant according to price list.', 'If there is a fault, we agree diagnostics separately.'],
        pricingTitle: 'AC service prices',
        pricing: [
          { name: 'AC R134a', price: '60 €', note: 'includes 100 g refrigerant' },
          { name: 'AC R1234yf', price: '70 €', note: 'includes 100 g refrigerant' },
          { name: 'Electric car', price: '120 €', note: 'R1234yf, includes 100 g' },
        ],
        faqTitle: 'AC service FAQ',
        faq: [
          { question: 'How do I know the refrigerant type?', answer: 'We check it from the vehicle information or system label before service.' },
          { question: 'Why does AC not cool?', answer: 'The reason can be low refrigerant, a leak or a system fault. We can diagnose it if needed.' },
          { question: 'Do you service electric car AC systems?', answer: 'Yes. Electric car AC service is available as a separate service.' },
        ],
        relatedTitle: 'Related AC services',
      },
    },
  },
  {
    id: 'dpf-service',
    primaryServiceId: 'dpf-diagnosis',
    relatedServiceIds: [
      'dpf-forced-regeneration',
      'dpf-cleaning-2002-2008',
      'dpf-cleaning-2009-2013',
      'dpf-cleaning-2014-newer',
      'dpf-removal-installation-estimate',
    ],
    imageKey: 'maintenance',
    paths: ['/palvelut/dpf-huolto', '/palvelut/dpf-pesu', '/en/services/dpf-service', '/en/services/dpf-cleaning'],
    copy: {
      fi: {
        title: 'DPF-huolto ja hiukkassuodattimen pesu Helsingissä',
        metaTitle: 'DPF-pesu Helsinki | Pakkopoltto ja hiukkassuodatin | Mitra Auto',
        metaDescription: 'DPF-huolto Helsingissä. DPF-diagnoosi, pakkopoltto, hiukkassuodattimen pesu sekä irrotuksen ja asennuksen arvio Mitra Autolta.',
        eyebrow: 'DPF- ja päästöjärjestelmäpalvelut',
        subtitle: 'Kun DPF-valo palaa, auto menee vikatilaan tai teho katoaa, aloitamme diagnoosilla ja valitsemme turvallisen jatkotoimenpiteen auton kunnon mukaan.',
        summary: 'DPF-palvelu sopii dieselautolle, jossa hiukkassuodatin oireilee tukkeutumisesta. Jos suodatin on mekaanisesti ehjä ja ongelma johtuu noki- tai tuhkakertymästä, pakkopoltto tai DPF-pesu voi palauttaa toimintaa.',
        priceLabel: 'Hinnat alkaen',
        durationLabel: 'Tyypillinen kesto',
        cta: 'Varaa DPF-diagnoosi',
        secondaryCta: 'Katso DPF-hinnat',
        includedTitle: 'Milloin DPF-palvelu kannattaa tarkistaa',
        included: ['DPF-valo tai moottorin vikavalo palaa', 'Auto menee vikatilaan tai tehot katoavat', 'Katsastus tai päästöt aiheuttavat ongelmia', 'Epäilet hiukkassuodattimen tukkeutumista'],
        processTitle: 'Näin DPF-huolto etenee',
        process: ['Varaa DPF-diagnoosi ja kerro auton tiedot sekä oireet.', 'Luemme vikakoodit ja tarkistamme, voiko regeneroinnin tai pesun tehdä turvallisesti.', 'Teemme sovitun pakkopolton tai ohjaamme suodattimen pesuun, jos se on oikea ratkaisu.', 'Jos suodatin on erittäin tukossa tai järjestelmässä on muu vika, annamme jatkosuosituksen.'],
        pricingTitle: 'DPF-palveluiden hinnat',
        pricing: [
          { name: 'DPF-diagnoosipaketti', price: '80 €', note: 'vianmääritys ennen jatkotoimia' },
          { name: 'Pakkopoltto / pakotettu regenerointi', price: 'alkaen 160 €', note: 'yleensä noin 2-3 h ajoneuvosta riippuen' },
          { name: 'DPF-pesu 2002-2008', price: 'alkaen 160 €', note: 'irrallisen hiukkassuodattimen pesu' },
          { name: 'DPF-pesu 2009-2013', price: 'alkaen 240 €', note: 'irrallisen hiukkassuodattimen pesu' },
          { name: 'DPF-pesu 2014 ja uudemmat', price: 'alkaen 340 €', note: 'irrallisen hiukkassuodattimen pesu' },
          { name: 'Irrotus ja asennus', price: 'autokohtainen tarjous', note: 'hinnoitellaan auton merkin, mallin ja työn laajuuden mukaan' },
        ],
        faqTitle: 'Usein kysyttyä DPF-huollosta',
        faq: [
          { question: 'Riittääkö pakkopoltto aina?', answer: 'Ei aina. Jos suodatin on erittäin tukossa tai järjestelmässä on muu vika, pelkkä regenerointi ei välttämättä ratkaise ongelmaa.' },
          { question: 'Milloin DPF-pesu on järkevä?', answer: 'Pesu voi olla järkevä, jos suodatin on mekaanisesti ehjä ja ongelma johtuu noki- tai tuhkakertymästä.' },
          { question: 'Sisältyykö irrotus pesun hintaan?', answer: 'Ei. Pesuhinnat koskevat irrallista hiukkassuodatinta. Irrotus ja asennus arvioidaan auton mukaan.' },
        ],
        relatedTitle: 'Muita DPF-palveluita',
      },
      en: {
        title: 'DPF Service and Diesel Particulate Filter Cleaning in Helsinki',
        metaTitle: 'DPF Cleaning Helsinki | Forced Regeneration and DPF Service | Mitra Auto',
        metaDescription: 'DPF service in Helsinki. DPF diagnosis, forced regeneration, diesel particulate filter cleaning and removal/install estimate from Mitra Auto.',
        eyebrow: 'DPF & emissions service',
        subtitle: 'When the DPF light is on, the car enters limp mode or power is missing, we start with diagnosis and choose the safe next step based on vehicle condition.',
        summary: 'DPF service fits diesel cars showing signs of a blocked particulate filter. If the filter is mechanically intact and the issue is soot or ash buildup, forced regeneration or DPF cleaning may restore function.',
        priceLabel: 'Prices from',
        durationLabel: 'Typical duration',
        cta: 'Book DPF diagnosis',
        secondaryCta: 'See DPF prices',
        includedTitle: 'When to check DPF service',
        included: ['DPF light or engine warning light is on', 'The car enters limp mode or loses power', 'Inspection or emissions issues appear', 'You suspect the particulate filter is blocked'],
        processTitle: 'How DPF service works',
        process: ['Book DPF diagnosis and share vehicle details plus symptoms.', 'We read fault codes and check whether regeneration or cleaning can be done safely.', 'We perform the agreed forced regeneration or recommend filter cleaning when it is the right option.', 'If the filter is heavily blocked or another system fault exists, we give the next recommendation.'],
        pricingTitle: 'DPF service prices',
        pricing: [
          { name: 'DPF diagnosis package', price: '80 €', note: 'fault finding before next action' },
          { name: 'Forced DPF regeneration', price: 'from 160 €', note: 'usually around 2-3 h depending on vehicle' },
          { name: 'DPF cleaning 2002-2008', price: 'from 160 €', note: 'cleaning of removed particulate filter' },
          { name: 'DPF cleaning 2009-2013', price: 'from 240 €', note: 'cleaning of removed particulate filter' },
          { name: 'DPF cleaning 2014 and newer', price: 'from 340 €', note: 'cleaning of removed particulate filter' },
          { name: 'Removal and installation', price: 'vehicle-specific quote', note: 'priced by make, model and work scope' },
        ],
        faqTitle: 'DPF service FAQ',
        faq: [
          { question: 'Is forced regeneration always enough?', answer: 'No. If the filter is heavily blocked or another system fault exists, regeneration alone may not solve the issue.' },
          { question: 'When does DPF cleaning make sense?', answer: 'Cleaning can make sense when the filter is mechanically intact and the issue is soot or ash buildup.' },
          { question: 'Is removal included in the cleaning price?', answer: 'No. Cleaning prices apply to a removed particulate filter. Removal and installation are estimated by vehicle.' },
        ],
        relatedTitle: 'Related DPF services',
      },
    },
  },
  {
    id: 'oil-change',
    primaryServiceId: 'engine-oil-change',
    relatedServiceIds: ['annual-maintenance', 'seasonal-maintenance', 'manual-gearbox-oil', 'automatic-gearbox-oil'],
    imageKey: 'maintenance',
    paths: ['/palvelut/oljynvaihto', '/en/services/oil-change'],
    copy: {
      fi: {
        title: 'Öljynvaihto Helsingissä',
        metaTitle: 'Öljynvaihto Helsinki | Moottoriöljy ja suodatin | Mitra Auto',
        metaDescription: 'Öljynvaihto Helsingissä. Moottoriöljyn ja suodattimen vaihto sekä huoltotarkistus Mitra Autolta.',
        eyebrow: 'Moottorihuolto',
        subtitle: 'Säännöllinen öljynvaihto suojaa moottoria ja auttaa pitämään auton luotettavana.',
        summary: 'Öljynvaihdossa vaihdamme moottoriöljyn ja suodattimen auton tarpeen mukaan. Samalla voidaan tarkistaa nesteet ja muut peruskohteet.',
        priceLabel: 'Hinnat alkaen',
        durationLabel: 'Tyypillinen kesto',
        cta: 'Varaa öljynvaihto',
        secondaryCta: 'Katso huollot',
        includedTitle: 'Mitä öljynvaihtoon kuuluu',
        included: ['Moottoriöljyn vaihto', 'Öljynsuodattimen vaihto', 'Öljylaadun valinta auton mukaan', 'Perustarkistus tarvittaessa'],
        processTitle: 'Näin öljynvaihto etenee',
        process: ['Varaa aika ja kerro auton tiedot.', 'Valitsemme autoon sopivan öljyn ja suodattimen.', 'Vaihdamme öljyn ja tarkistamme perusasiat.', 'Saat tiedon mahdollisista lisätarpeista.'],
        pricingTitle: 'Öljynvaihdon hinnat',
        pricing: [
          { name: 'Moottoriöljynvaihto', price: 'alkaen 80 €', note: 'öljy ja suodatin auton mukaan' },
          { name: 'Manuaalivaihteiston öljy', price: 'alkaen 80 €', note: 'ajoneuvon mukaan' },
          { name: 'Automaattivaihteiston öljy', price: 'alkaen 180 €', note: 'ajoneuvon mukaan' },
        ],
        faqTitle: 'Usein kysyttyä öljynvaihdosta',
        faq: [
          { question: 'Kuinka usein öljyt pitää vaihtaa?', answer: 'Noudata auton huolto-ohjelmaa. Jos ajat paljon lyhyttä ajoa, vaihto voi olla tarpeen aiemmin.' },
          { question: 'Sisältyykö suodatin hintaan?', answer: 'Hinta riippuu autosta, öljystä ja suodattimesta. Vahvistamme kokonaisuuden ennen työtä.' },
          { question: 'Voiko öljynvaihdon yhdistää huoltoon?', answer: 'Kyllä. Öljynvaihto voidaan yhdistää kausi- tai määräaikaishuoltoon.' },
        ],
        relatedTitle: 'Muita öljy- ja huoltopalveluita',
      },
      en: {
        title: 'Oil Change in Helsinki',
        metaTitle: 'Oil Change Helsinki | Engine Oil and Filter | Mitra Auto',
        metaDescription: 'Oil change in Helsinki. Engine oil and filter change plus maintenance checks from Mitra Auto.',
        eyebrow: 'Engine maintenance',
        subtitle: 'Regular oil change protects the engine and helps keep the car reliable.',
        summary: 'We change engine oil and filter according to the vehicle need. Fluids and basic checks can be done at the same time.',
        priceLabel: 'Prices from',
        durationLabel: 'Typical duration',
        cta: 'Book oil change',
        secondaryCta: 'See maintenance',
        includedTitle: 'What oil change includes',
        included: ['Engine oil change', 'Oil filter change', 'Correct oil grade for the vehicle', 'Basic check when needed'],
        processTitle: 'How oil change works',
        process: ['Book a time and share vehicle details.', 'We choose suitable oil and filter.', 'We change the oil and check basics.', 'You get information about possible additional needs.'],
        pricingTitle: 'Oil change prices',
        pricing: [
          { name: 'Engine oil change', price: 'from 80 €', note: 'oil and filter depend on vehicle' },
          { name: 'Manual gearbox oil', price: 'from 80 €', note: 'depends on vehicle' },
          { name: 'Automatic gearbox oil', price: 'from 180 €', note: 'depends on vehicle' },
        ],
        faqTitle: 'Oil change FAQ',
        faq: [
          { question: 'How often should oil be changed?', answer: 'Follow the vehicle service program. Heavy short-distance driving may require earlier changes.' },
          { question: 'Is the filter included?', answer: 'The final price depends on vehicle, oil and filter. We confirm it before the work.' },
          { question: 'Can oil change be combined with service?', answer: 'Yes. Oil change can be combined with seasonal or scheduled maintenance.' },
        ],
        relatedTitle: 'Related oil and maintenance services',
      },
    },
  },
  {
    id: 'wheel-balancing',
    primaryServiceId: 'wheel-balancing',
    relatedServiceIds: ['tire-change-car', 'tire-work-up-to-17', 'tire-work-18-19', 'tire-work-20-21'],
    imageKey: 'tires',
    paths: ['/palvelut/tasapainotus', '/en/services/wheel-balancing'],
    copy: {
      fi: {
        title: 'Renkaiden tasapainotus Helsingissä',
        metaTitle: 'Renkaiden tasapainotus Helsinki | Tärinän poisto | Mitra Auto',
        metaDescription: 'Renkaiden tasapainotus Helsingissä. Poista tärinä ja paranna ajomukavuutta Mitra Auton rengaspalvelussa.',
        eyebrow: 'Rengastyöt',
        subtitle: 'Tasapainotus auttaa, kun auto täristää, ratti värisee tai renkaisiin on tehty rengastyö.',
        summary: 'Tasapainotamme pyörät rengastöiden ja kausivaihtojen yhteydessä tai erillisenä palveluna.',
        priceLabel: 'Hinta',
        durationLabel: 'Tyypillinen kesto',
        cta: 'Varaa tasapainotus',
        secondaryCta: 'Katso rengastyöt',
        includedTitle: 'Milloin tasapainotus kannattaa',
        included: ['Ratti tärisee ajossa', 'Renkaat tai vanteet on vaihdettu', 'Uudet renkaat asennetaan vanteille', 'Ajomukavuus on heikentynyt'],
        processTitle: 'Näin tasapainotus etenee',
        process: ['Tarkistamme pyörän ja vanteen.', 'Tasapainotamme pyörän laitteella.', 'Lisäämme painot tarvittaviin kohtiin.', 'Varmistamme lopputuloksen ennen luovutusta.'],
        pricingTitle: 'Tasapainotuksen hinnat',
        pricing: [
          { name: 'Tasapainotus', price: '20 € / sarja', note: '4 pyörän sarja' },
          { name: 'Rengastyö max 17"', price: '80 €', note: 'asennus vanteille' },
          { name: 'Rengastyö 18"-19"', price: '90 €', note: 'asennus vanteille' },
        ],
        faqTitle: 'Usein kysyttyä tasapainotuksesta',
        faq: [
          { question: 'Mistä tiedän, että renkaat ovat epätasapainossa?', answer: 'Yleinen oire on tärinä tietyissä nopeuksissa tai ratin värinä.' },
          { question: 'Tarvitaanko tasapainotus uusille renkaille?', answer: 'Kyllä. Uudet renkaat tasapainotetaan asennuksen yhteydessä.' },
          { question: 'Voiko tasapainotuksen tehdä renkaanvaihdon yhteydessä?', answer: 'Kyllä. Se voidaan yhdistää renkaanvaihtoon tai rengastyöhön.' },
        ],
        relatedTitle: 'Muita rengastöitä',
      },
      en: {
        title: 'Wheel Balancing in Helsinki',
        metaTitle: 'Wheel Balancing Helsinki | Remove Tire Vibration | Mitra Auto',
        metaDescription: 'Wheel balancing in Helsinki. Reduce vibration and improve driving comfort with Mitra Auto tire service.',
        eyebrow: 'Tire work',
        subtitle: 'Balancing helps when the car vibrates, the steering wheel shakes or tire work has been done.',
        summary: 'We balance wheels during tire work and seasonal changes or as a separate service.',
        priceLabel: 'Price',
        durationLabel: 'Typical duration',
        cta: 'Book wheel balancing',
        secondaryCta: 'See tire work',
        includedTitle: 'When balancing helps',
        included: ['Steering wheel vibrates', 'Tires or rims have been changed', 'New tires are mounted on rims', 'Driving comfort has decreased'],
        processTitle: 'How balancing works',
        process: ['We check the wheel and rim.', 'We balance the wheel with equipment.', 'We add weights where needed.', 'We verify the result before handover.'],
        pricingTitle: 'Wheel balancing prices',
        pricing: [
          { name: 'Wheel balancing', price: '20 € / set', note: 'set of 4 wheels' },
          { name: 'Tire work up to 17"', price: '80 €', note: 'mounting on rims' },
          { name: 'Tire work 18"-19"', price: '90 €', note: 'mounting on rims' },
        ],
        faqTitle: 'Wheel balancing FAQ',
        faq: [
          { question: 'How do I know wheels are unbalanced?', answer: 'Common symptoms are vibration at certain speeds or steering wheel shake.' },
          { question: 'Do new tires need balancing?', answer: 'Yes. New tires are balanced during installation.' },
          { question: 'Can balancing be combined with tire change?', answer: 'Yes. It can be combined with tire change or tire work.' },
        ],
        relatedTitle: 'Related tire work',
      },
    },
  },
  {
    id: 'tire-repair',
    primaryServiceId: 'tire-repair-outside',
    relatedServiceIds: ['tire-repair-inside', 'tire-change-car', 'wheel-balancing'],
    imageKey: 'tires',
    paths: ['/palvelut/rengaspaikkaus', '/en/services/tire-repair'],
    copy: {
      fi: {
        title: 'Rengaspaikkaus Helsingissä',
        metaTitle: 'Rengaspaikkaus Helsinki | Ulko- ja sisäpaikkaus | Mitra Auto',
        metaDescription: 'Rengaspaikkaus Helsingissä. Tarkistamme vaurion ja korjaamme renkaan, jos paikkaus on turvallinen.',
        eyebrow: 'Renkaan korjaus',
        subtitle: 'Kun rengas vuotaa tai siihen on mennyt ruuvi, tarkistamme voiko renkaan korjata turvallisesti.',
        summary: 'Rengaspaikkaus riippuu vaurion sijainnista, renkaan kunnosta ja turvallisuudesta. Emme paikkaa rengasta, jos korjaus ei ole turvallinen.',
        priceLabel: 'Hinnat alkaen',
        durationLabel: 'Tyypillinen kesto',
        cta: 'Varaa rengaspaikkaus',
        secondaryCta: 'Katso rengaspalvelut',
        includedTitle: 'Mitä tarkistamme ennen paikkausta',
        included: ['Vaurion sijainti', 'Renkaan kulutuspinta', 'Renkaan sivualueen kunto', 'Onko korjaus turvallinen'],
        processTitle: 'Näin rengaspaikkaus etenee',
        process: ['Tarkistamme vuodon ja vaurion.', 'Arvioimme voiko renkaan paikata turvallisesti.', 'Teemme sovitun paikkauksen.', 'Kerromme, jos rengas kannattaa vaihtaa.'],
        pricingTitle: 'Rengaspaikkauksen hinnat',
        pricing: [
          { name: 'Ulkopuolinen paikkaus', price: '25 €', note: 'pieni korjaus' },
          { name: 'Sisäpuolinen paikkaus', price: '50 €', note: 'laajempi korjaus' },
          { name: 'Renkaanvaihto', price: 'alkaen 30 €', note: 'jos paikkaus ei ole turvallinen' },
        ],
        faqTitle: 'Usein kysyttyä rengaspaikkauksesta',
        faq: [
          { question: 'Voiko kaikki rengasvauriot paikata?', answer: 'Ei. Sivupinnan vauriot tai liian suuret vauriot eivät ole turvallisia paikata.' },
          { question: 'Kannattaako ajaa tyhjällä renkaalla?', answer: 'Ei. Tyhjällä ajaminen voi rikkoa renkaan rakenteen ja tehdä korjauksesta mahdottoman.' },
          { question: 'Tarkistatteko renkaan ennen korjausta?', answer: 'Kyllä. Korjaus tehdään vain, jos se on turvallinen.' },
        ],
        relatedTitle: 'Muita rengaspalveluita',
      },
      en: {
        title: 'Tire Repair in Helsinki',
        metaTitle: 'Tire Repair Helsinki | External and Internal Repair | Mitra Auto',
        metaDescription: 'Tire repair in Helsinki. We inspect the damage and repair the tire if it is safe to do so.',
        eyebrow: 'Tire repair',
        subtitle: 'When a tire leaks or has a screw in it, we check whether it can be repaired safely.',
        summary: 'Tire repair depends on damage location, tire condition and safety. We do not repair a tire if the repair is not safe.',
        priceLabel: 'Prices from',
        durationLabel: 'Typical duration',
        cta: 'Book tire repair',
        secondaryCta: 'See tire services',
        includedTitle: 'What we check before repair',
        included: ['Damage location', 'Tread condition', 'Sidewall condition', 'Whether repair is safe'],
        processTitle: 'How tire repair works',
        process: ['We locate the leak and damage.', 'We assess if the tire can be repaired safely.', 'We complete the agreed repair.', 'We tell you if the tire should be replaced.'],
        pricingTitle: 'Tire repair prices',
        pricing: [
          { name: 'External repair', price: '25 €', note: 'small repair' },
          { name: 'Internal repair', price: '50 €', note: 'larger repair' },
          { name: 'Tire change', price: 'from 30 €', note: 'if repair is not safe' },
        ],
        faqTitle: 'Tire repair FAQ',
        faq: [
          { question: 'Can all tire damage be repaired?', answer: 'No. Sidewall damage or damage that is too large is not safe to repair.' },
          { question: 'Should I drive on a flat tire?', answer: 'No. Driving flat can damage the tire structure and make repair impossible.' },
          { question: 'Do you inspect the tire before repair?', answer: 'Yes. Repair is done only when it is safe.' },
        ],
        relatedTitle: 'Related tire services',
      },
    },
  },
];

export const serviceSeoPageById = Object.fromEntries(
  serviceSeoPages.map((page) => [page.id, page]),
) as Record<ServiceSeoPageId, ServiceSeoPage>;

const SERVICE_DETAIL_BY_SERVICE_ID = new Map<string, ServiceSeoPageId>();

for (const page of serviceSeoPages) {
  SERVICE_DETAIL_BY_SERVICE_ID.set(page.primaryServiceId, page.id);
}

export const serviceSeoRouteRegistry: ServiceSeoRouteRegistryEntry[] = SERVICE_CATALOG.map((service) => {
  const pageId = SERVICE_DETAIL_BY_SERVICE_ID.get(service.id) ?? null;
  const isPromoted = Boolean(pageId);
  return {
    serviceId: service.id,
    pageId,
    publicRouteKind: isPromoted ? 'bespoke_indexable' : 'generated_noindex',
    promotedInPublicNavigation: isPromoted,
    sitemapIncluded: isPromoted,
    canonicalPolicy: isPromoted
      ? 'Self-canonical promoted service detail page.'
      : 'Resolvable generated fallback with noindex, follow; not linked from public service navigation until approved unique content exists.',
  };
});

export function getServiceSeoPageByServiceId(serviceId: string): ServiceSeoPage | null {
  const pageId = SERVICE_DETAIL_BY_SERVICE_ID.get(serviceId);
  return pageId ? serviceSeoPageById[pageId] : null;
}

export function getPromotedServiceDetailPathForServiceId(serviceId: string, language: ServiceSeoLanguage): string | null {
  const page = getServiceSeoPageByServiceId(serviceId);
  if (!page) return null;

  const matcher: Record<ServiceSeoLanguage, (path: string) => boolean> = {
    fi: (path) => !path.startsWith('/en/'),
    en: (path) => path.startsWith('/en/'),
  };
  return page.paths.find(matcher[language]) ?? page.paths[0] ?? null;
}

export function getServiceDetailPathForServiceId(serviceId: string, language: ServiceSeoLanguage): string | null {
  const page = getServiceSeoPageByServiceId(serviceId);
  if (page) {
    const matcher: Record<ServiceSeoLanguage, (path: string) => boolean> = {
      fi: (path) => !path.startsWith('/en/'),
      en: (path) => path.startsWith('/en/'),
    };
    return page.paths.find(matcher[language]) ?? page.paths[0] ?? null;
  }

  const service = getServiceCatalogEntryById(serviceId);
  if (!service) return null;
  return { fi: `/palvelut/${serviceId}`, en: `/en/services/${serviceId}` }[language];
}

export function resolveServiceSeoPageByPath(path: string): ServiceSeoPage | null {
  const normalizedPath = path.length > 1 && path.endsWith('/') ? path.replace(/\/+$/, '') : path;
  return serviceSeoPages.find((page) => page.paths.includes(normalizedPath)) ?? null;
}

export function resolveServiceDetailByPath(path: string): ResolvedServiceDetail | null {
  const normalizedPath = path.length > 1 && path.endsWith('/') ? path.replace(/\/+$/, '') : path;
  const bespoke = serviceSeoPages.find((page) => page.paths.includes(normalizedPath));
  const language: ServiceSeoLanguage = normalizedPath.startsWith('/en/') ? 'en' : 'fi';
  if (bespoke) {
    return { kind: 'bespoke', pageId: bespoke.id, language };
  }

  const fallbackMatch = normalizedPath.match(/^\/(?:palvelut|en\/services)\/([^/]+)$/);
  if (!fallbackMatch) return null;
  const serviceId = decodeURIComponent(fallbackMatch[1]);
  return getServiceCatalogEntryById(serviceId) ? { kind: 'generated', serviceId, language } : null;
}

export function getServiceDetailPathForResolvedDetail(
  detail: ResolvedServiceDetail,
  language: ServiceSeoLanguage,
): string {
  if (detail.kind === 'generated') {
    return { fi: `/palvelut/${detail.serviceId}`, en: `/en/services/${detail.serviceId}` }[language];
  }

  const page = serviceSeoPageById[detail.pageId];
  const matcher: Record<ServiceSeoLanguage, (path: string) => boolean> = {
    fi: (path) => !path.startsWith('/en/'),
    en: (path) => path.startsWith('/en/'),
  };
  return page.paths.find(matcher[language]) ?? page.paths[0] ?? '/services';
}

const generatedCategoryCopy: Record<string, Record<ServiceSeoLanguage, {
  included: string[];
  process: string[];
  faq: Array<{ question: string; answer: string }>;
  summary: string;
}>> = {
  'car-care': {
    fi: {
      summary: 'Tämä autonhoitopalvelu sopii kuljettajalle, joka haluaa pitää auton siistinä, suojattuna ja miellyttävänä käyttää arjessa.',
      included: ['Palvelun mukainen käsittely', 'Auton kunnon silmämääräinen tarkistus', 'Selkeä hinta ennen työn aloitusta', 'Mahdollisuus yhdistää muihin autonhoitopalveluihin'],
      process: ['Varaa palvelu verkossa.', 'Tuo auto sovittuun aikaan.', 'Teemme valitun autonhoitotyön.', 'Saat auton takaisin sovitussa kunnossa.'],
      faq: [
        { question: 'Voinko yhdistää tämän muihin palveluihin?', answer: 'Kyllä. Autonhoitopalvelut voidaan usein yhdistää pesuun, vahaukseen tai vanteiden pesuun.' },
        { question: 'Sopiiko palvelu myös SUV-autolle?', answer: 'Kyllä. Joillekin ajoneuvoluokille on oma hinta, joka näkyy hinnastossa.' },
      ],
    },
    en: {
      summary: 'This car care service fits drivers who want to keep the vehicle clean, protected and pleasant to use every day.',
      included: ['Treatment according to selected service', 'Visual vehicle condition check', 'Clear price before work starts', 'Option to combine with other car care services'],
      process: ['Book the service online.', 'Bring the car at the agreed time.', 'We complete the selected car care work.', 'You get the car back in the agreed condition.'],
      faq: [
        { question: 'Can this be combined with other services?', answer: 'Yes. Car care services can often be combined with washing, waxing or wheel wash.' },
        { question: 'Does this fit SUVs too?', answer: 'Yes. Some vehicle classes have their own price shown in the price list.' },
      ],
    },
  },
  'tire-services': {
    fi: {
      summary: 'Tämä rengaspalvelu auttaa pitämään renkaat turvallisina, oikein asennettuina ja valmiina Suomen ajo-olosuhteisiin.',
      included: ['Renkaan tai pyörän työn mukainen käsittely', 'Renkaan kunnon silmämääräinen tarkistus', 'Ilmanpaineen tai asennuksen tarkistus tarvittaessa', 'Suositus, jos renkaassa näkyy kulumaa tai vaurioita'],
      process: ['Varaa aika rengaspalveluun.', 'Tuo auto tai rengassarja sovittuun aikaan.', 'Teemme valitun rengastyön.', 'Kerromme, jos turvallisuus vaatii lisätoimia.'],
      faq: [
        { question: 'Voinko tuoda omat renkaat?', answer: 'Kyllä. Voit tuoda omat renkaat tai käyttää Mitra Autolta hankittuja renkaita.' },
        { question: 'Tarkistatteko renkaan kunnon?', answer: 'Kyllä. Tarkistamme renkaan kunnon silmämääräisesti työn yhteydessä.' },
      ],
    },
    en: {
      summary: 'This tire service helps keep tires safe, correctly fitted and ready for Finnish driving conditions.',
      included: ['Tire or wheel handling according to service', 'Visual tire condition check', 'Air pressure or installation check when needed', 'Recommendation if wear or damage is visible'],
      process: ['Book a tire service time.', 'Bring the car or tire set at the agreed time.', 'We complete the selected tire work.', 'We tell you if safety requires additional action.'],
      faq: [
        { question: 'Can I bring my own tires?', answer: 'Yes. You can bring your own tires or use tires purchased from Mitra Auto.' },
        { question: 'Do you check tire condition?', answer: 'Yes. We visually check tire condition during the work.' },
      ],
    },
  },
  'diagnostics-maintenance': {
    fi: {
      summary: 'Tämä huoltopalvelu sopii auton toimintakunnon ylläpitoon, vikojen ehkäisyyn ja selkeään korjaustarpeen arviointiin.',
      included: ['Valitun huoltotyön suoritus', 'Auton perustarkistus työn yhteydessä', 'Tarvittavien osien tai nesteiden arvio', 'Ilmoitus ennen lisätöitä'],
      process: ['Varaa aika ja kerro auton tiedot.', 'Tarkistamme työn tarpeen.', 'Teemme sovitun huollon tai korjauksen.', 'Saat yhteenvedon ja mahdolliset jatkosuositukset.'],
      faq: [
        { question: 'Ilmoitatteko ennen lisätöitä?', answer: 'Kyllä. Lisätyöt sovitaan aina ennen työn jatkamista.' },
        { question: 'Voinko tulla epäselvän oireen kanssa?', answer: 'Kyllä. Voimme aloittaa tarkistuksella tai vianetsinnällä.' },
      ],
    },
    en: {
      summary: 'This maintenance service fits keeping the car reliable, preventing faults and getting a clear repair estimate.',
      included: ['Selected maintenance work', 'Basic vehicle check during the work', 'Assessment of needed parts or fluids', 'Confirmation before additional work'],
      process: ['Book a time and share vehicle details.', 'We confirm the service need.', 'We complete the agreed maintenance or repair.', 'You get a summary and possible follow-up recommendations.'],
      faq: [
        { question: 'Do you confirm extra work first?', answer: 'Yes. Additional work is always agreed before continuing.' },
        { question: 'Can I come with an unclear symptom?', answer: 'Yes. We can start with an inspection or troubleshooting.' },
      ],
    },
  },
  'ac-service': {
    fi: {
      summary: 'Tämä ilmastointipalvelu auttaa pitämään auton jäähdytyksen toimintakunnossa ja matkustamon miellyttävänä.',
      included: ['Valitun AC-palvelun suoritus', 'Kylmäainetyypin huomiointi', 'Perustoiminnan tarkistus', 'Tarvittaessa jatkosuositus vianetsintään'],
      process: ['Varaa ilmastointipalvelu.', 'Tarkistamme auton järjestelmätyypin.', 'Teemme sovitun huollon tai tarkistuksen.', 'Kerromme, jos järjestelmä vaatii lisäselvitystä.'],
      faq: [
        { question: 'Miksi ilmastointi ei kylmennä?', answer: 'Syynä voi olla kylmäaineen määrä, vuoto tai järjestelmävika.' },
        { question: 'Huollatteko hybridit ja sähköautot?', answer: 'Kyllä. Valitse oikea palvelu ajoneuvon mukaan.' },
      ],
    },
    en: {
      summary: 'This AC service helps keep the vehicle cooling system working and the cabin comfortable.',
      included: ['Selected AC service work', 'Correct refrigerant type considered', 'Basic function check', 'Follow-up recommendation when diagnostics is needed'],
      process: ['Book AC service.', 'We check the vehicle system type.', 'We complete the agreed service or check.', 'We tell you if the system needs deeper diagnosis.'],
      faq: [
        { question: 'Why does AC not cool?', answer: 'The reason can be refrigerant amount, a leak or a system fault.' },
        { question: 'Do you service hybrids and electric cars?', answer: 'Yes. Choose the correct service according to vehicle type.' },
      ],
    },
  },
  'dpf-service': {
    fi: {
      summary: 'Tämä DPF-palvelu auttaa selvittämään hiukkassuodattimen tukkeutumista, päästöongelmia ja regeneroinnin tarvetta.',
      included: ['DPF-oireen tai vikavalon tarkistus', 'Vikakoodien ja järjestelmän tilan arvio', 'Sopivan jatkotoimenpiteen suositus', 'Selkeä arvio ennen pesua, pakkopolttoa tai irrotustyötä'],
      process: ['Varaa aika ja kerro auton tiedot sekä oireet.', 'Tarkistamme vikakoodit ja DPF-järjestelmän kunnon.', 'Suosittelemme pakkopolttoa, pesua tai jatkoselvitystä tilanteen mukaan.', 'Sovimme mahdollisen irrotus- ja asennustyön erikseen.'],
      faq: [
        { question: 'Voiko DPF-ongelman ratkaista ilman pesua?', answer: 'Jos järjestelmä on kunnossa ja tukkeuma sopiva, pakkopoltto voi joskus riittää. Siksi diagnoosi tehdään ensin.' },
        { question: 'Miksi irrotus ja asennus hinnoitellaan erikseen?', answer: 'Työn määrä vaihtelee paljon auton merkin, mallin ja suodattimen sijainnin mukaan.' },
      ],
    },
    en: {
      summary: 'This DPF service helps diagnose particulate filter blockage, emissions issues and regeneration needs.',
      included: ['DPF symptom or warning light check', 'Fault code and system status assessment', 'Recommended next action', 'Clear estimate before cleaning, regeneration or removal work'],
      process: ['Book a time and share vehicle details plus symptoms.', 'We check fault codes and DPF system condition.', 'We recommend regeneration, cleaning or further diagnosis based on the situation.', 'Removal and installation work is agreed separately when needed.'],
      faq: [
        { question: 'Can a DPF issue be solved without cleaning?', answer: 'If the system is healthy and the blockage level is suitable, forced regeneration may sometimes be enough. This is why diagnosis comes first.' },
        { question: 'Why is removal and installation quoted separately?', answer: 'The work varies a lot by make, model and filter location.' },
      ],
    },
  },
};

export const serviceSeoEvidenceByPageId: Partial<Record<ServiceSeoPageId, Record<ServiceSeoLanguage, ServiceSeoEvidence>>> = {
  'car-service': {
    fi: {
      durationValue: 'Työn laajuus vahvistetaan varauksessa auton ja huoltotarpeen mukaan.',
      notIncludedTitle: 'Mikä sovitaan erikseen',
      notIncluded: ['Vikadiagnostiikka, jos huollossa löytyy erillinen oire', 'Osat tai korjaukset, joita ei ole hyväksytty ennen työn jatkamista', 'Katsastuskorjaukset, hitsaustyöt ja laajemmat vaihteisto- tai sähkötyöt'],
      eligibilityTitle: 'Kenelle palvelu sopii',
      eligibility: ['Henkilöautot ja kevyet ajoneuvot, joiden huoltotarve voidaan arvioida varauksen tiedoista', 'Määräaikaishuolto, kausihuolto, öljynvaihto, jarruneste ja perushuollon tarkastukset', 'Autot, joiden vikavalot tai oireet vaativat ensin diagnostiikan'],
      safetyTitle: 'Turvallisuus ja rajaukset',
      safetyLimitations: ['Jos punainen varoitusvalo palaa, öljynpaine puuttuu tai jarruissa on vakava oire, vältä ajamista ja ota yhteyttä ennen siirtoa.', 'Emme jatka lisäkorjauksiin ilman hyväksyntää.', 'Huolto-ohjelma ja osavalinnat tarkistetaan auton tietojen mukaan.'],
      aftercareTitle: 'Huollon jälkeen',
      aftercare: ['Saat yhteenvedon tehdystä työstä ja havaitusta jatkotarpeesta.', 'Seuraava huolto tai tarkastus sovitaan auton tilanteen mukaan.', 'Mahdolliset takuu- ja reklamaatioehdot vahvistetaan työn ja osien mukaan.'],
    },
    en: {
      durationValue: 'Work scope is confirmed during booking based on the vehicle and service need.',
      notIncludedTitle: 'Agreed separately',
      notIncluded: ['Diagnostics when a separate symptom is found during service', 'Parts or repairs not approved before work continues', 'Inspection repairs, welding and larger gearbox or electrical work'],
      eligibilityTitle: 'Who this fits',
      eligibility: ['Passenger cars and light vehicles where the service need can be assessed from booking details', 'Scheduled maintenance, seasonal checks, oil changes, brake fluid and basic service inspections', 'Cars with warning lights or symptoms that need diagnostics first'],
      safetyTitle: 'Safety and limits',
      safetyLimitations: ['If a red warning light is on, oil pressure is missing or brakes show a severe symptom, avoid driving and contact the garage before moving the car.', 'Additional repairs are not continued without approval.', 'Service schedule and part choices are checked from vehicle details.'],
      aftercareTitle: 'After the service',
      aftercare: ['You receive a summary of the work and any follow-up need found.', 'The next service or inspection is agreed based on vehicle condition.', 'Warranty and complaint terms depend on the specific work and parts and are confirmed with the job.'],
    },
  },
  'tire-change': {
    fi: {
      durationValue: 'Vahvistetaan varauksessa ajoneuvon, pyöräkoon ja rengashotellitilanteen mukaan.',
      notIncludedTitle: 'Mikä ei kuulu perusvaihtoon',
      notIncluded: ['Tasapainotus, rengastyö vanteelle tai rengaspaikkaus', 'Uudet renkaat, venttiilit, TPMS-työ tai vauriokorjaus', 'Rengashotelli ja vanteiden pesu, ellei niitä lisätä palveluun'],
      eligibilityTitle: 'Sopivuus',
      eligibility: ['Henkilöautot, SUV:t ja pakettiautot hinnaston mukaisina palveluina', 'Kausivaihto, omat renkaat tai rengashotellissa säilytetyt renkaat', 'Renkaat, jotka ovat oikeaa kokoa ja turvallisessa kunnossa asennettavaksi'],
      safetyTitle: 'Turvallisuus ja rajaukset',
      safetyLimitations: ['Emme suosittele ajamista renkaalla, jossa näkyy sivuvaurio, kudosvaurio tai selvä ilmanpaineongelma.', 'Jos renkaan kunto tai sopivuus on epävarma, suosittelemme tarkastusta ennen asennusta.', 'Jälkikiristyksen käytäntö ja tarkka ohje vahvistetaan palvelun yhteydessä.'],
      aftercareTitle: 'Vaihdon jälkeen',
      aftercare: ['Saat suosituksen, jos renkaissa näkyy kulumaa, vauriota tai tasapainotustarvetta.', 'Ilmanpaineet tarkistetaan työn yhteydessä.', 'Seuraava kausivaihto tai rengashotelli voidaan varata samalla asioinnilla.'],
    },
    en: {
      durationValue: 'Confirmed during booking based on vehicle, wheel size and tire hotel status.',
      notIncludedTitle: 'Not included in basic change',
      notIncluded: ['Balancing, tire mounting on rims or tire repair', 'New tires, valves, TPMS work or damage repair', 'Tire hotel and wheel wash unless added to the service'],
      eligibilityTitle: 'Fit',
      eligibility: ['Passenger cars, SUVs and vans as separate price-list services', 'Seasonal change, customer-owned tires or tire hotel stored tires', 'Tires that are the correct size and safe to install'],
      safetyTitle: 'Safety and limits',
      safetyLimitations: ['Do not drive on a tire with visible sidewall damage, casing damage or clear pressure loss.', 'If tire condition or fit is uncertain, we recommend inspection before installation.', 'Retightening practice and exact instruction are confirmed with the service.'],
      aftercareTitle: 'After the change',
      aftercare: ['You get a recommendation if wear, damage or balancing need is visible.', 'Air pressures are checked during the work.', 'The next seasonal change or tire hotel service can be booked during the same visit.'],
    },
  },
  'tire-hotel': {
    fi: {
      durationValue: 'Kausisäilytys; nouto ja seuraava vaihto sovitaan ajanvarauksessa.',
      notIncludedTitle: 'Mikä sovitaan erikseen',
      notIncluded: ['Renkaanvaihto, tasapainotus, rengastyö ja vanteiden pesu, ellei niitä lisätä palveluun', 'Uusien renkaiden hankinta tai vaurioituneen renkaan korvaaminen', 'Erityiset säilytys- tai vakuutusehdot, joita ei ole vahvistettu sopimuksessa'],
      eligibilityTitle: 'Sopivuus',
      eligibility: ['Tavallinen neljän renkaan tai pyörän sarja', 'Asiakas, joka haluaa yhdistää säilytyksen kausivaihtoon', 'Renkaat, joiden omistaja ja ajoneuvoyhteys voidaan kirjata selkeästi'],
      safetyTitle: 'Turvallisuus ja rajaukset',
      safetyLimitations: ['Kuluneet tai vaurioituneet renkaat merkitään jatkotarkistusta tai vaihtosuositusta varten.', 'Säilytys ei tee kuluneesta tai vääränkokoisesta renkaasta asennuskelpoista.', 'Nouto tai vaihto kannattaa varata etukäteen, jotta sarja ehditään valmistella.'],
      aftercareTitle: 'Säilytyksen aikana ja jälkeen',
      aftercare: ['Renkaat tunnistetaan ja kirjataan säilytystä varten.', 'Seuraava kausivaihto voidaan varata ennakkoon.', 'Jos kunto herättää huolta, jatkotoimi sovitaan ennen asennusta.'],
    },
    en: {
      durationValue: 'Seasonal storage; pickup and next change are agreed during booking.',
      notIncludedTitle: 'Agreed separately',
      notIncluded: ['Tire change, balancing, tire mounting and wheel wash unless added to the service', 'New tire purchase or replacement of damaged tires', 'Special storage or insurance terms not confirmed in the agreement'],
      eligibilityTitle: 'Fit',
      eligibility: ['A normal set of four tires or wheels', 'Customers who want to combine storage with seasonal tire change', 'Tires where owner and vehicle relationship can be recorded clearly'],
      safetyTitle: 'Safety and limits',
      safetyLimitations: ['Worn or damaged tires are marked for follow-up inspection or replacement recommendation.', 'Storage does not make a worn or wrong-size tire safe to install.', 'Pickup or change should be booked in advance so the set can be prepared.'],
      aftercareTitle: 'During and after storage',
      aftercare: ['Tires are identified and recorded for storage.', 'The next seasonal change can be booked in advance.', 'If condition is a concern, the next step is agreed before installation.'],
    },
  },
  diagnostics: {
    fi: {
      durationValue: 'Vikakoodien luku on perustarkistus; laajempi vianetsintä hinnoitellaan tuntityönä.',
      notIncludedTitle: 'Mikä ei sisälly diagnoosiin',
      notIncluded: ['Osien vaihto tai korjaustyö ilman erillistä hyväksyntää', 'Laaja purkutyö, koeajo tai mittaus, jos niitä ei sovita vianetsinnän osaksi', 'Vikakoodien poisto pysyvänä korjauksena'],
      eligibilityTitle: 'Milloin varata diagnostiikka',
      eligibility: ['Moottorin, ABS:n, latauksen, päästöjärjestelmän tai muun järjestelmän vikavalo', 'Auto käy huonosti, tehot katoavat tai oire toistuu', 'Tarvitset arvion ennen korjausta tai katsastuskorjausta'],
      safetyTitle: 'Turvallisuus ja rajaukset',
      safetyLimitations: ['Punainen varoitusvalo, voimakas käyntihäiriö, jarruoire tai ylikuumeneminen voi tarkoittaa, ettei autolla pidä ajaa korjaamolle.', 'Vikakoodi on vihje, ei yksin varma osavaihtopäätös.', 'Korjaussuositus annetaan löydösten perusteella ja jatkotyö sovitaan erikseen.'],
      aftercareTitle: 'Diagnoosin jälkeen',
      aftercare: ['Saat selityksen löydöksistä ja jatkosuosituksesta.', 'Korjauksen hinta-arvio tehdään erikseen, jos vika vaatii työtä tai osia.', 'Jos oire on ajoittainen, seuraava tarkistus voi vaatia lisähavaintoja.'],
    },
    en: {
      durationValue: 'Error-code reading is a basic check; deeper troubleshooting is priced hourly.',
      notIncludedTitle: 'Not included in diagnosis',
      notIncluded: ['Parts replacement or repair work without separate approval', 'Extended disassembly, road test or measurement unless agreed as troubleshooting', 'Clearing codes as a permanent repair'],
      eligibilityTitle: 'When to book diagnostics',
      eligibility: ['Engine, ABS, charging, emissions or other warning light', 'Poor running, power loss or a repeated symptom', 'You need an estimate before repair or inspection-related work'],
      safetyTitle: 'Safety and limits',
      safetyLimitations: ['A red warning light, severe running issue, brake symptom or overheating can mean the car should not be driven to the garage.', 'A fault code is a clue, not a final parts decision on its own.', 'Repair recommendations are based on findings and follow-up work is agreed separately.'],
      aftercareTitle: 'After diagnosis',
      aftercare: ['You get an explanation of findings and recommended next step.', 'A repair estimate is prepared separately if the fault needs work or parts.', 'Intermittent symptoms may need additional observation before a final decision.'],
    },
  },
  'ac-service': {
    fi: {
      durationValue: 'Vahvistetaan kylmäainetyypin, ajoneuvon ja mahdollisen vianetsinnän mukaan.',
      notIncludedTitle: 'Mikä sovitaan erikseen',
      notIncluded: ['Ilmastoinnin vianetsintä tai vuototarkastus, jos perushuolto ei riitä', 'Korjaukset, tiivisteet, kompressori- tai lauhdutintyöt', 'Ylimenevä kylmäaine hinnaston ulkopuolella'],
      eligibilityTitle: 'Sopivuus',
      eligibility: ['R134a- ja R1234yf-järjestelmät hinnaston mukaan', 'Hybridit ja sähköautot omana palvelunaan', 'Autot, joissa järjestelmä voidaan tunnistaa ja huoltaa turvallisesti'],
      safetyTitle: 'Turvallisuus ja ympäristö',
      safetyLimitations: ['Jos järjestelmässä epäillään vuotoa, perushuolto ei välttämättä ole oikea ratkaisu ennen vianetsintää.', 'Kylmäainetyyppi tarkistetaan ennen työtä; väärää kylmäainetta ei pidä sekoittaa järjestelmään.', 'Sähkö- ja hybridiautoissa noudatetaan ajoneuvokohtaista huoltokäytäntöä.'],
      aftercareTitle: 'Huollon jälkeen',
      aftercare: ['Saat tiedon käytetystä palvelusta ja mahdollisesta lisäkylmäaineesta.', 'Jos jäähdytys ei palaudu normaaliksi, seuraava askel on vianetsintä.', 'Mahdolliset korjaukset sovitaan erikseen ennen työn jatkamista.'],
    },
    en: {
      durationValue: 'Confirmed by refrigerant type, vehicle and whether diagnostics is needed.',
      notIncludedTitle: 'Agreed separately',
      notIncluded: ['AC diagnostics or leak check when basic service is not enough', 'Repairs, seals, compressor or condenser work', 'Extra refrigerant outside the listed pricing'],
      eligibilityTitle: 'Fit',
      eligibility: ['R134a and R1234yf systems according to price list', 'Hybrids and electric cars as a separate service', 'Cars where the system can be identified and serviced safely'],
      safetyTitle: 'Safety and environment',
      safetyLimitations: ['If a leak is suspected, basic service may not be the right step before diagnostics.', 'Refrigerant type is checked before work; the wrong refrigerant should not be mixed into the system.', 'Electric and hybrid vehicles follow vehicle-specific service practice.'],
      aftercareTitle: 'After the service',
      aftercare: ['You get information on the service used and any added refrigerant.', 'If cooling does not return, the next step is diagnostics.', 'Repairs are agreed separately before work continues.'],
    },
  },
  'dpf-service': {
    fi: {
      durationValue: 'Diagnoosi ensin; pakkopolton sivuarvio on hinnastossa noin 2-3 h, muu työ vahvistetaan autokohtaisesti.',
      notIncludedTitle: 'Mikä sovitaan erikseen',
      notIncluded: ['Hiukkassuodattimen irrotus ja asennus, ellei siitä tehdä autokohtaista tarjousta', 'Muut päästö-, anturi- tai moottoriviat, jotka aiheuttavat DPF-oireen', 'DPF:n poistaminen tai päästöjärjestelmän ohitus tieliikennekäyttöön'],
      eligibilityTitle: 'Milloin palvelu sopii',
      eligibility: ['Dieselauto, jossa DPF-valo, vikatila, tehohäviö tai päästöongelma viittaa hiukkassuodattimeen', 'Mekaanisesti ehjä suodatin, jossa ongelma voi liittyä noki- tai tuhkakertymään', 'Tilanne, jossa diagnoosi voi erottaa pakkopolton, pesun ja muun vian'],
      safetyTitle: 'Turvallisuus ja päästörajaukset',
      safetyLimitations: ['Pakkopolttoa ei tule tehdä, jos järjestelmän kunto tai vikakoodit viittaavat vaurioriskiin.', 'Erittäin tukossa oleva tai mekaanisesti vaurioitunut suodatin voi vaatia muuta ratkaisua kuin regenerointia.', 'Palvelu ei ole päästöjärjestelmän poistopalvelu.'],
      aftercareTitle: 'DPF-palvelun jälkeen',
      aftercare: ['Saat suosituksen siitä, riittääkö regenerointi, pesu vai jatkodiagnoosi.', 'Jos irrotus tai asennus tarvitaan, hinta arvioidaan autokohtaisesti.', 'Jos taustavika aiheuttaa tukkeutumisen, se täytyy korjata erikseen.'],
    },
    en: {
      durationValue: 'Diagnosis first; the price list notes forced regeneration is usually around 2-3 h, other work is vehicle-specific.',
      notIncludedTitle: 'Agreed separately',
      notIncluded: ['DPF removal and installation unless quoted for the vehicle', 'Other emissions, sensor or engine faults causing the DPF symptom', 'DPF delete or emissions-system bypass for road use'],
      eligibilityTitle: 'When this fits',
      eligibility: ['Diesel car where DPF light, limp mode, power loss or emissions issue points to the particulate filter', 'Mechanically intact filter where the issue may be soot or ash buildup', 'A case where diagnosis can separate regeneration, cleaning and another fault'],
      safetyTitle: 'Safety and emissions limits',
      safetyLimitations: ['Forced regeneration should not be performed when system condition or fault codes suggest damage risk.', 'A heavily blocked or mechanically damaged filter may need another solution than regeneration.', 'This is not an emissions-system removal service.'],
      aftercareTitle: 'After DPF service',
      aftercare: ['You get a recommendation on whether regeneration, cleaning or further diagnosis is the right step.', 'If removal or installation is needed, the price is estimated by vehicle.', 'If an underlying fault causes blockage, it must be repaired separately.'],
    },
  },
  'tire-repair': {
    fi: {
      durationValue: 'Vahvistetaan vaurion sijainnin, renkaan kunnon ja korjaustavan mukaan.',
      notIncludedTitle: 'Mikä sovitaan erikseen',
      notIncluded: ['Uusi rengas tai rengassarja, jos paikkaus ei ole turvallinen', 'TPMS-, venttiili-, vanne- tai tasapainotustyö, ellei sitä lisätä palveluun', 'Korjaus renkaalle, jolla on ajettu tyhjänä tai jossa on sivuvaurio'],
      eligibilityTitle: 'Milloin paikkaus voi sopia',
      eligibility: ['Pieni pisto tai vuoto kulutuspinnan alueella', 'Rengas, jonka runko ja sivuseinä näyttävät ehjiltä tarkastuksessa', 'Tilanne, jossa korjaustapa voidaan valita renkaan irrotuksen ja tarkistuksen jälkeen'],
      safetyTitle: 'Turvallisuus ja rajaukset',
      safetyLimitations: ['Sivuvauriota, runkovauriota tai tyhjänä ajettua rengasta ei pidä paikata ajoturvallisuuden kustannuksella.', 'Jos renkaan kunto ei täytä turvallista korjausta, suosittelemme vaihtoa.', 'Älä jatka ajoa nopeasti tyhjenevällä renkaalla.'],
      aftercareTitle: 'Paikkauksen jälkeen',
      aftercare: ['Saat tiedon siitä, mitä korjaustapaa käytettiin tai miksi paikkausta ei suositeltu.', 'Ilmanpaine ja vuoto tarkistetaan työn yhteydessä.', 'Jos rengas tarvitsee vaihtoa, ohjaamme sopivaan rengaspalveluun.'],
    },
    en: {
      durationValue: 'Confirmed by damage location, tire condition and repair method.',
      notIncludedTitle: 'Agreed separately',
      notIncluded: ['New tire or tire set if repair is not safe', 'TPMS, valve, rim or balancing work unless added to the service', 'Repair for a tire driven flat or showing sidewall damage'],
      eligibilityTitle: 'When repair may fit',
      eligibility: ['Small puncture or leak in the tread area', 'Tire where casing and sidewall appear intact during inspection', 'A case where repair method can be chosen after removal and inspection'],
      safetyTitle: 'Safety and limits',
      safetyLimitations: ['Sidewall damage, casing damage or a tire driven flat should not be repaired at the cost of driving safety.', 'If tire condition is not safe for repair, replacement is recommended.', 'Do not continue driving on a tire that loses pressure quickly.'],
      aftercareTitle: 'After repair',
      aftercare: ['You are told which repair method was used or why repair was not recommended.', 'Pressure and leakage are checked during the work.', 'If replacement is needed, we guide you to the relevant tire service.'],
    },
  },
};

export function buildGeneratedServiceSeoPage(serviceId: string): ServiceSeoPage | null {
  const service = getServiceCatalogEntryById(serviceId);
  if (!service) return null;

  const category = CATEGORY_NAMES[service.categoryId];
  const categoryCopy = generatedCategoryCopy[service.categoryId] ?? generatedCategoryCopy['diagnostics-maintenance'];
  const priceText = {
    fi: service.price > 0 ? `${service.price} €` : 'Autokohtainen tarjous',
    en: service.price > 0 ? `${service.price} €` : 'Vehicle-specific quote',
  };

  return {
    id: 'car-service',
    primaryServiceId: service.id,
    relatedServiceIds: SERVICE_CATALOG
      .filter((candidate) => candidate.categoryId === service.categoryId && candidate.id !== service.id)
      .slice(0, 4)
      .map((candidate) => candidate.id),
    imageKey: service.categoryId === 'car-care' ? 'wash' : service.categoryId === 'tire-services' ? 'tires' : 'maintenance',
    paths: [`/palvelut/${service.id}`, `/en/services/${service.id}`],
    copy: {
      fi: {
        title: `${service.name.fi} Helsingissä`,
        metaTitle: `${service.name.fi} Helsinki | Mitra Auto`,
        metaDescription: `${service.name.fi} Helsingissä Mitra Autolta. Varaa aika verkossa ja hoida ${category.fi.toLowerCase()} selkeästi samassa korjaamossa.`,
        eyebrow: category.fi,
        subtitle: `${service.name.fi} Mitra Autolla Helsingissä. Selkeä hinnoittelu, helppo ajanvaraus ja asiantunteva toteutus.`,
        summary: categoryCopy.fi.summary,
        priceLabel: 'Hinta',
        durationLabel: 'Tyypillinen kesto',
        cta: 'Varaa palvelu',
        secondaryCta: 'Katso hinnat',
        includedTitle: `Mitä palveluun ${service.name.fi} kuuluu`,
        included: categoryCopy.fi.included,
        processTitle: 'Näin palvelu etenee',
        process: categoryCopy.fi.process,
        pricingTitle: 'Hinta',
        pricing: [{ name: service.name.fi, price: priceText.fi, note: category.fi }],
        faqTitle: 'Usein kysyttyä palvelusta',
        faq: categoryCopy.fi.faq,
        relatedTitle: 'Samaan kategoriaan liittyvät palvelut',
      },
      en: {
        title: `${service.name.en} in Helsinki`,
        metaTitle: `${service.name.en} Helsinki | Mitra Auto`,
        metaDescription: `${service.name.en} in Helsinki from Mitra Auto. Book online and handle ${category.en.toLowerCase()} clearly at one garage.`,
        eyebrow: category.en,
        subtitle: `${service.name.en} at Mitra Auto in Helsinki. Clear pricing, easy booking and expert execution.`,
        summary: categoryCopy.en.summary,
        priceLabel: 'Price',
        durationLabel: 'Typical duration',
        cta: 'Book service',
        secondaryCta: 'See prices',
        includedTitle: `What ${service.name.en} includes`,
        included: categoryCopy.en.included,
        processTitle: 'How the service works',
        process: categoryCopy.en.process,
        pricingTitle: 'Price',
        pricing: [{ name: service.name.en, price: priceText.en, note: category.en }],
        faqTitle: 'Service FAQ',
        faq: categoryCopy.en.faq,
        relatedTitle: 'Related services in this category',
      },
    },
  };
}
