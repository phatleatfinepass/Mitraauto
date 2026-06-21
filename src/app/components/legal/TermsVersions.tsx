import React from 'react';
import { Card } from '../ui/card';
import { legalContent } from './legalContent';


// Version 1.0 - Initial Basic Terms (Dec 2023)
export function TermsV1({ t }: { t: (key: string) => string }) {
  return (
    <Card className="border rounded-2xl p-8 lg:p-12">
      <div className="space-y-8 text-muted-foreground">
        {/* Acceptance */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0001')}</h2>
          <p>{legalContent(t, 'termsArchive.0002')}</p>
        </div>

        {/* Services */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0003')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0004')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0005')}</li>
            <li>{legalContent(t, 'termsArchive.0006')}</li>
            <li>{legalContent(t, 'termsArchive.0007')}</li>
          </ul>
        </div>

        {/* Bookings and Payment */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0008')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0009')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0010')}</li>
            <li>{legalContent(t, 'termsArchive.0011')}</li>
            <li>{legalContent(t, 'termsArchive.0012')}</li>
          </ul>
        </div>

        {/* Cancellation */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0013')}</h2>
          <p>{legalContent(t, 'termsArchive.0014')}</p>
        </div>

        {/* Liability */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0015')}</h2>
          <p>{legalContent(t, 'termsArchive.0016')}</p>
        </div>

        {/* Warranty */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0017')}</h2>
          <p>{legalContent(t, 'termsArchive.0018')}</p>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0019')}</h2>
          <p>{legalContent(t, 'termsArchive.0020')}<a href="mailto:info@mitraauto.fi" className="text-[#FF6B35] hover:underline">{legalContent(t, 'termsArchive.0021')}</a></p>
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
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0022')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0023')}</p>
          <p className="mb-3">{legalContent(t, 'termsArchive.0024')}</p>
          <p className="italic text-sm font-medium text-foreground">{legalContent(t, 'termsArchive.0025')}</p>
        </div>

        {/* Definitions */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0026')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{legalContent(t, 'termsArchive.0027')}</strong>{legalContent(t, 'termsArchive.0028')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0029')}</strong>{legalContent(t, 'termsArchive.0030')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0031')}</strong>{legalContent(t, 'termsArchive.0032')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0033')}</strong>{legalContent(t, 'termsArchive.0034')}</li>
          </ul>
        </div>

        {/* Services Scope */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0035')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0036')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0037')}</li>
            <li>{legalContent(t, 'termsArchive.0038')}</li>
            <li>{legalContent(t, 'termsArchive.0039')}</li>
            <li>{legalContent(t, 'termsArchive.0040')}</li>
            <li>{legalContent(t, 'termsArchive.0041')}</li>
          </ul>
        </div>

        {/* Pricing and Payment */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0042')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0043')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0044')}</li>
            <li>{legalContent(t, 'termsArchive.0045')}</li>
            <li>{legalContent(t, 'termsArchive.0046')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{legalContent(t, 'termsArchive.0047')}</p>
        </div>

        {/* Booking and Cancellation */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0048')}</h2>
          <p className="mb-3"><strong>{legalContent(t, 'termsArchive.0049')}</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0050')}</li>
            <li>{legalContent(t, 'termsArchive.0051')}</li>
            <li>{legalContent(t, 'termsArchive.0052')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{legalContent(t, 'termsArchive.0053')}</p>
        </div>

        {/* Consumer Rights */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0054')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0055')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0056')}</li>
            <li>{legalContent(t, 'termsArchive.0057')}</li>
            <li>{legalContent(t, 'termsArchive.0058')}</li>
            <li>{legalContent(t, 'termsArchive.0059')}</li>
          </ul>
        </div>

        {/* Liability */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0060')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0061')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0062')}</li>
            <li>{legalContent(t, 'termsArchive.0063')}</li>
            <li>{legalContent(t, 'termsArchive.0064')}</li>
          </ul>
          <p className="mt-3">{legalContent(t, 'termsArchive.0065')}</p>
        </div>

        {/* Warranty */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0066')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0067')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0068')}</li>
            <li>{legalContent(t, 'termsArchive.0069')}</li>
            <li>{legalContent(t, 'termsArchive.0070')}</li>
          </ul>
        </div>

        {/* Dispute Resolution */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0071')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0072')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0073')}</li>
            <li>{legalContent(t, 'termsArchive.0074')}</li>
            <li>{legalContent(t, 'termsArchive.0075')}</li>
          </ul>
        </div>

        {/* Changes to Terms */}
        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0076')}</h2>
          <p>{legalContent(t, 'termsArchive.0077')}</p>
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
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0078')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0079')}</p>
          <p className="mb-3">{legalContent(t, 'termsArchive.0080')}<a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">{legalContent(t, 'termsArchive.0081')}</a> | <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></p>
          <p className="italic text-sm font-medium text-foreground">{legalContent(t, 'termsArchive.0082')}</p>
          <p className="mt-3 text-sm italic">{legalContent(t, 'termsArchive.0083')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0084')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{legalContent(t, 'termsArchive.0085')}</strong>{legalContent(t, 'termsArchive.0086')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0087')}</strong>{legalContent(t, 'termsArchive.0088')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0089')}</strong>{legalContent(t, 'termsArchive.0090')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0091')}</strong>{legalContent(t, 'termsArchive.0092')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0093')}</strong>{legalContent(t, 'termsArchive.0094')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0095')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0096')}</li>
            <li>{legalContent(t, 'termsArchive.0097')}</li>
            <li>{legalContent(t, 'termsArchive.0098')}</li>
            <li>{legalContent(t, 'termsArchive.0099')}</li>
            <li>{legalContent(t, 'termsArchive.0100')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0101')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0102')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0103')}</li>
            <li>{legalContent(t, 'termsArchive.0104')}</li>
            <li>{legalContent(t, 'termsArchive.0105')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{legalContent(t, 'termsArchive.0106')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0107')}</h2>
          <p className="mb-3"><strong>{legalContent(t, 'termsArchive.0108')}</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0109')}</li>
            <li>{legalContent(t, 'termsArchive.0110')}</li>
            <li>{legalContent(t, 'termsArchive.0111')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{legalContent(t, 'termsArchive.0112')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0113')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0114')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0115')}</li>
            <li>{legalContent(t, 'termsArchive.0116')}</li>
            <li>{legalContent(t, 'termsArchive.0117')}</li>
            <li>{legalContent(t, 'termsArchive.0118')}</li>
          </ul>
          <p className="mt-3">{legalContent(t, 'termsArchive.0119')}<a href="https://www.kkv.fi" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0120')}</a></p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0121')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0122')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0123')}</li>
            <li>{legalContent(t, 'termsArchive.0124')}</li>
          </ul>
          <p className="mt-3">{legalContent(t, 'termsArchive.0125')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0126')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0127')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0128')}</li>
            <li>{legalContent(t, 'termsArchive.0129')}</li>
            <li>{legalContent(t, 'termsArchive.0130')}</li>
          </ul>
          <p className="mt-3">{legalContent(t, 'termsArchive.0131')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0132')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0133')}</li>
            <li>{legalContent(t, 'termsArchive.0134')}</li>
            <li>{legalContent(t, 'termsArchive.0135')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0136')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0137')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0138')}</li>
            <li>{legalContent(t, 'termsArchive.0139')}</li>
            <li>{legalContent(t, 'termsArchive.0140')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0141')}</h2>
          <p>{legalContent(t, 'termsArchive.0142')}</p>
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
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0143')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0144')}</p>
          <p className="mb-3"><strong>{legalContent(t, 'termsArchive.0145')}</strong></p>
          <ul className="space-y-1 ml-6 list-none">
            <li>{legalContent(t, 'termsArchive.0146')}</li>
            <li>{legalContent(t, 'termsArchive.0147')}</li>
            <li>{legalContent(t, 'termsArchive.0148')}</li>
            <li>{legalContent(t, 'termsArchive.0149')}<a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">{legalContent(t, 'termsArchive.0150')}</a></li>
            <li>{legalContent(t, 'termsArchive.0151')}<a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0152')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{legalContent(t, 'termsArchive.0153')}</strong>{legalContent(t, 'termsArchive.0154')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0155')}</strong>{legalContent(t, 'termsArchive.0156')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0157')}</strong>{legalContent(t, 'termsArchive.0158')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0159')}</strong>{legalContent(t, 'termsArchive.0160')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0161')}</strong>{legalContent(t, 'termsArchive.0162')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0163')}</strong>{legalContent(t, 'termsArchive.0164')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0165')}</strong>{legalContent(t, 'termsArchive.0166')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0167')}</h2>
          <p className="mb-3 font-semibold text-foreground">{legalContent(t, 'termsArchive.0168')}</p>
          <p className="mb-3">{legalContent(t, 'termsArchive.0169')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0170')}</li>
            <li>{legalContent(t, 'termsArchive.0171')}</li>
            <li>{legalContent(t, 'termsArchive.0172')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{legalContent(t, 'termsArchive.0173')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0174')}</h2>
          <p className="mb-3"><strong>{legalContent(t, 'termsArchive.0175')}</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0176')}</li>
            <li>{legalContent(t, 'termsArchive.0177')}</li>
          </ul>
          <p className="mt-3"><strong>{legalContent(t, 'termsArchive.0178')}</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0179')}</li>
            <li>{legalContent(t, 'termsArchive.0180')}</li>
            <li>{legalContent(t, 'termsArchive.0181')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0182')}</h2>
          <p className="mb-3"><strong>{legalContent(t, 'termsArchive.0183')}</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0184')}</li>
            <li>{legalContent(t, 'termsArchive.0185')}</li>
            <li>{legalContent(t, 'termsArchive.0186')}</li>
          </ul>
          <p className="mt-3"><strong>{legalContent(t, 'termsArchive.0187')}</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0188')}</li>
            <li>{legalContent(t, 'termsArchive.0189')}</li>
            <li>{legalContent(t, 'termsArchive.0190')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0191')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0192')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{legalContent(t, 'termsArchive.0193')}</strong>{legalContent(t, 'termsArchive.0194')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0195')}</strong>{legalContent(t, 'termsArchive.0196')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0197')}</strong>{legalContent(t, 'termsArchive.0198')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0199')}</strong>{legalContent(t, 'termsArchive.0200')}</li>
            <li><strong>{legalContent(t, 'termsArchive.0201')}</strong>{legalContent(t, 'termsArchive.0202')}</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">{legalContent(t, 'termsArchive.0203')}<a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0204')}</a></p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0205')}</h2>
          <p className="mb-3"><strong>{legalContent(t, 'termsArchive.0206')}</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0207')}</li>
            <li>{legalContent(t, 'termsArchive.0208')}</li>
            <li>{legalContent(t, 'termsArchive.0209')}</li>
          </ul>
          <p className="mt-3"><strong>{legalContent(t, 'termsArchive.0210')}</strong>{legalContent(t, 'termsArchive.0211')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0212')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0213')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0214')}</li>
            <li>{legalContent(t, 'termsArchive.0215')}</li>
            <li>{legalContent(t, 'termsArchive.0216')}</li>
          </ul>
          <p className="mt-3">{legalContent(t, 'termsArchive.0217')}</p>
          <p className="mt-3 italic text-sm">{legalContent(t, 'termsArchive.0218')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0219')}</h2>
          <p className="mb-3">{legalContent(t, 'termsArchive.0220')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0221')}</li>
            <li>{legalContent(t, 'termsArchive.0222')}</li>
            <li>{legalContent(t, 'termsArchive.0223')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0224')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0225')}</li>
            <li>{legalContent(t, 'termsArchive.0226')}</li>
            <li>{legalContent(t, 'termsArchive.0227')}</li>
            <li>{legalContent(t, 'termsArchive.0228')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0229')}</h2>
          <p className="mb-3"><strong>{legalContent(t, 'termsArchive.0230')}</strong></p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'termsArchive.0231')}</li>
            <li>{legalContent(t, 'termsArchive.0232')}<a href="https://www.kuluttajariita.fi" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0233')}</a></li>
            <li>{legalContent(t, 'termsArchive.0234')}<a href="https://www.kkv.fi" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0235')}</a></li>
            <li>{legalContent(t, 'termsArchive.0236')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0237')}</h2>
          <p>{legalContent(t, 'termsArchive.0238')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'termsArchive.0239')}</h2>
          <p>{legalContent(t, 'termsArchive.0240')}</p>
          <p className="mt-3 font-semibold text-foreground">{legalContent(t, 'termsArchive.0241')}</p>
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
            <li>{legalContent(t, 'termsArchive.0242')}</li>
            <li>{t('legal.terms.acceptance.businessId')}: 3408833-8</li>
            <li>{t('legal.terms.acceptance.address')}: Hankasuontie 5, 00390 Helsinki, Finland</li>
            <li>{t('legal.terms.acceptance.email')}: <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">{legalContent(t, 'termsArchive.0243')}</a></li>
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
          <p className="mt-4 font-medium text-foreground">{t('legal.terms.consumer.advisory')}: <a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0244')}</a></p>
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
          <p className="mt-4 font-medium text-foreground">{t('legal.terms.consumer.advisory')}: <a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0245')}</a></p>
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
            <li><strong>{t('legal.terms.dispute.step2')}:</strong> {t('legal.terms.dispute.step2Desc')} <a href="https://www.kuluttajariita.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0246')}</a></li>
            <li><strong>{t('legal.terms.dispute.step3')}:</strong> {t('legal.terms.dispute.step3Desc')} <a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0247')}</a></li>
            <li><strong>{t('legal.terms.dispute.step4')}:</strong> {t('legal.terms.dispute.step4Desc')}</li>
          </ul>
          <p className="mt-3"><strong className="text-foreground">{t('legal.terms.dispute.businessTitle')}:</strong> {t('legal.terms.dispute.business')}</p>
          <p className="mt-4 italic text-sm">{t('legal.terms.dispute.euOdr')}: <a href="https://ec.europa.eu/consumers/odr" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0248')}</a></p>
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
            <li>{legalContent(t, 'termsArchive.0249')}</li>
            <li>{t('legal.terms.acceptance.businessId')}: 3408833-8</li>
            <li>{t('legal.terms.acceptance.address')}: Hankasuontie 5, 00390 Helsinki, Finland</li>
            <li>{t('legal.terms.acceptance.email')}: <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">{legalContent(t, 'termsArchive.0250')}</a></li>
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
            <li><strong>{t('legal.terms.dispute.step2')}:</strong> {t('legal.terms.dispute.step2Desc')} <a href="https://www.kuluttajariita.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0251')}</a></li>
            <li><strong>{t('legal.terms.dispute.step3')}:</strong> {t('legal.terms.dispute.step3Desc')} <a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0252')}</a></li>
            <li><strong>{t('legal.terms.dispute.step4')}:</strong> {t('legal.terms.dispute.step4Desc')}</li>
          </ul>
          <p className="mt-3"><strong className="text-foreground">{t('legal.terms.dispute.businessTitle')}:</strong> {t('legal.terms.dispute.business')}</p>
          <p className="mt-4 italic text-sm">{t('legal.terms.dispute.euOdr')}: <a href="https://ec.europa.eu/consumers/odr" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0253')}</a></p>
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
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0001')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0002')}</p>
          <ul className="space-y-1 ml-6 list-none">
            <li><strong className="text-foreground">{legalContent(t, 'terms.0003')}:</strong>{legalContent(t, 'termsArchive.0254')}</li>
            <li>{legalContent(t, 'terms.0004')}: 3408833-8</li>
            <li>{legalContent(t, 'terms.0005')}: Hankasuontie 5, 00390 Helsinki, Finland</li>
            <li>{legalContent(t, 'terms.0006')}: <a href="mailto:contact@mitra-auto.fi" className="text-[#FF6B35] hover:underline">{legalContent(t, 'termsArchive.0255')}</a></li>
            <li>{legalContent(t, 'terms.0007')}: <a href="tel:+358407777163" className="text-[#FF6B35] hover:underline">+358 40 777 7163</a></li>
          </ul>
          <p className="mt-3 italic text-sm font-medium text-foreground">{legalContent(t, 'terms.0008')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0009')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0010')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'terms.0011')}</li>
            <li>{legalContent(t, 'terms.0012')}</li>
            <li>{legalContent(t, 'terms.0013')}</li>
            <li>{legalContent(t, 'terms.0014')}</li>
            <li>{legalContent(t, 'terms.0015')}</li>
            <li>{legalContent(t, 'terms.0016')}</li>
          </ul>
          <p className="mt-3 italic text-sm">{legalContent(t, 'terms.0017')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0018')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li><strong>{legalContent(t, 'terms.0019')}:</strong> {legalContent(t, 'terms.0020')}</li>
            <li><strong>{legalContent(t, 'terms.0021')}:</strong> {legalContent(t, 'terms.0022')}</li>
            <li><strong>{legalContent(t, 'terms.0023')}:</strong> {legalContent(t, 'terms.0024')}</li>
            <li><strong>{legalContent(t, 'terms.0025')}:</strong> {legalContent(t, 'terms.0026')}</li>
            <li><strong>{legalContent(t, 'terms.0027')}:</strong> {legalContent(t, 'terms.0028')}</li>
            <li><strong>{legalContent(t, 'terms.0029')}:</strong> {legalContent(t, 'terms.0030')}</li>
            <li><strong>{legalContent(t, 'terms.0031')}:</strong> {legalContent(t, 'terms.0032')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0033')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0034')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'terms.0035')}</li>
            <li>{legalContent(t, 'terms.0036')}</li>
            <li>{legalContent(t, 'terms.0037')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0038')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0039')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'terms.0040')}</li>
            <li>{legalContent(t, 'terms.0041')}</li>
            <li>{legalContent(t, 'terms.0042')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0043')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0044')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'terms.0045')}</li>
            <li>{legalContent(t, 'terms.0046')}</li>
            <li>{legalContent(t, 'terms.0047')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0048')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0049')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'terms.0050')}</li>
            <li>{legalContent(t, 'terms.0051')}</li>
            <li>{legalContent(t, 'terms.0052')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0053')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0054')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'terms.0055')}</li>
            <li>{legalContent(t, 'terms.0056')}</li>
            <li>{legalContent(t, 'terms.0057')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0058')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0059')}</p>
          <p className="mb-3">{legalContent(t, 'terms.0060')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0061')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0062')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'terms.0063')}</li>
            <li>{legalContent(t, 'terms.0064')}</li>
            <li>{legalContent(t, 'terms.0065')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0066')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0067')}</p>
          <p className="mb-3">{legalContent(t, 'terms.0068')}</p>
          <p className="italic text-sm">{legalContent(t, 'terms.0069')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0070')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0071')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'terms.0072')}</li>
            <li>{legalContent(t, 'terms.0073')}</li>
            <li>{legalContent(t, 'terms.0074')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0075')}</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'terms.0076')}</li>
            <li>{legalContent(t, 'terms.0077')}</li>
            <li>{legalContent(t, 'terms.0078')}</li>
            <li>{legalContent(t, 'terms.0079')}</li>
            <li>{legalContent(t, 'terms.0080')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0081')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0082')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'terms.0083')}</li>
            <li>{legalContent(t, 'terms.0084')}</li>
            <li>{legalContent(t, 'terms.0085')}</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">{legalContent(t, 'terms.0086')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0087')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0088')}</p>
          <p className="mb-3">{legalContent(t, 'terms.0089')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0090')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0091')}</p>
          <p className="mb-3">{legalContent(t, 'terms.0092')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0093')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0094')}</p>
          <p className="italic text-sm">{legalContent(t, 'terms.0095')}</p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0096')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0097')}</p>
          <ul className="space-y-2 ml-6 list-disc">
            <li>{legalContent(t, 'terms.0098')}</li>
            <li>{legalContent(t, 'terms.0099')}</li>
            <li>{legalContent(t, 'terms.0100')}</li>
          </ul>
          <p className="mt-3">
            <a href="https://www.kkv.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0256')}</a>
            {' | '}
            <a href="https://www.kuluttajariita.fi/en/" className="text-[#FF6B35] hover:underline" target="_blank" rel="noopener noreferrer">{legalContent(t, 'termsArchive.0257')}</a>
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-foreground mb-4">{legalContent(t, 'terms.0101')}</h2>
          <p className="mb-3">{legalContent(t, 'terms.0102')}</p>
          <p className="mt-3 font-semibold text-foreground">{legalContent(t, 'terms.0103')}</p>
          <p className="font-semibold text-foreground">{legalContent(t, 'terms.0104')}</p>
        </div>
      </div>
    </Card>
  );
}
