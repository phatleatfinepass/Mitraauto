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
  'legal.nav.privacy': { fi: 'Tietosuoja', en: 'Privacy Policy' },
  'legal.nav.terms': { fi: 'Käyttöehdot', en: 'Terms & Conditions' },
  'legal.downloadPdf': { fi: 'Lataa PDF-versio', en: 'Download PDF Version' },
  
  // Privacy Policy
  'legal.privacy.title': { fi: 'Tietosuojaseloste', en: 'Privacy Policy' },
  'legal.privacy.subtitle': { fi: 'Kuinka keräämme, käytämme ja suojaamme tietojasi ja ajoneuvosi tietoja.', en: 'How we collect, use and protect your data and your vehicle\'s data.' },
  
  'legal.privacy.controller.title': { fi: '1. Rekisterinpitäjä ja yhteystiedot', en: '1. Data Controller & Contact Information' },
  'legal.privacy.controller.intro': { fi: 'Henkilötietojen käsittelystä vastaa:', en: 'The controller responsible for processing personal data is:' },
  'legal.privacy.controller.company': { fi: 'Yritys', en: 'Company' },
  'legal.privacy.controller.businessId': { fi: 'Y-tunnus', en: 'Business ID' },
  'legal.privacy.controller.address': { fi: 'Osoite', en: 'Address' },
  'legal.privacy.controller.email': { fi: 'Sähköposti', en: 'Email' },
  'legal.privacy.controller.phone': { fi: 'Puhelin', en: 'Phone' },
  
  'legal.privacy.dataCollected.title': { fi: '2. Mitä tietoja keräämme', en: '2. What Data We Collect' },
  'legal.privacy.dataCollected.intro': { fi: 'Keräämme seuraavia tietoja palveluidemme tarjoamiseksi:', en: 'We collect the following information to provide our services:' },
  'legal.privacy.dataCollected.item1': { fi: 'Nimi, puhelinnumero, sähköpostiosoite ja muut yhteystiedot', en: 'Names, phone numbers, email addresses and other contact details' },
  'legal.privacy.dataCollected.item2': { fi: 'Ajoneuvon rekisteritunnus ja muu ajoneuvotiedot', en: 'Vehicle registration/license plate and other vehicle information' },
  'legal.privacy.dataCollected.item3': { fi: 'Huoltohistoria ja palvelukirjaukset', en: 'Service history and service records' },
  'legal.privacy.dataCollected.item4': { fi: 'Varaus- ja aikataulu tiedot', en: 'Booking and scheduling information' },
  'legal.privacy.dataCollected.item5': { fi: 'GPS-sijainti ja ajoneuvon tiedot (suostumuksella)', en: 'GPS/location and vehicle data (with consent)' },
  'legal.privacy.dataCollected.item6': { fi: 'Verkkosivuston käyttötiedot ja analytiikka', en: 'Website usage data and analytics' },
  
  'legal.privacy.legalBasis.title': { fi: '3. Käsittelyn oikeusperuste', en: '3. Legal Basis for Processing' },
  'legal.privacy.legalBasis.intro': { fi: 'Käsittelemme henkilötietojasi seuraavilla perusteilla:', en: 'We process your personal data on the following legal grounds:' },
  'legal.privacy.legalBasis.contract': { fi: 'Sopimuksen täytäntöönpano', en: 'Performance of Contract' },
  'legal.privacy.legalBasis.contractDesc': { fi: 'Palvelun toimittaminen ja asiakassuhteen hoitaminen', en: 'Service delivery and customer relationship management' },
  'legal.privacy.legalBasis.consent': { fi: 'Suostumus', en: 'Consent' },
  'legal.privacy.legalBasis.consentDesc': { fi: 'GPS-tietojen ja ajoneuvotietojen käsittely tulevaisuudessa', en: 'Future GPS and vehicle data processing' },
  'legal.privacy.legalBasis.legitimate': { fi: 'Oikeutettu etu', en: 'Legitimate Interest' },
  'legal.privacy.legalBasis.legitimateDesc': { fi: 'Palvelun parantaminen ja analytiikka', en: 'Service improvement and analytics' },
  
  'legal.privacy.dataUse.title': { fi: '4. Kuinka käytämme tietoja', en: '4. How We Use Your Data' },
  'legal.privacy.dataUse.intro': { fi: 'Käytämme kerättyjä tietoja seuraaviin tarkoituksiin:', en: 'We use the collected data for the following purposes:' },
  'legal.privacy.dataUse.item1': { fi: 'Huolto-, rengas- ja vannepalveluiden toimittaminen', en: 'Delivering maintenance, tire and rim services' },
  'legal.privacy.dataUse.item2': { fi: 'Rengashotellisäilytyksen hallinta', en: 'Managing tire hotel storage' },
  'legal.privacy.dataUse.item3': { fi: 'Ajanvarausten synkronointi ja vahvistukset', en: 'Booking synchronization and confirmations' },
  'legal.privacy.dataUse.item4': { fi: 'Henkilökohtaiset muistutukset ja tarjoukset (vain suostumuksella)', en: 'Personalized reminders and offers (with consent only)' },
  'legal.privacy.dataUse.item5': { fi: 'Anonymisoitu analytiikka palvelun parantamiseksi', en: 'Anonymized analytics for service improvement' },
  
  'legal.privacy.sharing.title': { fi: '5. Tietojen jakaminen ja luovuttaminen', en: '5. Data Disclosure & Sharing' },
  'legal.privacy.sharing.intro': { fi: 'Voimme jakaa tietojasi seuraavien tahojen kanssa:', en: 'We may share your data with the following parties:' },
  'legal.privacy.sharing.item1': { fi: 'Rengas- ja vannetoimittajat sekä logistiikkakumppanit', en: 'Tire and rim suppliers and logistics partners' },
  'legal.privacy.sharing.item2': { fi: 'Palvelukumppanit (esim. maksunvälittäjät)', en: 'Service partners (e.g., payment processors)' },
  'legal.privacy.sharing.noSell': { fi: 'Emme myy henkilötietojasi kolmansille osapuolille.', en: 'We do not sell your personal data to third parties.' },
  
  'legal.privacy.transfers.title': { fi: '6. Kansainväliset tiedonsiirrot', en: '6. International Data Transfers' },
  'legal.privacy.transfers.desc': { fi: 'Henkilötietoja ei siirretä EU/ETA-alueen ulkopuolelle. Jos tiedonsiirtoja tapahtuu tulevaisuudessa, varmistamme asianmukaiset suojatoimet EU:n tietosuoja-asetuksen mukaisesti.', en: 'Personal data is not transferred outside the EU/EEA. If transfers occur in the future, we will ensure adequate safeguards in accordance with GDPR.' },
  
  'legal.privacy.retention.title': { fi: '7. Tietojen säilytysaika', en: '7. Data Retention' },
  'legal.privacy.retention.intro': { fi: 'Säilytämme henkilötietoja seuraavasti:', en: 'We retain personal data as follows:' },
  'legal.privacy.retention.item1': { fi: 'Ajoneuvon huoltotiedot säilytetään asiakassuhteen keston ajan', en: 'Vehicle service records are kept for the duration of the service relationship' },
  'legal.privacy.retention.item2': { fi: 'Henkilötiedot poistetaan tai arkistoidaan, kun niitä ei enää tarvita, ellei laki vaadi pidempää säilytystä', en: 'Personal data is deleted or archived when no longer needed, unless legal obligations require longer retention' },
  
  'legal.privacy.rights.title': { fi: '8. Oikeutesi', en: '8. Your Rights' },
  'legal.privacy.rights.intro': { fi: 'Sinulla on seuraavat oikeudet EU:n tietosuoja-asetuksen (GDPR 2016/679) ja Suomen tietosuojalain mukaisesti:', en: 'You have the following rights under GDPR (Regulation EU 2016/679) and the Finnish Data Protection Act:' },
  'legal.privacy.rights.access': { fi: 'Tarkastusoikeus', en: 'Right of Access' },
  'legal.privacy.rights.accessDesc': { fi: 'Oikeus saada tieto käsiteltävistä henkilötiedoista', en: 'Right to obtain information about personal data being processed' },
  'legal.privacy.rights.correction': { fi: 'Oikeus tietojen oikaisemiseen', en: 'Right to Rectification' },
  'legal.privacy.rights.correctionDesc': { fi: 'Oikeus korjata virheelliset tai epätarkat tiedot', en: 'Right to correct inaccurate or incomplete data' },
  'legal.privacy.rights.erasure': { fi: 'Oikeus tietojen poistamiseen', en: 'Right to Erasure' },
  'legal.privacy.rights.erasureDesc': { fi: 'Oikeus pyytää tietojen poistamista tietyissä tilanteissa', en: 'Right to request deletion of data in certain circumstances' },
  'legal.privacy.rights.restriction': { fi: 'Oikeus käsittelyn rajoittamiseen', en: 'Right to Restriction' },
  'legal.privacy.rights.restrictionDesc': { fi: 'Oikeus rajoittaa käsittelyä tietyissä olosuhteissa', en: 'Right to restrict processing under certain conditions' },
  'legal.privacy.rights.portability': { fi: 'Oikeus siirtää tiedot', en: 'Right to Data Portability' },
  'legal.privacy.rights.portabilityDesc': { fi: 'Oikeus saada tietosi koneellisesti luettavassa muodossa', en: 'Right to receive your data in machine-readable format' },
  'legal.privacy.rights.object': { fi: 'Vastustamisoikeus', en: 'Right to Object' },
  'legal.privacy.rights.objectDesc': { fi: 'Oikeus vastustaa tietojesi käsittelyä', en: 'Right to object to the processing of your data' },
  'legal.privacy.rights.contact': { fi: 'Voit käyttää oikeuksiasi ottamalla yhteyttä info.mitra.auto@gmail.com.', en: 'You can exercise your rights by contacting info.mitra.auto@gmail.com.' },
  
  'legal.privacy.automated.title': { fi: '9. Automatisoitu päätöksenteko ja profilointi', en: '9. Automated Decision-Making & Profiling' },
  'legal.privacy.automated.desc': { fi: 'Saatamme tulevaisuudessa käyttää ajoneuvon ajohistoriaa, kilometrimäärää ja GPS-tietoja palvelun parantamiseen. Tämä edellyttää erillistä suostumustasi.', en: 'We may in the future use vehicle mileage, driving history and GPS data to improve service quality. This will require your explicit consent.' },
  
  'legal.privacy.cookies.title': { fi: '10. Evästeet ja seuranta', en: '10. Cookies & Tracking' },
  'legal.privacy.cookies.intro': { fi: 'Verkkosivustomme käyttää evästeitä:', en: 'Our website uses cookies:' },
  'legal.privacy.cookies.essential': { fi: 'Välttämättömät evästeet', en: 'Essential Cookies' },
  'legal.privacy.cookies.essentialDesc': { fi: 'Tarvitaan sivuston toiminnallisuuden varmistamiseksi', en: 'Required for website functionality' },
  'legal.privacy.cookies.analytics': { fi: 'Analytiikka-evästeet', en: 'Analytics Cookies' },
  'legal.privacy.cookies.analyticsDesc': { fi: 'Auttavat ymmärtämään sivuston käyttöä', en: 'Help us understand website usage' },
  'legal.privacy.cookies.marketing': { fi: 'Markkinointievästeet', en: 'Marketing Cookies' },
  'legal.privacy.cookies.marketingDesc': { fi: 'Käytetään suostumuksella kohdistettuun mainontaan', en: 'Used with consent for targeted advertising' },
  
  'legal.privacy.changes.title': { fi: '11. Muutokset tietosuojaselosteeseen', en: '11. Changes to This Privacy Policy' },
  'legal.privacy.changes.desc': { fi: 'Voimme päivittää tätä tietosuojaselostetta ajoittain. Merkittävistä muutoksista ilmoitamme asiakkaillemme.', en: 'We may update this Privacy Policy from time to time. We will notify customers of significant changes.' },
  'legal.privacy.changes.effective': { fi: 'Voimaantulopäivä', en: 'Effective Date' },
  'legal.privacy.changes.date': { fi: '5. marraskuuta 2025', en: 'November 5, 2025' },
  
  // Terms & Conditions
  'legal.terms.title': { fi: 'Käyttöehdot', en: 'Terms & Conditions' },
  'legal.terms.subtitle': { fi: 'Ehdot, joilla tarjoamme palveluitamme, myymme renkaita ja vanteita, tarjoamme huoltoa ja rengashotellisäilytystä.', en: 'The terms under which we provide our services, sell tires & rims, offer vehicle maintenance and tire-hotel storage.' },
  
  'legal.terms.definitions.title': { fi: '1. Määritelmät', en: '1. Definitions' },
  'legal.terms.definitions.intro': { fi: 'Näissä käyttöehdoissa seuraavilla termeillä on alla mainitut merkitykset:', en: 'In these Terms & Conditions, the following terms have the meanings set out below:' },
  'legal.terms.definitions.customer': { fi: 'Asiakas', en: 'Customer' },
  'legal.terms.definitions.customerDesc': { fi: 'Henkilö tai yritys, joka käyttää Mitra Auton palveluita', en: 'Individual or business entity using Mitra Auto services' },
  'legal.terms.definitions.vehicle': { fi: 'Ajoneuvo', en: 'Vehicle' },
  'legal.terms.definitions.vehicleDesc': { fi: 'Asiakkaan omistama tai hallinnoima ajoneuvo', en: 'Vehicle owned or managed by the Customer' },
  'legal.terms.definitions.service': { fi: 'Palvelu', en: 'Service' },
  'legal.terms.definitions.serviceDesc': { fi: 'Kaikki Mitra Auton tarjoamat palvelut, mukaan lukien huolto, katsastus ja rengashotelli', en: 'All services provided by Mitra Auto, including maintenance, inspection and tire hotel' },
  'legal.terms.definitions.product': { fi: 'Tuote', en: 'Product' },
  'legal.terms.definitions.productDesc': { fi: 'Renkaat, vanteet ja muut myytävät tuotteet', en: 'Tires, rims and other products for sale' },
  'legal.terms.definitions.booking': { fi: 'Varaus', en: 'Booking' },
  'legal.terms.definitions.bookingDesc': { fi: 'Ajanvaraus palveluun verkkosivuston tai puhelimen kautta', en: 'Service appointment made via website or phone' },
  'legal.terms.definitions.serviceHistory': { fi: 'Huoltohistoria', en: 'Service History Data' },
  'legal.terms.definitions.serviceHistoryDesc': { fi: 'Ajoneuvon huoltotiedot ja palvelukirjaukset', en: 'Vehicle maintenance records and service logs' },
  
  'legal.terms.scope.title': { fi: '2. Palveluiden laajuus', en: '2. Scope of Services' },
  'legal.terms.scope.intro': { fi: 'Mitra Auto tarjoaa seuraavia palveluita:', en: 'Mitra Auto provides the following services:' },
  'legal.terms.scope.item1': { fi: 'Renkaiden ja vanteiden myynti (toimittajien kautta)', en: 'Sale of tires and rims (via suppliers)' },
  'legal.terms.scope.item2': { fi: 'Ajoneuvon huolto- ja korjauspalvelut', en: 'Vehicle maintenance and repair services' },
  'legal.terms.scope.item3': { fi: 'Rengashotellisäilytys', en: 'Tire hotel storage services' },
  'legal.terms.scope.item4': { fi: 'Online-ajanvaraus ja asiakashallinta', en: 'Online booking and customer management' },
  
  'legal.terms.obligations.title': { fi: '3. Asiakkaan velvollisuudet', en: '3. Customer Obligations' },
  'legal.terms.obligations.intro': { fi: 'Asiakas sitoutuu:', en: 'The Customer agrees to:' },
  'legal.terms.obligations.item1': { fi: 'Antamaan tarkat ajoneuvon tiedot (rekisterinumero, koko, malli)', en: 'Provide accurate vehicle information (license plate, size, model)' },
  'legal.terms.obligations.item2': { fi: 'Noudattamaan annettuja ohjeita ja suosituksia', en: 'Follow provided instructions and recommendations' },
  'legal.terms.obligations.item3': { fi: 'Maksamaan palvelut sovitussa ajassa', en: 'Pay for services in a timely manner' },
  'legal.terms.obligations.item4': { fi: 'Ilmoittamaan peruutuksista etukäteen käyttöehtojen mukaisesti', en: 'Notify cancellations in advance as per cancellation policy' },
  
  'legal.terms.bookings.title': { fi: '4. Varaukset ja peruutukset', en: '4. Bookings & Cancellation' },
  'legal.terms.bookings.intro': { fi: 'Varausjärjestelmämme toimii seuraavasti:', en: 'Our booking system operates as follows:' },
  'legal.terms.bookings.process': { fi: 'Varausprosessi', en: 'Booking Process' },
  'legal.terms.bookings.processDesc': { fi: 'Rekisterinumero → Palvelun valinta → Päivämäärä ja aika → Vahvistus', en: 'License plate → Service selection → Date and time → Confirmation' },
  'legal.terms.bookings.cancellation': { fi: 'Peruutuskäytäntö', en: 'Cancellation Policy' },
  'legal.terms.bookings.cancellationDesc': { fi: 'Peruutukset vähintään 24 tuntia etukäteen ilman veloitusta', en: 'Cancellations at least 24 hours in advance without charge' },
  'legal.terms.bookings.rescheduling': { fi: 'Ajan siirto', en: 'Rescheduling' },
  'legal.terms.bookings.reschedulingDesc': { fi: 'Voit siirtää aikaa kerran ilman lisämaksua', en: 'You may reschedule once without additional fee' },
  'legal.terms.bookings.noShow': { fi: 'Saapumatta jättäminen', en: 'No-Show' },
  'legal.terms.bookings.noShowDesc': { fi: 'Saapumatta jättäminen voi johtaa peruutusmaksuun', en: 'No-show may result in a cancellation fee' },
  
  'legal.terms.payment.title': { fi: '5. Hinnat ja maksuehdot', en: '5. Pricing & Payment Terms' },
  'legal.terms.payment.intro': { fi: 'Maksuihin liittyvät ehdot:', en: 'Payment terms:' },
  'legal.terms.payment.item1': { fi: 'Kaikki hinnat sisältävät ALV:n, ellei toisin mainita', en: 'All prices include VAT unless otherwise stated' },
  'legal.terms.payment.item2': { fi: 'Maksut käsitellään Paytrailin kautta', en: 'Payments are processed via Paytrail' },
  'legal.terms.payment.item3': { fi: 'Hyväksytyt maksutavat: korttimaksut, verkkopankit', en: 'Accepted payment methods: card payments, online banking' },
  'legal.terms.payment.item4': { fi: 'Maksun epäonnistuminen voi johtaa varauksen peruutukseen', en: 'Payment failure may result in booking cancellation' },
  
  'legal.terms.delivery.title': { fi: '6. Toimitus ja varastosaatavuus', en: '6. Delivery & Stock Availability' },
  'legal.terms.delivery.intro': { fi: 'Tuotteiden toimitus:', en: 'Product delivery:' },
  'legal.terms.delivery.item1': { fi: 'Renkaat ja vanteet toimitetaan toimittajien varastoista', en: 'Tires and rims are delivered from supplier stock' },
  'legal.terms.delivery.item2': { fi: 'Toimitusajat riippuvat saatavuudesta', en: 'Delivery times depend on availability' },
  'legal.terms.delivery.item3': { fi: 'Mitra Auto ei ole vastuussa toimittajien viivästyksistä, jotka eivät ole kohtuullisessa hallinnassamme', en: 'Mitra Auto is not liable for supplier delays beyond reasonable control' },
  
  'legal.terms.vehicleData.title': { fi: '7. Ajoneuvotietojen käyttö', en: '7. Use of Vehicle & Service History Data' },
  'legal.terms.vehicleData.desc': { fi: 'Asiakas suostuu ajoneuvon huoltohistorian, GPS- ja kilometrimäärätietojen keräämiseen ja käyttöön palvelun parantamiseksi, mikäli asiakas on antanut suostumuksensa.', en: 'Customer consents to the collection and use of vehicle service history, GPS and mileage data for service improvement, if opted in.' },
  
  'legal.terms.warranty.title': { fi: '8. Takuu ja vastuunrajoitus', en: '8. Warranty & Limitation of Liability' },
  'legal.terms.warranty.intro': { fi: 'Takuu- ja vastuuehdot:', en: 'Warranty and liability terms:' },
  'legal.terms.warranty.service': { fi: 'Palvelutakuu', en: 'Service Warranty' },
  'legal.terms.warranty.serviceDesc': { fi: 'Huoltotyöt 12 kuukautta tai 10 000 km, kumpi tulee ensin', en: 'Service work covered for 12 months or 10,000 km, whichever comes first' },
  'legal.terms.warranty.products': { fi: 'Tuotetakuut', en: 'Product Warranties' },
  'legal.terms.warranty.productsDesc': { fi: 'Renkaat ja vanteet valmistajan takuuehtojen mukaisesti', en: 'Tires and rims according to manufacturer warranty terms' },
  'legal.terms.warranty.limitation': { fi: 'Vastuunrajoitus', en: 'Limitation of Liability' },
  'legal.terms.warranty.limitationDesc': { fi: 'Korvausvelvollisuus rajoittuu maksetun palvelun tai tuotteen määrään', en: 'Liability limited to the amount paid for the service or product' },
  'legal.terms.warranty.indirect': { fi: 'Välilliset vahingot', en: 'Indirect Damages' },
  'legal.terms.warranty.indirectDesc': { fi: 'Ei vastuuta välillisistä vahingoista, ellei laki muuta edellytä', en: 'No liability for indirect damages unless required by law' },
  
  'legal.terms.ip.title': { fi: '9. Immateriaalioikeudet', en: '9. Intellectual Property' },
  'legal.terms.ip.desc': { fi: 'Kaikki sisältö, tavaramerkit ja materiaalit (mukaan lukien Mitra Auto -brändi ja kumppaneiden materiaalit) ovat Mitra Auton tai lisenssinhaltijan omaisuutta. Sisältöä ei saa kopioida ilman lupaa.', en: 'All content, trademarks and materials (including Mitra Auto brand and partner materials) remain the property of Mitra Auto or licensors. Content may not be reproduced without consent.' },
  
  'legal.terms.law.title': { fi: '10. Sovellettava laki ja riitojen ratkaisu', en: '10. Governing Law & Dispute Resolution' },
  'legal.terms.law.intro': { fi: 'Laki ja riidat:', en: 'Law and disputes:' },
  'legal.terms.law.governing': { fi: 'Sovellettava laki', en: 'Governing Law' },
  'legal.terms.law.governingDesc': { fi: 'Suomen laki', en: 'Finnish law' },
  'legal.terms.law.disputes': { fi: 'Riitojen ratkaisu', en: 'Dispute Resolution' },
  'legal.terms.law.disputesDesc': { fi: 'Helsingin käräjäoikeus', en: 'Helsinki District Court' },
  'legal.terms.law.consumer': { fi: 'Kuluttaja-asiakkaat', en: 'Consumer Customers' },
  'legal.terms.law.consumerDesc': { fi: 'Kuluttaja-asiakkailla oikeus käyttää oman asuinpaikkansa käräjäoikeutta', en: 'Consumer customers may use their local district court' },
  
  'legal.terms.amendment.title': { fi: '11. Ehtojen muuttaminen', en: '11. Amendment of Terms' },
  'legal.terms.amendment.desc': { fi: 'Mitra Auto voi päivittää näitä ehtoja. Merkittävistä muutoksista ilmoitetaan rekisteröityneille asiakkaille sähköpostitse.', en: 'Mitra Auto may update these terms. Significant changes will be communicated to registered customers via email.' },
  'legal.terms.amendment.effective': { fi: 'Voimaantulopäivä', en: 'Effective Date' },
  'legal.terms.amendment.date': { fi: '5. marraskuuta 2025', en: 'November 5, 2025' },
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
