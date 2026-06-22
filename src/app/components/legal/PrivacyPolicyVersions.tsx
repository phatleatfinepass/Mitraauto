import React from 'react';
import { Card } from '../ui/card';
import { legalContent, type LegalContentKey } from './legalContent';

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
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0001')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0002')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong className="text-foreground">{legalContent(t, 'privacyArchive.0003')}</strong>{legalContent(t, 'privacyArchive.0004')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0005')}</strong> 3408833-8</li>
            <li><strong>{legalContent(t, 'privacyArchive.0006')}</strong> <a href="mailto:info@mitraauto.fi" className="text-[#FF6B35] hover:underline">{legalContent(t, 'privacyArchive.0007')}</a></li>
          </ul>
        </div>

        {/* What Data We Collect */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0008')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0009')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0010')}</li>
            <li>{legalContent(t, 'privacyArchive.0011')}</li>
            <li>{legalContent(t, 'privacyArchive.0012')}</li>
            <li>{legalContent(t, 'privacyArchive.0013')}</li>
          </ul>
        </div>

        {/* How We Use Data */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0014')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0015')}</li>
            <li>{legalContent(t, 'privacyArchive.0016')}</li>
            <li>{legalContent(t, 'privacyArchive.0017')}</li>
            <li>{legalContent(t, 'privacyArchive.0018')}</li>
          </ul>
        </div>

        {/* Data Security */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0019')}</h2>
          <p>{legalContent(t, 'privacyArchive.0020')}</p>
        </div>

        {/* Your Rights */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0021')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0022')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0023')}</li>
            <li>{legalContent(t, 'privacyArchive.0024')}</li>
            <li>{legalContent(t, 'privacyArchive.0025')}</li>
            <li>{legalContent(t, 'privacyArchive.0026')}</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0027')}</h2>
          <p>{legalContent(t, 'privacyArchive.0028')}<a href="mailto:info@mitraauto.fi" className="text-[#FF6B35] hover:underline">{legalContent(t, 'privacyArchive.0029')}</a></p>
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
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0030')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0031')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong className="text-foreground">{legalContent(t, 'privacyArchive.0032')}</strong>{legalContent(t, 'privacyArchive.0033')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0034')}</strong> 3408833-8</li>
            <li><strong>{legalContent(t, 'privacyArchive.0035')}</strong>{legalContent(t, 'privacyArchive.0036')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0037')}</strong> <a href="mailto:info@mitraauto.fi" className="text-[#FF6B35] hover:underline">{legalContent(t, 'privacyArchive.0038')}</a></li>
            <li><strong>{legalContent(t, 'privacyArchive.0039')}</strong> <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
          </ul>
        </div>

        {/* Legal Basis - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0040')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0041')}</p>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>{legalContent(t, 'privacyArchive.0042')}</strong>{legalContent(t, 'privacyArchive.0043')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0044')}</strong>{legalContent(t, 'privacyArchive.0045')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0046')}</strong>{legalContent(t, 'privacyArchive.0047')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0048')}</strong>{legalContent(t, 'privacyArchive.0049')}</li>
          </ul>
        </div>

        {/* What Data We Collect - Expanded */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0050')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0051')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0052')}</li>
            <li>{legalContent(t, 'privacyArchive.0053')}</li>
            <li>{legalContent(t, 'privacyArchive.0054')}</li>
            <li>{legalContent(t, 'privacyArchive.0055')}</li>
            <li>{legalContent(t, 'privacyArchive.0056')}</li>
            <li>{legalContent(t, 'privacyArchive.0057')}</li>
          </ul>
        </div>

        {/* Data Retention - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0058')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0059')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0060')}</li>
            <li>{legalContent(t, 'privacyArchive.0061')}</li>
            <li>{legalContent(t, 'privacyArchive.0062')}</li>
          </ul>
        </div>

        {/* Enhanced Rights */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0063')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0064')}</p>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>{legalContent(t, 'privacyArchive.0065')}</strong>{legalContent(t, 'privacyArchive.0066')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0067')}</strong>{legalContent(t, 'privacyArchive.0068')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0069')}</strong>{legalContent(t, 'privacyArchive.0070')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0071')}</strong>{legalContent(t, 'privacyArchive.0072')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0073')}</strong>{legalContent(t, 'privacyArchive.0074')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0075')}</strong>{legalContent(t, 'privacyArchive.0076')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0077')}</strong>{legalContent(t, 'privacyArchive.0078')}</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">{legalContent(t, 'privacyArchive.0079')}</p>
        </div>

        {/* Supervisory Authority - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0080')}</h2>
          <p>{legalContent(t, 'privacyArchive.0081')}</p>
          <p className="mt-2">{legalContent(t, 'privacyArchive.0082')}<a href="https://tietosuoja.fi" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'privacyArchive.0083')}</a></p>
        </div>

        {/* Data Security */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0084')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0085')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0086')}</li>
            <li>{legalContent(t, 'privacyArchive.0087')}</li>
            <li>{legalContent(t, 'privacyArchive.0088')}</li>
            <li>{legalContent(t, 'privacyArchive.0089')}</li>
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
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0090')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0091')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong className="text-foreground">{legalContent(t, 'privacyArchive.0092')}</strong>{legalContent(t, 'privacyArchive.0093')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0094')}</strong> 3408833-8</li>
            <li><strong>{legalContent(t, 'privacyArchive.0095')}</strong>{legalContent(t, 'privacyArchive.0096')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0097')}</strong> <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">{legalContent(t, 'privacyArchive.0098')}</a></li>
            <li><strong>{legalContent(t, 'privacyArchive.0099')}</strong> <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
          </ul>
          <p className="mt-3 text-sm italic">{legalContent(t, 'privacyArchive.0100')}</p>
        </div>

        {/* Legal Basis */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0101')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0102')}</p>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>{legalContent(t, 'privacyArchive.0103')}</strong>{legalContent(t, 'privacyArchive.0104')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0105')}</strong>{legalContent(t, 'privacyArchive.0106')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0107')}</strong>{legalContent(t, 'privacyArchive.0108')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0109')}</strong>{legalContent(t, 'privacyArchive.0110')}</li>
          </ul>
        </div>

        {/* Data Collected */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0111')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0112')}</li>
            <li>{legalContent(t, 'privacyArchive.0113')}</li>
            <li>{legalContent(t, 'privacyArchive.0114')}</li>
            <li>{legalContent(t, 'privacyArchive.0115')}</li>
            <li>{legalContent(t, 'privacyArchive.0116')}</li>
            <li>{legalContent(t, 'privacyArchive.0117')}</li>
            <li>{legalContent(t, 'privacyArchive.0118')}</li>
          </ul>
        </div>

        {/* International Transfers - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0119')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0120')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0121')}</li>
            <li>{legalContent(t, 'privacyArchive.0122')}</li>
            <li>{legalContent(t, 'privacyArchive.0123')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{legalContent(t, 'privacyArchive.0124')}</p>
        </div>

        {/* Third-Party Services - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0125')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0126')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0127')}</li>
            <li>{legalContent(t, 'privacyArchive.0128')}</li>
            <li>{legalContent(t, 'privacyArchive.0129')}</li>
            <li>{legalContent(t, 'privacyArchive.0130')}</li>
          </ul>
          <p className="mt-3 font-semibold text-foreground">{legalContent(t, 'privacyArchive.0131')}</p>
        </div>

        {/* Data Retention */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0132')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0133')}</li>
            <li>{legalContent(t, 'privacyArchive.0134')}</li>
            <li>{legalContent(t, 'privacyArchive.0135')}</li>
            <li>{legalContent(t, 'privacyArchive.0136')}</li>
          </ul>
        </div>

        {/* Your Rights */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0137')}</h2>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>{legalContent(t, 'privacyArchive.0138')}</strong>{legalContent(t, 'privacyArchive.0139')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0140')}</strong>{legalContent(t, 'privacyArchive.0141')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0142')}</strong>{legalContent(t, 'privacyArchive.0143')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0144')}</strong>{legalContent(t, 'privacyArchive.0145')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0146')}</strong>{legalContent(t, 'privacyArchive.0147')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0148')}</strong>{legalContent(t, 'privacyArchive.0149')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0150')}</strong>{legalContent(t, 'privacyArchive.0151')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0152')}</strong>{legalContent(t, 'privacyArchive.0153')}</li>
          </ul>
        </div>

        {/* Security */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0154')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0155')}</li>
            <li>{legalContent(t, 'privacyArchive.0156')}</li>
            <li>{legalContent(t, 'privacyArchive.0157')}</li>
            <li>{legalContent(t, 'privacyArchive.0158')}</li>
            <li>{legalContent(t, 'privacyArchive.0159')}</li>
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
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0160')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0161')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong className="text-foreground">{legalContent(t, 'privacyArchive.0162')}</strong>{legalContent(t, 'privacyArchive.0163')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0164')}</strong> 3408833-8</li>
            <li><strong>{legalContent(t, 'privacyArchive.0165')}</strong>{legalContent(t, 'privacyArchive.0166')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0167')}</strong> <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">{legalContent(t, 'privacyArchive.0168')}</a></li>
            <li><strong>{legalContent(t, 'privacyArchive.0169')}</strong> <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
          </ul>
        </div>

        {/* Extended Data Collection */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0170')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0171')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0172')}</li>
            <li>{legalContent(t, 'privacyArchive.0173')}</li>
            <li>{legalContent(t, 'privacyArchive.0174')}</li>
            <li>{legalContent(t, 'privacyArchive.0175')}</li>
            <li>{legalContent(t, 'privacyArchive.0176')}</li>
            <li>{legalContent(t, 'privacyArchive.0177')}</li>
            <li>{legalContent(t, 'privacyArchive.0178')}</li>
            <li>{legalContent(t, 'privacyArchive.0179')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{legalContent(t, 'privacyArchive.0180')}</p>
        </div>

        {/* Legal Basis with Balancing Test */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0181')}</h2>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>{legalContent(t, 'privacyArchive.0182')}</strong>{legalContent(t, 'privacyArchive.0183')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0184')}</strong>{legalContent(t, 'privacyArchive.0185')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0186')}</strong>{legalContent(t, 'privacyArchive.0187')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0188')}</strong>{legalContent(t, 'privacyArchive.0189')}</li>
          </ul>
          <p className="mt-4 italic text-sm">{legalContent(t, 'privacyArchive.0190')}</p>
        </div>

        {/* Enhanced Consumer Rights - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0191')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0192')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{legalContent(t, 'privacyArchive.0193')}</strong>{legalContent(t, 'privacyArchive.0194')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0195')}</strong>{legalContent(t, 'privacyArchive.0196')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0197')}</strong>{legalContent(t, 'privacyArchive.0198')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0199')}</strong>{legalContent(t, 'privacyArchive.0200')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{legalContent(t, 'privacyArchive.0201')}</p>
        </div>

        {/* International Transfers Updated */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0202')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0203')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0204')}</li>
            <li>{legalContent(t, 'privacyArchive.0205')}</li>
            <li>{legalContent(t, 'privacyArchive.0206')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{legalContent(t, 'privacyArchive.0207')}</p>
        </div>

        {/* Cookies - NEW */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0208')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0209')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{legalContent(t, 'privacyArchive.0210')}</strong>{legalContent(t, 'privacyArchive.0211')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0212')}</strong>{legalContent(t, 'privacyArchive.0213')}</li>
            <li><strong>{legalContent(t, 'privacyArchive.0214')}</strong>{legalContent(t, 'privacyArchive.0215')}</li>
          </ul>
          <p className="mt-3">{legalContent(t, 'privacyArchive.0216')}</p>
        </div>

        {/* Data Security Enhanced */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0217')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0218')}</li>
            <li>{legalContent(t, 'privacyArchive.0219')}</li>
            <li>{legalContent(t, 'privacyArchive.0220')}</li>
            <li>{legalContent(t, 'privacyArchive.0221')}</li>
            <li>{legalContent(t, 'privacyArchive.0222')}</li>
            <li>{legalContent(t, 'privacyArchive.0223')}</li>
          </ul>
        </div>

        {/* Your Rights Expanded */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacyArchive.0224')}</h2>
          <p className="mb-3">{legalContent(t, 'privacyArchive.0225')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacyArchive.0226')}</li>
            <li>{legalContent(t, 'privacyArchive.0227')}</li>
            <li>{legalContent(t, 'privacyArchive.0228')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{legalContent(t, 'privacyArchive.0229')}</p>
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
            <li><strong className="text-foreground">{t('legal.privacy.controller.company')}:</strong>{legalContent(t, 'privacyArchive.0230')}</li>
            <li><strong>{t('legal.privacy.controller.businessId')}:</strong> 3408833-8</li>
            <li><strong>{t('legal.privacy.controller.address')}:</strong>{legalContent(t, 'privacyArchive.0231')}</li>
            <li><strong>{t('legal.privacy.controller.email')}:</strong> <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">{legalContent(t, 'privacyArchive.0232')}</a></li>
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

function PrivacyPolicyV5x({
  t,
  currentVersionKey,
  effectiveDateKey,
  releaseNoteKey,
}: {
  t: (key: string) => string;
  currentVersionKey: LegalContentKey;
  effectiveDateKey: LegalContentKey;
  releaseNoteKey?: LegalContentKey;
}) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0001')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0002')}</p>
          <p className="mb-3">{legalContent(t, 'privacy.0003')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong className="text-foreground">{legalContent(t, 'privacy.0004')}:</strong>{legalContent(t, 'privacyArchive.0233')}</li>
            <li><strong>{legalContent(t, 'privacy.0005')}:</strong> 3408833-8</li>
            <li><strong>{legalContent(t, 'privacy.0006')}:</strong>{legalContent(t, 'privacyArchive.0234')}</li>
            <li><strong>{legalContent(t, 'privacy.0007')}:</strong> <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">{legalContent(t, 'privacyArchive.0235')}</a></li>
            <li><strong>{legalContent(t, 'privacy.0008')}:</strong> <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0009')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0010')}</p>
          <p className="mb-3">{legalContent(t, 'privacy.0011')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacy.0012')}</li>
            <li>{legalContent(t, 'privacy.0013')}</li>
            <li>{legalContent(t, 'privacy.0014')}</li>
            <li>{legalContent(t, 'privacy.0015')}</li>
            <li>{legalContent(t, 'privacy.0016')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0017')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0018')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacy.0019')}</li>
            <li>{legalContent(t, 'privacy.0020')}</li>
            <li>{legalContent(t, 'privacy.0021')}</li>
            <li>{legalContent(t, 'privacy.0022')}</li>
            <li>{legalContent(t, 'privacy.0023')}</li>
            <li>{legalContent(t, 'privacy.0024')}</li>
            <li>{legalContent(t, 'privacy.0025')}</li>
            <li>{legalContent(t, 'privacy.0026')}</li>
            <li>{legalContent(t, 'privacy.0027')}</li>
            <li>{legalContent(t, 'privacy.0028')}</li>
          </ul>
          <p className="mt-4 italic">{legalContent(t, 'privacy.0029')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0030')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0031')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacy.0032')}</li>
            <li>{legalContent(t, 'privacy.0033')}</li>
            <li>{legalContent(t, 'privacy.0034')}</li>
            <li>{legalContent(t, 'privacy.0035')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0036')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0037')}</p>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>{legalContent(t, 'privacy.0038')}:</strong> {legalContent(t, 'privacy.0039')}</li>
            <li><strong>{legalContent(t, 'privacy.0040')}:</strong> {legalContent(t, 'privacy.0041')}</li>
            <li><strong>{legalContent(t, 'privacy.0042')}:</strong> {legalContent(t, 'privacy.0043')}</li>
            <li><strong>{legalContent(t, 'privacy.0044')}:</strong> {legalContent(t, 'privacy.0045')}</li>
          </ul>
          <p className="mt-4 italic text-sm">{legalContent(t, 'privacy.0046')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0047')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0048')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacy.0049')}</li>
            <li>{legalContent(t, 'privacy.0050')}</li>
            <li>{legalContent(t, 'privacy.0051')}</li>
            <li>{legalContent(t, 'privacy.0052')}</li>
            <li>{legalContent(t, 'privacy.0053')}</li>
            <li>{legalContent(t, 'privacy.0054')}</li>
            <li>{legalContent(t, 'privacy.0055')}</li>
            <li>{legalContent(t, 'privacy.0056')}</li>
            <li>{legalContent(t, 'privacy.0057')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0058')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0059')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacy.0060')}</li>
            <li>{legalContent(t, 'privacy.0061')}</li>
            <li>{legalContent(t, 'privacy.0062')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{legalContent(t, 'privacy.0063')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0064')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0065')}</p>
          <p className="mb-3">{legalContent(t, 'privacy.0066')}</p>
          <p className="italic text-sm">{legalContent(t, 'privacy.0067')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0068')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0069')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacy.0070')}</li>
            <li>{legalContent(t, 'privacy.0071')}</li>
            <li>{legalContent(t, 'privacy.0072')}</li>
            <li>{legalContent(t, 'privacy.0073')}</li>
            <li>{legalContent(t, 'privacy.0074')}</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">{legalContent(t, 'privacy.0075')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0076')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0077')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0078')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0079')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacy.0080')}</li>
            <li>{legalContent(t, 'privacy.0081')}</li>
            <li>{legalContent(t, 'privacy.0082')}</li>
            <li>{legalContent(t, 'privacy.0083')}</li>
            <li>{legalContent(t, 'privacy.0084')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0085')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0086')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'privacy.0087')}</li>
            <li>{legalContent(t, 'privacy.0088')}</li>
            <li>{legalContent(t, 'privacy.0089')}</li>
            <li>{legalContent(t, 'privacy.0090')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0091')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0092')}</p>
          <p className="mb-3">{legalContent(t, 'privacy.0093')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0094')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0095')}</p>
          <ul className="space-y-3 ml-6 list-disc">
            <li><strong>{legalContent(t, 'privacy.0096')}:</strong> {legalContent(t, 'privacy.0097')}</li>
            <li><strong>{legalContent(t, 'privacy.0098')}:</strong> {legalContent(t, 'privacy.0099')}</li>
            <li><strong>{legalContent(t, 'privacy.0100')}:</strong> {legalContent(t, 'privacy.0101')}</li>
            <li><strong>{legalContent(t, 'privacy.0102')}:</strong> {legalContent(t, 'privacy.0103')}</li>
            <li><strong>{legalContent(t, 'privacy.0104')}:</strong> {legalContent(t, 'privacy.0105')}</li>
            <li><strong>{legalContent(t, 'privacy.0106')}:</strong> {legalContent(t, 'privacy.0107')}</li>
            <li><strong>{legalContent(t, 'privacy.0108')}:</strong> {legalContent(t, 'privacy.0109')}</li>
            <li><strong>{legalContent(t, 'privacy.0110')}:</strong> {legalContent(t, 'privacy.0111')}</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">{legalContent(t, 'privacy.0112')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0113')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0114')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{legalContent(t, 'privacy.0115')}:</strong> {legalContent(t, 'privacy.0116')}</li>
            <li><strong>{legalContent(t, 'privacy.0117')}:</strong> {legalContent(t, 'privacy.0118')}</li>
            <li><strong>{legalContent(t, 'privacy.0119')}:</strong> {legalContent(t, 'privacy.0120')}</li>
          </ul>
          <p className="mt-3">{legalContent(t, 'privacy.0121')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0122')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0123')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'privacy.0124')}</h2>
          <p className="mb-3">{legalContent(t, 'privacy.0125')}</p>
          {releaseNoteKey ? (
            <p className="mb-3 rounded-md border border-[#FF6B35]/20 bg-[#FF6B35]/5 px-4 py-3 text-sm text-foreground">
              {legalContent(t, releaseNoteKey)}
            </p>
          ) : null}
          <p className="mt-3 font-semibold text-foreground">{legalContent(t, currentVersionKey)}</p>
          <p className="font-semibold text-foreground">{legalContent(t, effectiveDateKey)}</p>
        </div>
      </div>
    </Card>
  );
}

// Version 5.1 - Account & Customer privacy policy (May 2026)
export function PrivacyPolicyV51({ t }: { t: (key: string) => string }) {
  return (
    <PrivacyPolicyV5x
      t={t}
      currentVersionKey="privacy.0126"
      effectiveDateKey="privacy.0127"
    />
  );
}

// Version 6.0 - Microsoft Clarity and analytics consent release (June 2026)
export function PrivacyPolicyV60({ t }: { t: (key: string) => string }) {
  return (
    <PrivacyPolicyV5x
      t={t}
      currentVersionKey="privacy.0128"
      effectiveDateKey="privacy.0129"
      releaseNoteKey="privacy.0130"
    />
  );
}
