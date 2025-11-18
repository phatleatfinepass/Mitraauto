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
  'hero.headline': { fi: 'Mitra Auto - Ammattitaitoiset palvelut', en: 'Mitra Auto - Professional Services' },
  'hero.subheadline': { fi: 'Täyden palvelun korjaamo rengas-, huolto- ja korjauspalveluilla. Varaa aikasi verkossa.', en: 'Full-service garage with tire, maintenance and repair services. Book your appointment online.' },
  'hero.cta.primary': { fi: 'Varaa huolto', en: 'Book a Service' },
  'hero.cta.secondary': { fi: 'Selaa renkaita', en: 'Browse Tyres' },
  'hero.trust.paytrail': { fi: 'Paytrail-maksu', en: 'Paytrail Payment' },
  'hero.trust.secure': { fi: 'Turvallinen', en: 'Secure' },
  'hero.trust.fast': { fi: 'Nopea varaus', en: 'Fast Booking' },
  
  // Services
  'services.title': { fi: 'Palvelumme', en: 'Our Services' },
  'services.subtitle': { fi: 'Ammattitaitoista palvelua kaikille autoilijoille', en: 'Professional service for all drivers' },
  'services.carMaintenance.title': { fi: 'Autohuolto', en: 'Car Maintenance' },
  'services.carMaintenance.desc': { fi: 'Huolto ja korjaus', en: 'Service and repairs' },
  'services.balancing.title': { fi: 'Tasapainotus', en: 'Balancing' },
  'services.balancing.desc': { fi: 'Renkaiden tasapainotus', en: 'Wheel balancing' },
  'services.tireHotel.title': { fi: 'Rengashotelli', en: 'Tire Hotel' },
  'services.tireHotel.desc': { fi: 'Säilytys renkaille', en: 'Tire storage' },
  'services.inspection.title': { fi: 'Tarkastus', en: 'Inspection' },
  'services.inspection.desc': { fi: 'Auton tarkastus', en: 'Vehicle inspection' },
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
  'footer.tireChange': { fi: 'Rengastyöt', en: 'Tire Work' },
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
  
  // Auth Errors
  'auth.error.invalidCredentials': { fi: 'Virheellinen sähköposti tai salasana', en: 'Invalid email or password' },
  'auth.error.emailNotFound': { fi: 'Sähköpostiosoitetta ei löydy', en: 'Email not found' },
  'auth.error.invalidEmail': { fi: 'Virheellinen sähköpostiosoite', en: 'Invalid email address' },
  'auth.error.weakPassword': { fi: 'Salasana on liian heikko', en: 'Password is too weak' },
  'auth.error.emailInUse': { fi: 'Sähköposti on jo käytössä', en: 'Email already in use' },
  'auth.error.tooManyAttempts': { fi: 'Liian monta yritystä. Yritä myöhemmin uudelleen.', en: 'Too many attempts. Please try again later.' },
  'auth.error.networkError': { fi: 'Verkkovirhe. Tarkista yhteytesi.', en: 'Network error. Check your connection.' },
  'auth.error.serverError': { fi: 'Palvelinvirhe. Yritä myöhemmin uudelleen.', en: 'Server error. Please try again later.' },
  'auth.error.unexpected': { fi: 'Odottamaton virhe. Yritä uudelleen.', en: 'An unexpected error occurred. Please try again.' },
  'auth.or': { fi: 'tai', en: 'or' },
  
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
  'season.winter': { fi: 'Talvi', en: 'Winter' },
  'season.summer': { fi: 'Kesä', en: 'Summer' },
  'season.allSeason': { fi: 'Ympärivuotinen', en: 'All Season' },
  
  // Common
  'common.reviewsSubtitle': { fi: 'Katso mitä asiakkaamme sanovat palvelustamme', en: 'See what our customers say about our service' },
  'common.stars': { fi: 'tähteä', en: 'stars' },
  'common.happyCustomers': { fi: 'Tyytyväistä asiakasta', en: 'Happy Customers' },
  'auth.or': { fi: 'TAI', en: 'OR' },
  'auth.placeholder.email': { fi: 'nimi@esimerkki.fi', en: 'name@example.com' },
  
  // Trust Signals (Landing Page)
  'trustSignals.expertService': { fi: 'Ammattilaisten palvelu', en: 'Expert Service' },
  'trustSignals.expertServiceDesc': { fi: 'Sertifioidut asentajat ja modernit työkalut', en: 'Certified technicians and modern equipment' },
  'trustSignals.qualityProducts': { fi: 'Laatutuotteet', en: 'Quality Products' },
  'trustSignals.qualityProductsDesc': { fi: 'Tunnetut tuotemerkit ja takuu', en: 'Trusted brands and warranty' },
  'trustSignals.fastService': { fi: 'Nopea huolto', en: 'Fast Service' },
  'trustSignals.fastServiceDesc': { fi: 'Tehokas palvelu ja nopea läpimenoaika', en: 'Efficient service and quick turnaround' },
  'trustSignals.customerFirst': { fi: 'Asiakas edellä', en: 'Customer First' },
  'trustSignals.customerFirstDesc': { fi: 'Yli 500 tyytyväistä asiakasta', en: 'Over 500 satisfied customers' },
  
  // Trust Signals (Services Page)
  'trustSignals.certifiedTechs': { fi: 'Sertifioidut asentajat', en: 'Certified Technicians' },
  'trustSignals.certifiedTechsDesc': { fi: 'Ammattitaitoiset ja koulutetut mekaanikkot', en: 'Skilled and trained mechanics' },
  'trustSignals.modernEquipment': { fi: 'Modernit työkalut', en: 'Modern Equipment' },
  'trustSignals.modernEquipmentDesc': { fi: 'Uusimmat diagnostiikka- ja korjauslaitteet', en: 'Latest diagnostic and repair tools' },
  'trustSignals.genuineParts': { fi: 'Aidot varaosat', en: 'Genuine Parts' },
  'trustSignals.genuinePartsDesc': { fi: 'Laadukkaita varaosia luotetuista lähteistä', en: 'Quality parts from trusted sources' },
  'trustSignals.satisfaction': { fi: 'Tyytyväisyystakuu', en: 'Satisfaction Guarantee' },
  'trustSignals.satisfactionDesc': { fi: '100% tyytyväisyystakuu kaikissa palveluissa', en: '100% satisfaction guarantee on all services' },
  
  // Trust Signals (Tire Hotel Page)
  'trustSignals.secureStorage': { fi: 'Turvallinen säilytys', en: 'Secure Storage' },
  'trustSignals.secureStorageDesc': { fi: 'Valvottu tila kattavalla vakuutusturvalla', en: 'Monitored facility with full insurance' },
  'trustSignals.uvProtection': { fi: 'UV-suojaus', en: 'UV Protection' },
  'trustSignals.uvProtectionDesc': { fi: 'Sisäsäilytys suojaa UV-valolta ja säältä', en: 'Indoor storage protects from UV light and weather' },
  'trustSignals.easySwap': { fi: 'Helppo kausivaihtto', en: 'Easy Seasonal Swap' },
  'trustSignals.easySwapDesc': { fi: 'Varaa asennus verkossa milloin tahansa', en: 'Book installation online anytime' },
  'trustSignals.convenientService': { fi: 'Kätevä palvelu', en: 'Convenient Service' },
  'trustSignals.convenientServiceDesc': { fi: 'Ei tarvetta säilyttää renkaita kotona', en: 'No need to store tires at home' },
  
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
  
  // About Page
  'about.hero.headline': { fi: 'Tarkkuus ajaa meitä. Kuljettajat luottavat meihin.', en: 'Driven by Precision. Trusted by Drivers.' },
  'about.hero.subtitle': { fi: 'Mitra Auto määrittelee autonhoidon uudelleen Helsingissä – yhdistämällä huippuluokan käsityötaidon ja kehittyneen teknologian.', en: 'Mitra Auto is redefining car care in Helsinki — combining high-end craftsmanship with advanced technology.' },
  'about.hero.exploreServices': { fi: 'Tutustu palveluihimme', en: 'Explore Our Services' },
  'about.hero.contactUs': { fi: 'Ota yhteyttä', en: 'Contact Us' },
  
  'about.story.title': { fi: 'Luottamuksen rakentaminen vuodesta 2023', en: 'Engineering Trust Since 2023' },
  'about.story.body': { fi: 'Vuoden 2023 lopulla perustettu Mitra Auto Oy Hankasuontiellä 5 rakentuu kokeneiden mekaanikkojen ja älykkäiden palvelujärjestelmien perustalle. Erikoistuimme ajoneuvojen huoltoon ja korjaukseen, palvellen kaikkia merkittäviä tuotemerkkejä läpinäkyvyydellä ja tehokkuudella.', en: 'Founded in late 2023, Mitra Auto Oy at Hankasuontie 5 is built on a foundation of experienced mechanics and smart service systems. We specialise in vehicle maintenance and repair, servicing all major brands with transparency and efficiency.' },
  
  'about.values.title': { fi: 'Arvomme', en: 'Our Values' },
  'about.values.precision.title': { fi: 'Tarkkuus', en: 'Precision' },
  'about.values.precision.desc': { fi: 'Jokainen yksityiskohta on tärkeä.', en: 'Every detail matters.' },
  'about.values.integrity.title': { fi: 'Rehellisyys', en: 'Integrity' },
  'about.values.integrity.desc': { fi: 'Läpinäkyvä palvelu, oikeudenmukainen hinnoittelu.', en: 'Transparent service, fair pricing.' },
  'about.values.innovation.title': { fi: 'Innovaatio', en: 'Innovation' },
  'about.values.innovation.desc': { fi: 'Älykkäät järjestelmät, saumattomat kokemukset.', en: 'Smart systems, seamless experiences.' },
  'about.values.care.title': { fi: 'Huolenpito', en: 'Care' },
  'about.values.care.desc': { fi: 'Turvallisuutesi on prioriteettimme.', en: 'Your safety is our priority.' },
  
  'about.expertise.title': { fi: 'Osaamisemme', en: 'Our Expertise' },
  'about.expertise.carServices.title': { fi: 'Autopalvelut', en: 'Car Services' },
  'about.expertise.carServices.desc': { fi: 'Kattava huolto ja korjaus kaikille automerkeille ammattitaidolla ja luotettavuudella.', en: 'Comprehensive maintenance and repair for all car brands with expertise and reliability.' },
  'about.expertise.carInspection.title': { fi: 'Katsastus', en: 'Car Inspection' },
  'about.expertise.carInspection.desc': { fi: 'Perusteellinen ajoneuvotarkastus varmistaaksemme autosi turvallisuuden ja kunnon.', en: 'Thorough vehicle inspection to ensure your car\'s safety and condition.' },
  'about.expertise.tireAndRims.title': { fi: 'Renkaat & Vanteet', en: 'Tire & Rims' },
  'about.expertise.tireAndRims.desc': { fi: 'Laadukkaat renkaat ja vanteet sekä asiantunteva asennus ja tasapainotus.', en: 'Quality tires and rims with expert installation and balancing services.' },
  'about.expertise.tireHotel.title': { fi: 'Rengashotelli', en: 'Tire Hotel' },
  'about.expertise.tireHotel.desc': { fi: 'Turvallinen ja käytännöllinen rengassäilytys optimaalisissa olosuhteissa ympäri vuoden.', en: 'Safe and convenient tire storage in optimal conditions year-round.' },
  
  'about.team.title': { fi: 'Tapaa tiimimme', en: 'Meet the Team' },
  'about.team.quote': { fi: 'Uskomme oikein tekemiseen ensimmäisellä kerralla.', en: 'We believe in doing it right the first time.' },
  
  'about.partners.title': { fi: 'Luotettavat kumppanimme', en: 'In Trusted Partnership' },
  'about.partners.subtitle': { fi: 'Integraatiot, jotka tehostavat palveluamme.', en: 'Integrations that power our service.' },
  
  'about.closing.quote': { fi: 'Emme vain huolla autoja – rakennamme kestäviä asiakassuhteita.', en: "We don't just service cars – we build lasting relationships." },
  'about.closing.cta': { fi: 'Aloita tästä', en: 'Get Started' },
  
  'about.businessInfo.companyName': { fi: 'Mitra Auto Oy', en: 'Mitra Auto Oy' },
  'about.businessInfo.businessId': { fi: 'Y-tunnus', en: 'Business ID' },
  
  // Legal Page
  'legal.nav.privacy': { fi: 'Tietosuojaseloste', en: 'Privacy Policy' },
  'legal.nav.terms': { fi: 'Käyttöehdot', en: 'Terms & Conditions' },
  
  // Chronicle Timeline
  'legal.timeline.title': { fi: 'Aikajana – Tietosuojaselosteen historia', en: 'Chronicle of Time – Privacy Policy History' },
  'legal.timeline.v1.date': { fi: 'Joulukuu 2023', en: 'Dec 2023' },
  'legal.timeline.v1.description': { fi: 'Alkuperäinen versio', en: 'Initial version' },
  'legal.timeline.v2.date': { fi: 'Maaliskuu 2025', en: 'Mar 2025' },
  'legal.timeline.v2.description': { fi: 'EU-US DPF päivitys', en: 'EU-US DPF update' },
  'legal.timeline.v3.date': { fi: 'Kesäkuu 2025', en: 'Jun 2025' },
  'legal.timeline.v3.description': { fi: 'Tavaramerkkioikeus', en: 'Trade Marks Act' },
  'legal.timeline.v4.date': { fi: 'Syyskuu 2025', en: 'Sep 2025' },
  'legal.timeline.v4.description': { fi: 'ALV-päivitys 25.5%', en: 'VAT update 25.5%' },
  'legal.timeline.v5.date': { fi: 'Marraskuu 2025', en: 'Nov 2025' },
  'legal.timeline.v5.description': { fi: 'GDPR 13 artikla', en: 'GDPR Article 13' },
  
  // Privacy Policy
  'legal.privacy.title': { fi: 'Tietosuojaseloste', en: 'Privacy Policy' },
  'legal.privacy.subtitle': { fi: 'Miten keräämme, käsittelemme ja suojaamme henkilötietojasi sekä ajoneuvosi tietoja EU:n tietosuoja-asetuksen ja Suomen tietosuojalain mukaisesti.', en: 'How we collect, process and protect your personal data and vehicle information in accordance with GDPR and Finnish Data Protection Act.' },
  'legal.privacy.effective': { fi: 'Voimaantulopäivä', en: 'Effective Date' },
  'legal.privacy.effectiveDate': { fi: '5. marraskuuta 2025', en: 'November 5, 2025' },
  'legal.privacy.lastUpdated': { fi: 'Viimeksi päivitetty', en: 'Last Updated' },
  'legal.privacy.lastUpdatedDate': { fi: '5. marraskuuta 2025', en: 'November 5, 2025' },
  
  'legal.privacy.controller.title': { fi: '1. Rekisterinpitäjä ja yhteystiedot', en: '1. Data Controller & Contact Information' },
  'legal.privacy.controller.intro': { fi: 'Henkilötietojen käsittelystä vastaa rekisterinpitäjä:', en: 'The controller responsible for processing your personal data is:' },
  'legal.privacy.controller.company': { fi: 'Yritys', en: 'Company' },
  'legal.privacy.controller.businessId': { fi: 'Y-tunnus', en: 'Business ID' },
  'legal.privacy.controller.address': { fi: 'Osoite', en: 'Address' },
  'legal.privacy.controller.email': { fi: 'Sähköposti', en: 'Email' },
  'legal.privacy.controller.phone': { fi: 'Puhelin', en: 'Phone' },
  
  'legal.privacy.dataCollected.title': { fi: '2. Kerättävät henkilötiedot', en: '2. Personal Data We Collect' },
  'legal.privacy.dataCollected.intro': { fi: 'Keräämme ja käsittelemme seuraavia henkilötietoja palvelujemme tarjoamiseksi ja asiakassuhteen hoitamiseksi:', en: 'We collect and process the following personal data to provide our services and manage customer relationships:' },
  'legal.privacy.dataCollected.item1': { fi: 'Tunnistus- ja yhteystiedot: nimi, osoite, puhelinnumero, sähköpostiosoite', en: 'Identification and contact details: name, address, phone number, email address' },
  'legal.privacy.dataCollected.item2': { fi: 'Ajoneuvotiedot: rekisteritunnus, merkki, malli, vuosimalli, VIN-numero, kilometrilukema', en: 'Vehicle information: license plate number, make, model, year, VIN number, odometer reading' },
  'legal.privacy.dataCollected.item3': { fi: 'Palvelu- ja huoltohistoria: suoritetut työt, huoltomerkinnät, varaosahistoria, katsastustiedot', en: 'Service and maintenance history: completed work, service records, parts history, inspection data' },
  'legal.privacy.dataCollected.item4': { fi: 'Varaus- ja ajanhallintatiedot: ajanvaraukset, palvelutyypit, aikataulu-preferenssit', en: 'Booking and scheduling data: appointments, service types, scheduling preferences' },
  'legal.privacy.dataCollected.item5': { fi: 'Maksu- ja laskutustiedot: laskutusosoite, maksutapatiedot (käsitellään maksunvälittäjän kautta)', en: 'Payment and billing information: billing address, payment method details (processed via payment provider)' },
  'legal.privacy.dataCollected.item6': { fi: 'Sijaintitiedot ja GPS-data: ajoneuvon sijainti (vain suostumuksella hätähinauspalvelussa)', en: 'Location and GPS data: vehicle location (only with consent for emergency towing service)' },
  'legal.privacy.dataCollected.item7': { fi: 'Tekninen data: IP-osoite, selaimen tiedot, evästeet, sivuston käyttötiedot', en: 'Technical data: IP address, browser information, cookies, website usage data' },
  'legal.privacy.dataCollected.item8': { fi: 'Viestintähistoria: asiakaspalvelukeskustelut, sähköpostiviestit, tekstiviestit', en: 'Communication history: customer service conversations, emails, text messages' },
  'legal.privacy.dataCollected.gpsNote': { fi: 'GPS-sijaintitiedot kerätään vain, kun pyydät hätähinauspalvelua, ja ne voidaan poistaa käytöstä milloin tahansa laitteen tai sovelluksen asetuksista.', en: 'GPS location is collected only when you request emergency towing and can be disabled at any time in your device or application settings.' },
  
  'legal.privacy.legalBasis.title': { fi: '3. Henkilötietojen käsittelyn oikeusperuste', en: '3. Legal Basis for Processing Personal Data' },
  'legal.privacy.legalBasis.intro': { fi: 'Käsittelemme henkilötietojasi seuraavilla EU:n tietosuoja-asetuksen (GDPR) mukaisilla oikeusperusteilla:', en: 'We process your personal data based on the following legal grounds under GDPR:' },
  'legal.privacy.legalBasis.contract': { fi: 'Sopimuksen täytäntöönpano (GDPR 6(1)(b))', en: 'Performance of Contract (GDPR 6(1)(b))' },
  'legal.privacy.legalBasis.contractDesc': { fi: 'Palvelusopimusten toteuttaminen, huoltojen suorittaminen, rengas- ja vannemyynti, rengashotellisäilytys', en: 'Execution of service contracts, performing maintenance, tire and rim sales, tire hotel storage' },
  'legal.privacy.legalBasis.consent': { fi: 'Suostumus (GDPR 6(1)(a))', en: 'Consent (GDPR 6(1)(a))' },
  'legal.privacy.legalBasis.consentDesc': { fi: 'GPS-sijaintitietojen käsittely hätähinauksessa, markkinointiviestintä, analytiikkaevästeet', en: 'Processing GPS location data for emergency towing, marketing communications, analytics cookies' },
  'legal.privacy.legalBasis.legitimate': { fi: 'Oikeutettu etu (GDPR 6(1)(f))', en: 'Legitimate Interest (GDPR 6(1)(f))' },
  'legal.privacy.legalBasis.legitimateDesc': { fi: 'Palvelun kehittäminen, asiakassuhteiden ylläpito, väärinkäytösten estäminen, tietoturva', en: 'Service improvement, customer relationship management, fraud prevention, data security' },
  'legal.privacy.legalBasis.legal': { fi: 'Lakisääteinen velvoite (GDPR 6(1)(c))', en: 'Legal Obligation (GDPR 6(1)(c))' },
  'legal.privacy.legalBasis.legalDesc': { fi: 'Kirjanpitovelvoitteet, verotus, viranomaismääräykset, kuluttajansuoja', en: 'Accounting obligations, taxation, regulatory requirements, consumer protection' },
  'legal.privacy.legalBasis.balancingNote': { fi: 'Kun käytämme oikeutettua etua, olemme suorittaneet intressipunnintatestin (Legitimate Interest Assessment). Voit vastustaa käsittelyä milloin tahansa (katso Oikeutesi).', en: 'Where we rely on legitimate interests, we have carried out a balancing test (Legitimate Interest Assessment). You may object at any time (see Your Rights).' },
  
  'legal.privacy.dataUse.title': { fi: '4. Henkilötietojen käyttötarkoitukset', en: '4. Purposes of Processing Personal Data' },
  'legal.privacy.dataUse.intro': { fi: 'Käytämme kerättyjä henkilötietoja seuraaviin tarkoituksiin:', en: 'We use collected personal data for the following purposes:' },
  'legal.privacy.dataUse.item1': { fi: 'Palveluiden toimittaminen: huolto, korjaus, rengasvaihdot, katsastuspalvelut, rengashotelli', en: 'Service delivery: maintenance, repairs, tire changes, inspection services, tire hotel' },
  'legal.privacy.dataUse.item2': { fi: 'Ajanvarausten hallinta: varausten vahvistaminen, muistutukset, aikataulumuutokset', en: 'Booking management: appointment confirmations, reminders, schedule changes' },
  'legal.privacy.dataUse.item3': { fi: 'Ajoneuvon huoltohistorian ylläpito: seurantajärjestelmä, huoltovälit, takuuasiat', en: 'Vehicle service history maintenance: tracking system, service intervals, warranty matters' },
  'legal.privacy.dataUse.item4': { fi: 'Asiakaspalvelu ja viestintä: yhteydenottoihin vastaaminen, tekninen tuki, reklamaatiot', en: 'Customer service and communication: responding to inquiries, technical support, complaints' },
  'legal.privacy.dataUse.item5': { fi: 'Laskutus ja maksujen käsittely: laskujen lähettäminen, maksujen vastaanotto ja seuranta', en: 'Billing and payment processing: sending invoices, receiving and tracking payments' },
  'legal.privacy.dataUse.item6': { fi: 'Markkinointi ja viestintä (suostumuksella): uutiset, tarjoukset, huoltomuistutukset', en: 'Marketing and communication (with consent): news, offers, service reminders' },
  'legal.privacy.dataUse.item7': { fi: 'Palvelun kehittäminen: käyttäjäkokemus, toiminnallisuudet, analytiikka', en: 'Service improvement: user experience, functionality, analytics' },
  'legal.privacy.dataUse.marketingNote': { fi: 'Voit peruuttaa suostumuksesi markkinointiviestintään milloin tahansa. Sinulla on myös ehdoton oikeus vastustaa suoramarkkinointia.', en: 'You can withdraw your consent to marketing communications at any time. You also have an absolute right to object to direct marketing.' },
  
  'legal.privacy.sharing.title': { fi: '5. Henkilötietojen luovuttaminen ja jakaminen', en: '5. Disclosure and Sharing of Personal Data' },
  'legal.privacy.sharing.intro': { fi: 'Voimme luovuttaa henkilötietojasi seuraavissa tilanteissa ja seuraaville vastaanottajille:', en: 'We may disclose your personal data in the following situations and to the following recipients:' },
  'legal.privacy.sharing.item1': { fi: 'Rengastoimittajat (esim. Vianor, Nokian Renkaat): tilausten käsittelyyn ja toimitukseen', en: 'Tire suppliers (e.g., Vianor, Nokian Tyres): for order processing and delivery' },
  'legal.privacy.sharing.item2': { fi: 'Maksunvälittäjä Paytrail Oyj: maksujen turvalliseen käsittelyyn', en: 'Payment service provider Paytrail Oyj: for secure payment processing' },
  'legal.privacy.sharing.item3': { fi: 'IT-palveluntarjoajat: verkkosivuston ylläpito, pilvipalvelut (Supabase), analytiikka', en: 'IT service providers: website hosting, cloud services (Supabase), analytics' },
  'legal.privacy.sharing.item4': { fi: 'Viranomaistahot: lakisääteisten velvoitteiden täyttämiseksi (verotus, Traficom)', en: 'Authorities: to fulfill legal obligations (taxation, Finnish Transport and Communications Agency)' },
  'legal.privacy.sharing.item5': { fi: 'Yhteistyökumppanit: katsastusasemat, vakuutusyhtiöt (vain asiakkaan pyynnöstä)', en: 'Business partners: inspection stations, insurance companies (only at customer request)' },
  'legal.privacy.sharing.noSell': { fi: 'Emme myy, vuokraa tai luovuta henkilötietojasi kaupallisiin tarkoituksiin kolmansille osapuolille ilman nimenomaista suostumustasi.', en: 'We do not sell, rent, or disclose your personal data for commercial purposes to third parties without your explicit consent.' },
  'legal.privacy.sharing.processors': { fi: 'Kaikki kolmannen osapuolen IT-, hosting- ja analytiikkapalveluntarjoajat toimivat kirjallisten tietojenkäsittelysopimusten alaisina ja vain ohjeidemme mukaan.', en: 'All third-party IT, hosting, and analytics providers act under written data-processing agreements and only on our instructions.' },
  
  'legal.privacy.transfers.title': { fi: '6. Tietojen siirto EU/ETA-alueen ulkopuolelle', en: '6. International Data Transfers' },
  'legal.privacy.transfers.desc': { fi: 'Henkilötietojasi säilytetään ja käsitellään pääasiallisesti Euroopan unionin ja Euroopan talousalueen sisällä. Mikäli palveluntarjoajamme (esim. pilvipalvelut) sijaitsevat EU/ETA-alueen ulkopuolella, varmistamme GDPR:n mukaiset asianmukaiset suojatoimet.', en: 'Your personal data is primarily stored and processed within the European Union and the European Economic Area. If our service providers (e.g., cloud services) are located outside the EU/EEA, we ensure appropriate safeguards in accordance with GDPR.' },
  'legal.privacy.transfers.safeguards': { fi: 'Kun siirtoja tapahtuu maihin, joilla ei ole riittävyyspäätöstä, käytämme Euroopan komission vakiosopimuslausekkeita (Standard Contractual Clauses) ja tarvittaessa täydentäviä teknisiä ja organisatorisia toimenpiteitä. Sertifioiduille yhdysvaltalaisille vastaanottajille turvaudumme EU–US Data Privacy Framework -riittävyyspäätökseen (10. heinäkuuta 2023).', en: 'Where transfers occur to countries without an adequacy decision, we use the European Commission\'s Standard Contractual Clauses and, where appropriate, supplementary technical and organisational measures. For certified US recipients, we rely on the EU–US Data Privacy Framework adequacy decision (10 July 2023).' },
  'legal.privacy.transfers.transferNote': { fi: 'Luovutukset viranomaisille tapahtuvat vain lain edellyttämissä tilanteissa. Ks. jakamisen suojatoimista kohta 6.', en: 'Disclosures to authorities occur only where required by law. See Section 6 for transfer safeguards.' },
  
  'legal.privacy.retention.title': { fi: '7. Henkilötietojen säilytysaika', en: '7. Data Retention Period' },
  'legal.privacy.retention.intro': { fi: 'Säilytämme henkilötietojasi vain niin kauan kuin on tarpeen käsittelyn tarkoitusten täyttämiseksi tai lakisääteisten velvoitteiden noudattamiseksi:', en: 'We retain your personal data only as long as necessary to fulfill the purposes of processing or to comply with legal obligations:' },
  'legal.privacy.retention.item1': { fi: 'Asiakastiedot ja huoltohistoria: asiakassuhteen ajan ja 10 vuotta sen päättymisen jälkeen (takuut, vastuuasiat)', en: 'Customer data and service history: during customer relationship and 10 years after termination (warranties, liability matters)' },
  'legal.privacy.retention.item2': { fi: 'Kirjanpitoaineisto: tilinpäätökset ja keskeiset kirjanpitokirjat 10 vuotta; tositteet ja muu aineisto 6 vuotta tilikauden päättymisestä (Kirjanpitolaki)', en: 'Accounting records: financial statements and core accounting records 10 years; supporting documents/vouchers 6 years from end of financial year (Finnish Accounting Act)' },
  'legal.privacy.retention.item3': { fi: 'Markkinointisuostumukset: suostumuksen peruuttamiseen asti tai 3 vuotta viimeisestä kontaktista', en: 'Marketing consents: until consent is withdrawn or 3 years from last contact' },
  'legal.privacy.retention.item4': { fi: 'Tekniset logit: vain tietoturvaan tai vianetsintään tarvittavan ajan (tyypillisesti 3-12 kuukautta). Analytiikkatiedot noudattavat analytiikkatyökalun asetuksia (GA4 oletus 2-14 kuukautta).', en: 'Technical logs: only as long as necessary for security or troubleshooting (typically 3-12 months). Analytics data follow analytics tool settings (GA4 default 2-14 months).' },
  
  'legal.privacy.security.title': { fi: '8. Tietoturva ja suojatoimet', en: '8. Data Security and Protection Measures' },
  'legal.privacy.security.intro': { fi: 'Toteutamme asianmukaiset tekniset ja organisatoriset toimenpiteet henkilötietojesi suojaamiseksi luvattomalta ja lainvastaiselta käsittelyltä:', en: 'We implement appropriate technical and organizational measures to protect your personal data from unauthorized and unlawful processing:' },
  'legal.privacy.security.item1': { fi: 'Salaus: SSL/TLS-salaus tiedonsiirrossa, tietokantasalaus levossa', en: 'Encryption: SSL/TLS encryption in transit, database encryption at rest' },
  'legal.privacy.security.item2': { fi: 'Pääsynhallinta: käyttöoikeudet vain valtuutetuille työntekijöille, kaksivaiheinen tunnistautuminen', en: 'Access control: access rights only for authorized personnel, two-factor authentication' },
  'legal.privacy.security.item3': { fi: 'Varmuuskopiointi: säännölliset automaattiset varmuuskopiot, disaster recovery -suunnitelma', en: 'Backup: regular automatic backups, disaster recovery plan' },
  'legal.privacy.security.item4': { fi: 'Henkilöstön koulutus: säännöllinen tietosuojakoulutus, salassapitositoumukset', en: 'Staff training: regular data protection training, confidentiality agreements' },
  'legal.privacy.security.item5': { fi: 'Pseudonymisointi: mahdollisuuksien mukaan pseudonymisoimme analytiikkaan tai testaukseen käytettävät tiedot', en: 'Pseudonymisation: where feasible, we pseudonymise data used for analytics or testing' },
  'legal.privacy.security.item6': { fi: 'Testaus ja arviointi: testaamme ja arvioimme säännöllisesti tietoturvasuunnitelmiamme ja palautumismenettelyjämme', en: 'Testing and review: we regularly test and review our incident-response and recovery plans' },
  
  'legal.privacy.rights.title': { fi: '9. Rekisteröidyn oikeudet', en: '9. Data Subject Rights' },
  'legal.privacy.rights.intro': { fi: 'Sinulla on EU:n yleisen tietosuoja-asetuksen (2016/679) ja Suomen tietosuojalain (1050/2018) mukaiset seuraavat oikeudet:', en: 'You have the following rights under the EU General Data Protection Regulation (2016/679) and the Finnish Data Protection Act (1050/2018):' },
  'legal.privacy.rights.access': { fi: 'Tarkastusoikeus (GDPR 15 artikla)', en: 'Right of Access (GDPR Article 15)' },
  'legal.privacy.rights.accessDesc': { fi: 'Oikeus saada vahvistus siitä, käsitelläänkö henkilötietojasi, ja saada pääsy tietoihin sekä jäljennös käsiteltävistä tiedoista', en: 'Right to obtain confirmation of whether personal data concerning you is being processed, access to that data, and a copy of the data' },
  'legal.privacy.rights.correction': { fi: 'Oikeus tietojen oikaisemiseen (GDPR 16 artikla)', en: 'Right to Rectification (GDPR Article 16)' },
  'legal.privacy.rights.correctionDesc': { fi: 'Oikeus vaatia virheellisten tai epätarkkojen henkilötietojen oikaisemista tai täydentämistä', en: 'Right to require correction or completion of inaccurate or incomplete personal data' },
  'legal.privacy.rights.erasure': { fi: 'Oikeus tietojen poistamiseen (GDPR 17 artikla)', en: 'Right to Erasure (GDPR Article 17)' },
  'legal.privacy.rights.erasureDesc': { fi: 'Oikeus vaatia henkilötietojesi poistamista, jos laillinen peruste käsittelylle puuttuu tai suostumus peruutetaan', en: 'Right to require deletion of your personal data if there is no legal basis for processing or consent is withdrawn' },
  'legal.privacy.rights.restriction': { fi: 'Oikeus käsittelyn rajoittamiseen (GDPR 18 artikla)', en: 'Right to Restriction of Processing (GDPR Article 18)' },
  'legal.privacy.rights.restrictionDesc': { fi: 'Oikeus rajoittaa henkilötietojesi käsittelyä tietyissä tilanteissa, esim. kun riitautat tietojen paikkansapitävyyden', en: 'Right to restrict processing of your personal data in certain situations, e.g., when you contest the accuracy of the data' },
  'legal.privacy.rights.portability': { fi: 'Oikeus siirtää tiedot järjestelmästä toiseen (GDPR 20 artikla)', en: 'Right to Data Portability (GDPR Article 20)' },
  'legal.privacy.rights.portabilityDesc': { fi: 'Oikeus saada toimittamasi henkilötiedot jäsennellyssä, yleisesti käytetyssä ja koneellisesti luettavassa muodossa', en: 'Right to receive your personal data in structured, commonly used, and machine-readable format' },
  'legal.privacy.rights.object': { fi: 'Vastustamisoikeus (GDPR 21 artikla)', en: 'Right to Object (GDPR Article 21)' },
  'legal.privacy.rights.objectDesc': { fi: 'Oikeus vastustaa henkilötietojesi käsittelyä, joka perustuu oikeutettuun etuun tai yleiseen etuun', en: 'Right to object to processing of your personal data based on legitimate interest or public interest' },
  'legal.privacy.rights.withdraw': { fi: 'Oikeus peruuttaa suostumus', en: 'Right to Withdraw Consent' },
  'legal.privacy.rights.withdrawDesc': { fi: 'Oikeus peruuttaa antamasi suostumus milloin tahansa vaikuttamatta peruutusta edeltäneen käsittelyn laillisuuteen', en: 'Right to withdraw your consent at any time without affecting the lawfulness of processing before withdrawal' },
  'legal.privacy.rights.complaint': { fi: 'Oikeus tehdä valitus valvontaviranomaiselle', en: 'Right to Lodge a Complaint' },
  'legal.privacy.rights.complaintDesc': { fi: 'Oikeus tehdä valitus Tietosuojavaltuutetulle (www.tietosuoja.fi), jos katsot, että henkilötietojesi käsittely rikkoo tietosuojalainsäädäntöä', en: 'Right to lodge a complaint with the Data Protection Ombudsman (www.tietosuoja.fi) if you believe processing of your personal data violates data protection legislation' },
  'legal.privacy.rights.contact': { fi: 'Voit käyttää oikeuksiasi ottamalla yhteyttä sähköpostitse osoitteeseen info.mitra.auto@gmail.com tai kirjallisesti osoitteeseen Mitra Auto Oy, Hankasuontie 5, 00390 Helsinki. Vastaamme pyyntöihisi yhden kuukauden kuluessa.', en: 'You can exercise your rights by contacting us via email at info.mitra.auto@gmail.com or in writing to Mitra Auto Oy, Hankasuontie 5, 00390 Helsinki. We will respond to your requests within one month.' },
  'legal.privacy.rights.objectMarketing': { fi: 'Voit vastustaa oikeutettuun etuun perustuvaa käsittelyä ja vastustaa suoramarkkinointia milloin tahansa.', en: 'You may object to processing based on our legitimate interests and may object to direct marketing at any time.' },
  
  'legal.privacy.automated.title': { fi: '10. Automatisoitu päätöksenteko ja profilointi', en: '10. Automated Decision-Making and Profiling' },
  'legal.privacy.automated.desc': { fi: 'Tällä hetkellä emme käytä automaattista päätöksentekoa tai profilointia, joka tuottaisi sinua koskevia oikeusvaikutuksia tai vastaavasti merkittävästi vaikuttaisi sinuun.', en: 'We currently do not use automated decision-making or profiling that would produce legal effects concerning you or similarly significantly affect you.' },
  'legal.privacy.automated.future': { fi: 'Jos otamme tulevaisuudessa käyttöön automatisoitua päätöksentekoa, tarjoamme merkityksellisiä tietoja logiikasta, sen merkityksestä ja varmistamme inhimillisen tarkastelun mahdollisuuden.', en: 'If we implement automated decision-making in the future, we will provide meaningful information about the logic involved, its significance, and ensure human review options.' },
  
  'legal.privacy.cookies.title': { fi: '11. Evästeet ja seurantateknologiat', en: '11. Cookies and Tracking Technologies' },
  'legal.privacy.cookies.intro': { fi: 'Verkkosivustomme käyttää evästeitä parantaaksemme käyttökokemusta ja analysoidaksemme sivuston käyttöä:', en: 'Our website uses cookies to improve user experience and analyze website usage:' },
  'legal.privacy.cookies.essential': { fi: 'Välttämättömät evästeet', en: 'Essential Cookies' },
  'legal.privacy.cookies.essentialDesc': { fi: 'Tekniset evästeet, jotka ovat välttämättömiä verkkosivuston toiminnallisuuden, ajanvarausjärjestelmän ja turvallisen kirjautumisen kannalta', en: 'Technical cookies essential for website functionality, booking system, and secure login' },
  'legal.privacy.cookies.functional': { fi: 'Toiminnalliset evästeet', en: 'Functional Cookies' },
  'legal.privacy.cookies.functionalDesc': { fi: 'Muistavat valintasi (kieli, teema) ja parantavat käyttökokemusta', en: 'Remember your preferences (language, theme) and improve user experience' },
  'legal.privacy.cookies.analytics': { fi: 'Analytiikkaevästeet', en: 'Analytics Cookies' },
  'legal.privacy.cookies.analyticsDesc': { fi: 'Keräävät aggregoitua tai mahdollisuuksien mukaan pseudonymisoitua tietoa sivuston käytöstä kävijämäärien, sivulatausten ja käyttäjäpolkujen analysointiin', en: 'Collect aggregated or pseudonymised data where possible about website usage for visitor counts, page loads, and user journey analysis' },
  'legal.privacy.cookies.marketing': { fi: 'Markkinointievästeet', en: 'Marketing Cookies' },
  'legal.privacy.cookies.marketingDesc': { fi: 'Käytetään kohdennettuun mainontaan ja markkinointiviestinnän tehokkuuden mittaamiseen (vain suostumuksella)', en: 'Used for targeted advertising and measuring marketing communication effectiveness (only with consent)' },
  'legal.privacy.cookies.consent': { fi: 'Ei-välttämättömät evästeet (analytiikka, markkinointi) aktivoidaan vain sen jälkeen, kun annat suostumuksen evästebannerin kautta. Voit muuttaa tai peruuttaa suostumuksen milloin tahansa.', en: 'Non-essential cookies (analytics, marketing) are activated only after you give consent via our cookie banner. You can change or withdraw consent anytime.' },
  'legal.privacy.cookies.control': { fi: 'Evästebanneri antaa sinun hyväksyä tai hylätä evästeet kategorioidensa mukaan ja tarkistaa asetukset myöhemmin uudelleen.', en: 'Our banner lets you accept or reject cookies by category and revisit settings later.' },
  
  'legal.privacy.thirdParty.title': { fi: '12. Kolmannen osapuolen palvelut', en: '12. Third-Party Services' },
  'legal.privacy.thirdParty.intro': { fi: 'Verkkosivustomme ja palvelumme käyttävät seuraavia kolmannen osapuolen palveluntarjoajia:', en: 'Our website and services use the following third-party service providers:' },
  'legal.privacy.thirdParty.item1': { fi: 'Paytrail Oyj (maksupalvelut): käsittelee maksutiedot turvallisesti PCI DSS -standardin mukaisesti', en: 'Paytrail Oyj (payment services): processes payment information securely in accordance with PCI DSS standards' },
  'legal.privacy.thirdParty.item2': { fi: 'Supabase (tietokantapalvelut): pilvipalvelu asiakastietojen ja varausten hallintaan', en: 'Supabase (database services): cloud service for customer data and booking management' },
  'legal.privacy.thirdParty.item3': { fi: 'Google Analytics (analytiikka): anonymisoitu sivuston käyttötietojen analyysi', en: 'Google Analytics (analytics): anonymized website usage data analysis' },
  'legal.privacy.thirdParty.item4': { fi: 'Vianor Trading Oy ja muut rengastoimittajat: rengastietojen ja toimitustietojen välitys', en: 'Vianor Trading Oy and other tire suppliers: tire data and delivery information transfer' },
  'legal.privacy.thirdParty.regions': { fi: 'Paytrail ja rengastoimittajat sijaitsevat EU:ssa. Supabase ja Google Analytics voivat käsitellä tietoja EU:n ulkopuolella suojatoimien alaisina (ks. kohta 6).', en: 'Paytrail and tire suppliers are located in the EU. Supabase and Google Analytics may process data outside the EU subject to safeguards (see Section 6).' },
  
  'legal.privacy.children.title': { fi: '13. Alaikäisten tietosuoja', en: '13. Children\'s Privacy' },
  'legal.privacy.children.desc': { fi: 'Palvelumme on tarkoitettu täysi-ikäisille henkilöille. Emme tietoisesti kerää henkilötietoja alle 18-vuotiailta henkilöiltä ilman huoltajan suostumusta. Jos huomaat, että alaikäinen on toimittanut meille henkilötietoja, ota yhteyttä välittömästi.', en: 'Our services are intended for adults. We do not knowingly collect personal data from individuals under 18 years of age without parental consent. If you notice that a minor has provided us with personal data, please contact us immediately.' },
  'legal.privacy.children.ageNote': { fi: 'Suomen lain mukaan informaatioyhteiskunnan palveluiden digitaalisen suostumuksen ikäraja on 13 vuotta.', en: 'Under Finnish law, the age of digital consent for information-society services is 13 years.' },
  
  'legal.privacy.changes.title': { fi: '14. Muutokset tietosuojaselosteeseen', en: '14. Changes to This Privacy Policy' },
  'legal.privacy.changes.desc': { fi: 'Voimme päivittää tätä tietosuojaselostetta ajoittain vastaamaan lainsäädännön muutoksia, uusia palveluja tai liiketoimintakäytäntöjä. Merkittävistä muutoksista ilmoitamme rekisteröidyille asiakkaille sähköpostitse tai verkkosivustollamme vähintään 30 päivää ennen muutosten voimaantuloa.', en: 'We may update this Privacy Policy from time to time to reflect changes in legislation, new services, or business practices. We will notify registered customers of significant changes via email or on our website at least 30 days before the changes take effect.' },
  'legal.privacy.changes.archive': { fi: 'Säilytämme arkistoa aiemmista versioista ja näytämme kunkin version voimaantulopäivän.', en: 'We maintain an archive of previous versions and show the effective date of each version.' },
  'legal.privacy.changes.effective': { fi: 'Viimeksi päivitetty', en: 'Last Updated' },
  'legal.privacy.changes.date': { fi: '5. marraskuuta 2025', en: 'November 5, 2025' },
  
  // Terms & Conditions
  'legal.terms.title': { fi: 'Käyttöehdot ja sopimusehdot', en: 'Terms & Conditions of Service' },
  'legal.terms.subtitle': { fi: 'Yleiset sopimusehdot, joilla Mitra Auto Oy tarjoaa autohuolto-, rengaspalvelu-, katsastus- ja rengashotellipalveluja Suomessa.', en: 'General terms and conditions under which Mitra Auto Oy provides automotive service, tire services, inspection, and tire hotel services in Finland.' },
  'legal.terms.version': { fi: 'Versio', en: 'Version' },
  'legal.terms.versionNumber': { fi: '1.0', en: '1.0' },
  'legal.terms.effective': { fi: 'Voimaantulopäivä', en: 'Effective Date' },
  'legal.terms.effectiveDate': { fi: '5. marraskuuta 2025', en: 'November 5, 2025' },
  
  'legal.terms.acceptance.title': { fi: '1. Sopimusehtojen hyväksyminen', en: '1. Acceptance of Terms' },
  'legal.terms.acceptance.intro': { fi: 'Nämä yleiset sopimusehdot ("Ehdot") koskevat kaikkia Mitra Auto Oy:n (Y-tunnus 3408833-8) tarjoamia palveluja ja tuotteita. Käyttämällä palveluitamme, tekemällä varauksen tai ostamalla tuotteita sitoudut noudattamaan näitä ehtoja.', en: 'These General Terms and Conditions ("Terms") apply to all services and products provided by Mitra Auto Oy (Business ID 3408833-8). By using our services, making a booking, or purchasing products, you agree to comply with these Terms.' },
  'legal.terms.acceptance.binding': { fi: 'Mikäli et hyväksy näitä ehtoja, älä käytä palveluitamme. Varauksen tai tilauksen tekeminen katsotaan näiden ehtojen hyväksymiseksi.', en: 'If you do not accept these Terms, please do not use our services. Making a booking or order is considered acceptance of these Terms.' },
  'legal.terms.acceptance.language': { fi: 'Jos nämä Ehdot ovat saatavilla useilla kielillä, suomenkielinen versio on ensisijainen ristiriitatilanteissa.', en: 'If these Terms are available in multiple languages, the Finnish version prevails in case of conflict.' },
  
  'legal.terms.definitions.title': { fi: '2. Määritelmät', en: '2. Definitions' },
  'legal.terms.definitions.intro': { fi: 'Näissä käyttöehdoissa seuraavilla termeillä on alla mainitut merkitykset:', en: 'In these Terms and Conditions, the following terms have the meanings set out below:' },
  'legal.terms.definitions.consumer': { fi: 'Kuluttaja', en: 'Consumer' },
  'legal.terms.definitions.consumerDesc': { fi: 'Luonnollinen henkilö, joka toimii pääasiassa kaupan tai elinkeinonsa ulkopuolella', en: 'A natural person acting mainly outside their trade or business' },
  'legal.terms.definitions.business': { fi: 'Yritysasiakas', en: 'Business Customer' },
  'legal.terms.definitions.businessDesc': { fi: 'Kaikki muut kuin kuluttaja-asiakkaat (yritykset, yhdistykset, elinkeinonharjoittajat)', en: 'Any non-consumer customer (companies, associations, traders)' },
  'legal.terms.definitions.customer': { fi: 'Asiakas', en: 'Customer' },
  'legal.terms.definitions.customerDesc': { fi: 'Luonnollinen henkilö tai oikeushenkilö, joka tilaa tai ostaa Mitra Auton palveluita tai tuotteita', en: 'Natural person or legal entity who orders or purchases services or products from Mitra Auto' },
  'legal.terms.definitions.vehicle': { fi: 'Ajoneuvo', en: 'Vehicle' },
  'legal.terms.definitions.vehicleDesc': { fi: 'Asiakkaan omistama tai hallinnassa oleva moottoriajoneuvo, johon palvelu kohdistuu', en: 'Motor vehicle owned or possessed by the Customer to which the service applies' },
  'legal.terms.definitions.service': { fi: 'Palvelu', en: 'Service' },
  'legal.terms.definitions.serviceDesc': { fi: 'Kaikki Mitra Auton tarjoamat palvelut: huolto, korjaus, katsastus, rengasvaihdot, rengashotelli, hinaus', en: 'All services provided by Mitra Auto: maintenance, repair, inspection, tire changes, tire hotel, towing' },
  'legal.terms.definitions.product': { fi: 'Tuote', en: 'Product' },
  'legal.terms.definitions.productDesc': { fi: 'Myytävät tavarat kuten renkaat, vanteet, varaosat ja tarvikkeet', en: 'Goods for sale such as tires, rims, spare parts, and accessories' },
  'legal.terms.definitions.booking': { fi: 'Varaus', en: 'Booking' },
  'legal.terms.definitions.bookingDesc': { fi: 'Ajanvaraus palveluun verkkosivuston, puhelimen tai paikanpäällä tehdyn sopimuksen kautta', en: 'Service appointment made via website, phone, or on-site agreement' },
  'legal.terms.definitions.serviceHistory': { fi: 'Huoltohistoria', en: 'Service History' },
  'legal.terms.definitions.serviceHistoryDesc': { fi: 'Ajoneuvon huolto- ja korjaustietojen sähköinen tai kirjallinen dokumentaatio', en: 'Electronic or written documentation of vehicle maintenance and repair data' },
  'legal.terms.definitions.tireHotel': { fi: 'Rengashotelli', en: 'Tire Hotel' },
  'legal.terms.definitions.tireHotelDesc': { fi: 'Renkaiden ja vanteiden kausivaihdon ulkopuolinen säilytyspalvelu Mitra Auton tiloissa', en: 'Seasonal tire and rim storage service at Mitra Auto facilities' },
  
  'legal.terms.scope.title': { fi: '3. Palveluiden laajuus ja soveltamisala', en: '3. Scope and Applicability of Services' },
  'legal.terms.scope.intro': { fi: 'Mitra Auto Oy tarjoaa seuraavia palveluita ja tuotteita Suomessa, pääasiassa Helsingin seudulla:', en: 'Mitra Auto Oy provides the following services and products in Finland, primarily in the Helsinki metropolitan area:' },
  'legal.terms.scope.item1': { fi: 'Autojen huolto- ja korjauspalvelut: määräaikaishuollot, öljynvaihdot, jarrut, jousitukset, pakoputket', en: 'Vehicle maintenance and repair services: scheduled maintenance, oil changes, brakes, suspensions, exhaust systems' },
  'legal.terms.scope.item2': { fi: 'Rengas- ja vannepalvelut: rengas- ja vannemyynti toimittajien valikoimista, rengasvaihdot, tasapainotukset, paikkaukset', en: 'Tire and rim services: tire and rim sales from supplier selections, tire changes, balancing, puncture repairs' },
  'legal.terms.scope.item3': { fi: 'Katsastuspalvelut: rekisterikatsastukset Trafin hyväksymissä katsastuspisteissä', en: 'Inspection services: vehicle inspections at Finnish Transport and Communications Agency approved inspection points' },
  'legal.terms.scope.item4': { fi: 'Rengashotellipalvelu: renkaiden ja vanteiden säilytys asianmukaisissa olosuhteissa', en: 'Tire hotel service: storage of tires and rims in appropriate conditions' },
  'legal.terms.scope.item5': { fi: 'Hätähinauspalvelu ("Rescue 24/7"): ajoneuvon hinaus tien varresta korjaamolle', en: 'Emergency towing service ("Rescue 24/7"): vehicle towing from roadside to repair facility' },
  'legal.terms.scope.item6': { fi: 'Online-ajanvaraus: sähköinen varausjärjestelmä palveluiden varaamiseen ja hallintaan', en: 'Online booking: electronic booking system for reserving and managing services' },
  'legal.terms.scope.location': { fi: 'Palvelut tarjotaan Suomessa. Jotkin palvelut (esim. katsastukset) suorittavat lisensoidut kumppanit.', en: 'Services are provided in Finland. Some services (e.g., inspections) are performed by licensed partners.' },
  
  'legal.terms.obligations.title': { fi: '4. Asiakkaan velvollisuudet ja vastuut', en: '4. Customer Obligations and Responsibilities' },
  'legal.terms.obligations.intro': { fi: 'Asiakas sitoutuu ja vastaa seuraavista:', en: 'The Customer commits to and is responsible for the following:' },
  'legal.terms.obligations.item1': { fi: 'Antamaan tarkat ja totuudenmukaiset tiedot ajoneuvosta (rekisterinumero, malli, vuosimalli, käyttötarkoitus)', en: 'Providing accurate and truthful information about the vehicle (license plate, model, year, usage purpose)' },
  'legal.terms.obligations.item2': { fi: 'Ilmoittamaan mahdollisista ajoneuvon erityispiirteistä, modifikaatioista tai vaurioista ennen palvelua', en: 'Reporting any special features, modifications, or damages to the vehicle before service' },
  'legal.terms.obligations.item3': { fi: 'Noudattamaan Mitra Auton antamia ohjeita, suosituksia ja turvallisuusmääräyksiä', en: 'Following instructions, recommendations, and safety regulations provided by Mitra Auto' },
  'legal.terms.obligations.item4': { fi: 'Maksamaan palvelut ja tuotteet sovitussa ajassa ja sovitulla maksutavalla', en: 'Paying for services and products on time and using agreed payment methods' },
  'legal.terms.obligations.item5': { fi: 'Poistamaan henkilökohtaiset tavarat ja arvokkaat esineet ajoneuvosta ennen palvelun aloittamista', en: 'Removing personal belongings and valuables from the vehicle before service begins' },
  'legal.terms.obligations.item6': { fi: 'Noutamaan ajoneuvon sovitussa ajassa palvelun valmistuttua (viive voi johtaa lisämaksuihin)', en: 'Picking up the vehicle on time after service completion (delays may result in additional charges)' },
  
  'legal.terms.bookings.title': { fi: '5. Ajanvaraukset ja varausten hallinta', en: '5. Bookings and Appointment Management' },
  'legal.terms.bookings.intro': { fi: 'Ajanvaraukset voidaan tehdä seuraavilla tavoilla:', en: 'Appointments can be made through the following methods:' },
  'legal.terms.bookings.process': { fi: 'Varausprosessi', en: 'Booking Process' },
  'legal.terms.bookings.processDesc': { fi: 'Verkkosivuston kautta: ajoneuvon rekisteritunnus → palvelun valinta → päivämäärä ja aika → yhteystiedot → varauksen vahvistus sähköpostitse ja tekstiviestillä', en: 'Via website: vehicle license plate → service selection → date and time → contact details → booking confirmation via email and SMS' },
  'legal.terms.bookings.confirmation': { fi: 'Varauksen vahvistus', en: 'Booking Confirmation' },
  'legal.terms.bookings.confirmationDesc': { fi: 'Varaus tulee voimaan, kun asiakas on saanut kirjallisen vahvistuksen sähköpostitse tai tekstiviestillä. Mitra Auto pidättää oikeuden hylätä varauksen, jos kapasiteetti ei riitä.', en: 'Booking becomes valid when the customer has received written confirmation via email or SMS. Mitra Auto reserves the right to reject a booking if capacity is insufficient.' },
  'legal.terms.bookings.cancellation': { fi: 'Peruutuskäytäntö', en: 'Cancellation Policy' },
  'legal.terms.bookings.cancellationDesc': { fi: 'Maksuton peruutus vähintään 24 tuntia ennen varattua aikaa. Peruutukset tehdään verkkosivuston kautta, sähköpostitse tai puhelimitse.', en: 'Free cancellation at least 24 hours before the scheduled time. Cancellations are made via website, email, or phone.' },
  'legal.terms.bookings.rescheduling': { fi: 'Ajan siirto', en: 'Rescheduling' },
  'legal.terms.bookings.reschedulingDesc': { fi: 'Ajan siirto ilman lisämaksua ensimmäisellä kerralla, jos tehdään vähintään 12 tuntia ennen alkuperäistä aikaa.', en: 'Rescheduling without additional fee for the first time if done at least 12 hours before the original time.' },
  'legal.terms.bookings.noShow': { fi: 'Saapumatta jättäminen', en: 'No-Show' },
  'legal.terms.bookings.noShowDesc': { fi: 'Jos asiakas ei saavu varattuun aikaan eikä ilmoita peruutuksesta, Mitra Auto pidättää oikeuden veloittaa 50 euron käsittelymaksun.', en: 'If the customer does not arrive at the booked time and does not notify of cancellation, Mitra Auto reserves the right to charge a processing fee of 50 euros.' },
  'legal.terms.bookings.lateCancellation': { fi: 'Myöhäinen peruutus', en: 'Late Cancellation' },
  'legal.terms.bookings.lateCancellationDesc': { fi: 'Peruutukset alle 24 tuntia ennen varattua aikaa voivat johtaa 30 euron peruutusmaksuun.', en: 'Cancellations less than 24 hours before scheduled time may result in a cancellation fee of 30 euros.' },
  
  'legal.terms.payment.title': { fi: '6. Hinnoittelu ja maksuehdot', en: '6. Pricing and Payment Terms' },
  'legal.terms.payment.intro': { fi: 'Hinnoitteluun ja maksuihin sovelletaan seuraavia ehtoja:', en: 'The following terms apply to pricing and payments:' },
  'legal.terms.payment.item1': { fi: 'Hinnat: Kaikki verkkosivustolla ja tarjouksissa ilmoitetut hinnat sisältävät Suomen arvonlisäveron (ALV 25,5 %), ellei toisin mainita. Hinnat ovat voimassa tarjoushetkellä.', en: 'Prices: All prices stated on the website and in quotes include Finnish value-added tax (VAT 25.5%) unless otherwise stated. Prices are valid at the time of offer.' },
  'legal.terms.payment.item2': { fi: 'Maksupalveluntarjoaja: Maksut käsitellään Paytrail Oyj:n (Y-tunnus 2122839-7) kautta. Hyväksymme pankki- ja luottokorttimaksut, verkkopankkimaksut sekä laskun yrityksille.', en: 'Payment service provider: Payments are processed via Paytrail Oyj (Business ID 2122839-7). We accept bank and credit card payments, online banking, and invoicing for businesses.' },
  'legal.terms.payment.item3': { fi: 'Maksuaika: Palvelut maksetaan työn valmistuttua ennen ajoneuvon luovutusta. Laskuasiakkaille maksuaika on 14 päivää netto.', en: 'Payment terms: Services are paid upon completion before vehicle handover. For invoice customers, payment term is 14 days net.' },
  'legal.terms.payment.item4': { fi: 'Viivästyskorko: Maksun viivästyessä perimme Suomen korkolain (633/1982) mukaisen viivästyskoron (referenssikorko + 8 %).', en: 'Late payment interest: For late payments, we charge interest according to Finnish Interest Act (633/1982) (reference rate + 8%).' },
  'legal.terms.payment.item5': { fi: 'Ennakkomaksu: Rengastilaukset ja erikoisvaraosat voivat vaatia 30-50% ennakkomaksun ennen tilausta toimittajalta.', en: 'Advance payment: Tire orders and special parts may require 30-50% advance payment before ordering from supplier.' },
  'legal.terms.payment.item6': { fi: 'Hinnanmuutokset: Mitra Auto pidättää oikeuden muuttaa hintoja ilman ennakkoilmoitusta. Vahvistettuihin varauksiin sovelletaan varaushetken hintoja.', en: 'Price changes: Mitra Auto reserves the right to change prices without prior notice. Confirmed bookings are subject to prices at time of booking.' },
  'legal.terms.payment.item7': { fi: 'Lisätyöt: Jos työn aikana havaitaan tarve lisätöille, asiakas hyväksyy nämä erikseen ennen töiden aloittamista. Kiireellisistä korjauksista (turvallisuus) ilmoitetaan välittömästi.', en: 'Additional work: If need for additional work is discovered during service, customer must approve separately before work begins. Urgent repairs (safety) are reported immediately.' },
  
  'legal.terms.delivery.title': { fi: '7. Tuotetoimitus ja varastosaatavuus', en: '7. Product Delivery and Stock Availability' },
  'legal.terms.delivery.intro': { fi: 'Tuotteiden myynti ja toimitus:', en: 'Product sales and delivery:' },
  'legal.terms.delivery.item1': { fi: 'Rengastoimittajat: Mitra Auto toimii välittäjänä rengastoimituksissa. Renkaat ja vanteet tilataan ulkopuolisilta toimittajilta kuten Vianor Trading Oy, Nokian Renkaat Oyj ja muut hyväksytyt kumppanit.', en: 'Tire suppliers: Mitra Auto acts as intermediary for tire deliveries. Tires and rims are ordered from external suppliers such as Vianor Trading Oy, Nokian Tyres Plc, and other approved partners.' },
  'legal.terms.delivery.item2': { fi: 'Toimitusajat: Ilmoitetut toimitusajat ovat arvioita. Todelliset toimitusajat riippuvat toimittajan varastotilanteesta ja logistiikasta. Tyypilliset toimitusajat 2-7 arkipäivää.', en: 'Delivery times: Stated delivery times are estimates. Actual delivery times depend on supplier stock situation and logistics. Typical delivery times 2-7 business days.' },
  'legal.terms.delivery.item3': { fi: 'Saatavuus: Tuotteiden saatavuus vahvistetaan tilausta tehtäessä. Mikäli tuote ei olekaan saatavilla, asiakkaalle ilmoitetaan viipymättä ja tarjotaan vaihtoehtoisia tuotteita tai täysi hyvitys.', en: 'Availability: Product availability is confirmed when placing order. If product is not available, customer is notified promptly and offered alternative products or full refund.' },
  'legal.terms.delivery.item4': { fi: 'Toimitusongelmat: Mitra Auto ei ole vastuussa toimittajien aiheuttamista viivästyksistä, varastonpuutteista tai logistiikkaongelmista, jotka ovat kohtuullisen hallinnan ulkopuolella.', en: 'Delivery issues: Mitra Auto is not liable for delays, stock shortages, or logistics problems caused by suppliers that are beyond reasonable control.' },
  'legal.terms.delivery.item5': { fi: 'Tuotteiden vastaanotto: Asiakas tarkastaa tuotteet vastaanotettaessa ja ilmoittaa mahdollisista vaurioista tai virheistä välittömästi.', en: 'Product receipt: Customer inspects products upon receipt and reports any damages or errors immediately.' },
  'legal.terms.delivery.item6': { fi: 'Palautusoikeus: Kuluttaja-asiakkailla on 14 päivän palautusoikeus kuluttajansuojalain (38/1978) mukaisesti käyttämättömiin tuotteisiin alkuperäispakkauksessa.', en: 'Right of return: Consumer customers have 14-day right of return according to Consumer Protection Act (38/1978) for unused products in original packaging.' },
  
  'legal.terms.tireHotel.title': { fi: '8. Rengashotellipalvelu', en: '8. Tire Hotel Service' },
  'legal.terms.tireHotel.intro': { fi: 'Rengashotellisäilytystä koskevat erityisehdot:', en: 'Special terms for tire hotel storage:' },
  'legal.terms.tireHotel.item1': { fi: 'Säilytysolosuhteet: Renkaat ja vanteet säilytetään kuivassa, pimeässä ja viileässä tilassa renkaiden valmistajan suositusten mukaisesti. Lämpötila +5 - +20°C.', en: 'Storage conditions: Tires and rims are stored in dry, dark, and cool space according to tire manufacturer recommendations. Temperature +5 - +20°C.' },
  'legal.terms.tireHotel.item2': { fi: 'Säilytysaika: Tyypillinen säilytyskausi on lokakuusta huhtikuuhun (talvirenkaat) tai toukokuusta syyskuuhun (kesärenkaat). Vuosisopimukset mahdollisia.', en: 'Storage period: Typical storage season is October to April (winter tires) or May to September (summer tires). Annual agreements possible.' },
  'legal.terms.tireHotel.item3': { fi: 'Säilytyshinnat: Hinnat määräytyvät renkaiden koon ja lukumäärän mukaan. Hinta sisältää renkaiden pesun, tarkastuksen ja merkinnän. Rengasvaihdot veloitetaan erikseen.', en: 'Storage prices: Prices are determined by tire size and quantity. Price includes tire washing, inspection, and labeling. Tire changes are charged separately.' },
  'legal.terms.tireHotel.item4': { fi: 'Vakuutus ja vastuu: Säilytettävät renkaat ovat vakuutettuja varkaus- ja palovahinkojen varalta. Mitra Auton vastuu rajoittuu 2000 euroon per rengas- ja vannesetti.', en: 'Insurance and liability: Stored tires are insured against theft and fire damage. Mitra Auto liability is limited to 2000 euros per tire and rim set.' },
  'legal.terms.tireHotel.item5': { fi: 'Noutamatta jääneet renkaat: Mikäli asiakas ei nouda renkaita 60 päivän kuluessa säilytyskauden päättymisestä, Mitra Auto pidättää oikeuden hävittää renkaat asianmukaisesti ja veloittaa käsittelymaksun 100 euroa.', en: 'Unclaimed tires: If customer does not pick up tires within 60 days after storage period ends, Mitra Auto reserves the right to dispose of tires appropriately and charge a handling fee of 100 euros.' },
  
  'legal.terms.inspection.title': { fi: '9. Katsastuspalvelut', en: '9. Vehicle Inspection Services' },
  'legal.terms.inspection.intro': { fi: 'Rekisterikatsastuksia koskevat ehdot:', en: 'Terms for vehicle inspections:' },
  'legal.terms.inspection.item1': { fi: 'Katsastuspisteet: Mitra Auto toimii yhteistyössä Trafin (Liikenne- ja viestintävirasto) hyväksymien katsastusasemien kanssa. Varsinaisen katsastuksen suorittaa valtuutettu katsastaja.', en: 'Inspection points: Mitra Auto collaborates with inspection stations approved by the Finnish Transport and Communications Agency (Traficom). Actual inspection is performed by authorized inspector.' },
  'legal.terms.inspection.item2': { fi: 'Katsastuksen hylkääminen: Mikäli ajoneuvo hylätään katsastuksessa, Mitra Auto tarjoaa korjauspalvelut havaittujen puutteiden korjaamiseksi. Uusintakatsastus tehdään erillisellä varauksella.', en: 'Inspection rejection: If vehicle fails inspection, Mitra Auto offers repair services to fix identified deficiencies. Re-inspection is done with separate booking.' },
  'legal.terms.inspection.item3': { fi: 'Katsastusmaksut: Katsastusmaksut määräytyvät Trafin vahvistamien hintojen mukaan. Korjauskustannukset arvio tutetaan erikseen ennen töiden aloittamista.', en: 'Inspection fees: Inspection fees are determined according to rates confirmed by Traficom. Repair costs are estimated separately before work begins.' },
  
  'legal.terms.quality.title': { fi: '10. Palvelun laatu ja standardit', en: '10. Service Quality and Standards' },
  'legal.terms.quality.intro': { fi: 'Mitra Auto sitoutuu seuraaviin laatustandardeihin:', en: 'Mitra Auto commits to the following quality standards:' },
  'legal.terms.quality.item1': { fi: 'Ammattitaito: Kaikki työt suorittaa koulutettu ja ammattitaitoinen henkilöstö. Mekaanikkojemme pätevyys täyttää alan ammattitaitovaatimukset.', en: 'Professional competence: All work is performed by trained and qualified personnel. Our mechanics meet industry professional competency requirements.' },
  'legal.terms.quality.item2': { fi: 'Varaosat ja materiaalit: Käytämme alkuperäisiä tai vastaavan laatuisia varaosia ja materiaaleja, ellei asiakas erikseen hyväksy muita vaihtoehtoja.', en: 'Parts and materials: We use original or equivalent quality spare parts and materials unless customer specifically approves other options.' },
  'legal.terms.quality.item3': { fi: 'Työturvallisuus: Noudatamme Suomen työturvallisuuslakia (738/2002) ja alan parhaita käytäntöjä kaikissa työvaiheissa.', en: 'Occupational safety: We comply with Finnish Occupational Safety Act (738/2002) and industry best practices in all work phases.' },
  'legal.terms.quality.item4': { fi: 'Ympäristövastuullisuus: Jätteiden käsittely, öljyjen kierrätys ja ympäristönsuojelu toteutetaan ympäristönsuojelulain (527/2014) mukaisesti.', en: 'Environmental responsibility: Waste management, oil recycling, and environmental protection are implemented according to Environmental Protection Act (527/2014).' },
  
  'legal.terms.warranty.title': { fi: '11. Takuu, vastuu ja reklamaatiot', en: '11. Warranty, Liability, and Complaints' },
  'legal.terms.warranty.intro': { fi: 'Palveluihin ja tuotteisiin sovelletaan seuraavia takuu- ja vastuuehtoja:', en: 'The following warranty and liability terms apply to services and products:' },
  'legal.terms.warranty.service': { fi: 'Palvelutakuu', en: 'Service Warranty' },
  'legal.terms.warranty.serviceDesc': { fi: 'Suoritetut huolto- ja korjaustyöt: 12 kuukautta tai 10 000 km sen mukaan, kumpi tulee ensin. Takuu kattaa työn virheet ja käytetyt varaosat. Takuu ei kata normaalia kulumista tai väärinkäytöstä aiheutuvia vaurioita.', en: 'Completed maintenance and repair work: 12 months or 10,000 km, whichever comes first. Warranty covers work errors and parts used. Warranty does not cover normal wear or damage from misuse.' },
  'legal.terms.warranty.products': { fi: 'Tuotetakuut', en: 'Product Warranties' },
  'legal.terms.warranty.productsDesc': { fi: 'Renkaat ja vanteet: valmistajan myöntämä takuu (tyypillisesti 2-5 vuotta valmistusviasta). Kulutuspinnan tasainen kuluminen ei kuulu takuun piiriin.', en: 'Tires and rims: manufacturer warranty (typically 2-5 years for manufacturing defects). Even tread wear is not covered by warranty.' },
  'legal.terms.warranty.limitation': { fi: 'Vastuunrajoitus', en: 'Limitation of Liability' },
  'legal.terms.warranty.limitationDesc': { fi: 'Mitra Auton korvausvastuu rajoittuu asiakkaan maksamaan palvelun tai tuotteen hintaan, ellei kyse ole tahallisesta tai törkeästä huolimattomuudesta. Vastuu ei kata seurannaisvahinkoja.', en: 'Mitra Auto liability is limited to the price of service or product paid by customer, unless involving intentional or gross negligence. Liability does not cover consequential damages.' },
  'legal.terms.warranty.indirect': { fi: 'Välilliset vahingot', en: 'Indirect Damages' },
  'legal.terms.warranty.indirectDesc': { fi: 'Mitra Auto ei vastaa välillisistä vahingoista kuten tulon menetyksestä, käyttökatkoksesta tai vaihtoehtoisten kuljetuskustannuksista, ellei pakottava lainsäädäntö muuta edellytä.', en: 'Mitra Auto is not liable for indirect damages such as loss of income, business interruption, or alternative transportation costs unless required by mandatory legislation.' },
  'legal.terms.warranty.vehicleDamage': { fi: 'Ajoneuvovahingot', en: 'Vehicle Damage' },
  'legal.terms.warranty.vehicleDamageDesc': { fi: 'Työn aikana aiheutuneet vahingot asiakkaan ajoneuvoon korvataan täysimääräisesti. Ennestään olemassa olevat vauriot dokumentoidaan työn vastaanottovaiheessa.', en: 'Damages to customer vehicle during work are compensated in full. Pre-existing damages are documented at vehicle acceptance.' },
  'legal.terms.warranty.consumerRights': { fi: 'Kuluttajien oikeudet', en: 'Consumer Rights' },
  'legal.terms.warranty.consumerRightsDesc': { fi: 'Kuluttaja-asiakkaiden oikeudet kuluttajansuojalain (38/1978) mukaan pysyvät voimassa näistä ehdoista riippumatta. Reklamaatiot tulee tehdä kohtuullisessa ajassa virheen havaitsemisesta.', en: 'Consumer customer rights under Consumer Protection Act (38/1978) remain in force regardless of these terms. Complaints must be made within reasonable time of discovering defect.' },
  
  'legal.terms.forceMajeure.title': { fi: '12. Ylivoimainen este (Force Majeure)', en: '12. Force Majeure' },
  'legal.terms.forceMajeure.desc': { fi: 'Mitra Auto ei ole vastuussa viivästyksistä tai sopimusvelvoitteiden laiminlyönnistä, jotka johtuvat ylivoimaisesta esteestä kuten sodasta, luonnonkatastrofista, pandemioista, lakosta, viranomaismääräyksistä, energiahuollon katkeamisesta tai vastaavista Mitra Auton kohtuullisen hallinnan ulkopuolella olevista syistä.', en: 'Mitra Auto is not liable for delays or failure to fulfill contractual obligations resulting from force majeure such as war, natural disasters, pandemics, strikes, government orders, energy supply disruptions, or similar causes beyond Mitra Auto reasonable control.' },
  'legal.terms.forceMajeure.examples': { fi: 'Ylivoimainen este sisältää myös toimittajien toimitusviivästykset, jotka johtuvat vastaavista syistä. Asiakkaalle ilmoitetaan ylivoimaisesta esteestä viipymättä ja sovitaan vaihtoehtoinen toimitus- tai palveluaika.', en: 'Force majeure also includes supplier delivery delays resulting from similar causes. Customer is notified of force majeure without delay and alternative delivery or service time is agreed.' },
  
  'legal.terms.ip.title': { fi: '13. Immateriaalioikeudet ja tavaramerkit', en: '13. Intellectual Property Rights and Trademarks' },
  'legal.terms.ip.desc': { fi: 'Kaikki verkkosivuston sisältö, materiaalit, logot, graafiset elementit, tavaramerkit (Mitra Auto® ja yhteistyökumppaneiden tavaramerkit) ovat Mitra Auto Oy:n tai sen lisenssinhaltijoiden omaisuutta ja suojattuja tekijänoikeuslain (404/1961) ja tavaramerkkilain (7/1964) mukaisesti.', en: 'All website content, materials, logos, graphic elements, trademarks (Mitra Auto® and partner trademarks) are property of Mitra Auto Oy or its licensors and protected under Copyright Act (404/1961) and Trademarks Act (7/1964).' },
  'legal.terms.ip.restrictions': { fi: 'Sisällön kopiointi, muokkaaminen, jakaminen tai kaupallinen käyttö ilman kirjallista lupaa on kielletty. Asiakkailla on rajoitettu käyttöoikeus verkkosivustoon vain henkilökohtaiseen ja ei-kaupalliseen käyttöön.', en: 'Copying, modifying, distributing, or commercial use of content without written permission is prohibited. Customers have limited right to use website for personal and non-commercial purposes only.' },
  
  'legal.terms.dataProtection.title': { fi: '14. Tietosuoja ja henkilötietojen käsittely', en: '14. Data Protection and Personal Data Processing' },
  'legal.terms.dataProtection.desc': { fi: 'Henkilötietojen käsittely tapahtuu erillisen tietosuojaselosteen mukaisesti, joka noudattaa EU:n yleistä tietosuoja-asetusta (GDPR 2016/679) ja Suomen tietosuojalakia (1050/2018). Katso täydelliset tiedot tietosuojaselosteesta.', en: 'Processing of personal data is governed by separate Privacy Policy that complies with EU General Data Protection Regulation (GDPR 2016/679) and Finnish Data Protection Act (1050/2018). See Privacy Policy for complete information.' },
  
  'legal.terms.consumerRights.title': { fi: '15. Kuluttajan erityisoikeudet', en: '15. Special Consumer Rights' },
  'legal.terms.consumerRights.intro': { fi: 'Kuluttaja-asiakkailla on kuluttajansuojalain (38/1978) mukaiset seuraavat lisäoikeudet:', en: 'Consumer customers have the following additional rights under Consumer Protection Act (38/1978):' },
  'legal.terms.consumerRights.item1': { fi: 'Virhevastuuaika: Tuotteissa 2 vuotta ja palveluissa 2 vuotta, mikäli virhe on ollut olemassa luovutushetkellä.', en: 'Defect liability period: 2 years for products and 2 years for services if defect existed at time of delivery.' },
  'legal.terms.consumerRights.item2': { fi: 'Kuluttajaneuvonta: Mahdollisissa riitatilanteissa kuluttaja voi kääntyä kuluttajaneuvonnan (www.kkv.fi) tai kuluttajariitalautakunnan (www.kuluttajariita.fi) puoleen.', en: 'Consumer advice: In case of disputes, consumer may contact consumer advice (www.kkv.fi) or Consumer Disputes Board (www.kuluttajariita.fi).' },
  'legal.terms.consumerRights.item3': { fi: 'Peruuttamisoikeus: Verkkokaupan kautta ostetut tuotteet (ei palvelut) 14 päivän peruuttamisoikeus kuluttajansuojalain 6 luvun mukaisesti.', en: 'Right of withdrawal: Products purchased via online shop (not services) 14-day right of withdrawal according to Consumer Protection Act Chapter 6.' },
  
  'legal.terms.law.title': { fi: '16. Sovellettava laki ja riitojen ratkaisu', en: '16. Governing Law and Dispute Resolution' },
  'legal.terms.law.intro': { fi: 'Näihin sopimusehtoihin ja kaikkiin Mitra Auton palveluihin sovelletaan seuraavia lakeja ja riidanratkaisumekanismeja:', en: 'These Terms and all Mitra Auto services are governed by the following laws and dispute resolution mechanisms:' },
  'legal.terms.law.governing': { fi: 'Sovellettava laki', en: 'Governing Law' },
  'legal.terms.law.governingDesc': { fi: 'Suomen laki ilman lainvalintaa koskevia säännöksiä. Erityisesti sovelletaan: kuluttajansuojalakia (38/1978), kauppalakia (355/1987), tieliikennelakia (729/2018).', en: 'Finnish law without regard to conflict of law provisions. Specifically applies: Consumer Protection Act (38/1978), Sale of Goods Act (355/1987), Road Traffic Act (729/2018).' },
  'legal.terms.law.disputes': { fi: 'Ensisijainen tuomioistuin', en: 'Primary Court' },
  'legal.terms.law.disputesDesc': { fi: 'Helsingin käräjäoikeus on ensisijainen tuomioistuin yritysasiakkaiden riita-asioissa.', en: 'Helsinki District Court is the primary court for business customer disputes.' },
  'legal.terms.law.consumer': { fi: 'Kuluttajan oikeus valita tuomioistuin', en: 'Consumer Right to Choose Court' },
  'legal.terms.law.consumerDesc': { fi: 'Kuluttaja-asiakas voi nostaa kanteen myös oman kotipaikkansa käräjäoikeudessa oikeudenkäymiskaaren (4/1734) 10 luvun 1-4 §:n mukaisesti.', en: 'Consumer customer may bring action in district court of own domicile according to Code of Judicial Procedure (4/1734) Chapter 10, Sections 1-4.' },
  'legal.terms.law.alternative': { fi: 'Vaihtoehtoinen riidanratkaisu', en: 'Alternative Dispute Resolution' },
  'legal.terms.law.alternativeDesc': { fi: 'Ennen oikeudenkäyntiä suosittelemme yhteyttä kuluttajaneuvontaan ja kuluttajariitalautakuntaan. Osoite: Kuluttajariitalautakunta, PL 306, 00531 Helsinki.', en: 'Before litigation, we recommend contacting consumer advice and Consumer Disputes Board. Address: Consumer Disputes Board, P.O. Box 306, 00531 Helsinki.' },
  
  'legal.terms.amendment.title': { fi: '17. Sopimusehtojen muuttaminen', en: '17. Amendment of Terms and Conditions' },
  'legal.terms.amendment.desc': { fi: 'Mitra Auto Oy pidättää oikeuden muuttaa näitä sopimusehtoja milloin tahansa vastaamaan lainsäädännön muutoksia, liiketoimintakäytäntöjen kehittymistä tai palveluiden laajentumista.', en: 'Mitra Auto Oy reserves the right to amend these Terms and Conditions at any time to reflect changes in legislation, evolution of business practices, or expansion of services.' },
  'legal.terms.amendment.notification': { fi: 'Merkittävistä muutoksista ilmoitetaan rekisteröidyille asiakkaille sähköpostitse vähintään 30 päivää ennen muutosten voimaantuloa. Jatkamalla palveluiden käyttöä muutosten jälkeen asiakas hyväksyy päivitetyt ehdot.', en: 'Significant changes will be communicated to registered customers via email at least 30 days before changes take effect. Continued use of services after changes constitutes acceptance of updated terms.' },
  'legal.terms.amendment.effective': { fi: 'Voimaantulopäivä', en: 'Effective Date' },
  'legal.terms.amendment.date': { fi: '5. marraskuuta 2025', en: 'November 5, 2025' },
  
  'legal.terms.contact.title': { fi: '18. Yhteystiedot ja asiakaspalvelu', en: '18. Contact Information and Customer Service' },
  'legal.terms.contact.intro': { fi: 'Kysymyksissä, palautteessa tai reklamaatioissa, ota yhteyttä:', en: 'For questions, feedback, or complaints, please contact:' },
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
