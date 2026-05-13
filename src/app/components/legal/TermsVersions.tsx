import React from 'react';
import { Card } from '../ui/card';

function termsLang(t: (key: string) => string) {
  return t('legal.nav.terms') === 'Käyttöehdot' ? 'fi' : 'en';
}

function tt(t: (key: string) => string, fi: string, en: string) {
  return termsLang(t) === 'fi' ? fi : en;
}

// Version 1.0 - Initial Basic Terms (Dec 2023)
export function TermsV1({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        {/* Acceptance */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">1. Acceptance of Terms</h2>
          <p>By using Mitra Auto's services, you agree to these Terms and Conditions.</p>
        </div>

        {/* Services */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">2. Services</h2>
          <p className="mb-3">Mitra Auto provides:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Vehicle maintenance and repair services</li>
            <li>Tire services and tire hotel storage</li>
            <li>Online booking for services</li>
          </ul>
        </div>

        {/* Bookings and Payment */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">3. Bookings and Payment</h2>
          <p className="mb-3">When making a booking:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>You agree to provide accurate information</li>
            <li>Payment is due upon completion of services</li>
            <li>Prices include applicable VAT (24%)</li>
          </ul>
        </div>

        {/* Cancellation */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">4. Cancellation Policy</h2>
          <p>You may cancel bookings with 24 hours notice. Late cancellations may incur fees.</p>
        </div>

        {/* Liability */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">5. Limitation of Liability</h2>
          <p>Mitra Auto is responsible for services provided according to Finnish law. We are not liable for pre-existing vehicle conditions not disclosed at the time of service.</p>
        </div>

        {/* Warranty */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">6. Warranty</h2>
          <p>All services and parts come with a standard warranty as required by Finnish consumer protection law.</p>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">7. Contact Information</h2>
          <p>For questions about these terms: <a href="mailto:info@mitraauto.fi" className="text-[#FF6B35] hover:underline">info@mitraauto.fi</a></p>
        </div>
      </div>
    </Card>
  );
}

// Version 2.0 - Enhanced Legal Compliance (Mar 2025)
export function TermsV2({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        {/* Acceptance */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">1. Acceptance of Terms</h2>
          <p className="mb-3">By accessing or using Mitra Auto Oy's services, you agree to be bound by these Terms and Conditions and our Privacy Policy.</p>
          <p className="mb-3">These terms constitute a legally binding agreement between you and Mitra Auto Oy (Business ID: 3408833-8).</p>
          <p className="italic text-sm font-medium text-foreground">In case of conflict between Finnish and English versions, the Finnish version shall prevail.</p>
        </div>

        {/* Definitions */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">2. Definitions</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Consumer:</strong> Natural person acting for purposes outside their trade or profession</li>
            <li><strong>Business Customer:</strong> Legal entity or person acting in commercial capacity</li>
            <li><strong>Services:</strong> All automotive services provided by Mitra Auto</li>
            <li><strong>Booking:</strong> Service reservation made through our platform</li>
          </ul>
        </div>

        {/* Services Scope */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">3. Scope of Services</h2>
          <p className="mb-3">Mitra Auto provides:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>General vehicle maintenance and repairs</li>
            <li>Tire services (sales, installation, balancing)</li>
            <li>Tire hotel seasonal storage</li>
            <li>Online booking and service management</li>
            <li>Emergency towing services (Rescue 24/7)</li>
          </ul>
        </div>

        {/* Pricing and Payment */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">4. Pricing and Payment</h2>
          <p className="mb-3">All prices are in Euros (€) and include Finnish VAT at the statutory rate (currently 24%).</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Payment due upon service completion</li>
            <li>Accepted payment methods: cash, credit/debit cards, bank transfer</li>
            <li>Invoices issued in accordance with Finnish Accounting Act</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">Payment terms for business customers: Net 14 days from invoice date.</p>
        </div>

        {/* Booking and Cancellation */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">5. Booking and Cancellation Policy</h2>
          <p className="mb-3"><strong>Cancellation:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Free cancellation: 24 hours before scheduled service</li>
            <li>Late cancellation (less than 24h): May incur 50% service fee</li>
            <li>No-show: Full service fee may apply</li>
          </ul>
          <p className="mt-3 italic text-sm">Cancellation fees comply with Finnish Consumer Protection Act.</p>
        </div>

        {/* Consumer Rights */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">6. Consumer Protection Rights</h2>
          <p className="mb-3">Under Finnish Consumer Protection Act (38/1978), consumers have:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Right to defect-free services</li>
            <li>Right to warranty claims (2 years on parts)</li>
            <li>Right to complain to Consumer Disputes Board</li>
            <li>Right to clear pricing information</li>
          </ul>
        </div>

        {/* Liability */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">7. Limitation of Liability</h2>
          <p className="mb-3">Mitra Auto is liable according to Finnish law for:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Defective work or services</li>
            <li>Damages caused by negligence</li>
            <li>Product defects in parts sold</li>
          </ul>
          <p className="mt-3">We are not liable for pre-existing damage, normal wear and tear, or damage caused by customer's actions.</p>
        </div>

        {/* Warranty */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">8. Warranty Terms</h2>
          <p className="mb-3">Standard warranty coverage:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Parts: 24 months from installation</li>
            <li>Labor: 12 months from service completion</li>
            <li>Manufacturer warranties apply for new parts</li>
          </ul>
        </div>

        {/* Dispute Resolution */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">9. Dispute Resolution</h2>
          <p className="mb-3">In case of disputes:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Contact us directly first: info@mitraauto.fi</li>
            <li>Consumer Disputes Board: kuluttajariita-lautakunta.fi</li>
            <li>Consumer Ombudsman: kuluttajaneuvonta.fi</li>
          </ul>
        </div>

        {/* Changes to Terms */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">10. Changes to Terms</h2>
          <p>We may update these terms. Continued use after changes constitutes acceptance. Material changes will be communicated via email.</p>
        </div>
      </div>
    </Card>
  );
}

// Version 3.0 - Updated Contact & Trade Marks (Jun 2025)
export function TermsV3({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        <div>
          <h2 className="text-2xl text-foreground mb-4">1. Agreement and Acceptance</h2>
          <p className="mb-3">These Terms and Conditions govern your use of services provided by Mitra Auto Oy (Business ID: 3408833-8), located at Hankasuontie 5, 00390 Helsinki, Finland.</p>
          <p className="mb-3">Contact: <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">contact@mitra-auto.fi</a> | <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></p>
          <p className="italic text-sm font-medium text-foreground">Finnish version prevails in case of interpretation disputes.</p>
          <p className="mt-3 text-sm italic">Contact information updated June 2025</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">2. Definitions</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Consumer:</strong> Natural person purchasing for non-commercial purposes (Consumer Protection Act 38/1978)</li>
            <li><strong>Business Customer:</strong> Entity or individual acting in commercial capacity</li>
            <li><strong>Service:</strong> Any automotive service including repair, maintenance, tire services</li>
            <li><strong>Tire Hotel:</strong> Seasonal tire storage service</li>
            <li><strong>Rescue 24/7:</strong> Emergency roadside assistance and towing</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">3. Services Provided</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Comprehensive vehicle diagnostics and repair</li>
            <li>Tire sales, installation, balancing, and alignment</li>
            <li>Seasonal tire storage (Tire Hotel)</li>
            <li>Emergency towing and roadside assistance</li>
            <li>Online booking and service history management</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">4. Pricing, Payment, and VAT</h2>
          <p className="mb-3">All prices include Finnish VAT at current statutory rate (24%).</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Consumers: Payment due upon service completion</li>
            <li>Business customers: Net 14 days from invoice date</li>
            <li>Late payment interest: 8% per annum (Interest Act 633/1982)</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">Invoices comply with Finnish Accounting Act (1336/1997).</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">5. Booking and Cancellation</h2>
          <p className="mb-3"><strong>Cancellation Policy:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Free cancellation: 24+ hours notice</li>
            <li>Late cancellation (12-24h): 50% fee may apply</li>
            <li>No-show: 100% fee may apply</li>
          </ul>
          <p className="mt-3 italic text-sm">Consumer rights under Consumer Protection Act override cancellation fees where applicable.</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">6. Consumer Protection Rights</h2>
          <p className="mb-3">Consumers have rights under Finnish Consumer Protection Act:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>2-year warranty on parts and services</li>
            <li>Right to complain to Consumer Disputes Board</li>
            <li>Right to defect-free services</li>
            <li>14-day right of withdrawal for distance sales</li>
          </ul>
          <p className="mt-3">Consumer Advisory Services: <a href="https://www.kkv.fi" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">kkv.fi</a></p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">7. Intellectual Property and Trade Marks</h2>
          <p className="mb-3">All content, logos, and trade marks are protected under:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Finnish Trade Marks Act (544/2019)</li>
            <li>Copyright Act (404/1961)</li>
          </ul>
          <p className="mt-3">"Mitra Auto", our logo, and "Rescue 24/7" are trade marks of Mitra Auto Oy. Unauthorized use is prohibited.</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">8. Liability and Insurance</h2>
          <p className="mb-3">Mitra Auto maintains professional liability insurance and is responsible for:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Defective workmanship</li>
            <li>Damage caused during service (up to insurance limits)</li>
            <li>Defective parts supplied by us</li>
          </ul>
          <p className="mt-3">Liability limited to direct damages; not liable for indirect or consequential losses unless caused by gross negligence.</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">9. Warranty Terms</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Parts: 24 months (Consumer Sales Act 38/1978)</li>
            <li>Labor: 12 months from completion</li>
            <li>Tires: Manufacturer warranty applies</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">10. Dispute Resolution</h2>
          <p className="mb-3">Dispute resolution options:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Direct contact: contact@mitra-auto.fi</li>
            <li>Consumer Disputes Board (consumers only)</li>
            <li>Finnish courts (Helsinki District Court has jurisdiction)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">11. Governing Law</h2>
          <p>These terms are governed by Finnish law. Consumers retain mandatory consumer protection rights.</p>
        </div>
      </div>
    </Card>
  );
}

// Version 4.0 - VAT Update & Enhanced Rights (Sep 2025)
export function TermsV4({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        <div>
          <h2 className="text-2xl text-foreground mb-4">1. Acceptance of Terms</h2>
          <p className="mb-3">By using Mitra Auto Oy's services, you enter into a binding agreement governed by these Terms and Conditions.</p>
          <p className="mb-3"><strong>Service Provider:</strong></p>
          <ul className="space-y-1 ml-6 list-none">
            <li>Mitra Auto Oy</li>
            <li>Business ID: 3408833-8</li>
            <li>Hankasuontie 5, 00390 Helsinki, Finland</li>
            <li>Email: <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">contact@mitra-auto.fi</a></li>
            <li>Phone: <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">2. Definitions</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Consumer:</strong> Natural person acting outside trade/business (Consumer Protection Act 38/1978, as amended)</li>
            <li><strong>Business Customer:</strong> Legal entity or trader</li>
            <li><strong>Customer:</strong> Any user of our services</li>
            <li><strong>Vehicle:</strong> Any motor vehicle serviced</li>
            <li><strong>Service:</strong> Work, parts, or products provided</li>
            <li><strong>Service History:</strong> Digital record of services performed</li>
            <li><strong>Tire Hotel:</strong> Seasonal tire storage facility</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">3. Pricing and VAT (Updated September 2025)</h2>
          <p className="mb-3 font-semibold text-foreground">Important: VAT rate updated to 25.5% effective September 1, 2025</p>
          <p className="mb-3">All displayed prices include Finnish VAT at the current statutory rate (25.5%).</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Prices valid at time of booking confirmation</li>
            <li>Quotes valid for 14 days unless stated otherwise</li>
            <li>Additional work requires customer approval</li>
          </ul>
          <p className="mt-3 italic text-sm">Business customers may be subject to reverse charge mechanism for certain services (VAT Act 1501/1993).</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">4. Payment Terms</h2>
          <p className="mb-3"><strong>Consumer Customers:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Payment due immediately upon service completion</li>
            <li>Payment methods: Cash, debit/credit card, mobile payment</li>
          </ul>
          <p className="mt-3"><strong>Business Customers:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Payment terms: Net 14 days from invoice date</li>
            <li>Late payment interest: 8% annually (Interest Act 633/1982)</li>
            <li>Reminder fee: €5 (as permitted by law)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">5. Booking, Cancellation, and Right of Withdrawal</h2>
          <p className="mb-3"><strong>General Cancellation:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Free cancellation: 24+ hours before appointment</li>
            <li>Late cancellation (12-24h): 50% of service fee</li>
            <li>No-show: 100% of service fee</li>
          </ul>
          <p className="mt-3"><strong>Consumer Right of Withdrawal (Distance Sales):</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>14-day withdrawal right for online purchases (Consumer Protection Act Chapter 6)</li>
            <li>Does not apply to services already performed with consent</li>
            <li>Does not apply to custom-made products</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">6. Enhanced Consumer Rights</h2>
          <p className="mb-3">As a consumer in Finland, you have comprehensive rights:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Right to Defect-Free Services:</strong> Services must meet industry standards</li>
            <li><strong>Warranty Rights:</strong> 2-year warranty on parts and services</li>
            <li><strong>Complaint Rights:</strong> Free access to Consumer Disputes Board</li>
            <li><strong>Price Transparency:</strong> Clear itemized pricing</li>
            <li><strong>Pre-contractual Information:</strong> Full service details before commitment</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">Consumer Advisory Services: <a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">kkv.fi/en</a></p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">7. Warranty and Defect Liability</h2>
          <p className="mb-3"><strong>Statutory Warranty (Consumer Sales Act):</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Parts: 24 months from installation</li>
            <li>Labor: 12 months from service completion</li>
            <li>Defects presumed to exist at delivery if appearing within 6 months</li>
          </ul>
          <p className="mt-3"><strong>Warranty Claims:</strong> Contact us immediately upon discovering defects. We will repair or replace at no cost if defect existed at time of service.</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">8. Liability and Limitations</h2>
          <p className="mb-3">Mitra Auto is liable for:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Defects in services or parts provided</li>
            <li>Damage caused by our negligence</li>
            <li>Violations of consumer protection laws</li>
          </ul>
          <p className="mt-3">We are not liable for: pre-existing damage, normal wear, customer-caused damage, or force majeure events.</p>
          <p className="mt-3 italic text-sm">Consumer mandatory rights cannot be limited by contract.</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">9. Intellectual Property Rights</h2>
          <p className="mb-3">Protected under Finnish Trade Marks Act (544/2019):</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>"Mitra Auto" trade mark and logo</li>
            <li>"Rescue 24/7" service mark</li>
            <li>Website content and design</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">10. Tire Hotel Terms</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Storage period: Defined in service agreement</li>
            <li>Storage fee: Paid in advance or per invoice</li>
            <li>Insurance: Tires stored at customer's risk (insurance available)</li>
            <li>Unclaimed tires: May be disposed after 12 months with 30 days notice</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">11. Dispute Resolution</h2>
          <p className="mb-3"><strong>For Consumers:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Contact us first: contact@mitra-auto.fi</li>
            <li>Consumer Disputes Board: <a href="https://www.kuluttajariita.fi" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">kuluttajariita.fi</a></li>
            <li>Consumer Ombudsman: <a href="https://www.kkv.fi" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">kkv.fi</a></li>
            <li>Helsinki District Court (as last resort)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">12. Governing Law</h2>
          <p>Finnish law governs these terms. Consumers retain all mandatory rights under Finnish and EU consumer protection legislation.</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">13. Amendments</h2>
          <p>We may update these terms. Material changes will be communicated 30 days in advance. Continued use constitutes acceptance.</p>
          <p className="mt-3 font-semibold text-foreground">Effective Date: September 15, 2025</p>
        </div>
      </div>
    </Card>
  );
}

// Version 5.0 - Current Comprehensive Version (Nov 2025)
export function TermsV5({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        {/* 1. Acceptance and Company Information */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.acceptance.title')}</h2>
          <p className="mb-3">{t('legal.terms.acceptance.intro')}</p>
          <p className="mb-3"><strong className="text-foreground">{t('legal.terms.acceptance.provider')}:</strong></p>
          <ul className="space-y-1 ml-6 list-none">
            <li>Mitra Auto Oy</li>
            <li>{t('legal.terms.acceptance.businessId')}: 3408833-8</li>
            <li>{t('legal.terms.acceptance.address')}: Hankasuontie 5, 00390 Helsinki, Finland</li>
            <li>{t('legal.terms.acceptance.email')}: <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">contact@mitra-auto.fi</a></li>
            <li>{t('legal.terms.acceptance.phone')}: <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
            <li>{t('legal.terms.acceptance.emergency')}</li>
          </ul>
          <p className="mt-3 italic text-sm font-medium text-foreground">{t('legal.terms.acceptance.language')}</p>
        </div>

        {/* 2. Definitions */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.definitions.title')}</h2>
          <p className="mb-3">{t('legal.terms.definitions.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.definitions.consumer')}:</strong> {t('legal.terms.definitions.consumerDesc')}</li>
            <li><strong>{t('legal.terms.definitions.businessCustomer')}:</strong> {t('legal.terms.definitions.businessCustomerDesc')}</li>
            <li><strong>{t('legal.terms.definitions.customer')}:</strong> {t('legal.terms.definitions.customerDesc')}</li>
            <li><strong>{t('legal.terms.definitions.vehicle')}:</strong> {t('legal.terms.definitions.vehicleDesc')}</li>
            <li><strong>{t('legal.terms.definitions.service')}:</strong> {t('legal.terms.definitions.serviceDesc')}</li>
            <li><strong>{t('legal.terms.definitions.product')}:</strong> {t('legal.terms.definitions.productDesc')}</li>
            <li><strong>{t('legal.terms.definitions.booking')}:</strong> {t('legal.terms.definitions.bookingDesc')}</li>
            <li><strong>{t('legal.terms.definitions.serviceHistory')}:</strong> {t('legal.terms.definitions.serviceHistoryDesc')}</li>
            <li><strong>{t('legal.terms.definitions.tireHotel')}:</strong> {t('legal.terms.definitions.tireHotelDesc')}</li>
          </ul>
        </div>

        {/* 3. Scope of Services */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.services.title')}</h2>
          <p className="mb-3">{t('legal.terms.services.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.services.item1')}</li>
            <li>{t('legal.terms.services.item2')}</li>
            <li>{t('legal.terms.services.item3')}</li>
            <li>{t('legal.terms.services.item4')}</li>
            <li>{t('legal.terms.services.item5')}</li>
            <li>{t('legal.terms.services.item6')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{t('legal.terms.services.qualification')}</p>
        </div>

        {/* 4. Pricing and VAT */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.pricing.title')}</h2>
          <p className="mb-3 font-semibold text-foreground">{t('legal.terms.pricing.vat')}</p>
          <p className="mb-3">{t('legal.terms.pricing.validityIntro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.pricing.item1')}</li>
            <li>{t('legal.terms.pricing.item2')}</li>
            <li>{t('legal.terms.pricing.item3')}</li>
            <li>{t('legal.terms.pricing.item4')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{t('legal.terms.pricing.business')}</p>
        </div>

        {/* 5. Payment Terms */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.payment.title')}</h2>
          <p className="mb-3"><strong className="text-foreground">{t('legal.terms.payment.consumerTitle')}:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.payment.consumerItem1')}</li>
            <li>{t('legal.terms.payment.consumerItem2')}</li>
            <li>{t('legal.terms.payment.consumerItem3')}</li>
          </ul>
          <p className="mt-3"><strong className="text-foreground">{t('legal.terms.payment.businessTitle')}:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.payment.businessItem1')}</li>
            <li>{t('legal.terms.payment.businessItem2')}</li>
            <li>{t('legal.terms.payment.businessItem3')}</li>
            <li>{t('legal.terms.payment.businessItem4')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{t('legal.terms.payment.invoiceCompliance')}</p>
        </div>

        {/* 6. Booking, Cancellation, and Modifications */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.booking.title')}</h2>
          <p className="mb-3">{t('legal.terms.booking.intro')}</p>
          <p className="mt-3"><strong className="text-foreground">{t('legal.terms.booking.cancellationTitle')}:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.booking.free')}:</strong> {t('legal.terms.booking.freeDesc')}</li>
            <li><strong>{t('legal.terms.booking.late')}:</strong> {t('legal.terms.booking.lateDesc')}</li>
            <li><strong>{t('legal.terms.booking.noShow')}:</strong> {t('legal.terms.booking.noShowDesc')}</li>
          </ul>
          <p className="mt-3"><strong className="text-foreground">{t('legal.terms.booking.modificationsTitle')}:</strong> {t('legal.terms.booking.modifications')}</p>
          <p className="mt-3 italic text-sm">{t('legal.terms.booking.consumerRights')}</p>
        </div>

        {/* 7. Consumer Right of Withdrawal */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.withdrawal.title')}</h2>
          <p className="mb-3">{t('legal.terms.withdrawal.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.withdrawal.item1')}</li>
            <li>{t('legal.terms.withdrawal.item2')}</li>
            <li>{t('legal.terms.withdrawal.item3')}</li>
            <li>{t('legal.terms.withdrawal.item4')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{t('legal.terms.withdrawal.request')}</p>
        </div>

        {/* 8. Consumer Protection Rights */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.consumer.title')}</h2>
          <p className="mb-3">{t('legal.terms.consumer.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.consumer.defectFree')}:</strong> {t('legal.terms.consumer.defectFreeDesc')}</li>
            <li><strong>{t('legal.terms.consumer.warranty')}:</strong> {t('legal.terms.consumer.warrantyDesc')}</li>
            <li><strong>{t('legal.terms.consumer.remedy')}:</strong> {t('legal.terms.consumer.remedyDesc')}</li>
            <li><strong>{t('legal.terms.consumer.complain')}:</strong> {t('legal.terms.consumer.complainDesc')}</li>
            <li><strong>{t('legal.terms.consumer.clearInfo')}:</strong> {t('legal.terms.consumer.clearInfoDesc')}</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">{t('legal.terms.consumer.advisory')}: <a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">Finnish Competition and Consumer Authority (kkv.fi/en)</a></p>
        </div>

        {/* 9. Warranty and Defect Liability */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.consumer.title')}</h2>
          <p className="mb-3">{t('legal.terms.consumer.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.consumer.defectFree')}:</strong> {t('legal.terms.consumer.defectFreeDesc')}</li>
            <li><strong>{t('legal.terms.consumer.warranty')}:</strong> {t('legal.terms.consumer.warrantyDesc')}</li>
            <li><strong>{t('legal.terms.consumer.remedy')}:</strong> {t('legal.terms.consumer.remedyDesc')}</li>
            <li><strong>{t('legal.terms.consumer.complain')}:</strong> {t('legal.terms.consumer.complainDesc')}</li>
            <li><strong>{t('legal.terms.consumer.clearInfo')}:</strong> {t('legal.terms.consumer.clearInfoDesc')}</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">{t('legal.terms.consumer.advisory')}: <a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">Finnish Competition and Consumer Authority (kkv.fi/en)</a></p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.warranty.title')}</h2>
          <p className="mb-3"><strong className="text-foreground">{t('legal.terms.warranty.coverageTitle')}:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.warranty.parts')}:</strong> {t('legal.terms.warranty.partsDesc')}</li>
            <li><strong>{t('legal.terms.warranty.labor')}:</strong> {t('legal.terms.warranty.laborDesc')}</li>
            <li><strong>{t('legal.terms.warranty.manufacturer')}:</strong> {t('legal.terms.warranty.manufacturerDesc')}</li>
            <li><strong>{t('legal.terms.warranty.defectPresumption')}:</strong> {t('legal.terms.warranty.defectPresumptionDesc')}</li>
          </ul>
          <p className="mt-4"><strong className="text-foreground">{t('legal.terms.warranty.claimTitle')}:</strong> {t('legal.terms.warranty.claim')}</p>
          <p className="mt-3 italic text-sm">{t('legal.terms.warranty.exclusions')}</p>
        </div>

        {/* 10. Limitation of Liability */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.liability.title')}</h2>
          <p className="mb-3">{t('legal.terms.liability.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.liability.item1')}</li>
            <li>{t('legal.terms.liability.item2')}</li>
            <li>{t('legal.terms.liability.item3')}</li>
          </ul>
          <p className="mt-4"><strong className="text-foreground">{t('legal.terms.liability.notLiableTitle')}:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.liability.notLiableItem1')}</li>
            <li>{t('legal.terms.liability.notLiableItem2')}</li>
            <li>{t('legal.terms.liability.notLiableItem3')}</li>
            <li>{t('legal.terms.liability.notLiableItem4')}</li>
            <li>{t('legal.terms.liability.notLiableItem5')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{t('legal.terms.liability.mandatory')}</p>
        </div>

        {/* 11. Intellectual Property and Trade Marks */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.ip.title')}</h2>
          <p className="mb-3">{t('legal.terms.ip.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.ip.trademarks')}:</strong> {t('legal.terms.ip.trademarksDesc')}</li>
            <li><strong>{t('legal.terms.ip.copyright')}:</strong> {t('legal.terms.ip.copyrightDesc')}</li>
            <li><strong>{t('legal.terms.ip.serviceMarks')}:</strong> {t('legal.terms.ip.serviceMarksDesc')}</li>
          </ul>
          <p className="mt-3">{t('legal.terms.ip.unauthorized')}</p>
        </div>

        {/* 12. Tire Hotel Specific Terms */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.tireHotel.title')}</h2>
          <p className="mb-3">{t('legal.terms.tireHotel.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.tireHotel.storagePeriod')}:</strong> {t('legal.terms.tireHotel.storagePeriodDesc')}</li>
            <li><strong>{t('legal.terms.tireHotel.payment')}:</strong> {t('legal.terms.tireHotel.paymentDesc')}</li>
            <li><strong>{t('legal.terms.tireHotel.insurance')}:</strong> {t('legal.terms.tireHotel.insuranceDesc')}</li>
            <li><strong>{t('legal.terms.tireHotel.inspection')}:</strong> {t('legal.terms.tireHotel.inspectionDesc')}</li>
            <li><strong>{t('legal.terms.tireHotel.unclaimed')}:</strong> {t('legal.terms.tireHotel.unclaimedDesc')}</li>
            <li><strong>{t('legal.terms.tireHotel.liability')}:</strong> {t('legal.terms.tireHotel.liabilityDesc')}</li>
          </ul>
        </div>

        {/* 13. Emergency Service (Rescue 24/7) Terms */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.rescue.title')}</h2>
          <p className="mb-3">{t('legal.terms.rescue.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.rescue.availability')}:</strong> {t('legal.terms.rescue.availabilityDesc')}</li>
            <li><strong>{t('legal.terms.rescue.responseTime')}:</strong> {t('legal.terms.rescue.responseTimeDesc')}</li>
            <li><strong>{t('legal.terms.rescue.servicesIncluded')}:</strong> {t('legal.terms.rescue.servicesIncludedDesc')}</li>
            <li><strong>{t('legal.terms.rescue.payment')}:</strong> {t('legal.terms.rescue.paymentDesc')}</li>
            <li><strong>{t('legal.terms.rescue.coverage')}:</strong> {t('legal.terms.rescue.coverageDesc')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{t('legal.terms.rescue.contact')}</p>
        </div>

        {/* 14. Dispute Resolution */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.dispute.title')}</h2>
          <p className="mb-3"><strong className="text-foreground">{t('legal.terms.dispute.consumerTitle')}:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.dispute.step1')}:</strong> {t('legal.terms.dispute.step1Desc')}</li>
            <li><strong>{t('legal.terms.dispute.step2')}:</strong> {t('legal.terms.dispute.step2Desc')} <a href="https://www.kuluttajariita.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">kuluttajariita.fi/en</a></li>
            <li><strong>{t('legal.terms.dispute.step3')}:</strong> {t('legal.terms.dispute.step3Desc')} <a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">kkv.fi/en</a></li>
            <li><strong>{t('legal.terms.dispute.step4')}:</strong> {t('legal.terms.dispute.step4Desc')}</li>
          </ul>
          <p className="mt-3"><strong className="text-foreground">{t('legal.terms.dispute.businessTitle')}:</strong> {t('legal.terms.dispute.business')}</p>
          <p className="mt-4 italic text-sm">{t('legal.terms.dispute.euOdr')}: <a href="https://ec.europa.eu/consumers/odr" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a></p>
        </div>

        {/* 15. Governing Law and Jurisdiction */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.governing.title')}</h2>
          <p className="mb-3">{t('legal.terms.governing.intro')}</p>
          <p className="mb-3">{t('legal.terms.governing.legislation')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.governing.item1')}</li>
            <li>{t('legal.terms.governing.item2')}</li>
            <li>{t('legal.terms.governing.item3')}</li>
            <li>{t('legal.terms.governing.item4')}</li>
            <li>{t('legal.terms.governing.item5')}</li>
            <li>{t('legal.terms.governing.item6')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{t('legal.terms.governing.consumerRights')}</p>
        </div>

        {/* 16. Force Majeure */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.force.title')}</h2>
          <p>{t('legal.terms.force.description')}</p>
        </div>

        {/* 17. Amendments to Terms */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.amendments.title')}</h2>
          <p className="mb-3">{t('legal.terms.amendments.intro')}</p>
          <p className="mt-3">{t('legal.terms.amendments.continued')}</p>
          <p className="mt-3 font-semibold text-foreground">{t('legal.terms.amendments.currentVersion')}</p>
          <p className="font-semibold text-foreground">{t('legal.terms.amendments.effectiveDate')}</p>
          <p className="mt-3 italic text-sm">{t('legal.terms.amendments.previousVersions')}</p>
        </div>
      </div>
    </Card>
  );
}

// Version 6.0 - Booking policy refinement (Apr 2026)
export function TermsV6({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.acceptance.title')}</h2>
          <p className="mb-3">{t('legal.terms.acceptance.intro')}</p>
          <p className="mb-3"><strong className="text-foreground">{t('legal.terms.acceptance.provider')}:</strong></p>
          <ul className="space-y-1 ml-6 list-none">
            <li>Mitra Auto Oy</li>
            <li>{t('legal.terms.acceptance.businessId')}: 3408833-8</li>
            <li>{t('legal.terms.acceptance.address')}: Hankasuontie 5, 00390 Helsinki, Finland</li>
            <li>{t('legal.terms.acceptance.email')}: <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">contact@mitra-auto.fi</a></li>
            <li>{t('legal.terms.acceptance.phone')}: <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
            <li>{t('legal.terms.acceptance.emergency')}</li>
          </ul>
          <p className="mt-3 italic text-sm font-medium text-foreground">{t('legal.terms.acceptance.language')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.definitions.title')}</h2>
          <p className="mb-3">{t('legal.terms.definitions.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.definitions.consumer')}:</strong> {t('legal.terms.definitions.consumerDesc')}</li>
            <li><strong>{t('legal.terms.definitions.businessCustomer')}:</strong> {t('legal.terms.definitions.businessCustomerDesc')}</li>
            <li><strong>{t('legal.terms.definitions.customer')}:</strong> {t('legal.terms.definitions.customerDesc')}</li>
            <li><strong>{t('legal.terms.definitions.vehicle')}:</strong> {t('legal.terms.definitions.vehicleDesc')}</li>
            <li><strong>{t('legal.terms.definitions.service')}:</strong> {t('legal.terms.definitions.serviceDesc')}</li>
            <li><strong>{t('legal.terms.definitions.product')}:</strong> {t('legal.terms.definitions.productDesc')}</li>
            <li><strong>{t('legal.terms.definitions.booking')}:</strong> {t('legal.terms.definitions.bookingDesc')}</li>
            <li><strong>{t('legal.terms.definitions.serviceHistory')}:</strong> {t('legal.terms.definitions.serviceHistoryDesc')}</li>
            <li><strong>{t('legal.terms.definitions.tireHotel')}:</strong> {t('legal.terms.definitions.tireHotelDesc')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.services.title')}</h2>
          <p className="mb-3">{t('legal.terms.services.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.services.item1')}</li>
            <li>{t('legal.terms.services.item2')}</li>
            <li>{t('legal.terms.services.item3')}</li>
            <li>{t('legal.terms.services.item4')}</li>
            <li>{t('legal.terms.services.item5')}</li>
            <li>{t('legal.terms.services.item6')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{t('legal.terms.services.qualification')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.pricing.title')}</h2>
          <p className="mb-3 font-semibold text-foreground">{t('legal.terms.pricing.vat')}</p>
          <p className="mb-3">{t('legal.terms.pricing.validityIntro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.pricing.item1')}</li>
            <li>{t('legal.terms.pricing.item2')}</li>
            <li>{t('legal.terms.pricing.item3')}</li>
            <li>{t('legal.terms.pricing.item4')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{t('legal.terms.pricing.business')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.payment.title')}</h2>
          <p className="mb-3"><strong className="text-foreground">{t('legal.terms.payment.consumerTitle')}:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.payment.consumerItem1')}</li>
            <li>{t('legal.terms.payment.consumerItem2')}</li>
            <li>{t('legal.terms.payment.consumerItem3')}</li>
          </ul>
          <p className="mt-3"><strong className="text-foreground">{t('legal.terms.payment.businessTitle')}:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.payment.businessItem1')}</li>
            <li>{t('legal.terms.payment.businessItem2')}</li>
            <li>{t('legal.terms.payment.businessItem3')}</li>
            <li>{t('legal.terms.payment.businessItem4')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{t('legal.terms.payment.invoiceCompliance')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.v6.booking.title')}</h2>
          <p className="mb-3">{t('legal.terms.v6.booking.intro')}</p>
          <p className="mt-3"><strong className="text-foreground">{t('legal.terms.v6.booking.cancellationTitle')}</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.v6.booking.item1')}</li>
            <li>{t('legal.terms.v6.booking.item2')}</li>
            <li>{t('legal.terms.v6.booking.item3')}</li>
          </ul>
          <p className="mt-3">{t('legal.terms.v6.booking.modifications')}</p>
          <p className="mt-3 italic text-sm">{t('legal.terms.v6.booking.consumerRights')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.tireHotel.title')}</h2>
          <p className="mb-3">{t('legal.terms.tireHotel.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.tireHotel.storagePeriod')}:</strong> {t('legal.terms.tireHotel.storagePeriodDesc')}</li>
            <li><strong>{t('legal.terms.tireHotel.payment')}:</strong> {t('legal.terms.tireHotel.paymentDesc')}</li>
            <li><strong>{t('legal.terms.tireHotel.insurance')}:</strong> {t('legal.terms.tireHotel.insuranceDesc')}</li>
            <li><strong>{t('legal.terms.tireHotel.inspection')}:</strong> {t('legal.terms.tireHotel.inspectionDesc')}</li>
            <li><strong>{t('legal.terms.tireHotel.unclaimed')}:</strong> {t('legal.terms.tireHotel.unclaimedDesc')}</li>
            <li><strong>{t('legal.terms.tireHotel.liability')}:</strong> {t('legal.terms.tireHotel.liabilityDesc')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.rescue.title')}</h2>
          <p className="mb-3">{t('legal.terms.rescue.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.rescue.availability')}:</strong> {t('legal.terms.rescue.availabilityDesc')}</li>
            <li><strong>{t('legal.terms.rescue.responseTime')}:</strong> {t('legal.terms.rescue.responseTimeDesc')}</li>
            <li><strong>{t('legal.terms.rescue.servicesIncluded')}:</strong> {t('legal.terms.rescue.servicesIncludedDesc')}</li>
            <li><strong>{t('legal.terms.rescue.payment')}:</strong> {t('legal.terms.rescue.paymentDesc')}</li>
            <li><strong>{t('legal.terms.rescue.coverage')}:</strong> {t('legal.terms.rescue.coverageDesc')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{t('legal.terms.rescue.contact')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.withdrawal.title')}</h2>
          <p className="mb-3">{t('legal.terms.withdrawal.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.withdrawal.item1')}</li>
            <li>{t('legal.terms.withdrawal.item2')}</li>
            <li>{t('legal.terms.withdrawal.item3')}</li>
            <li>{t('legal.terms.withdrawal.item4')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{t('legal.terms.withdrawal.request')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.warranty.title')}</h2>
          <p className="mb-3"><strong className="text-foreground">{t('legal.terms.warranty.coverageTitle')}:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.warranty.parts')}:</strong> {t('legal.terms.warranty.partsDesc')}</li>
            <li><strong>{t('legal.terms.warranty.labor')}:</strong> {t('legal.terms.warranty.laborDesc')}</li>
            <li><strong>{t('legal.terms.warranty.manufacturer')}:</strong> {t('legal.terms.warranty.manufacturerDesc')}</li>
            <li><strong>{t('legal.terms.warranty.defectPresumption')}:</strong> {t('legal.terms.warranty.defectPresumptionDesc')}</li>
          </ul>
          <p className="mt-4"><strong className="text-foreground">{t('legal.terms.warranty.claimTitle')}:</strong> {t('legal.terms.warranty.claim')}</p>
          <p className="mt-3 italic text-sm">{t('legal.terms.warranty.exclusions')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.liability.title')}</h2>
          <p className="mb-3">{t('legal.terms.liability.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.liability.item1')}</li>
            <li>{t('legal.terms.liability.item2')}</li>
            <li>{t('legal.terms.liability.item3')}</li>
          </ul>
          <p className="mt-4"><strong className="text-foreground">{t('legal.terms.liability.notLiableTitle')}:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.liability.notLiableItem1')}</li>
            <li>{t('legal.terms.liability.notLiableItem2')}</li>
            <li>{t('legal.terms.liability.notLiableItem3')}</li>
            <li>{t('legal.terms.liability.notLiableItem4')}</li>
            <li>{t('legal.terms.liability.notLiableItem5')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{t('legal.terms.liability.mandatory')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.ip.title')}</h2>
          <p className="mb-3">{t('legal.terms.ip.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.ip.trademarks')}:</strong> {t('legal.terms.ip.trademarksDesc')}</li>
            <li><strong>{t('legal.terms.ip.copyright')}:</strong> {t('legal.terms.ip.copyrightDesc')}</li>
            <li><strong>{t('legal.terms.ip.serviceMarks')}:</strong> {t('legal.terms.ip.serviceMarksDesc')}</li>
          </ul>
          <p className="mt-3">{t('legal.terms.ip.unauthorized')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.dispute.title')}</h2>
          <p className="mb-3"><strong className="text-foreground">{t('legal.terms.dispute.consumerTitle')}:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.terms.dispute.step1')}:</strong> {t('legal.terms.dispute.step1Desc')}</li>
            <li><strong>{t('legal.terms.dispute.step2')}:</strong> {t('legal.terms.dispute.step2Desc')} <a href="https://www.kuluttajariita.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">kuluttajariita.fi/en</a></li>
            <li><strong>{t('legal.terms.dispute.step3')}:</strong> {t('legal.terms.dispute.step3Desc')} <a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">kkv.fi/en</a></li>
            <li><strong>{t('legal.terms.dispute.step4')}:</strong> {t('legal.terms.dispute.step4Desc')}</li>
          </ul>
          <p className="mt-3"><strong className="text-foreground">{t('legal.terms.dispute.businessTitle')}:</strong> {t('legal.terms.dispute.business')}</p>
          <p className="mt-4 italic text-sm">{t('legal.terms.dispute.euOdr')}: <a href="https://ec.europa.eu/consumers/odr" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a></p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.governing.title')}</h2>
          <p className="mb-3">{t('legal.terms.governing.intro')}</p>
          <p className="mb-3">{t('legal.terms.governing.legislation')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.terms.governing.item1')}</li>
            <li>{t('legal.terms.governing.item2')}</li>
            <li>{t('legal.terms.governing.item3')}</li>
            <li>{t('legal.terms.governing.item4')}</li>
            <li>{t('legal.terms.governing.item5')}</li>
            <li>{t('legal.terms.governing.item6')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{t('legal.terms.governing.consumerRights')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.force.title')}</h2>
          <p>{t('legal.terms.force.description')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.terms.amendments.title')}</h2>
          <p className="mb-3">{t('legal.terms.amendments.intro')}</p>
          <p className="mt-3">{t('legal.terms.amendments.continued')}</p>
          <p className="mt-3 font-semibold text-foreground">{t('legal.terms.amendments.currentVersion')}</p>
          <p className="font-semibold text-foreground">{t('legal.terms.amendments.effectiveDate')}</p>
          <p className="mt-3 italic text-sm">{t('legal.terms.amendments.previousVersions')}</p>
        </div>
      </div>
    </Card>
  );
}

// Version 6.1 - Current terms (May 2026)
export function TermsV61({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '1. Sopimus, soveltamisala ja palveluntarjoaja', '1. Agreement, Scope, and Service Provider')}</h2>
          <p className="mb-3">{tt(t, 'Nämä käyttöehdot koskevat Mitra Auto Oy:n verkkosivustoa, ajanvarausta, korjaamo- ja rengaspalveluita, verkkokauppaa, maksamista, Rescue 24/7 -palvelua, asiakaspalvelua, asiakas-PWA:ta, asiakastiliä, digitaalista huoltokirjaa, muistutuksia ja asiakashyötyjä. Käyttämällä palveluita, tekemällä varauksen, ostamalla tuotteita, maksamalla laskun tai käyttämällä asiakastiliä hyväksyt nämä ehdot.', 'These Terms apply to Mitra Auto Oy website, booking, workshop and tire services, webshop, payments, Rescue 24/7, customer support, customer PWA, customer account, digital service book, reminders, and customer benefits. By using the services, making a booking, buying products, paying an invoice, or using a customer account, you accept these Terms.')}</p>
          <ul className="space-y-1 ml-6 list-none">
            <li><strong className="text-foreground">{tt(t, 'Palveluntarjoaja', 'Service provider')}:</strong> Mitra Auto Oy</li>
            <li>{tt(t, 'Y-tunnus', 'Business ID')}: 3408833-8</li>
            <li>{tt(t, 'Osoite', 'Address')}: Hankasuontie 5, 00390 Helsinki, Finland</li>
            <li>{tt(t, 'Sähköposti', 'Email')}: <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">contact@mitra-auto.fi</a></li>
            <li>{tt(t, 'Puhelin', 'Phone')}: <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
          </ul>
          <p className="mt-3 italic text-sm font-medium text-foreground">{tt(t, 'Suomenkielinen versio on ensisijainen, jos kieliversioiden välillä on tulkintaero.', 'The Finnish version prevails if there is a conflict between language versions.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '2. Palvelut, joita ehdot koskevat', '2. Services Covered')}</h2>
          <p className="mb-3">{tt(t, 'Mitra Auto tarjoaa ajoneuvoihin liittyviä palveluita ja niitä tukevia digitaalisia toimintoja. Palvelun tarkka sisältö määräytyy asiakkaan tekemän varauksen, hyväksytyn tarjouksen, tilauksen, työmääräyksen, maksun tai erillisen sopimuksen perusteella.', 'Mitra Auto provides vehicle-related services and supporting digital functions. The exact service content is determined by the customer booking, accepted offer, order, work order, payment, or separate agreement.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tt(t, 'korjaamo-, huolto-, diagnostiikka-, öljynvaihto-, jarru-, alusta-, sähkö-, ilmastointi- ja muut ajoneuvotyöt;', 'workshop, maintenance, diagnostics, oil change, brake, chassis, electrical, air conditioning, and other vehicle work;')}</li>
            <li>{tt(t, 'rengas- ja vannepalvelut, renkaiden myynti, asennus, tasapainotus, paikkaus, kausivaihto ja rengashotelli;', 'tire and rim services, tire sales, installation, balancing, puncture repair, seasonal change, and tire hotel;')}</li>
            <li>{tt(t, 'pesu-, puhdistus-, katsastus-, varaosa-, nouto-, palautus- ja kuljetukseen liittyvät palvelut;', 'cleaning, inspection, parts, pickup, handover, and transport-related services;')}</li>
            <li>{tt(t, 'verkkokauppa, ajanvaraus, laskutus, maksut, kuitit ja asiakaspalvelu;', 'webshop, booking, invoicing, payments, receipts, and customer support;')}</li>
            <li>{tt(t, 'Rescue 24/7 -hätäpalvelu, hinauspalveluiden koordinointi ja tienvarsitilanteiden tuki;', 'Rescue 24/7 emergency service, towing coordination, and roadside support;')}</li>
            <li>{tt(t, 'asiakas-PWA, asiakastili, ajoneuvolista, digitaalinen huoltokirja, muistutukset, mahdolliset huoltopäivät ja asiakashyödyt.', 'customer PWA, customer account, vehicle list, digital service book, reminders, possible service dates, and customer benefits.')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{tt(t, 'Digitaalisia ominaisuuksia voidaan kehittää, rajoittaa, poistaa käytöstä tai julkaista vaiheittain. Tämä ei poista asiakkaan oikeuksia jo sovitusta huolto-, korjaus- tai ostosopimuksesta.', 'Digital features may be developed, limited, discontinued, or released gradually. This does not remove customer rights under an already agreed service, repair, or purchase contract.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '3. Määritelmät', '3. Definitions')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{tt(t, 'Asiakas', 'Customer')}:</strong> {tt(t, 'kuluttaja, yritysasiakas, fleet-asiakas, asiakastilin käyttäjä tai muu henkilö, joka käyttää palveluita.', 'a consumer, business customer, fleet customer, customer account user, or other person using the services.')}</li>
            <li><strong>{tt(t, 'Kuluttaja', 'Consumer')}:</strong> {tt(t, 'luonnollinen henkilö, joka toimii pääasiassa muussa kuin elinkeino- tai ammattitoiminnassa.', 'a natural person acting mainly outside business or professional activity.')}</li>
            <li><strong>{tt(t, 'Yritys- ja fleet-asiakas', 'Business and fleet customer')}:</strong> {tt(t, 'yritys, yhteisö, elinkeinonharjoittaja tai ajoneuvokalustoa hallinnoiva asiakas.', 'a company, organization, trader, or customer managing a vehicle fleet.')}</li>
            <li><strong>{tt(t, 'Ajoneuvo', 'Vehicle')}:</strong> {tt(t, 'asiakkaan omistama, hallitsema, käyttämä tai palveluun muuten liittyvä ajoneuvo.', 'a vehicle owned, controlled, used, or otherwise connected to the service by the customer.')}</li>
            <li><strong>{tt(t, 'Asiakastili ja PWA', 'Customer account and PWA')}:</strong> {tt(t, 'asiakkaalle tarkoitettu verkkonäkymä omiin varauksiin, ajoneuvoihin, huoltohistoriaan, muistutuksiin ja etuihin.', 'the customer-facing online view for bookings, vehicles, service history, reminders, and benefits.')}</li>
            <li><strong>{tt(t, 'Digitaalinen huoltokirja', 'Digital service book')}:</strong> {tt(t, 'Mitra Auton ylläpitämä palveluhistoria, joka voi sisältää huolto-, korjaus-, rengas-, varaosa-, pesu-, tarkastus- ja suositustietoja.', 'service history maintained by Mitra Auto, which may include maintenance, repair, tire, parts, cleaning, inspection, and recommendation data.')}</li>
            <li><strong>{tt(t, 'Asiakashyödyt', 'Customer benefits')}:</strong> {tt(t, 'pisteet, alennukset, etutasot, kampanjat, muistutukset tai muut asiakkuuteen liittyvät edut.', 'points, discounts, benefit levels, campaigns, reminders, or other customer relationship benefits.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '4. Asiakastili, käyttöoikeus ja turvallisuus', '4. Customer Account, Access, and Security')}</h2>
          <p className="mb-3">{tt(t, 'Asiakastili on tarkoitettu asiakkaan oman asioinnin helpottamiseen. Asiakas voi nähdä tiliin, asiakasryhmään tai ajoneuvoon yhdistettyjä tietoja, kuten tulevia varauksia, nouto- ja palautustietoja, huoltohistoriaa, mahdollisia huoltopäiviä, muistutuksia ja asiakashyötyjä.', 'The customer account is intended to make customer service use easier. The customer may see data connected to the account, customer group, or vehicle, such as upcoming bookings, pickup and handover details, service history, possible service dates, reminders, and customer benefits.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tt(t, 'Asiakas vastaa kirjautumistietojen turvallisesta käytöstä ja ilmoittaa Mitra Autolle epäillystä väärinkäytöstä.', 'The customer is responsible for secure use of login credentials and must notify Mitra Auto of suspected misuse.')}</li>
            <li>{tt(t, 'Mitra Auto voi rajoittaa, keskeyttää tai sulkea asiakastilin, jos se on tarpeen turvallisuuden, väärinkäytösten, virheellisten tietojen, maksamattomien saatavien tai lain noudattamisen vuoksi.', 'Mitra Auto may limit, suspend, or close a customer account where needed for security, abuse prevention, inaccurate data, unpaid receivables, or legal compliance.')}</li>
            <li>{tt(t, 'Yritys- ja fleet-asiakkaiden käyttäjät, roolit ja ajoneuvolistat voidaan vahvistaa nimetyn yhteyshenkilön tai erillisen sopimuksen perusteella.', 'Business and fleet customer users, roles, and vehicle lists may be confirmed based on a named contact person or separate agreement.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '5. Ajoneuvot, rekisteritunnukset ja asiakastietojen yhdistäminen', '5. Vehicles, License Plates, and Customer Mapping')}</h2>
          <p className="mb-3">{tt(t, 'Asiakas vastaa siitä, että hänen ilmoittamansa yhteystiedot, ajoneuvotiedot, rekisteritunnukset ja yritys- tai fleet-listat ovat oikein ja että asiakkaalla on oikeus käyttää tai hallita kyseistä ajoneuvoa palvelussa.', 'The customer is responsible for the accuracy of contact details, vehicle data, license plates, and business or fleet lists, and for having the right to use or manage the vehicle in the service.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tt(t, 'Mitra Auto voi yhdistää varaukset, tilaukset, kuitit, hätäpalvelupyynnöt, noutotiedot, aikataulut ja huoltohistorian asiakasprofiiliin sähköpostin, puhelinnumeron, asiakastunnisteen tai rekisteritunnuksen perusteella.', 'Mitra Auto may connect bookings, orders, receipts, emergency requests, pickup details, schedules, and service history to a customer profile using email, phone number, customer identifier, or license plate.')}</li>
            <li>{tt(t, 'Jos linkitys on virheellinen, asiakkaan tulee ilmoittaa siitä Mitra Autolle. Mitra Auto korjaa, irrottaa tai anonymisoi virheellisen linkityksen kohtuullisessa ajassa.', 'If a mapping is incorrect, the customer must notify Mitra Auto. Mitra Auto will correct, unlink, or anonymize the incorrect mapping within a reasonable time.')}</li>
            <li>{tt(t, 'Usean ajoneuvon, yrityksen tai fleet-ryhmän hallinta ei muuta ajoneuvon omistusta, vastuuta tai vakuutusehtoja.', 'Management of several vehicles, a company, or a fleet group does not change vehicle ownership, liability, or insurance terms.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '6. Ajanvaraukset, aikataulut, nouto ja peruutukset', '6. Bookings, Schedules, Pickup, and Cancellations')}</h2>
          <p className="mb-3">{tt(t, 'Varaus on asiakkaan pyyntö palveluajasta. Sitova sopimus syntyy, kun Mitra Auto vahvistaa varauksen, aloittaa työn, hyväksyy tilauksen tai antaa tarjouksen, jonka asiakas hyväksyy. Arvioidut ajat eivät ole takuita valmistumisajasta, ellei siitä ole nimenomaisesti sovittu.', 'A booking is the customer request for a service time. A binding agreement is formed when Mitra Auto confirms the booking, starts the work, accepts an order, or gives an offer accepted by the customer. Estimated times are not guarantees of completion time unless expressly agreed.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tt(t, 'Asiakkaan tulee toimittaa ajoneuvo sovittuna aikana ja antaa tarvittavat tiedot, avaimet, lukituskoodit tai hyväksynnät työn suorittamiseksi.', 'The customer must deliver the vehicle at the agreed time and provide necessary information, keys, lock codes, or approvals for the work.')}</li>
            <li>{tt(t, 'Mitra Auto voi siirtää aikaa, jos työ, varaosa, turvallisuus, sää, henkilöstötilanne tai muu perusteltu syy sitä edellyttää.', 'Mitra Auto may reschedule where work, parts, safety, weather, staffing, or another justified reason requires it.')}</li>
            <li>{tt(t, 'Peruutus tai muutos tulee tehdä mahdollisimman aikaisin. Toistuvasta saapumatta jättämisestä tai myöhäisestä peruutuksesta voidaan veloittaa kohtuulliset kustannukset, jos laki sen sallii.', 'Cancellation or change must be made as early as possible. Repeated no-shows or late cancellations may be charged for reasonable costs where permitted by law.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '7. Tilaukset, hinnat, maksut ja laskutus', '7. Orders, Prices, Payments, and Invoicing')}</h2>
          <p className="mb-3">{tt(t, 'Hinnat ilmoitetaan euroissa. Kuluttajahinnoissa arvonlisävero sisältyy hintaan, ellei toisin ilmoiteta. Yritysasiakkaiden hinnoissa arvonlisävero voidaan ilmoittaa erikseen. Lopullinen hinta voi muuttua, jos työn laajuus, varaosat, ajoneuvon kunto tai asiakkaan hyväksymät lisätyöt muuttuvat.', 'Prices are stated in euros. Consumer prices include VAT unless otherwise stated. Business customer prices may show VAT separately. The final price may change if work scope, parts, vehicle condition, or customer-approved additional work changes.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tt(t, 'Maksut voidaan käsitellä verkossa, laskulla, maksulinkillä, maksunvälittäjän kautta tai muulla Mitra Auton hyväksymällä tavalla.', 'Payments may be handled online, by invoice, payment link, payment provider, or another method accepted by Mitra Auto.')}</li>
            <li>{tt(t, 'Mitra Auto voi edellyttää ennakkomaksua, varaosien maksua etukäteen, luottotietojen tarkistusta tai maksun suorittamista ennen ajoneuvon luovutusta.', 'Mitra Auto may require advance payment, prepayment of parts, credit check, or payment before vehicle handover.')}</li>
            <li>{tt(t, 'Maksamattomista laskuista voidaan periä viivästyskorkoa, muistutusmaksuja ja perintäkuluja lain mukaisesti.', 'Unpaid invoices may incur late interest, reminder fees, and collection costs as permitted by law.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '8. Rengashotelli ja säilytyspalvelut', '8. Tire Hotel and Storage Services')}</h2>
          <p className="mb-3">{tt(t, 'Rengashotelli ja muut säilytyspalvelut koskevat asiakkaan renkaita, vanteita tai muita erikseen sovittuja tuotteita. Säilytyskausi, hinta, nouto, vaihto ja mahdolliset lisäpalvelut määräytyvät varauksen, tilauksen tai erillisen sopimuksen mukaan.', 'Tire hotel and other storage services apply to customer tires, rims, or other separately agreed products. Storage period, price, pickup, change, and possible additional services are determined by booking, order, or separate agreement.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tt(t, 'Asiakas vastaa siitä, että säilytettävät tuotteet ovat laillisia, tunnistettavia ja palveluun soveltuvia.', 'The customer is responsible for ensuring stored products are lawful, identifiable, and suitable for the service.')}</li>
            <li>{tt(t, 'Mitra Auto voi tarkastaa renkaiden kunnon ja ilmoittaa asiakkaalle, jos renkaat eivät ole turvallisia tai laillisia käyttää.', 'Mitra Auto may inspect tire condition and notify the customer if tires are not safe or legal to use.')}</li>
            <li>{tt(t, 'Noutamattomiin, maksamattomiin tai tunnistamattomiin tuotteisiin voidaan soveltaa erillisiä säilytys-, ilmoitus- ja käsittelyehtoja lain sallimissa rajoissa.', 'Unclaimed, unpaid, or unidentified products may be subject to separate storage, notice, and handling terms within the limits permitted by law.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '9. Rescue 24/7 ja tienvarsitilanteet', '9. Rescue 24/7 and Roadside Situations')}</h2>
          <p className="mb-3">{tt(t, 'Rescue 24/7 on hätä- ja tienvarsitilanteisiin tarkoitettu palvelu, joka voi sisältää asiakkaan yhteydenoton, sijainnin, rekisteritunnuksen, tilanteen kuvauksen, hinauksen koordinoinnin, renkaanvaihdon, käynnistysavun tai muun tilanteeseen soveltuvan tuen. Saatavuus riippuu sijainnista, säästä, turvallisuudesta, kumppaneista ja resursseista.', 'Rescue 24/7 is a service for emergency and roadside situations that may include customer contact, location, license plate, situation description, towing coordination, tire change, jump-start help, or other suitable support. Availability depends on location, weather, safety, partners, and resources.')}</p>
          <p className="mb-3">{tt(t, 'Asiakas vastaa oikeiden sijainti- ja ajoneuvotietojen antamisesta. Jos tilanne on välitön hengen, terveyden tai yleisen turvallisuuden vaara, asiakkaan tulee ottaa yhteys yleiseen hätänumeroon 112.', 'The customer is responsible for providing correct location and vehicle data. If the situation is an immediate danger to life, health, or public safety, the customer must contact the public emergency number 112.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '10. Digitaalinen huoltokirja ja palveluhistoria', '10. Digital Service Book and Service History')}</h2>
          <p className="mb-3">{tt(t, 'Digitaalinen huoltokirja näyttää Mitra Auton järjestelmiin tallennettua palveluhistoriaa. Se voi sisältää korjauksia, huoltoja, varaosia, rengastöitä, pesuja, tarkastuksia, mittarilukemia, suosituksia, henkilökunnan merkintöjä ja asiakkaalle näytettäviä yhteenvetoja.', 'The digital service book shows service history stored in Mitra Auto systems. It may include repairs, maintenance, parts, tire work, cleaning, inspections, mileage readings, recommendations, staff entries, and summaries shown to the customer.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tt(t, 'Huoltokirja ei ole viranomaisrekisteri eikä se korvaa virallisia laskuja, kuitteja, katsastusasiakirjoja tai valmistajan huoltokirjaa, ellei erikseen sovita.', 'The service book is not an authority register and does not replace official invoices, receipts, inspection documents, or manufacturer service book unless separately agreed.')}</li>
            <li>{tt(t, 'Mitra Auto pyrkii pitämään tiedot oikeina, mutta historiassa voi olla asiakkaan, aikaisemman järjestelmän, kolmannen osapuolen tai henkilökunnan syöttämiä virheitä.', 'Mitra Auto aims to keep data accurate, but history may contain errors entered by the customer, a previous system, a third party, or staff.')}</li>
            <li>{tt(t, 'Asiakas voi pyytää virheellisen tiedon korjaamista. Mitra Auto voi säilyttää korjauksen lokitiedon oikeudellisen vastuun ja auditoinnin vuoksi.', 'The customer may request correction of inaccurate data. Mitra Auto may retain a correction log for legal liability and auditing.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '11. Huoltomuistutukset, ilmoitukset ja viestintä', '11. Service Reminders, Notices, and Communications')}</h2>
          <p className="mb-3">{tt(t, 'Mitra Auto voi lähettää palveluviestejä, kuten varausvahvistuksia, aikataulumuutoksia, noutoilmoituksia, maksulinkkejä, turvallisuusviestejä ja huoltoon liittyviä kysymyksiä. Näitä viestejä tarvitaan palvelun toteuttamiseksi.', 'Mitra Auto may send service messages such as booking confirmations, schedule changes, pickup notices, payment links, security messages, and service-related questions. These messages are needed to provide the service.')}</p>
          <p className="mb-3">{tt(t, 'Mitra Auto voi myös tarjota muistutuksia esimerkiksi öljynvaihdosta, renkaiden vaihdosta, määräaikaishuollosta, katsastuksesta tai muusta asiakkaan ajoneuvoon liittyvästä tarpeesta. Muistutukset perustuvat saatavilla oleviin tietoihin eivätkä korvaa asiakkaan vastuuta seurata ajoneuvon turvallisuutta ja valmistajan ohjeita.', 'Mitra Auto may also provide reminders for oil change, tire change, scheduled maintenance, inspection, or another vehicle-related need. Reminders are based on available data and do not replace customer responsibility to monitor vehicle safety and manufacturer instructions.')}</p>
          <p className="italic text-sm">{tt(t, 'Markkinointi- ja etuviestit lähetetään vain lainmukaisella perusteella, ja asiakas voi kieltää ne soveltuvin osin.', 'Marketing and benefit messages are sent only on a lawful basis, and the customer may opt out where applicable.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '12. Asiakashyödyt, pisteet ja alennukset', '12. Customer Benefits, Points, and Discounts')}</h2>
          <p className="mb-3">{tt(t, 'Asiakashyödyt voivat sisältää pisteitä, alennuksia, etutasoja, kampanjoita, muistutuksia tai muita Mitra Auton määrittelemiä etuja. Edut ovat palvelun lisäominaisuuksia, eivät rahaa, pankkitalletuksia tai asiakkaalle kuuluvaa omaisuutta, ellei pakottava laki toisin määrää.', 'Customer benefits may include points, discounts, benefit levels, campaigns, reminders, or other benefits defined by Mitra Auto. Benefits are additional service features, not money, bank deposits, or customer property unless mandatory law states otherwise.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tt(t, 'Mitra Auto voi muuttaa etujen sääntöjä, kertymistä, voimassaoloa, käyttörajoja ja kampanjoita kohtuullisella tavalla.', 'Mitra Auto may reasonably change benefit rules, accrual, validity, use limits, and campaigns.')}</li>
            <li>{tt(t, 'Etua ei voi yleensä vaihtaa rahaksi eikä siirtää toiselle asiakkaalle ilman Mitra Auton hyväksyntää.', 'A benefit generally cannot be exchanged for cash or transferred to another customer without Mitra Auto approval.')}</li>
            <li>{tt(t, 'Väärinkäyttö, virheellinen linkitys, maksamaton lasku tai tilin sulkeminen voi estää etujen käytön.', 'Misuse, incorrect mapping, unpaid invoice, or account closure may prevent use of benefits.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '13. Asiakkaan velvollisuudet', '13. Customer Obligations')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tt(t, 'antaa oikeat yhteys-, laskutus-, ajoneuvo-, rekisteritunnus- ja palvelutiedot;', 'provide correct contact, billing, vehicle, license plate, and service data;')}</li>
            <li>{tt(t, 'kertoa tiedossa olevista vioista, turvallisuusriskeistä, lisävarusteista, lukitusjärjestelmistä ja aikaisemmista korjauksista, jos ne voivat vaikuttaa työhön;', 'disclose known faults, safety risks, accessories, locking systems, and previous repairs where they may affect the work;')}</li>
            <li>{tt(t, 'varmistaa, että ajoneuvossa ei ole vaarallista, laitonta tai palveluun kuulumatonta omaisuutta;', 'ensure the vehicle does not contain dangerous, illegal, or unrelated property;')}</li>
            <li>{tt(t, 'maksaa sovitut hinnat, lisätyöt, varaosat, säilytyspalvelut ja muut hyväksytyt kustannukset;', 'pay agreed prices, additional work, parts, storage services, and other approved costs;')}</li>
            <li>{tt(t, 'käyttää asiakastiliä, PWA:ta ja Mitra Auton palveluita lainmukaisesti ja hyvän tavan mukaisesti.', 'use the customer account, PWA, and Mitra Auto services lawfully and appropriately.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '14. Kuluttajansuoja, peruuttaminen, takuu ja virhevastuu', '14. Consumer Rights, Withdrawal, Warranty, and Defects')}</h2>
          <p className="mb-3">{tt(t, 'Kuluttaja-asiakkaalla on Suomen kuluttajansuojalain mukaiset oikeudet. Mikään näissä ehdoissa ei rajoita asiakkaan pakottavia kuluttajansuojaoikeuksia.', 'Consumer customers have rights under Finnish consumer protection law. Nothing in these Terms limits mandatory consumer protection rights.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tt(t, 'Palveluiden peruuttamisoikeus, alkaminen ja mahdollinen korvaus määräytyvät kuluttajansuojalain mukaan. Jos kuluttaja pyytää palvelun aloittamista ennen peruuttamisajan päättymistä, hän voi olla velvollinen maksamaan jo tehdystä työstä.', 'Withdrawal rights for services, service start, and possible compensation are determined by consumer protection law. If a consumer asks the service to begin before the withdrawal period ends, the consumer may be required to pay for work already performed.')}</li>
            <li>{tt(t, 'Tavaroiden, kuten renkaiden tai varaosien, palautus- ja peruuttamisoikeus määräytyy lain, tuotteen luonteen, käyttöönoton ja mahdollisen erikoistilauksen perusteella.', 'Return and withdrawal rights for goods such as tires or parts are determined by law, product nature, use, and possible special order status.')}</li>
            <li>{tt(t, 'Työn, varaosien ja tuotteiden takuu tai virhevastuu määräytyy lain, valmistajan ehtojen, Mitra Auton antaman takuun ja sovitun työn perusteella.', 'Warranty or defect liability for work, parts, and products is determined by law, manufacturer terms, Mitra Auto warranty, and the agreed work.')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{tt(t, 'Reklamaatio tulee tehdä kohtuullisessa ajassa virheen havaitsemisesta osoitteeseen contact@mitra-auto.fi.', 'Complaints must be made within a reasonable time after discovering the defect to contact@mitra-auto.fi.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '15. Vastuu ja vastuunrajoitukset', '15. Liability and Limitations')}</h2>
          <p className="mb-3">{tt(t, 'Mitra Auto vastaa palvelun suorittamisesta ammattitaitoisesti ja sovitun mukaisesti. Mitra Auto ei vastaa vahingoista, jotka johtuvat asiakkaan antamista virheellisistä tiedoista, ajoneuvon piilevistä vioista, asiakkaan hyväksymättä jättämästä suositellusta työstä, kolmannen osapuolen palvelusta, ylivoimaisesta esteestä tai asiakkaan omasta laiminlyönnistä, ellei pakottava laki toisin määrää.', 'Mitra Auto is responsible for performing the service professionally and as agreed. Mitra Auto is not liable for damage caused by inaccurate customer data, hidden vehicle defects, customer refusal of recommended work, third-party services, force majeure, or customer negligence unless mandatory law states otherwise.')}</p>
          <p className="mb-3">{tt(t, 'Digitaalinen asiakastili, PWA, huoltokirja, mahdolliset huoltopäivät ja muistutukset ovat tietopalveluita. Ne eivät takaa ajoneuvon kuntoa, turvallisuutta, katsastuskelpoisuutta tai valmistajan huolto-ohjelman täyttymistä.', 'The digital customer account, PWA, service book, possible service dates, and reminders are information services. They do not guarantee vehicle condition, safety, inspection readiness, or fulfillment of manufacturer service program.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '16. Tietosuoja', '16. Data Protection')}</h2>
          <p className="mb-3">{tt(t, 'Mitra Auto käsittelee henkilötietoja tietosuojaselosteen mukaisesti. Rekisteritunnus, ajoneuvolinkitys ja digitaalinen huoltokirja voivat olla henkilötietoja, kun ne voidaan yhdistää tunnistettavaan henkilöön, yritysyhteyshenkilöön tai asiakastiliin.', 'Mitra Auto processes personal data according to the Privacy Policy. A license plate, vehicle mapping, and digital service book may be personal data where they can be connected to an identifiable person, business contact, or customer account.')}</p>
          <p className="mb-3">{tt(t, 'Asiakas voi pyytää virheellisen asiakas-, ajoneuvo- tai rekisteritunnuslinkityksen korjaamista, irrottamista tai anonymisointia tietosuojaselosteen mukaisesti.', 'The customer may request correction, unlinking, or anonymization of an incorrect customer, vehicle, or license-plate mapping according to the Privacy Policy.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '17. Palvelun väärinkäyttö ja tilin sulkeminen', '17. Misuse and Account Closure')}</h2>
          <p className="mb-3">{tt(t, 'Mitra Auto voi estää palvelun käytön, poistaa käyttöoikeuksia, peruuttaa etuja, keskeyttää tilin tai sulkea tilin, jos asiakas käyttää palvelua väärin, antaa olennaisesti virheellisiä tietoja, yrittää nähdä toisen asiakkaan tietoja, jättää maksut maksamatta, rikkoo näitä ehtoja tai aiheuttaa turvallisuus- tai tietosuojariskin.', 'Mitra Auto may block service use, remove access rights, cancel benefits, suspend an account, or close an account if the customer misuses the service, provides materially inaccurate data, attempts to view another customer data, leaves payments unpaid, breaches these Terms, or causes a security or privacy risk.')}</p>
          <p className="italic text-sm">{tt(t, 'Tilin sulkeminen ei poista Mitra Auton oikeutta säilyttää tietoja, joita tarvitaan lain, sopimuksen, maksujen, vastuun, takuun, reklamaation, kirjanpidon tai oikeusvaateen vuoksi.', 'Account closure does not remove Mitra Auto right to retain data needed for law, contract, payments, liability, warranty, complaint, accounting, or legal claims.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '18. Riidat, sovellettava laki ja kuluttajaneuvonta', '18. Disputes, Governing Law, and Consumer Advice')}</h2>
          <p className="mb-3">{tt(t, 'Näihin ehtoihin sovelletaan Suomen lakia, pois lukien lainvalintasäännöt. Kuluttaja-asiakkaan pakottavia oikeuksia ei rajoiteta.', 'These Terms are governed by Finnish law, excluding conflict-of-law rules. Mandatory consumer rights are not limited.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tt(t, 'Erimielisyydet pyritään ratkaisemaan ensisijaisesti ottamalla yhteyttä Mitra Autoon.', 'Disputes should first be handled by contacting Mitra Auto.')}</li>
            <li>{tt(t, 'Kuluttaja voi olla yhteydessä kuluttajaneuvontaan ja viedä asian Kuluttajariitalautakuntaan.', 'A consumer may contact consumer advice and bring the matter to the Finnish Consumer Disputes Board.')}</li>
            <li>{tt(t, 'Yritysasiakkaiden riidat ratkaistaan ensisijaisesti Helsingin käräjäoikeudessa, ellei pakottava laki tai erillinen sopimus muuta edellytä.', 'Business customer disputes are primarily resolved in Helsinki District Court unless mandatory law or a separate agreement requires otherwise.')}</li>
          </ul>
          <p className="mt-3">
            <a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">kkv.fi/en</a>
            {' | '}
            <a href="https://www.kuluttajariita.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">kuluttajariita.fi/en</a>
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tt(t, '19. Muutokset ja voimassaolo', '19. Changes and Effective Version')}</h2>
          <p className="mb-3">{tt(t, 'Mitra Auto voi päivittää näitä ehtoja, kun palvelut, digitaaliset ominaisuudet, lainsäädäntö, hinnat, maksutavat, asiakastili, asiakashyödyt tai toimintatavat muuttuvat. Olennaisista muutoksista ilmoitetaan kohtuullisella tavalla. Aiemmat ehdot voivat soveltua ennen muutosta tehtyihin tilauksiin tai sopimuksiin, ellei pakottava laki tai asiakkaan kanssa sovittu muutos muuta edellytä.', 'Mitra Auto may update these Terms when services, digital features, law, prices, payment methods, customer account, customer benefits, or operating practices change. Material changes are communicated in a reasonable way. Previous terms may apply to orders or agreements made before the change unless mandatory law or an agreed change requires otherwise.')}</p>
          <p className="mt-3 font-semibold text-foreground">{tt(t, 'Nykyinen versio: Käyttöehdot v6.1', 'Current version: Terms and Conditions v6.1')}</p>
          <p className="font-semibold text-foreground">{tt(t, 'Voimaantulopäivä: 1.5.2026', 'Effective date: 1 May 2026')}</p>
        </div>
      </div>
    </Card>
  );
}
