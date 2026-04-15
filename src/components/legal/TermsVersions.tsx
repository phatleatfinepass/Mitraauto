import React from 'react';
import { Card } from '../ui/card';

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
