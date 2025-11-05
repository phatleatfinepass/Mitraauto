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
          <p className="mb-3">Contact: <a href="mailto:info.mitra.auto@gmail.com" className="text-[#FF6B35] hover:underline">info.mitra.auto@gmail.com</a> | <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></p>
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
            <li>Direct contact: info.mitra.auto@gmail.com</li>
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
            <li>Email: <a href="mailto:info.mitra.auto@gmail.com" className="text-[#FF6B35] hover:underline">info.mitra.auto@gmail.com</a></li>
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
            <li>Contact us first: info.mitra.auto@gmail.com</li>
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
          <h2 className="text-2xl text-foreground mb-4">1. Acceptance of Terms</h2>
          <p className="mb-3">By accessing or using any services provided by Mitra Auto Oy, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions of Service.</p>
          <p className="mb-3"><strong className="text-foreground">Service Provider:</strong></p>
          <ul className="space-y-1 ml-6 list-none">
            <li>Mitra Auto Oy</li>
            <li>Business ID (Y-tunnus): 3408833-8</li>
            <li>Address: Hankasuontie 5, 00390 Helsinki, Finland</li>
            <li>Email: <a href="mailto:info.mitra.auto@gmail.com" className="text-[#FF6B35] hover:underline">info.mitra.auto@gmail.com</a></li>
            <li>Phone: <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
            <li>Emergency Service: Available 24/7 via Rescue 24/7</li>
          </ul>
          <p className="mt-3 italic text-sm font-medium text-foreground">In case of any conflict between the Finnish and English versions of these terms, the Finnish version shall prevail.</p>
        </div>

        {/* 2. Definitions */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">2. Definitions</h2>
          <p className="mb-3">For the purposes of these Terms and Conditions, the following definitions apply:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Consumer:</strong> A natural person acting for purposes outside their trade, business, craft, or profession, as defined in the Finnish Consumer Protection Act (38/1978, as amended)</li>
            <li><strong>Business Customer:</strong> A legal entity, business, trader, or natural person acting in a commercial or professional capacity</li>
            <li><strong>Customer:</strong> Any person or entity using Mitra Auto's services, whether Consumer or Business Customer</li>
            <li><strong>Vehicle:</strong> Any motor vehicle, including cars, vans, motorcycles, and light trucks</li>
            <li><strong>Service:</strong> Any work, maintenance, repair, diagnostic, installation, or other automotive service provided by Mitra Auto</li>
            <li><strong>Product:</strong> Any parts, tires, accessories, or goods sold by Mitra Auto</li>
            <li><strong>Booking:</strong> A service reservation made through our online platform, by phone, or in person</li>
            <li><strong>Service History:</strong> Digital and physical records of all services performed on a Customer's vehicle</li>
            <li><strong>Tire Hotel:</strong> Our seasonal tire storage facility and service</li>
          </ul>
        </div>

        {/* 3. Scope of Services */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">3. Scope of Services</h2>
          <p className="mb-3">Mitra Auto provides the following automotive services:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Comprehensive vehicle maintenance, repair, and diagnostic services</li>
            <li>Tire services including sales, mounting, balancing, rotation, and alignment</li>
            <li>Seasonal tire storage through our Tire Hotel service</li>
            <li>Emergency roadside assistance and towing through our Rescue 24/7 service</li>
            <li>Online booking platform for service appointments and management</li>
            <li>Digital service history tracking and vehicle maintenance records</li>
          </ul>
          <p className="mt-3 italic text-sm">All services are performed by qualified technicians in accordance with industry standards and manufacturer specifications.</p>
        </div>

        {/* 4. Pricing and VAT */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">4. Pricing and VAT</h2>
          <p className="mb-3 font-semibold text-foreground">All prices displayed include Finnish Value Added Tax (VAT) at the current statutory rate of 25.5%, effective as of September 1, 2025.</p>
          <p className="mb-3">Price validity and terms:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Prices are valid at the time of booking confirmation</li>
            <li>Written quotes remain valid for 14 calendar days unless otherwise stated</li>
            <li>Any additional work beyond the original scope requires Customer approval before proceeding</li>
            <li>Price estimates are based on standard labor times; actual costs may vary if complications arise</li>
          </ul>
          <p className="mt-3 italic text-sm">Business customers may be subject to the reverse charge mechanism for certain cross-border services in accordance with the Finnish VAT Act (1501/1993, as amended).</p>
        </div>

        {/* 5. Payment Terms */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">5. Payment Terms</h2>
          <p className="mb-3"><strong className="text-foreground">Consumer Customers:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Payment is due immediately upon completion of services</li>
            <li>Accepted payment methods: Cash (EUR), debit cards, credit cards, and mobile payment solutions (e.g., MobilePay)</li>
            <li>Vehicles may not be released until full payment is received</li>
          </ul>
          <p className="mt-3"><strong className="text-foreground">Business Customers:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Standard payment terms: Net 14 days from invoice date</li>
            <li>Late payment interest: 8% per annum in accordance with the Finnish Interest Act (633/1982)</li>
            <li>Reminder fee: €5.00 as permitted by Finnish law</li>
            <li>Credit terms subject to approval and credit check</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">All invoices comply with the requirements of the Finnish Accounting Act (1336/1997).</p>
        </div>

        {/* 6. Booking, Cancellation, and Modifications */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">6. Booking, Cancellation, and Modifications</h2>
          <p className="mb-3">When making a booking, you agree to provide accurate and complete information about your vehicle and service needs.</p>
          <p className="mt-3"><strong className="text-foreground">Cancellation Policy:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Free cancellation:</strong> Bookings cancelled 24+ hours before the scheduled appointment time</li>
            <li><strong>Late cancellation:</strong> Bookings cancelled between 12-24 hours before appointment may incur a fee of 50% of the estimated service cost</li>
            <li><strong>No-show:</strong> Failure to appear for a scheduled appointment without prior notice may result in a charge of 100% of the estimated service cost</li>
          </ul>
          <p className="mt-3"><strong className="text-foreground">Modifications:</strong> Changes to booking details can be made up to 12 hours before the scheduled time, subject to availability.</p>
          <p className="mt-3 italic text-sm">Consumer rights under the Finnish Consumer Protection Act override cancellation fees where applicable. We will always assess cancellation requests on a case-by-case basis.</p>
        </div>

        {/* 7. Consumer Right of Withdrawal */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">7. Consumer Right of Withdrawal (Distance and Off-Premises Contracts)</h2>
          <p className="mb-3">Consumers have the right to withdraw from distance contracts (online bookings) within 14 days in accordance with Chapter 6 of the Consumer Protection Act.</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>The withdrawal period begins on the day the contract is concluded</li>
            <li>Withdrawal right does not apply if service performance has begun with the consumer's express consent</li>
            <li>Withdrawal right does not apply to custom-made or personalized products</li>
            <li>To exercise withdrawal, contact us at: info.mitra.auto@gmail.com</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">For withdrawal requests, please provide your booking reference number and contact information.</p>
        </div>

        {/* 8. Consumer Protection Rights */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">8. Consumer Protection Rights</h2>
          <p className="mb-3">As a consumer in Finland, you are entitled to comprehensive protection under Finnish and EU law:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Right to defect-free services and products:</strong> All services and products must be of satisfactory quality and fit for purpose</li>
            <li><strong>Statutory warranty:</strong> 2-year warranty period for parts and services under the Consumer Sales Act</li>
            <li><strong>Right to remedy:</strong> In case of defects, you may request repair, replacement, price reduction, or contract cancellation</li>
            <li><strong>Right to complain:</strong> Free access to the Consumer Disputes Board (Kuluttajariitalautakunta)</li>
            <li><strong>Right to clear information:</strong> Transparent pricing, terms, and pre-contractual information</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">Consumer Advisory Services: <a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">Finnish Competition and Consumer Authority (kkv.fi/en)</a></p>
        </div>

        {/* 9. Warranty and Defect Liability */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">9. Warranty and Defect Liability</h2>
          <p className="mb-3"><strong className="text-foreground">Statutory Warranty Coverage:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Parts:</strong> 24 months from the date of installation (Consumer Sales Act)</li>
            <li><strong>Labor/Workmanship:</strong> 12 months from the date of service completion</li>
            <li><strong>Manufacturer warranties:</strong> Apply to new parts as specified by the manufacturer</li>
            <li><strong>Defect presumption:</strong> Defects appearing within 6 months are presumed to have existed at the time of delivery</li>
          </ul>
          <p className="mt-4"><strong className="text-foreground">Making a Warranty Claim:</strong> Contact us immediately upon discovering any defect. We will assess the claim and provide repair, replacement, or other appropriate remedy at no additional cost if the defect falls within the warranty period.</p>
          <p className="mt-3 italic text-sm">Warranty does not cover normal wear and tear, misuse, accidents, or damage caused by third parties.</p>
        </div>

        {/* 10. Limitation of Liability */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">10. Limitation of Liability</h2>
          <p className="mb-3">Mitra Auto Oy is liable under Finnish law for:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Defects in services or products provided by us</li>
            <li>Damage to your vehicle caused by our negligence during service</li>
            <li>Failure to comply with statutory consumer protection obligations</li>
          </ul>
          <p className="mt-4"><strong className="text-foreground">We are not liable for:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Pre-existing damage or defects not disclosed at the time of service</li>
            <li>Normal wear and tear of vehicle components</li>
            <li>Damage resulting from customer's failure to follow maintenance recommendations</li>
            <li>Indirect or consequential losses unless caused by gross negligence or willful misconduct</li>
            <li>Force majeure events beyond our reasonable control</li>
          </ul>
          <p className="mt-3 italic text-sm">Mandatory consumer protection rights cannot be limited or waived by contract.</p>
        </div>

        {/* 11. Intellectual Property and Trade Marks */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">11. Intellectual Property and Trade Marks</h2>
          <p className="mb-3">All intellectual property rights are protected under Finnish law:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Trade Marks:</strong> "Mitra Auto," our logo, and "Rescue 24/7" are registered or common law trade marks protected under the Finnish Trade Marks Act (544/2019)</li>
            <li><strong>Copyright:</strong> Website content, designs, text, graphics, and software are protected by the Finnish Copyright Act (404/1961)</li>
            <li><strong>Service Marks:</strong> Our service names and branding elements are proprietary</li>
          </ul>
          <p className="mt-3">Unauthorized use, reproduction, or distribution of our intellectual property is strictly prohibited and may result in legal action.</p>
        </div>

        {/* 12. Tire Hotel Specific Terms */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">12. Tire Hotel Specific Terms</h2>
          <p className="mb-3">When using our Tire Hotel seasonal storage service, the following additional terms apply:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Storage period:</strong> As specified in your service agreement (typically 6 months per season)</li>
            <li><strong>Payment:</strong> Storage fees must be paid in advance or as per the invoice terms</li>
            <li><strong>Insurance:</strong> Tires are stored at customer's risk. Optional insurance coverage is available</li>
            <li><strong>Condition inspection:</strong> We inspect tires upon receipt and will notify you of any damage or excessive wear</li>
            <li><strong>Unclaimed property:</strong> Tires not claimed within 12 months of storage period end may be disposed of after 30 days written notice</li>
            <li><strong>Liability:</strong> We are liable for damage caused by our negligence during storage, handling, or retrieval</li>
          </ul>
        </div>

        {/* 13. Emergency Service (Rescue 24/7) Terms */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">13. Emergency Service (Rescue 24/7) Terms</h2>
          <p className="mb-3">Our Rescue 24/7 emergency roadside assistance and towing service operates under the following conditions:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Availability:</strong> 24 hours a day, 7 days a week, 365 days a year</li>
            <li><strong>Response time:</strong> We aim to respond within 60 minutes in the Helsinki metropolitan area; actual response times may vary based on location, weather, and traffic conditions</li>
            <li><strong>Services included:</strong> Towing, jump-start, tire change, lockout assistance, fuel delivery</li>
            <li><strong>Payment:</strong> Emergency service fees are due upon completion. Payment by card or cash</li>
            <li><strong>Geographic coverage:</strong> Primary coverage in Uusimaa region; extended coverage subject to availability and additional fees</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">Emergency Contact: Available through our website emergency button or by calling +358 40 777 7163</p>
        </div>

        {/* 14. Dispute Resolution */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">14. Dispute Resolution</h2>
          <p className="mb-3"><strong className="text-foreground">For Consumer Customers:</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Step 1:</strong> Contact us directly at info.mitra.auto@gmail.com or +358 40 777 7163</li>
            <li><strong>Step 2:</strong> Consumer Disputes Board: <a href="https://www.kuluttajariita.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">kuluttajariita.fi/en</a></li>
            <li><strong>Step 3:</strong> Consumer Ombudsman: <a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">kkv.fi/en</a></li>
            <li><strong>Step 4:</strong> Helsinki District Court (Helsingin käräjäoikeus) as the court of first instance</li>
          </ul>
          <p className="mt-3"><strong className="text-foreground">For Business Customers:</strong> Disputes shall be resolved in Helsinki District Court under Finnish law.</p>
          <p className="mt-4 italic text-sm">EU consumers may also use the Online Dispute Resolution platform: <a href="https://ec.europa.eu/consumers/odr" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a></p>
        </div>

        {/* 15. Governing Law and Jurisdiction */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">15. Governing Law and Jurisdiction</h2>
          <p className="mb-3">These Terms and Conditions are governed by and construed in accordance with the laws of Finland.</p>
          <p className="mb-3">Applicable Finnish legislation includes but is not limited to:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Consumer Protection Act (38/1978, as amended)</li>
            <li>Consumer Sales Act (38/1978, Chapter 5)</li>
            <li>Trade Marks Act (544/2019)</li>
            <li>VAT Act (1501/1993, as amended)</li>
            <li>Interest Act (633/1982)</li>
            <li>Accounting Act (1336/1997)</li>
          </ul>
          <p className="mt-3 italic text-sm">Consumers retain all mandatory rights provided under Finnish and EU consumer protection legislation, which cannot be waived or limited by these terms.</p>
        </div>

        {/* 16. Force Majeure */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">16. Force Majeure</h2>
          <p>Neither party shall be liable for any failure or delay in performance due to events beyond their reasonable control, including but not limited to: acts of God, natural disasters, war, terrorism, civil unrest, labor disputes, epidemics, pandemics, government actions, power failures, or failures of third-party suppliers. In such events, the affected party shall notify the other party promptly and take reasonable steps to minimize the impact.</p>
        </div>

        {/* 17. Amendments to Terms */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">17. Amendments to Terms</h2>
          <p className="mb-3">We reserve the right to update or modify these Terms and Conditions at any time. Material changes will be communicated to customers via email or prominent notice on our website at least 30 days prior to the effective date.</p>
          <p className="mt-3">Continued use of our services after the effective date of changes constitutes acceptance of the modified terms.</p>
          <p className="mt-3 font-semibold text-foreground">Current Version: 5.0</p>
          <p className="font-semibold text-foreground">Effective Date: November 5, 2025</p>
          <p className="mt-3 italic text-sm">Previous versions are available upon request for reference purposes.</p>
        </div>
      </div>
    </Card>
  );
}
