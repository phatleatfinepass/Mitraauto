import type { TranslationDictionary } from '../types';

export const commonTranslations = {
  // Common
  'common.reviewsSubtitle': { fi: 'Katso mitä asiakkaamme sanovat palvelustamme', en: 'See what our customers say about our service' },
  'common.stars': { fi: 'tähteä', en: 'stars' },
  'common.happyCustomers': { fi: 'Tyytyväistä asiakasta', en: 'Happy Customers' },
  'common.ratingAria': { fi: '4.9 tähteä 5:stä', en: '4.9 out of 5 stars' },
  'common.customerRating': { fi: 'Asiakasarvostelut', en: 'Customer Rating' },
  'common.happyCustomersAria': { fi: '500+ tyytyväistä asiakasta', en: '500+ happy customers' },
  'common.review.matti': { fi: 'Erittäin nopea ja ammattitaitoinen palvelu. Suosittelen lämpimästi!', en: 'Very fast and professional service. Highly recommended!' },
  'common.review.anna': { fi: 'Rengashotelli toimii loistavasti. Ei tarvitse vaivata kotona.', en: 'Tire hotel works perfectly. No need to store at home.' },
  'common.review.jukka': { fi: 'Helppo varata verkossa ja hinnat kilpailukykyiset.', en: 'Easy to book online and competitive prices.' },
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
