import React from 'react';
import { Card } from '../ui/card';

interface PrivacyPolicyContentProps {
  version: number;
  t: (key: string) => string;
}

function legalLang(t: (key: string) => string) {
  return t('legal.nav.privacy') === 'Tietosuojaseloste' ? 'fi' : 'en';
}

function tx(t: (key: string) => string, fi: string, en: string) {
  return legalLang(t) === 'fi' ? fi : en;
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

// Version 5.1 - Current privacy policy (May 2026)
export function PrivacyPolicyV51({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '1. Rekisterinpitäjä, soveltamisala ja yhteystiedot', '1. Controller, Scope, and Contact Information')}</h2>
          <p className="mb-3">{tx(t, 'Tässä tietosuojaselosteessa kerrotaan, miten Mitra Auto Oy käsittelee henkilötietoja verkkosivustolla, ajanvarauksessa, korjaamo- ja rengaspalveluissa, Rescue 24/7 -palvelussa, verkkokaupassa, maksamisessa, asiakaspalvelussa, CMS-hallinnassa, Account & Customer -järjestelmässä, asiakas-PWA:ssa, asiakastileissä, asiakashyödyissä, muistutuksissa ja digitaalisessa huoltokirjassa.', 'This Privacy Policy explains how Mitra Auto Oy processes personal data on the website, booking service, workshop and tire services, Rescue 24/7, webshop, payments, customer support, CMS administration, Account & Customer system, customer PWA, customer accounts, customer benefits, reminders, and digital service book.')}</p>
          <p className="mb-3">{tx(t, 'Seloste koskee kuluttaja-asiakkaita, yritys- ja fleet-asiakkaiden yhteyshenkilöitä, asiakastilin käyttäjiä, verkkokaupan käyttäjiä, hätäpalvelun käyttäjiä, työnhakijoita silloin kun he ovat yhteydessä palvelun kautta sekä muita henkilöitä, joiden tietoja käsitellään Mitra Auton palveluissa.', 'This policy applies to consumer customers, contacts of business and fleet customers, customer account users, webshop users, emergency service users, job applicants where they contact us through the service, and other persons whose data is processed in Mitra Auto services.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong className="text-foreground">{tx(t, 'Yritys', 'Company')}:</strong> Mitra Auto Oy</li>
            <li><strong>{tx(t, 'Y-tunnus', 'Business ID')}:</strong> 3408833-8</li>
            <li><strong>{tx(t, 'Osoite', 'Address')}:</strong> Hankasuontie 5, 00390 Helsinki, Finland</li>
            <li><strong>{tx(t, 'Sähköposti', 'Email')}:</strong> <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">contact@mitra-auto.fi</a></li>
            <li><strong>{tx(t, 'Puhelin', 'Phone')}:</strong> <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '2. Palvelut ja järjestelmät, joita seloste koskee', '2. Services and Systems Covered')}</h2>
          <p className="mb-3">{tx(t, 'Mitra Auto käyttää digitaalisia järjestelmiä palveluiden vastaanottamiseen, toteuttamiseen, seuraamiseen ja asiakastietojen hallintaan. Account & Customer on henkilökunnan hallintajärjestelmän osa, jolla ylläpidetään asiakas-, ajoneuvo-, rekisteritunnus-, varaus-, tilaus-, kuitti-, hätäpalvelu-, huoltohistoria-, muistutus- ja asiakashyötytietoja.', 'Mitra Auto uses digital systems to receive, provide, track, and manage services and customer data. Account & Customer is part of the staff administration system used to maintain customer, vehicle, license plate, booking, order, receipt, emergency service, service history, reminder, and customer benefit data.')}</p>
          <p className="mb-3">{tx(t, 'Asiakas-PWA on asiakkaalle tarkoitettu näkymä, jossa asiakas voi nähdä omia ajoneuvojaan, tulevia aikoja, mahdollisia palvelupäiviä, nouto- ja palautustietoja, digitaalisen huoltokirjan, muistutuksia, asiakashyötyjä ja tiliin liittyviä yhteystietoja.', 'The customer PWA is the customer-facing view where a customer may see vehicles, upcoming appointments, possible service dates, pickup and handover details, digital service book, reminders, customer benefits, and contact details connected to the account.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tx(t, 'Verkkosivusto ja yhteydenottolomakkeet.', 'Website and contact forms.')}</li>
            <li>{tx(t, 'Ajanvaraus, palvelun vastaanotto, työmääräykset, nouto ja palautus.', 'Booking, service intake, work orders, pickup, and handover.')}</li>
            <li>{tx(t, 'Verkkokauppa, tilaukset, maksut, laskut ja kuitit.', 'Webshop, orders, payments, invoices, and receipts.')}</li>
            <li>{tx(t, 'Korjaamo-, rengas-, pesu-, katsastus-, varaosa- ja Rescue 24/7 -palvelut.', 'Workshop, tire, cleaning, inspection, parts, and Rescue 24/7 services.')}</li>
            <li>{tx(t, 'CMS, Account & Customer, asiakas-PWA, asiakastili, digitaalinen huoltokirja, asiakashyödyt ja muistutusjärjestelmä.', 'CMS, Account & Customer, customer PWA, customer account, digital service book, customer benefits, and reminder system.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '3. Kerättävät henkilötiedot', '3. Personal Data We Collect')}</h2>
          <p className="mb-3">{tx(t, 'Keräämme tietoja suoraan asiakkaalta, asiakkaan käyttämistä palveluista, Mitra Auton henkilökunnan palvelumerkinnöistä, maksunvälittäjiltä, kuljetus- ja palvelukumppaneilta sekä teknisistä järjestelmistä. Keräämme vain tietoja, joita tarvitsemme määriteltyihin tarkoituksiin.', 'We collect data directly from the customer, from services used by the customer, from service entries made by Mitra Auto staff, from payment providers, from transport and service partners, and from technical systems. We collect only data needed for defined purposes.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tx(t, 'Tunnistus- ja yhteystiedot: nimi, sähköposti, puhelinnumero, osoite, kieli ja asiakastunnisteet.', 'Identification and contact details: name, email, phone number, address, language, and customer identifiers.')}</li>
            <li>{tx(t, 'Tilitiedot: asiakastilin tunniste, kirjautumistiedot, rooli, käyttöoikeus, tilin tila, suostumukset ja ilmoitusasetukset.', 'Account data: customer account identifier, login data, role, access rights, account status, consents, and notification settings.')}</li>
            <li>{tx(t, 'Ajoneuvotiedot: rekisteritunnus, ajoneuvon nimi, merkki, malli, VIN, rengas- ja vannetiedot, säilytystiedot sekä kilometrimäärät silloin kun niitä tarvitaan palveluun tai muistutuksiin.', 'Vehicle data: license plate, vehicle name, make, model, VIN, tire and rim data, storage data, and mileage where needed for services or reminders.')}</li>
            <li>{tx(t, 'Varaus- ja aikataulutiedot: ajanvaraukset, palvelutyyppi, nouto- ja palautusajat, muutokset ja peruutukset.', 'Booking and scheduling data: appointments, service type, pickup and handover times, changes, and cancellations.')}</li>
            <li>{tx(t, 'Huoltohistoria ja digitaalinen huoltokirja: tehdyt työt, vikadiagnoosit, korjaukset, varaosat, öljynvaihdot, rengastyöt, pesut, katsastukseen liittyvät tiedot, suositukset, mittarilukemat ja henkilökunnan merkinnät.', 'Service history and digital service book: completed work, diagnostics, repairs, parts, oil changes, tire work, cleaning, inspection-related data, recommendations, mileage readings, and staff notes.')}</li>
            <li>{tx(t, 'Tilaus-, maksu-, lasku- ja kuittitiedot, mukaan lukien Paytrailin kautta käsiteltävät maksutiedot.', 'Order, payment, invoice, and receipt data, including payment data processed through Paytrail.')}</li>
            <li>{tx(t, 'Rescue 24/7 -tiedot: nimi, puhelin, sijainti, rekisteritunnus, hätäpalvelupyynnön tila ja tapahtumaloki.', 'Rescue 24/7 data: name, phone, location, license plate, emergency service request status, and event log.')}</li>
            <li>{tx(t, 'Asiakashyötytiedot: pisteet, alennukset, etutaso, kampanjat, lunastukset ja etuihin liittyvät säännöt.', 'Customer benefit data: points, discounts, benefit level, campaigns, redemptions, and rules connected to benefits.')}</li>
            <li>{tx(t, 'Viestintä ja suostumukset: sähköposti-, tekstiviesti- ja asiakaspalveluhistoria sekä markkinointi- ja yhteydenottosuostumukset.', 'Communications and consents: email, SMS, and customer support history, plus marketing and contact consents.')}</li>
            <li>{tx(t, 'Tekniset ja turvallisuustiedot: IP-osoite, selain, laite, evästeet, istunto, lokit, virhetilanteet, auditointimerkinnät ja tietoturvan kannalta tarpeelliset tiedot.', 'Technical and security data: IP address, browser, device, cookies, session, logs, errors, audit entries, and information needed for security.')}</li>
          </ul>
          <p className="mt-4 italic">{tx(t, 'GPS-sijaintia kerätään vain hätäpalvelun tai asiakkaan nimenomaisesti pyytämän sijaintitoiminnon yhteydessä.', 'GPS location is collected only for emergency service or a location feature expressly requested by the customer.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '4. Ajoneuvot, rekisteritunnukset ja asiakkuuden yhdistäminen', '4. Vehicles, License Plates, and Customer Mapping')}</h2>
          <p className="mb-3">{tx(t, 'Rekisteritunnus voi olla henkilötieto, kun se voidaan yhdistää tunnistettavaan henkilöön, yrityksen yhteyshenkilöön, asiakastiliin tai palveluhistoriaan. Siksi Mitra Auto käsittelee rekisteritunnuksia ja ajoneuvolinkityksiä GDPR:n periaatteiden mukaisesti.', 'A license plate may be personal data when it can be connected to an identifiable person, business contact, customer account, or service history. Mitra Auto therefore processes license plates and vehicle mappings according to GDPR principles.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tx(t, 'Yksityisasiakkaalla voi olla yksi tai useampi ajoneuvo asiakastilillä.', 'A private customer may have one or several vehicles connected to the customer account.')}</li>
            <li>{tx(t, 'Yritys- ja fleet-asiakkaalla voi olla useita ajoneuvoja ja rekisteritunnuksia samassa asiakasryhmässä.', 'A business or fleet customer may have several vehicles and license plates under the same customer group.')}</li>
            <li>{tx(t, 'Varaukset, tilaukset, hätäpalvelupyynnöt, kuitit, noutotiedot ja huoltohistoria voidaan yhdistää asiakasprofiiliin sähköpostin, puhelinnumeron, asiakastunnisteen tai rekisteritunnuksen perusteella.', 'Bookings, orders, emergency requests, receipts, pickup details, and service history may be linked to a customer profile using email, phone number, customer identifier, or license plate.')}</li>
            <li>{tx(t, 'Jos rekisteritunnus tai muu tunniste antaa epävarman tai ristiriitaisen osuman, linkitys käsitellään henkilökunnan tarkastuksessa ennen kuin tieto näytetään asiakkaalle.', 'If a license plate or other identifier gives an uncertain or conflicting match, the mapping is reviewed by staff before the data is shown to a customer.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '5. Käsittelyn oikeusperusteet', '5. Legal Bases for Processing')}</h2>
          <p className="mb-3">{tx(t, 'Käsittelemme henkilötietoja GDPR:n 6 artiklan mukaisilla perusteilla. Sama tietoryhmä voi olla tarpeen useammalla perusteella eri tilanteissa.', 'We process personal data under GDPR Article 6. The same category of data may be needed under different legal bases in different situations.')}</p>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>{tx(t, 'Sopimuksen täytäntöönpano', 'Contract performance')}:</strong> {tx(t, 'ajanvaraukset, huollot, korjaukset, rengaspalvelut, tilaukset, maksut, nouto, asiakastili ja digitaalinen huoltokirja.', 'bookings, maintenance, repairs, tire services, orders, payments, pickup, customer account, and digital service book.')}</li>
            <li><strong>{tx(t, 'Lakisääteinen velvoite', 'Legal obligation')}:</strong> {tx(t, 'kirjanpito, verotus, kuluttajansuoja, takuu- ja vastuuasiat, reklamaatiot sekä viranomaispyynnöt.', 'accounting, taxation, consumer protection, warranty and liability matters, complaints, and authority requests.')}</li>
            <li><strong>{tx(t, 'Oikeutettu etu', 'Legitimate interest')}:</strong> {tx(t, 'asiakassuhteen hallinta, palvelun turvallinen tuottaminen, tietojen eheys, väärinkäytösten estäminen, rekisteritunnuslinkitysten tarkistaminen, sisäinen auditointi ja palvelun kehittäminen.', 'customer relationship management, safe service delivery, data integrity, abuse prevention, review of license-plate mappings, internal auditing, and service development.')}</li>
            <li><strong>{tx(t, 'Suostumus', 'Consent')}:</strong> {tx(t, 'markkinointi, vapaaehtoiset etuviestit, analytiikkaevästeet, vapaaehtoinen sijaintitoiminto ja muut tilanteet, joissa laki edellyttää suostumusta.', 'marketing, optional benefit messages, analytics cookies, optional location functionality, and other situations where consent is required by law.')}</li>
          </ul>
          <p className="mt-4 italic text-sm">{tx(t, 'Kun käsittely perustuu oikeutettuun etuun, arvioimme käsittelyn tarpeellisuuden, vaikutuksen asiakkaaseen ja asiakkaan kohtuulliset odotukset. Asiakas voi vastustaa tällaista käsittelyä GDPR:n mukaisesti.', 'Where processing is based on legitimate interest, we assess necessity, the effect on the customer, and reasonable expectations. The customer may object to such processing under GDPR.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '6. Tietojen käyttötarkoitukset', '6. Purposes of Processing')}</h2>
          <p className="mb-3">{tx(t, 'Käytämme henkilötietoja seuraaviin tarkoituksiin:', 'We use personal data for the following purposes:')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tx(t, 'palveluiden, ajanvarausten, tilausten, maksujen, laskujen ja kuittien toteuttamiseen;', 'to provide services, bookings, orders, payments, invoices, and receipts;')}</li>
            <li>{tx(t, 'asiakas-PWA:n, asiakastilin, ajoneuvolistan, digitaalisen huoltokirjan ja asiakashyötyjen näyttämiseen;', 'to display the customer PWA, customer account, vehicle list, digital service book, and customer benefits;')}</li>
            <li>{tx(t, 'rekisteritunnuksen, sähköpostin, puhelinnumeron tai asiakastunnisteen avulla tapahtuvaan asiakastietojen yhdistämiseen;', 'to match customer data using license plate, email, phone number, or customer identifier;')}</li>
            <li>{tx(t, 'seuraavan ajan, mahdollisen huoltopäivän, noudon, palautuksen ja työn etenemisen näyttämiseen;', 'to show the next appointment, possible service date, pickup, handover, and work progress;')}</li>
            <li>{tx(t, 'huoltomuistutusten, noutoilmoitusten, maksuilmoitusten, turvallisuusviestien ja asiakaspalveluviestien lähettämiseen;', 'to send service reminders, pickup notices, payment notices, security messages, and customer support messages;')}</li>
            <li>{tx(t, 'asiakashyötyjen, pisteiden, alennusten, etujen ja kampanjoiden hallintaan;', 'to manage customer benefits, points, discounts, offers, and campaigns;')}</li>
            <li>{tx(t, 'reklamaatioiden, korjauspyyntöjen, takuiden, vastuuasioiden ja viranomaisasioiden käsittelyyn;', 'to handle complaints, correction requests, warranties, liability matters, and authority matters;')}</li>
            <li>{tx(t, 'tietoturvaan, käyttöoikeuksien hallintaan, väärinkäytösten estämiseen, lokitukseen ja auditointiin;', 'for security, access control, abuse prevention, logging, and auditing;')}</li>
            <li>{tx(t, 'palvelun laadun, varaston, resurssien, aikataulujen ja asiakaskokemuksen kehittämiseen.', 'to improve service quality, inventory, resources, schedules, and customer experience.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '7. Asiakastili, PWA ja digitaalinen huoltokirja', '7. Customer Account, PWA, and Digital Service Book')}</h2>
          <p className="mb-3">{tx(t, 'Asiakastili ja PWA näyttävät tietoja, jotka Mitra Auto on yhdistänyt asiakkaaseen, asiakasryhmään tai ajoneuvoon. Näkyvät tiedot voivat sisältää tulevat ajat, palvelun vastaanoton, noudon ja palautuksen, mahdollisen seuraavan huoltopäivän, palveluhistorian, huoltosuositukset ja asiakashyödyt.', 'The customer account and PWA show data that Mitra Auto has linked to the customer, customer group, or vehicle. Visible data may include upcoming appointments, service intake, pickup and handover, possible next service date, service history, service recommendations, and customer benefits.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tx(t, 'Digitaalinen huoltokirja voi sisältää huolto- ja korjaustyöt, vaihdetut osat, rengastyöt, pesu- ja puhdistustyöt, tarkastusmerkinnät, mittarilukemat ja suositukset.', 'The digital service book may include maintenance and repair work, replaced parts, tire work, cleaning work, inspection entries, mileage readings, and recommendations.')}</li>
            <li>{tx(t, 'Seuraava mahdollinen huoltopäivä tai muistutus voidaan muodostaa huoltohistorian, mittarilukeman, ajoneuvon tietojen, aikaisempien töiden tai henkilökunnan arvion perusteella.', 'The next possible service date or reminder may be created from service history, mileage, vehicle data, previous work, or staff assessment.')}</li>
            <li>{tx(t, 'Asiakashyötyjen tiedot voivat sisältää pisteitä, alennuksia, kampanjoita, etutasoja ja käyttöehtoja.', 'Customer benefit data may include points, discounts, campaigns, benefit levels, and conditions of use.')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{tx(t, 'Asiakastilin tiedot eivät korvaa virallisia kuitteja, laskuja, takuuehtoja tai viranomaisrekistereitä.', 'Customer account data does not replace official receipts, invoices, warranty terms, or authority registers.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '8. Automaattinen linkitys, ehdotukset ja ihmisen tarkastus', '8. Automated Matching, Suggestions, and Human Review')}</h2>
          <p className="mb-3">{tx(t, 'Mitra Auto voi käyttää sääntöperusteista automaattista linkitystä, jotta varaukset, tilaukset, kuitit, hätäpalvelupyynnöt ja huoltohistoria voidaan liittää oikeaan asiakasprofiiliin. Linkitys voi perustua esimerkiksi yksilölliseen sähköpostiin, yksilölliseen rekisteritunnukseen, asiakastunnisteeseen tai vahvistettuun yritys- tai fleet-listaan.', 'Mitra Auto may use rule-based automated matching so bookings, orders, receipts, emergency requests, and service history can be linked to the correct customer profile. Matching may be based on a unique email, unique license plate, customer identifier, or confirmed business or fleet list.')}</p>
          <p className="mb-3">{tx(t, 'Epävarmat osumat, ristiriidat, päällekkäiset rekisteritunnukset ja usean asiakkaan väliset linkitykset ohjataan henkilökunnan tarkistettavaksi. Henkilökunta voi hyväksyä, hylätä, korjata, irrottaa, yhdistää tai anonymisoida linkityksen.', 'Uncertain matches, conflicts, duplicate license plates, and mappings between several customers are directed to staff review. Staff may approve, reject, correct, unlink, merge, or anonymize the mapping.')}</p>
          <p className="italic text-sm">{tx(t, 'Tämä linkitys ei ole GDPR:n 22 artiklan mukaista automaattista päätöksentekoa, jolla olisi asiakkaalle oikeusvaikutuksia tai vastaavia merkittäviä vaikutuksia.', 'This matching is not automated decision-making under GDPR Article 22 that would produce legal effects or similarly significant effects for the customer.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '9. Tietojen luovutukset ja käsittelijät', '9. Sharing and Processors')}</h2>
          <p className="mb-3">{tx(t, 'Emme myy henkilötietoja. Luovutamme tai annamme henkilötietoja käsiteltäväksi vain silloin, kun se on tarpeen palvelun, lain, turvallisuuden tai asiakkaan pyynnön toteuttamiseksi.', 'We do not sell personal data. We disclose or make personal data available for processing only where needed for the service, law, security, or a customer request.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tx(t, 'maksunvälittäjät, pankit, kirjanpito ja laskutuspalvelut;', 'payment providers, banks, accounting, and invoicing services;')}</li>
            <li>{tx(t, 'IT-, hosting-, tietokanta-, sähköposti-, tekstiviesti-, analytiikka- ja turvallisuuspalveluntarjoajat;', 'IT, hosting, database, email, SMS, analytics, and security service providers;')}</li>
            <li>{tx(t, 'varaosa-, rengas-, hinaus-, kuljetus-, tarkastus- ja muut palvelukumppanit siinä laajuudessa kuin palvelu edellyttää;', 'parts, tire, towing, transport, inspection, and other service partners to the extent required by the service;')}</li>
            <li>{tx(t, 'viranomaiset, vakuutusyhtiöt, kuluttajaneuvonta, perintäpalvelut tai tuomioistuimet, jos laki, oikeusvaade tai sopimus sitä edellyttää;', 'authorities, insurance companies, consumer advice, debt collection services, or courts where required by law, legal claim, or contract;')}</li>
            <li>{tx(t, 'yritys- ja fleet-asiakkaan nimetyt yhteyshenkilöt, kun käsittely koskee kyseisen asiakasryhmän ajoneuvoja tai palveluita.', 'named contacts of a business or fleet customer where processing concerns that customer group vehicles or services.')}</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">{tx(t, 'Käytämme henkilötietojen käsittelijöiden kanssa sopimuksia, jotka rajoittavat käsittelyn Mitra Auton ohjeisiin ja edellyttävät asianmukaista tietoturvaa.', 'We use agreements with personal data processors that limit processing to Mitra Auto instructions and require appropriate security.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '10. Kansainväliset siirrot', '10. International Transfers')}</h2>
          <p className="mb-3">{tx(t, 'Pyrimme käyttämään EU- tai ETA-alueella sijaitsevia palveluntarjoajia. Jos henkilötietoja siirretään EU:n tai ETA:n ulkopuolelle, käytämme GDPR:n mukaisia suojatoimia, kuten Euroopan komission mallisopimuslausekkeita, siirtovaikutusten arviointia ja palveluntarjoajan teknisiä sekä organisatorisia suojauksia.', 'We aim to use service providers located in the EU or EEA. If personal data is transferred outside the EU or EEA, we use GDPR safeguards such as European Commission Standard Contractual Clauses, transfer impact assessment, and technical and organizational protections from the provider.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '11. Säilytysajat', '11. Retention')}</h2>
          <p className="mb-3">{tx(t, 'Säilytämme henkilötietoja vain niin kauan kuin se on tarpeen käsittelyn tarkoituksen, sopimuksen, lain, vastuuajan, takuun, reklamaation, kirjanpidon tai oikeusvaateen vuoksi. Kun tietoja ei enää tarvita, poistamme tai anonymisoimme ne kohtuullisessa ajassa.', 'We retain personal data only for as long as needed for the processing purpose, contract, law, liability period, warranty, complaint, accounting, or legal claim. When data is no longer needed, we delete or anonymize it within a reasonable time.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tx(t, 'Kirjanpito-, lasku- ja kuittitiedot säilytetään pääsääntöisesti kirjanpitolain edellyttämän ajan.', 'Accounting, invoice, and receipt data is generally retained for the period required by accounting law.')}</li>
            <li>{tx(t, 'Huolto-, korjaus-, takuu- ja reklamaatiotiedot säilytetään niin kauan kuin niitä voidaan tarvita palveluhistorian, takuun, vastuun tai oikeusvaateen vuoksi.', 'Service, repair, warranty, and complaint data is retained for as long as it may be needed for service history, warranty, liability, or legal claims.')}</li>
            <li>{tx(t, 'Asiakastilin ja PWA:n tiedot säilytetään asiakassuhteen ajan ja sen jälkeen vain siltä osin kuin laki, sopimus tai oikeutettu etu edellyttää.', 'Customer account and PWA data is retained during the customer relationship and afterward only where required by law, contract, or legitimate interest.')}</li>
            <li>{tx(t, 'Markkinointisuostumukset ja kiellot säilytetään niin kauan kuin tarvitaan suostumuksen tai kiellon todentamiseksi.', 'Marketing consents and opt-outs are retained for as long as needed to prove the consent or opt-out.')}</li>
            <li>{tx(t, 'Tekniset lokit ja auditointitiedot säilytetään rajatun ajan turvallisuuden, virheiden selvittämisen ja väärinkäytösten estämisen vuoksi.', 'Technical logs and audit data are retained for a limited time for security, error investigation, and abuse prevention.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '12. Tietoturva ja käyttöoikeudet', '12. Security and Access Control')}</h2>
          <p className="mb-3">{tx(t, 'Suojaamme henkilötietoja teknisillä ja organisatorisilla toimenpiteillä. CMS- ja Account & Customer -käyttöoikeudet annetaan vain henkilökunnalle, joka tarvitsee tietoja työtehtäviensä vuoksi.', 'We protect personal data with technical and organizational measures. CMS and Account & Customer access is granted only to staff who need the data for work duties.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{tx(t, 'Super Admin voi hallita CMS:n käyttöoikeuksia, rooleja, näkyvyyttä ja henkilökunnan tilejä.', 'Super Admin may manage CMS access rights, roles, visibility, and staff accounts.')}</li>
            <li>{tx(t, 'Admin- ja supervisor-käyttöoikeudet rajataan tehtävän mukaiseen asiakas-, varaus-, tilaus- ja palvelutietoon.', 'Admin and supervisor access is limited to customer, booking, order, and service data needed for the role.')}</li>
            <li>{tx(t, 'Käytämme kirjautumista, roolipohjaisia oikeuksia, istunnonhallintaa, lokitusta, auditointia ja tarvittaessa pääsyn poistamista.', 'We use login controls, role-based permissions, session management, logging, auditing, and access removal where needed.')}</li>
            <li>{tx(t, 'Tietoturvaloukkaukset käsitellään GDPR:n mukaisesti, ja ilmoitamme valvontaviranomaiselle ja rekisteröidyille silloin kun laki edellyttää.', 'Personal data breaches are handled under GDPR, and we notify the supervisory authority and data subjects where required by law.')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '13. Viestintä, muistutukset ja markkinointi', '13. Communications, Reminders, and Marketing')}</h2>
          <p className="mb-3">{tx(t, 'Lähetämme palveluun liittyviä viestejä, kuten varausvahvistuksia, aikataulumuutoksia, noutoilmoituksia, maksulinkkejä, turvallisuusviestejä, huoltoon liittyviä kysymyksiä ja asiakaspalveluviestejä. Nämä viestit ovat tarpeellisia palvelun toteuttamiseksi eivätkä yleensä ole markkinointia.', 'We send service-related messages such as booking confirmations, schedule changes, pickup notices, payment links, security messages, service questions, and customer support messages. These messages are necessary to provide the service and are generally not marketing.')}</p>
          <p className="mb-3">{tx(t, 'Huoltomuistutuksia voidaan lähettää sopimuksen, oikeutetun edun tai suostumuksen perusteella viestin sisällöstä riippuen. Markkinointi, etuviestit ja vapaaehtoiset kampanjaviestit lähetetään vain lainmukaisella perusteella, ja niistä voi kieltäytyä.', 'Service reminders may be sent based on contract, legitimate interest, or consent depending on the message content. Marketing, benefit messages, and optional campaign messages are sent only on a lawful basis, and the customer may opt out.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '14. Rekisteröidyn oikeudet', '14. GDPR Rights')}</h2>
          <p className="mb-3">{tx(t, 'Asiakkaalla ja muulla rekisteröidyllä on GDPR:n mukaiset oikeudet. Oikeudet koskevat myös ajoneuvo- ja rekisteritunnuslinkityksiä silloin, kun tiedot voidaan yhdistää tunnistettavaan henkilöön.', 'Customers and other data subjects have rights under GDPR. These rights also apply to vehicle and license-plate mappings where the data can be connected to an identifiable person.')}</p>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>{tx(t, 'Tarkastusoikeus', 'Access')}:</strong> {tx(t, 'oikeus saada tieto siitä, käsittelemmekö henkilötietoja, ja saada jäljennös tiedoista.', 'the right to know whether we process personal data and to receive a copy of the data.')}</li>
            <li><strong>{tx(t, 'Oikaisu', 'Rectification')}:</strong> {tx(t, 'oikeus korjata virheelliset tai puutteelliset tiedot, mukaan lukien ajoneuvo- ja rekisteritunnuslinkitykset.', 'the right to correct inaccurate or incomplete data, including vehicle and license-plate mappings.')}</li>
            <li><strong>{tx(t, 'Poisto ja anonymisointi', 'Erasure and anonymization')}:</strong> {tx(t, 'oikeus pyytää tietojen poistamista, kun säilytykselle ei ole lakisääteistä, sopimukseen perustuvaa tai muuta lainmukaista perustetta.', 'the right to request deletion where there is no legal, contractual, or other lawful ground for retention.')}</li>
            <li><strong>{tx(t, 'Käsittelyn rajoittaminen', 'Restriction')}:</strong> {tx(t, 'oikeus pyytää käsittelyn rajoittamista esimerkiksi tietojen oikeellisuuden selvittämisen ajaksi.', 'the right to request restriction, for example while data accuracy is reviewed.')}</li>
            <li><strong>{tx(t, 'Tietojen siirrettävyys', 'Portability')}:</strong> {tx(t, 'oikeus saada itse toimitetut tiedot jäsennellyssä ja koneellisesti luettavassa muodossa, kun edellytykset täyttyvät.', 'the right to receive data provided by the customer in a structured and machine-readable format where the conditions are met.')}</li>
            <li><strong>{tx(t, 'Vastustaminen', 'Objection')}:</strong> {tx(t, 'oikeus vastustaa oikeutettuun etuun perustuvaa käsittelyä ja suoramarkkinointia.', 'the right to object to processing based on legitimate interest and to direct marketing.')}</li>
            <li><strong>{tx(t, 'Suostumuksen peruuttaminen', 'Withdraw consent')}:</strong> {tx(t, 'oikeus peruuttaa suostumus milloin tahansa ilman vaikutusta ennen peruuttamista tehtyyn käsittelyyn.', 'the right to withdraw consent at any time without affecting processing carried out before withdrawal.')}</li>
            <li><strong>{tx(t, 'Valitus', 'Complaint')}:</strong> {tx(t, 'oikeus tehdä valitus Suomen tietosuojavaltuutetulle.', 'the right to lodge a complaint with the Finnish Data Protection Ombudsman.')}</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">{tx(t, 'Pyynnöt voi lähettää osoitteeseen contact@mitra-auto.fi. Voimme pyytää lisätietoja henkilöllisyyden varmistamiseksi ja oikean asiakas- tai ajoneuvolinkityksen löytämiseksi.', 'Requests may be sent to contact@mitra-auto.fi. We may ask for additional information to verify identity and find the correct customer or vehicle mapping.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '15. Evästeet ja tekninen seuranta', '15. Cookies and Technical Tracking')}</h2>
          <p className="mb-3">{tx(t, 'Käytämme välttämättömiä evästeitä ja vastaavia teknisiä tietoja sivuston, kirjautumisen, ostoskorin, istunnon, turvallisuuden ja PWA-toimintojen toteuttamiseen. Voimme käyttää analytiikka- tai markkinointievästeitä vain, jos sille on lainmukainen peruste ja tarvittaessa suostumus.', 'We use essential cookies and similar technical data to provide the website, login, shopping cart, session, security, and PWA functionality. We may use analytics or marketing cookies only where there is a lawful basis and consent where required.')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{tx(t, 'Välttämättömät evästeet', 'Essential cookies')}:</strong> {tx(t, 'tarvitaan palvelun tekniseen toimintaan ja turvallisuuteen.', 'needed for technical operation and security of the service.')}</li>
            <li><strong>{tx(t, 'Asetusevästeet', 'Preference cookies')}:</strong> {tx(t, 'muistavat esimerkiksi kielen tai käyttöliittymän valinnat.', 'remember choices such as language or interface settings.')}</li>
            <li><strong>{tx(t, 'Analytiikka ja markkinointi', 'Analytics and marketing')}:</strong> {tx(t, 'käytetään vain lainmukaisesti ja tarvittaessa suostumuksella.', 'used only lawfully and with consent where required.')}</li>
          </ul>
          <p className="mt-3">{tx(t, 'Selaimen asetuksilla voi rajoittaa evästeitä, mutta välttämättömien evästeiden estäminen voi estää osan palveluista toimimasta.', 'Browser settings may limit cookies, but blocking essential cookies may prevent some services from working.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '16. Lapset', '16. Children')}</h2>
          <p className="mb-3">{tx(t, 'Mitra Auton palvelut on tarkoitettu ensisijaisesti ajoneuvon omistajille, haltijoille, kuljettajille, yritysasiakkaille ja täysi-ikäisille asiakkaille. Emme tarkoituksellisesti kerää lasten henkilötietoja ilman huoltajan tai muun laillisen edustajan osallistumista.', 'Mitra Auto services are intended mainly for vehicle owners, holders, drivers, business customers, and adults. We do not knowingly collect personal data of children without involvement of a guardian or other legal representative.')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{tx(t, '17. Muutokset ja voimassaolo', '17. Changes and Effective Version')}</h2>
          <p className="mb-3">{tx(t, 'Voimme päivittää tätä tietosuojaselostetta, kun palvelut, järjestelmät, lainsäädäntö tai käsittelytavat muuttuvat. Julkaisemme ajantasaisen version verkkosivustolla ja säilytämme aiemmat versiot historiatietona.', 'We may update this Privacy Policy when services, systems, law, or processing practices change. We publish the current version on the website and keep previous versions as version history.')}</p>
          <p className="mt-3 font-semibold text-foreground">{tx(t, 'Nykyinen versio: Tietosuojaseloste v5.1', 'Current version: Privacy Policy v5.1')}</p>
          <p className="font-semibold text-foreground">{tx(t, 'Voimaantulopäivä: 1.5.2026', 'Effective date: 1 May 2026')}</p>
        </div>
      </div>
    </Card>
  );
}
