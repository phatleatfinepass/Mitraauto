import React from 'react';
import { Card } from '../ui/card';

interface PrivacyPolicyContentProps {
  version: number;
  t: (key: string) => string;
}

// Version 1.0 - Initial Basic Version (Dec 2023)
export function PrivacyPolicyV1({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        {/* Basic Data Controller */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">Data Controller</h2>
          <p className="mb-3">Mitra Auto Oy is responsible for processing your personal data.</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong className="text-foreground">Company:</strong> Mitra Auto Oy</li>
            <li><strong>Business ID:</strong> 3408833-8</li>
            <li><strong>Email:</strong> <a href="mailto:info@mitraauto.fi" className="text-[#FF6B35] hover:underline">info@mitraauto.fi</a></li>
          </ul>
        </div>

        {/* What Data We Collect */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">What Information We Collect</h2>
          <p className="mb-3">We collect the following information when you use our services:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Name and contact information</li>
            <li>Vehicle information (make, model, license plate)</li>
            <li>Service booking details</li>
            <li>Payment information</li>
          </ul>
        </div>

        {/* How We Use Data */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">How We Use Your Information</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>To provide our automotive services</li>
            <li>To process bookings and payments</li>
            <li>To communicate with you about services</li>
            <li>To improve our services</li>
          </ul>
        </div>

        {/* Data Security */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal data.</p>
        </div>

        {/* Your Rights */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">Your Rights</h2>
          <p className="mb-3">You have the right to:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Access your personal data</li>
            <li>Request correction of your data</li>
            <li>Request deletion of your data</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">Contact Us</h2>
          <p>For privacy-related questions, contact us at: <a href="mailto:info@mitraauto.fi" className="text-[#FF6B35] hover:underline">info@mitraauto.fi</a></p>
        </div>
      </div>
    </Card>
  );
}

// Version 2.0 - GDPR Compliance Update (Mar 2025)
export function PrivacyPolicyV2({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        {/* Data Controller - Enhanced */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">1. Data Controller (Article 13 GDPR)</h2>
          <p className="mb-3">In accordance with the General Data Protection Regulation (GDPR), we inform you that:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong className="text-foreground">Company:</strong> Mitra Auto Oy</li>
            <li><strong>Business ID:</strong> 3408833-8</li>
            <li><strong>Address:</strong> Hankasuontie 5, 00390 Helsinki, Finland</li>
            <li><strong>Email:</strong> <a href="mailto:info@mitraauto.fi" className="text-[#FF6B35] hover:underline">info@mitraauto.fi</a></li>
            <li><strong>Phone:</strong> <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
          </ul>
        </div>

        {/* Legal Basis - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">2. Legal Basis for Processing</h2>
          <p className="mb-3">We process your personal data based on:</p>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>Contract Performance:</strong> Processing necessary for providing our services</li>
            <li><strong>Consent:</strong> Where you have given explicit consent</li>
            <li><strong>Legitimate Interest:</strong> For service improvement and customer support</li>
            <li><strong>Legal Obligation:</strong> Compliance with Finnish accounting and tax laws</li>
          </ul>
        </div>

        {/* What Data We Collect - Expanded */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">3. Personal Data We Collect</h2>
          <p className="mb-3">We collect and process the following categories of personal data:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Personal identification (name, email, phone number)</li>
            <li>Vehicle information (registration number, make, model, VIN)</li>
            <li>Service history and maintenance records</li>
            <li>Payment and billing information</li>
            <li>Tire hotel storage details</li>
            <li>Communication history</li>
          </ul>
        </div>

        {/* Data Retention - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">4. Data Retention</h2>
          <p className="mb-3">We retain your personal data as follows:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Customer data: Duration of customer relationship + 2 years</li>
            <li>Accounting data: 6 years (Finnish Accounting Act requirement)</li>
            <li>Service records: 3 years for warranty purposes</li>
          </ul>
        </div>

        {/* Enhanced Rights */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">5. Your GDPR Rights</h2>
          <p className="mb-3">Under GDPR, you have the following rights:</p>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>Right of Access (Art. 15):</strong> Request a copy of your personal data</li>
            <li><strong>Right to Rectification (Art. 16):</strong> Correct inaccurate data</li>
            <li><strong>Right to Erasure (Art. 17):</strong> Request deletion of your data</li>
            <li><strong>Right to Restriction (Art. 18):</strong> Limit processing of your data</li>
            <li><strong>Right to Data Portability (Art. 20):</strong> Receive your data in machine-readable format</li>
            <li><strong>Right to Object (Art. 21):</strong> Object to certain processing activities</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw previously given consent</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">To exercise your rights, contact us at: privacy@mitraauto.fi</p>
        </div>

        {/* Supervisory Authority - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">6. Right to Lodge a Complaint</h2>
          <p>You have the right to lodge a complaint with the Finnish Data Protection Ombudsman (Tietosuojavaltuutettu) if you believe your data protection rights have been violated.</p>
          <p className="mt-2">Website: <a href="https://tietosuoja.fi" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">tietosuoja.fi</a></p>
        </div>

        {/* Data Security */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">7. Data Security</h2>
          <p className="mb-3">We implement appropriate technical and organizational security measures:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Encrypted data transmission (SSL/TLS)</li>
            <li>Access controls and authentication</li>
            <li>Regular security audits</li>
            <li>Employee training on data protection</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

// Version 3.0 - Contact Info & International Transfers (Jun 2025)
export function PrivacyPolicyV3({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        {/* Includes all V2 content plus: */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">1. Data Controller</h2>
          <p className="mb-3">Mitra Auto Oy processes your personal data in accordance with GDPR and Finnish data protection legislation.</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong className="text-foreground">Company:</strong> Mitra Auto Oy</li>
            <li><strong>Business ID:</strong> 3408833-8</li>
            <li><strong>Address:</strong> Hankasuontie 5, 00390 Helsinki, Finland</li>
            <li><strong>Email:</strong> <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">contact@mitra-auto.fi</a></li>
            <li><strong>Phone:</strong> <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
          </ul>
          <p className="mt-3 text-sm italic">Contact information updated June 2025</p>
        </div>

        {/* Legal Basis */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">2. Legal Basis for Processing</h2>
          <p className="mb-3">We process your personal data based on:</p>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>Contract Performance (Art. 6(1)(b) GDPR):</strong> Processing necessary for service delivery</li>
            <li><strong>Consent (Art. 6(1)(a) GDPR):</strong> Where you have given explicit consent</li>
            <li><strong>Legitimate Interest (Art. 6(1)(f) GDPR):</strong> For service improvement and customer support</li>
            <li><strong>Legal Obligation (Art. 6(1)(c) GDPR):</strong> Compliance with Finnish accounting and tax laws</li>
          </ul>
        </div>

        {/* Data Collected */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">3. Personal Data We Collect</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Personal identification (name, email, phone number, address)</li>
            <li>Vehicle information (registration number, make, model, VIN)</li>
            <li>Service history and maintenance records</li>
            <li>Payment and billing information</li>
            <li>Tire hotel storage details and tire specifications</li>
            <li>Communication history and service preferences</li>
            <li>Technical data (IP address, browser type for online services)</li>
          </ul>
        </div>

        {/* International Transfers - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">4. International Data Transfers</h2>
          <p className="mb-3">Some of our service providers may be located outside the European Economic Area (EEA). When we transfer data internationally, we ensure adequate protection through:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>EU Standard Contractual Clauses (SCCs)</li>
            <li>Adequacy decisions by the European Commission</li>
            <li>Privacy Shield framework for US-based service providers</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">All international transfers comply with Chapter V of GDPR.</p>
        </div>

        {/* Third-Party Services - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">5. Third-Party Service Providers</h2>
          <p className="mb-3">We may share your data with the following categories of service providers:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Cloud hosting providers (data storage)</li>
            <li>Payment processors (secure payment handling)</li>
            <li>Email service providers (communications)</li>
            <li>Analytics providers (service improvement)</li>
          </ul>
          <p className="mt-3 font-semibold text-foreground">We never sell your personal data to third parties.</p>
        </div>

        {/* Data Retention */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">6. Data Retention</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Customer data: Duration of customer relationship + 2 years</li>
            <li>Accounting data: 6 years (Finnish Accounting Act 1336/1997)</li>
            <li>Service records: 3 years for warranty and liability purposes</li>
            <li>Marketing consents: Until withdrawn or 3 years of inactivity</li>
          </ul>
        </div>

        {/* Your Rights */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">7. Your Data Protection Rights</h2>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
            <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
            <li><strong>Right to Restriction:</strong> Limit processing of your data</li>
            <li><strong>Right to Data Portability:</strong> Receive your data in machine-readable format</li>
            <li><strong>Right to Object:</strong> Object to certain processing activities</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw previously given consent</li>
            <li><strong>Right to Lodge a Complaint:</strong> File a complaint with the Data Protection Ombudsman</li>
          </ul>
        </div>

        {/* Security */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">8. Data Security</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>256-bit SSL/TLS encryption for data transmission</li>
            <li>Multi-factor authentication for system access</li>
            <li>Regular security audits and penetration testing</li>
            <li>Employee data protection training</li>
            <li>Incident response procedures</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

// Version 4.0 - Enhanced Consumer Rights & VAT Update (Sep 2025)
export function PrivacyPolicyV4({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        {/* All previous content plus enhancements */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">1. Data Controller</h2>
          <p className="mb-3">Mitra Auto Oy is committed to protecting your personal data in accordance with GDPR, Finnish Data Protection Act, and Consumer Protection Act.</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong className="text-foreground">Company:</strong> Mitra Auto Oy</li>
            <li><strong>Business ID:</strong> 3408833-8</li>
            <li><strong>Address:</strong> Hankasuontie 5, 00390 Helsinki, Finland</li>
            <li><strong>Email:</strong> <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">contact@mitra-auto.fi</a></li>
            <li><strong>Phone:</strong> <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
          </ul>
        </div>

        {/* Extended Data Collection */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">2. Personal Data We Collect</h2>
          <p className="mb-3">We collect and process the following categories:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Personal identification information</li>
            <li>Vehicle data (VIN, make, model, year, license plate)</li>
            <li>Service and maintenance history</li>
            <li>Payment and billing information (VAT 25.5% applied)</li>
            <li>Tire hotel storage records and tire specifications</li>
            <li>Communication records and preferences</li>
            <li>Technical data (cookies, IP addresses, device information)</li>
            <li>Location data (for emergency towing services only, with consent)</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">GPS location data is only collected with explicit consent for Rescue 24/7 emergency services.</p>
        </div>

        {/* Legal Basis with Balancing Test */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">3. Legal Basis for Processing</h2>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>Contract Performance:</strong> Service delivery, booking management, payment processing</li>
            <li><strong>Consent:</strong> Marketing communications, location tracking for emergency services</li>
            <li><strong>Legitimate Interest:</strong> Fraud prevention, service improvement, customer support</li>
            <li><strong>Legal Obligation:</strong> Accounting records, tax compliance, consumer protection compliance</li>
          </ul>
          <p className="mt-4 italic text-sm">We conduct balancing tests to ensure legitimate interests do not override your fundamental rights.</p>
        </div>

        {/* Enhanced Consumer Rights - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">4. Enhanced Consumer Rights</h2>
          <p className="mb-3">In addition to GDPR rights, as a consumer you have:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Right to Clear Information:</strong> Transparent pricing and service descriptions</li>
            <li><strong>Right to Complaint:</strong> Free dispute resolution through Finnish Consumer Disputes Board</li>
            <li><strong>Right to Warranty Claims:</strong> 2-year warranty on parts and services per Consumer Protection Act</li>
            <li><strong>Right to Cancel Distance Sales:</strong> 14-day right of withdrawal for online purchases</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">Contact: Finnish Consumer Ombudsman (kuluttajaneuvonta.fi)</p>
        </div>

        {/* International Transfers Updated */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">5. International Data Transfers</h2>
          <p className="mb-3">Data may be transferred outside the EEA with appropriate safeguards:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>EU Standard Contractual Clauses (2021 version)</li>
            <li>EU Commission adequacy decisions</li>
            <li>Privacy Shield framework (where applicable)</li>
          </ul>
          <p className="mt-3 italic text-sm">We regularly review transfer mechanisms to ensure compliance with Schrems II requirements.</p>
        </div>

        {/* Cookies - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">6. Cookies and Tracking</h2>
          <p className="mb-3">We use the following types of cookies:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>Essential:</strong> Required for website functionality</li>
            <li><strong>Analytics:</strong> To understand how you use our services</li>
            <li><strong>Preference:</strong> Remember your settings and language</li>
          </ul>
          <p className="mt-3">You can manage cookie preferences through your browser settings.</p>
        </div>

        {/* Data Security Enhanced */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">7. Data Security Measures</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>256-bit SSL/TLS encryption</li>
            <li>ISO 27001-aligned security practices</li>
            <li>Multi-factor authentication</li>
            <li>Regular penetration testing and security audits</li>
            <li>Data breach notification procedures (within 72 hours)</li>
            <li>Employee confidentiality agreements</li>
          </ul>
        </div>

        {/* Your Rights Expanded */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">8. Exercising Your Rights</h2>
          <p className="mb-3">To exercise any of your data protection rights:</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Email us at: privacy@mitraauto.fi</li>
            <li>Call us at: +358 40 777 7163</li>
            <li>Visit our location: Hankasuontie 5, Helsinki</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">We will respond to requests within 30 days (can be extended by 2 months if complex).</p>
        </div>
      </div>
    </Card>
  );
}

// Version 5.0 - Current Comprehensive Version (Nov 2025)
export function PrivacyPolicyV5({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        {/* Full current implementation with all sections */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.controller.title')}</h2>
          <p className="mb-3">{t('legal.privacy.controller.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong className="text-foreground">{t('legal.privacy.controller.company')}:</strong> Mitra Auto Oy</li>
            <li><strong>{t('legal.privacy.controller.businessId')}:</strong> 3408833-8</li>
            <li><strong>{t('legal.privacy.controller.address')}:</strong> Hankasuontie 5, 00390 Helsinki, Finland</li>
            <li><strong>{t('legal.privacy.controller.email')}:</strong> <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">contact@mitra-auto.fi</a></li>
            <li><strong>{t('legal.privacy.controller.phone')}:</strong> <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.dataCollected.title')}</h2>
          <p className="mb-3">{t('legal.privacy.dataCollected.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.privacy.dataCollected.item1')}</li>
            <li>{t('legal.privacy.dataCollected.item2')}</li>
            <li>{t('legal.privacy.dataCollected.item3')}</li>
            <li>{t('legal.privacy.dataCollected.item4')}</li>
            <li>{t('legal.privacy.dataCollected.item5')}</li>
            <li>{t('legal.privacy.dataCollected.item6')}</li>
            <li>{t('legal.privacy.dataCollected.item7')}</li>
            <li>{t('legal.privacy.dataCollected.item8')}</li>
          </ul>
          <p className="mt-4 italic">{t('legal.privacy.dataCollected.gpsNote')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.legalBasis.title')}</h2>
          <p className="mb-3">{t('legal.privacy.legalBasis.intro')}</p>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>{t('legal.privacy.legalBasis.contract')}:</strong> {t('legal.privacy.legalBasis.contractDesc')}</li>
            <li><strong>{t('legal.privacy.legalBasis.consent')}:</strong> {t('legal.privacy.legalBasis.consentDesc')}</li>
            <li><strong>{t('legal.privacy.legalBasis.legitimate')}:</strong> {t('legal.privacy.legalBasis.legitimateDesc')}</li>
            <li><strong>{t('legal.privacy.legalBasis.legal')}:</strong> {t('legal.privacy.legalBasis.legalDesc')}</li>
          </ul>
          <p className="mt-4 italic text-sm">{t('legal.privacy.legalBasis.balancingNote')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.dataUse.title')}</h2>
          <p className="mb-3">{t('legal.privacy.dataUse.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.privacy.dataUse.item1')}</li>
            <li>{t('legal.privacy.dataUse.item2')}</li>
            <li>{t('legal.privacy.dataUse.item3')}</li>
            <li>{t('legal.privacy.dataUse.item4')}</li>
            <li>{t('legal.privacy.dataUse.item5')}</li>
            <li>{t('legal.privacy.dataUse.item6')}</li>
            <li>{t('legal.privacy.dataUse.item7')}</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">{t('legal.privacy.dataUse.marketingNote')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.sharing.title')}</h2>
          <p className="mb-3">{t('legal.privacy.sharing.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.privacy.sharing.item1')}</li>
            <li>{t('legal.privacy.sharing.item2')}</li>
            <li>{t('legal.privacy.sharing.item3')}</li>
            <li>{t('legal.privacy.sharing.item4')}</li>
            <li>{t('legal.privacy.sharing.item5')}</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">{t('legal.privacy.sharing.processors')}</p>
          <p className="mt-2 font-semibold text-foreground">{t('legal.privacy.sharing.noSell')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.transfers.title')}</h2>
          <p className="mb-3">{t('legal.privacy.transfers.desc')}</p>
          <p className="mt-3">{t('legal.privacy.transfers.safeguards')}</p>
          <p className="mt-2 italic text-sm">{t('legal.privacy.transfers.transferNote')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.retention.title')}</h2>
          <p className="mb-3">{t('legal.privacy.retention.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.privacy.retention.item1')}</li>
            <li>{t('legal.privacy.retention.item2')}</li>
            <li>{t('legal.privacy.retention.item3')}</li>
            <li>{t('legal.privacy.retention.item4')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.security.title')}</h2>
          <p className="mb-3">{t('legal.privacy.security.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.privacy.security.item1')}</li>
            <li>{t('legal.privacy.security.item2')}</li>
            <li>{t('legal.privacy.security.item3')}</li>
            <li>{t('legal.privacy.security.item4')}</li>
            <li>{t('legal.privacy.security.item5')}</li>
            <li>{t('legal.privacy.security.item6')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.rights.title')}</h2>
          <p className="mb-3">{t('legal.privacy.rights.intro')}</p>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>{t('legal.privacy.rights.access')}:</strong> {t('legal.privacy.rights.accessDesc')}</li>
            <li><strong>{t('legal.privacy.rights.correction')}:</strong> {t('legal.privacy.rights.correctionDesc')}</li>
            <li><strong>{t('legal.privacy.rights.erasure')}:</strong> {t('legal.privacy.rights.erasureDesc')}</li>
            <li><strong>{t('legal.privacy.rights.restriction')}:</strong> {t('legal.privacy.rights.restrictionDesc')}</li>
            <li><strong>{t('legal.privacy.rights.portability')}:</strong> {t('legal.privacy.rights.portabilityDesc')}</li>
            <li><strong>{t('legal.privacy.rights.object')}:</strong> {t('legal.privacy.rights.objectDesc')}</li>
            <li><strong>{t('legal.privacy.rights.withdraw')}:</strong> {t('legal.privacy.rights.withdrawDesc')}</li>
            <li><strong>{t('legal.privacy.rights.complain')}:</strong> {t('legal.privacy.rights.complainDesc')}</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">{t('legal.privacy.rights.contact')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.automated.title')}</h2>
          <p>{t('legal.privacy.automated.desc')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.cookies.title')}</h2>
          <p className="mb-3">{t('legal.privacy.cookies.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{t('legal.privacy.cookies.essential')}:</strong> {t('legal.privacy.cookies.essentialDesc')}</li>
            <li><strong>{t('legal.privacy.cookies.analytics')}:</strong> {t('legal.privacy.cookies.analyticsDesc')}</li>
            <li><strong>{t('legal.privacy.cookies.preference')}:</strong> {t('legal.privacy.cookies.preferenceDesc')}</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">{t('legal.privacy.cookies.consent')}</p>
          <p className="mt-3">{t('legal.privacy.cookies.control')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.thirdParty.title')}</h2>
          <p className="mb-3">{t('legal.privacy.thirdParty.intro')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{t('legal.privacy.thirdParty.item1')}</li>
            <li>{t('legal.privacy.thirdParty.item2')}</li>
            <li>{t('legal.privacy.thirdParty.item3')}</li>
            <li>{t('legal.privacy.thirdParty.item4')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{t('legal.privacy.thirdParty.regions')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.children.title')}</h2>
          <p className="mb-3">{t('legal.privacy.children.desc')}</p>
          <p className="font-medium text-foreground">{t('legal.privacy.children.ageNote')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{t('legal.privacy.changes.title')}</h2>
          <p className="mb-3">{t('legal.privacy.changes.desc')}</p>
          <p className="mt-3 italic text-sm">{t('legal.privacy.changes.archive')}</p>
          <p className="mt-3 font-semibold text-foreground">
            {t('legal.privacy.changes.effective')}: {t('legal.privacy.changes.date')}
          </p>
        </div>
      </div>
    </Card>
  );
}

// Version 6.0 - April 2026 legal refresh
export function PrivacyPolicyV6({ t }: { t: (key: string) => string }) {
  return <PrivacyPolicyV5 t={t} />;
}
