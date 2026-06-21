export const businessProfile = {
  publicName: 'Mitra Auto',
  legalName: 'Mitra Auto Oy',
  businessId: '3408833-8',
  websiteUrl: 'https://www.mitra-auto.fi',
  email: 'contact@mitra-auto.fi',
  phoneE164: '+358407777163',
  phoneDisplay: '+358 40 777 7163',
  address: {
    streetAddress: 'Hankasuontie 5',
    postalCode: '00390',
    addressLocality: 'Helsinki',
    addressCountry: 'FI',
    formatted: 'Hankasuontie 5, 00390 Helsinki',
    formattedWithCountry: 'Hankasuontie 5, 00390 Helsinki, Finland',
  },
  languages: ['fi', 'en'],
  serviceArea: 'Helsinki',
  mapSearchUrl: 'https://www.google.com/maps/search/?api=1&query=Hankasuontie%205%2C%2000390%20Helsinki%2C%20Finland',
  appleMapsUrl: 'https://maps.apple.com/?address=Hankasuontie+5,+00390+Helsinki,+Finland',
  googleMapsEmbedUrl: 'https://www.google.com/maps?q=Hankasuontie%205%2C%2000390%20Helsinki%2C%20Finland&output=embed',
  openingHours: [
    {
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    {
      dayOfWeek: ['Saturday'],
      opens: '10:00',
      closes: '17:00',
    },
  ],
  openingHoursText: {
    fi: 'Ma-Pe: 9:00-18:00\nLa: 10:00-17:00\nSu: Suljettu',
    en: 'Mon-Fri: 9:00-18:00\nSat: 10:00-17:00\nSun: Closed',
  },
} as const;

export const localBusinessIds = {
  organization: `${businessProfile.websiteUrl}/#organization`,
  website: `${businessProfile.websiteUrl}/#website`,
};

export function getBusinessAddressSchema() {
  return {
    '@type': 'PostalAddress',
    streetAddress: businessProfile.address.streetAddress,
    postalCode: businessProfile.address.postalCode,
    addressLocality: businessProfile.address.addressLocality,
    addressCountry: businessProfile.address.addressCountry,
  };
}

export function getLocalBusinessSchema() {
  return {
    '@type': ['AutoRepair', 'AutomotiveBusiness', 'LocalBusiness'],
    '@id': localBusinessIds.organization,
    name: businessProfile.publicName,
    legalName: businessProfile.legalName,
    url: businessProfile.websiteUrl,
    telephone: businessProfile.phoneE164,
    email: businessProfile.email,
    address: getBusinessAddressSchema(),
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'Y-tunnus',
      value: businessProfile.businessId,
    },
    areaServed: {
      '@type': 'City',
      name: businessProfile.serviceArea,
    },
    hasMap: businessProfile.mapSearchUrl,
    openingHoursSpecification: businessProfile.openingHours.map((hours) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.dayOfWeek,
      opens: hours.opens,
      closes: hours.closes,
    })),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: businessProfile.phoneE164,
      email: businessProfile.email,
      contactType: 'customer service',
      areaServed: 'FI',
      availableLanguage: businessProfile.languages,
    },
  };
}
