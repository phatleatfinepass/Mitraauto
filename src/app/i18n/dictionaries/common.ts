import type { TranslationDictionary } from '../types';

export const commonTranslations = {
  // Common
  'common.reviewsSubtitle': { fi: 'Asiakaspalautteet julkaistaan vasta lähteen ja luvan varmistamisen jälkeen', en: 'Customer feedback is published only after source and permission are confirmed' },
  'common.stars': { fi: 'tähteä', en: 'stars' },
  'common.happyCustomers': { fi: 'Tyytyväistä asiakasta', en: 'Happy Customers' },
  'common.ratingAria': { fi: 'Arvostelut odottavat lähteen varmistusta', en: 'Reviews awaiting source verification' },
  'common.customerRating': { fi: 'Asiakaspalaute', en: 'Customer Feedback' },
  'common.happyCustomersAria': { fi: 'Asiakasmäärä vahvistetaan omistajan lähteestä ennen julkaisua', en: 'Customer count is confirmed from an owner source before publication' },
  'common.review.matti': { fi: 'Asiakaspalautteet julkaistaan, kun lähde, lupa ja esitystapa on vahvistettu.', en: 'Customer feedback is published when source, permission and presentation are confirmed.' },
  'common.review.anna': { fi: 'Emme näytä esimerkkipalautetta todellisena arvosteluna ilman hyväksyttyä lähdettä.', en: 'We do not show sample feedback as a real review without an approved source.' },
  'common.review.jukka': { fi: 'Arvostelukäytäntö dokumentoidaan ennen julkaisua.', en: 'The review policy is documented before publication.' },
  'toast.paymentReceived': { fi: 'Maksu vastaanotettu.{{suffix}}', en: 'Payment received.{{suffix}}' },
  'toast.invoiceAlreadyPaid': { fi: 'Lasku on jo maksettu.{{suffix}}', en: 'Invoice already paid.{{suffix}}' },
  'toast.paymentIncomplete': { fi: 'Maksu ei valmistunut.{{suffix}}', en: 'Payment was not completed.{{suffix}}' },
  'toast.paymentConfirming': { fi: 'Maksua vahvistetaan.{{suffix}}', en: 'Payment is being confirmed.{{suffix}}' },
  'toast.installBookingInvalid': { fi: 'Asennusvarauksen linkki ei ole voimassa.', en: 'The install booking link is not valid.' },
  'toast.addedToCart': { fi: '{{quantity}} × {{brand}} {{model}} lisätty ostoskoriin', en: '{{quantity}} × {{brand}} {{model}} added to cart' },
  'analyticsConsent.title': { fi: 'Analytiikkaevästeet', en: 'Analytics cookies' },
  'analyticsConsent.description': {
    fi: 'Käytämme Microsoft Claritya sivuston käytön ymmärtämiseen ja ajanvarauksen, verkkokaupan ja sivujen parantamiseen. Emme lähetä Claritylle nimiä, sähköposteja, puhelinnumeroita, rekisteritunnuksia tai maksutietoja.',
    en: 'We use Microsoft Clarity to understand site usage and improve booking, shopping, and page experience. We do not send names, emails, phone numbers, license plates, or payment details to Clarity.',
  },
  'analyticsConsent.accept': { fi: 'Hyväksy', en: 'Accept' },
  'analyticsConsent.decline': { fi: 'Hylkää', en: 'Decline' },
  'footer.cookiePolicy': { fi: 'Evästekäytäntö', en: 'Cookie Policy' },
  'footer.cookieSettings': { fi: 'Evästeasetukset', en: 'Cookie settings' },
  'auth.or': { fi: 'TAI', en: 'OR' },
  'auth.placeholder.email': { fi: 'nimi@esimerkki.fi', en: 'name@example.com' },
} satisfies TranslationDictionary;
