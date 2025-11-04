import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'fi' | 'en';

interface Translations {
  [key: string]: {
    fi: string;
    en: string;
  };
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Translations = {
  // Navigation
  'nav.home': { fi: 'Etusivu', en: 'Home' },
  'nav.services': { fi: 'Palvelut', en: 'Services' },
  'nav.catalog': { fi: 'Katalogi', en: 'Catalog' },
  'nav.tireHotel': { fi: 'Rengashotelli', en: 'Tire Hotel' },
  'nav.usedCars': { fi: 'Käytetyt autot', en: 'Used Cars' },
  'nav.login': { fi: 'Kirjaudu', en: 'Login' },
  'nav.signup': { fi: 'Rekisteröidy', en: 'Sign Up' },
  'nav.dashboard': { fi: 'Hallintapaneeli', en: 'Dashboard' },
  'nav.orders': { fi: 'Tilaukset', en: 'Orders' },
  'nav.signout': { fi: 'Kirjaudu ulos', en: 'Sign Out' },
  'nav.menu': { fi: 'Valikko', en: 'Menu' },
  'nav.menuDescription': { fi: 'Navigoi sivustolla ja muuta asetuksia', en: 'Navigate the site and change settings' },
  'nav.cart': { fi: 'Ostoskori', en: 'Cart' },
  
  // Hero
  'hero.headline': { fi: 'Renkaat ja huolto — nopeasti ja luotettavasti', en: 'Tyres & service — fast and reliable' },
  'hero.subheadline': { fi: 'Varaa aika verkossa minuuteissa.', en: 'Book online in minutes.' },
  'hero.cta.primary': { fi: 'Varaa huolto', en: 'Book a Service' },
  'hero.cta.secondary': { fi: 'Selaa renkaita', en: 'Browse Tyres' },
  'hero.trust.paytrail': { fi: 'Paytrail-maksu', en: 'Paytrail Payment' },
  'hero.trust.secure': { fi: 'Turvallinen', en: 'Secure' },
  'hero.trust.fast': { fi: 'Nopea varaus', en: 'Fast Booking' },
  
  // Services
  'services.title': { fi: 'Palvelumme', en: 'Our Services' },
  'services.subtitle': { fi: 'Ammattitaitoista palvelua kaikille autoilijoille', en: 'Professional service for all drivers' },
  'services.tireChange.title': { fi: 'Renkaan vaihto', en: 'Tyre Change' },
  'services.tireChange.desc': { fi: 'Nopea ja ammattimainen renkaan vaihto', en: 'Fast and professional tyre change' },
  'services.balancing.title': { fi: 'Tasapainotus', en: 'Balancing' },
  'services.balancing.desc': { fi: 'Renkaiden tasapainotus tarkkuudella', en: 'Precise wheel balancing' },
  'services.tireHotel.title': { fi: 'Rengashotelli', en: 'Tire Hotel' },
  'services.tireHotel.desc': { fi: 'Turvallinen säilytys renkkaillesi', en: 'Safe storage for your tyres' },
  'services.inspection.title': { fi: 'Tarkastus', en: 'Inspection' },
  'services.inspection.desc': { fi: 'Kattava auton tarkastus', en: 'Comprehensive vehicle inspection' },
  'services.cta': { fi: 'Varaa', en: 'Book' },
  
  // Services Page
  'servicesPage.title': { fi: 'Palvelumme', en: 'Our Services' },
  'servicesPage.subtitle': { fi: 'Varaa mikä tahansa palvelu helposti — valitse aikasi ja saat välittömän vahvistuksen.', en: 'Book any service easily — choose your slot and get instant confirmation.' },
  'servicesPage.bookNow': { fi: 'Varaa nyt', en: 'Book Now' },
  'servicesPage.readyToBook': { fi: 'Valmis varaamaan?', en: 'Ready to Book?' },
  'servicesPage.readySubtitle': { fi: 'Varaa palvelusi nyt — se vie vain 2 vaihetta.', en: 'Reserve your service now — it only takes 2 steps.' },
  'servicesPage.bookService': { fi: 'Varaa palvelu', en: 'Book a Service' },
  'servicesPage.selectCategory': { fi: 'Valitse kategoria', en: 'Select category' },
  'servicesPage.from': { fi: 'alkaen', en: 'from' },
  
  // Service Categories
  'serviceCategory.carWash': { fi: 'Auton pesu', en: 'Car Wash' },
  'serviceCategory.maintenance': { fi: 'Huolto', en: 'Maintenance' },
  'serviceCategory.tireWork': { fi: 'Rengastyöt', en: 'Tire Work' },
  
  // Car Wash Services
  'service.exteriorWash': { fi: 'Ulkopesu + kovavaha', en: 'Exterior washing + hard waxing' },
  'service.fullWash': { fi: 'Täyspesu sisältä ja ulkoa', en: 'Full wash inside and outside' },
  'service.interiorCleaning': { fi: 'Sisäpuhdistus', en: 'Interior cleaning' },
  'service.engineWash': { fi: 'Moottorinpesu', en: 'Engine wash' },
  
  // Maintenance Services
  'service.basicService': { fi: 'Perushuolto', en: 'Basic service' },
  'service.basicServiceNote': { fi: 'Sisältää varaosat', en: 'Including spare parts' },
  'service.largeService': { fi: 'Iso huolto', en: 'Large service' },
  'service.largeServiceNote': { fi: 'Sisältää varaosat', en: 'Including spare parts' },
  'service.acService': { fi: 'Ilmastointihuolto', en: 'Air conditioning service' },
  'service.brakeFluid': { fi: 'Jarrunestevaihdto', en: 'Brake fluid change' },
  'service.brakeFluidNote': { fi: 'Sisältää jarrunesteen', en: 'Including brake fluid' },
  
  // Tire Work Services
  'service.tireMounting': { fi: 'Renkaan asennus', en: 'Tire mounting' },
  'service.tireMountingNote': { fi: 'Poistettujen renkaiden tasapainotus 5 EUR/kpl', en: 'Balancing of removed tires 5 EUR/pc' },
  'service.tireRemoval': { fi: 'Renkaan irrotus', en: 'Tire removal' },
  'service.wheelBalancing': { fi: 'Pyörän tasapainotus', en: 'Wheel balancing' },
  'service.tireRepair': { fi: 'Rengaskorjaus', en: 'Tire repair' },
  'service.tpmsService': { fi: 'TPMS-rengaspaineanturin huolto', en: 'TPMS tire pressure sensor service' },
  'service.wheelAlignment': { fi: 'Pyörän kohdistus', en: 'Wheel alignment' },
  'service.wheelAlignmentNote': { fi: 'Sisältää mittauksen ja säädön', en: 'Including measurement and adjustment' },
  
  // Catalog
  'catalog.title': { fi: 'Rengaskatalogi', en: 'Tyre Catalog' },
  'catalog.subtitle': { fi: 'Löydä täydellinen rengas autoosi', en: 'Find the perfect tyre for your vehicle' },
  'catalog.viewAll': { fi: 'Näytä kaikki', en: 'View All' },
  'catalog.filter.size': { fi: 'Koko', en: 'Size' },
  'catalog.filter.season': { fi: 'Kausi', en: 'Season' },
  'catalog.cta': { fi: 'Avaa katalogi', en: 'Open Catalog' },
  
  // Booking
  'booking.title': { fi: 'Pikavaraaja', en: 'Quick Booking' },
  'booking.cta.title': { fi: 'Varaa huoltoaika verkossa', en: 'Book Your Service Online' },
  'booking.cta.subtitle': { fi: 'Helppoa ja nopeaa varaamista milloin tahansa', en: 'Easy and fast booking anytime' },
  'booking.cta.button': { fi: 'Varaa aika', en: 'Book Now' },
  'booking.benefit1': { fi: 'Nopea varaus verkossa', en: 'Quick online booking' },
  'booking.benefit2': { fi: 'Vahvistus sähköpostilla', en: 'Email confirmation' },
  'booking.benefit3': { fi: 'Joustavat ajat', en: 'Flexible times' },
  
  // Booking Modal Steps
  'booking.step1of2': { fi: 'Vaihe 1 / 2', en: 'Step 1 of 2' },
  'booking.step2of2': { fi: 'Vaihe 2 / 2', en: 'Step 2 of 2' },
  'booking.step1.description': { fi: 'Valitse aika ja rekisterinumero', en: 'Select date and license plate' },
  'booking.step2.description': { fi: 'Valitse palvelu ja anna yhteystietosi', en: 'Choose service and provide contact details' },
  
  // Booking Step 1
  'booking.step1.licensePlate': { fi: 'Rekisterinumero', en: 'License Plate' },
  'booking.step1.licensePlateHelper': { fi: 'Esim. ABC-123', en: 'e.g., ABC-123' },
  'booking.step1.selectDate': { fi: 'Valitse päivä', en: 'Select Date' },
  'booking.step1.pickDate': { fi: 'Valitse päivä', en: 'Pick a date' },
  'booking.step1.selectTime': { fi: 'Valitse aika', en: 'Select Time' },
  
  // Booking Actions
  'booking.cancel': { fi: 'Peruuta', en: 'Cancel' },
  'booking.continue': { fi: 'Jatka', en: 'Continue' },
  'booking.back': { fi: 'Takaisin', en: 'Back' },
  'booking.confirmBooking': { fi: 'Vahvista varaus', en: 'Confirm Booking' },
  'booking.checking': { fi: 'Tarkistetaan...', en: 'Checking...' },
  'booking.confirming': { fi: 'Vahvistetaan...', en: 'Confirming...' },
  
  // Booking Success
  'booking.success.title': { fi: 'Varaus vahvistettu!', en: 'Booking Confirmed!' },
  'booking.success.subtitle': { fi: 'Kiitos varauksestasi. Olemme lähettäneet vahvistuksen.', en: 'Thank you for your booking. We\'ve sent you a confirmation.' },
  'booking.success.addToCalendar': { fi: 'Lisää kalenteriin', en: 'Add to Calendar' },
  'booking.success.done': { fi: 'Valmis', en: 'Done' },
  
  // Tire Hotel
  'tireHotel.title': { fi: 'Rengashotelli – Huoletonta säilytystä', en: 'Tire Hotel – Hassle-free Storage' },
  'tireHotel.subtitle': { fi: 'Säilytämme renkaasi turvallisesti ja ammattimaisesti. Ei enää vaivaa kotona!', en: 'We store your tyres safely and professionally. No more hassle at home!' },
  'tireHotel.desc': { fi: 'Säilytämme renkaasi turvallisesti ja ammattimaisesti. Ei enää vaivaa kotona!', en: 'We store your tyres safely and professionally. No more hassle at home!' },
  'tireHotel.benefit1': { fi: 'Optimaaliset säilytysolosuhteet', en: 'Optimal storage conditions' },
  'tireHotel.benefit2': { fi: 'Helppo varaus verkossa', en: 'Easy online booking' },
  'tireHotel.benefit3': { fi: 'Kilpailukykyiset hinnat', en: 'Competitive prices' },
  'tireHotel.cta': { fi: 'Lue lisää', en: 'Learn more' },
  
  // Reviews
  'reviews.title': { fi: 'Asiakkaidemme kokemuksia', en: 'Customer Reviews' },
  'reviews.rating': { fi: '4.8 ★★★★★', en: '4.8 ★★★★★' },
  
  // Footer
  'footer.shop': { fi: 'Kauppa', en: 'Shop' },
  'footer.services': { fi: 'Palvelut', en: 'Services' },
  'footer.company': { fi: 'Yritys', en: 'Company' },
  'footer.legal': { fi: 'Oikeudelliset', en: 'Legal' },
  'footer.catalog': { fi: 'Katalogi', en: 'Catalog' },
  'footer.tireChange': { fi: 'Renkaan vaihto', en: 'Tyre Change' },
  'footer.tireHotel': { fi: 'Rengashotelli', en: 'Tire Hotel' },
  'footer.inspection': { fi: 'Tarkastus', en: 'Inspection' },
  'footer.about': { fi: 'Tietoa meistä', en: 'About Us' },
  'footer.contact': { fi: 'Yhteystiedot', en: 'Contact' },
  'footer.privacy': { fi: 'Tietosuoja', en: 'Privacy' },
  'footer.terms': { fi: 'Käyttöehdot', en: 'Terms' },
  'footer.copyright': { fi: '© Mitra Auto 2025', en: '© Mitra Auto 2025' },
  
  // Auth
  'auth.login.title': { fi: 'Kirjaudu sisään', en: 'Log In' },
  'auth.login.subtitle': { fi: 'Tervetuloa takaisin! Kirjaudu sisään jatkaaksesi.', en: 'Welcome back! Log in to continue.' },
  'auth.login.email': { fi: 'Sähköposti', en: 'Email' },
  'auth.login.password': { fi: 'Salasana', en: 'Password' },
  'auth.login.submit': { fi: 'Kirjaudu', en: 'Log In' },
  'auth.login.forgot': { fi: 'Unohtuiko salasana?', en: 'Forgot password?' },
  'auth.login.noAccount': { fi: 'Ei tiliä?', en: 'No account?' },
  'auth.login.signupLink': { fi: 'Luo tili', en: 'Sign up' },
  'auth.login.google': { fi: 'Jatka Google-tilillä', en: 'Continue with Google' },
  'auth.login.apple': { fi: 'Jatka Apple-tilillä', en: 'Continue with Apple' },
  
  'auth.signup.title': { fi: 'Luo tili', en: 'Create Account' },
  'auth.signup.subtitle': { fi: 'Aloita matka kanssamme tänään.', en: 'Start your journey with us today.' },
  'auth.signup.name': { fi: 'Nimi', en: 'Name' },
  'auth.signup.email': { fi: 'Sähköposti', en: 'Email' },
  'auth.signup.password': { fi: 'Salasana', en: 'Password' },
  'auth.signup.terms': { fi: 'Hyväksyn', en: 'I accept the' },
  'auth.signup.termsLink': { fi: 'käyttöehdot', en: 'terms and conditions' },
  'auth.signup.submit': { fi: 'Luo tili', en: 'Create Account' },
  'auth.signup.hasAccount': { fi: 'Onko sinulla jo tili?', en: 'Already have an account?' },
  'auth.signup.loginLink': { fi: 'Kirjaudu sisään', en: 'Log in' },
  
  'auth.reset.title': { fi: 'Palauta salasana', en: 'Reset Password' },
  'auth.reset.description': { fi: 'Anna sähköpostiosoitteesi, niin lähetämme sinulle palautusohjeet.', en: 'Enter your email address and we\'ll send you reset instructions.' },
  'auth.reset.email': { fi: 'Sähköposti', en: 'Email' },
  'auth.reset.submit': { fi: 'Lähetä linkki', en: 'Send Link' },
  'auth.reset.success': { fi: 'Tarkista sähköpostisi', en: 'Check your email' },
  'auth.reset.backToLogin': { fi: 'Takaisin kirjautumiseen', en: 'Back to login' },
  
  // Emergency Roadside Rescue 24/7
  'emergency.cta': { fi: 'Hätäapu 24/7', en: 'Rescue 24/7' },
  'emergency.title': { fi: 'Hätäapu 24/7', en: 'Rescue 24/7' },
  'emergency.description': { fi: 'Tarvitsetko hätähinausta? Kerro sijaintisi ja otamme yhteyttä välittömästi.', en: 'Need emergency towing? Share your location and we\'ll contact you immediately.' },
  'emergency.chooseMethod': { fi: 'Valitse sijaintimenetelmä', en: 'Choose location method' },
  'emergency.chooseMethodDesc': { fi: 'Valitse kuinka haluat jakaa sijaintisi', en: 'Choose how you want to share your location' },
  'emergency.useGpsButton': { fi: 'Käytä GPS-sijaintia', en: 'Use GPS Location' },
  'emergency.useManualButton': { fi: 'Syötä osoite manuaalisesti', en: 'Enter Address Manually' },
  'emergency.gettingLocation': { fi: 'Haetaan sijaintia...', en: 'Getting location...' },
  'emergency.gpsActive': { fi: 'GPS-sijainti aktiivinen', en: 'GPS location active' },
  'emergency.phone': { fi: 'Puhelinnumero', en: 'Phone Number' },
  'emergency.street': { fi: 'Katuosoite', en: 'Street Address' },
  'emergency.streetPlaceholder': { fi: 'Esim. Mannerheimintie 10', en: 'e.g. Mannerheimintie 10' },
  'emergency.postcode': { fi: 'Postinumero', en: 'Postcode' },
  'emergency.city': { fi: 'Kaupunki', en: 'City' },
  'emergency.submit': { fi: 'Lähetä hätäpyyntö', en: 'Send Emergency Request' },
  'emergency.sending': { fi: 'Lähetetään...', en: 'Sending...' },
  'emergency.success': { fi: '✓ Pyyntö lähetetty! Otamme sinuun yhteyttä pian.', en: '✓ Request sent! We\'ll contact you soon.' },
  'emergency.switchToManual': { fi: 'Vaihda manuaaliseen syöttöön', en: 'Switch to manual entry' },
  'emergency.switchToGps': { fi: 'Vaihda GPS-sijaintiin', en: 'Switch to GPS location' },
  
  // Emergency Errors
  'emergency.error.noGps': { fi: 'GPS ei ole tuettu tässä laitteessa', en: 'GPS is not supported on this device' },
  'emergency.error.gpsPermission': { fi: 'GPS-käyttöoikeus evätty. Salli sijainti asetuksista.', en: 'GPS permission denied. Please enable location access.' },
  'emergency.error.gpsUnavailable': { fi: 'GPS-sijainti ei ole saatavilla', en: 'GPS location unavailable' },
  'emergency.error.gpsTimeout': { fi: 'GPS-paikannuksen aikakatkaisu', en: 'GPS location timeout' },
  'emergency.error.gpsGeneral': { fi: 'Virhe GPS-paikannuksessa', en: 'Error getting GPS location' },
  'emergency.error.noLocation': { fi: 'Sijaintia ei ole määritetty', en: 'Location not provided' },
  'emergency.error.noPhone': { fi: 'Puhelinnumero vaaditaan', en: 'Phone number required' },
  'emergency.error.submit': { fi: 'Virhe pyynnön lähetyksessä. Yritä uudelleen.', en: 'Error submitting request. Please try again.' },
  
  // Additional UI
  'ui.skipToContent': { fi: 'Siirry pääsisältöön', en: 'Skip to main content' },
  'ui.loading': { fi: 'Ladataan...', en: 'Loading...' },
  'ui.buy': { fi: 'Osta', en: 'Buy' },
  'ui.theme.toggle': { fi: 'Vaihda teemaa', en: 'Toggle theme' },
  'ui.theme.dark': { fi: 'Tumma teema', en: 'Dark mode' },
  'ui.theme.light': { fi: 'Valoisa teema', en: 'Light mode' },
  'ui.language.toggle': { fi: 'Vaihda kieltä', en: 'Toggle language' },
  'ui.language.switchToEn': { fi: 'Switch to English', en: 'Switch to English' },
  'ui.language.switchToFi': { fi: 'Vaihda suomeksi', en: 'Vaihda suomeksi' },
  'nav.cart': { fi: 'Ostoskori', en: 'Shopping Cart' },
  'season.winter': { fi: 'Talvi', en: 'Winter' },
  'season.summer': { fi: 'Kesä', en: 'Summer' },
  'season.allSeason': { fi: 'Ympärivuotinen', en: 'All Season' },
  
  // Common
  'common.reviewsSubtitle': { fi: 'Katso mitä asiakkaamme sanovat palvelustamme', en: 'See what our customers say about our service' },
  'common.stars': { fi: 'tähteä', en: 'stars' },
  'common.happyCustomers': { fi: 'Tyytyväistä asiakasta', en: 'Happy Customers' },
  'auth.or': { fi: 'TAI', en: 'OR' },
  'auth.placeholder.email': { fi: 'nimi@esimerkki.fi', en: 'name@example.com' },
  
  // Contact Section
  'contact.title': { fi: 'Ota yhteyttä', en: 'Get in Touch' },
  'contact.heading': { fi: 'Yhteystiedot', en: 'Contact Information' },
  'contact.subheading': { fi: 'Olemme täällä auttamassa — tavoita meidät koska tahansa.', en: 'We\'re here to help — reach us anytime.' },
  'contact.address': { fi: 'Osoite', en: 'Address' },
  'contact.phone': { fi: 'Puhelin', en: 'Phone' },
  'contact.email': { fi: 'Sähköposti', en: 'Email' },
  'contact.hours': { fi: 'Aukioloajat', en: 'Opening Hours' },
  'contact.hoursValue': { fi: 'Ma–Pe: 9:00–18:00\nLa: 10:00–17:00\nSu: Suljettu', en: 'Mon–Fri: 9:00–18:00\nSat: 10:00–17:00\nSun: Closed' },
  'contact.directionsButton': { fi: 'Hae reittiohjeet', en: 'Get Directions' },
  'contact.contactButton': { fi: 'Ota yhteyttä', en: 'Contact Us' },
  'contact.mapPlaceholder': { fi: 'Kartta palvelukeskuksestamme', en: 'Map of our service center' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('fi');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
