import React, { useState } from 'react';
import { useCart } from './CartContext';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft, Package, CreditCard, Truck, MapPin, Mail, Phone, User, Building, Home, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getSupabaseClient } from '../utils/supabase/client';
import { calculateLinePricing } from '../utils/pricing';
import { FINNISH_PHONE_PREFIX, hasFinnishPhoneValue, normalizeFinnishPhone, normalizeFinnishPhoneInput } from '../utils/phone';

const VAT_RATE = 0.255;
const VAT_PERCENT = 25.5;
const VAT_MULTIPLIER = 1 + VAT_RATE;

interface CheckoutPageProps {
  onBack: () => void;
  onComplete: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBack, onComplete }) => {
  const { items, totalPrice, clearCart } = useCart();
  const { theme } = useTheme();
  const { language } = useLanguage();

  const [formData, setFormData] = useState({
    // Contact Information
    firstName: '',
    lastName: '',
    email: '',
    phone: FINNISH_PHONE_PREFIX,
    
    // Billing Address
    billingAddress: '',
    billingCity: '',
    billingPostalCode: '',
    billingCountry: 'Finland',
    
    // Shipping Address
    shippingAddress: '',
    shippingCity: '',
    shippingPostalCode: '',
    shippingCountry: 'Finland',
    
    // Options
    sameAsShipping: true,
    acceptTerms: false,
    
    // Notes
    orderNotes: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const t = (key: string) => {
    const translations: Record<string, { fi: string; en: string }> = {
      checkout: { fi: 'Kassa', en: 'Checkout' },
      backToCart: { fi: 'Takaisin ostoskoriin', en: 'Back to Cart' },
      orderSummary: { fi: 'Tilausyhteenveto', en: 'Order Summary' },
      contactInfo: { fi: 'Yhteystiedot', en: 'Contact Information' },
      shippingAddress: { fi: 'Toimitusosoite', en: 'Shipping Address' },
      billingAddress: { fi: 'Laskutusosoite', en: 'Billing Address' },
      paymentMethod: { fi: 'Maksutapa', en: 'Payment Method' },
      firstName: { fi: 'Etunimi', en: 'First Name' },
      lastName: { fi: 'Sukunimi', en: 'Last Name' },
      email: { fi: 'Sähköposti', en: 'Email' },
      phone: { fi: 'Puhelinnumero', en: 'Phone Number' },
      address: { fi: 'Osoite', en: 'Address' },
      city: { fi: 'Kaupunki', en: 'City' },
      postalCode: { fi: 'Postinumero', en: 'Postal Code' },
      country: { fi: 'Maa', en: 'Country' },
      sameAsShipping: { fi: 'Sama kuin toimitusosoite', en: 'Same as shipping address' },
      orderNotes: { fi: 'Tilaushuomautukset (valinnainen)', en: 'Order Notes (optional)' },
      subtotal: { fi: 'Välisumma', en: 'Subtotal' },
      shipping: { fi: 'Toimitus', en: 'Shipping' },
      vat: { fi: 'ALV 25.5%', en: 'VAT 25.5%' },
      total: { fi: 'Yhteensä', en: 'Total' },
      placeOrder: { fi: 'Vahvista tilaus', en: 'Place Order' },
      processing: { fi: 'Käsitellään...', en: 'Processing...' },
      acceptTerms: { fi: 'Hyväksyn käyttöehdot ja tietosuojakäytännön', en: 'I accept the terms and conditions and privacy policy' },
      required: { fi: 'pakollinen', en: 'required' },
      items: { fi: 'tuotetta', en: 'items' },
      perPcs: { fi: 'kpl', en: 'pcs' },
      freeShipping: { fi: 'Ilmainen toimitus', en: 'Free Shipping' },
      secureCheckout: { fi: 'Turvallinen maksu', en: 'Secure Checkout' },
      cancelOrder: { fi: 'Peruuta tilaus', en: 'Cancel order' },
    };
    return translations[key]?.[language] || key;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // STRICT VALIDATION - Check cart is not empty
    if (!items || items.length === 0) {
      toast.error(
        language === 'fi'
          ? 'Ostoskori on tyhjä'
          : 'Cart is empty'
      );
      return;
    }

    // Validate terms acceptance
    if (!formData.acceptTerms) {
      toast.error(
        language === 'fi' 
          ? 'Sinun on hyväksyttävä käyttöehdot jatkaaksesi' 
          : 'You must accept the terms and conditions to continue'
      );
      return;
    }

    // Validate required fields - Contact Information
    if (!formData.firstName || !formData.lastName) {
      toast.error(
        language === 'fi'
          ? 'Täytä etu- ja sukunimi'
          : 'Please fill in first and last name'
      );
      return;
    }

    // Validate email contains @
    if (!formData.email || !formData.email.includes('@')) {
      toast.error(
        language === 'fi'
          ? 'Anna kelvollinen sähköpostiosoite'
          : 'Please enter a valid email address'
      );
      return;
    }

    // Validate phone
    const normalizedPhone = normalizeFinnishPhone(formData.phone);

    if (!hasFinnishPhoneValue(normalizedPhone)) {
      toast.error(
        language === 'fi'
          ? 'Anna puhelinnumero'
          : 'Please enter phone number'
      );
      return;
    }

    // Validate shipping address
    if (!formData.shippingAddress) {
      toast.error(
        language === 'fi'
          ? 'Anna toimitusosoite'
          : 'Please enter shipping address'
      );
      return;
    }

    // Validate city
    if (!formData.shippingCity) {
      toast.error(
        language === 'fi'
          ? 'Anna kaupunki'
          : 'Please enter city'
      );
      return;
    }

    // Validate postal code
    if (!formData.shippingPostalCode) {
      toast.error(
        language === 'fi'
          ? 'Anna postinumero'
          : 'Please enter postal code'
      );
      return;
    }

    // Validate country
    if (!formData.shippingCountry) {
      toast.error(
        language === 'fi'
          ? 'Anna maa'
          : 'Please enter country'
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Build items array in correct Paytrail format
      const paytrailItems = items.map(item => {
        const linePricing = calculateLinePricing(
          item.base_price ?? item.price ?? 0,
          item.quantity,
          item.pricing_rules ?? item.product?.pricing_rules ?? null,
        );
        const unitPriceWithVatCents = Math.round(linePricing.effectiveUnitPriceEur * VAT_MULTIPLIER * 100);
        const productName = `${item.product.brand || 'Product'} ${item.product.model || ''}`.trim();
        const sku = item.product.id || item.id;
        
        return {
          qty: item.quantity,
          client_unit_price_cents: unitPriceWithVatCents,
          sku: sku,
          name: productName,
          vatPercentage: VAT_PERCENT
        };
      });

      // Build payload for Paytrail payment
      const payload = {
        items: paytrailItems,
        currency: 'EUR',
        customer: {
          email: formData.email,
          phone: normalizedPhone,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        return_url: 'https://mitra-auto.fi/checkout/result',
        idempotency_key: crypto.randomUUID()
      };

      // Debug log
      console.log('Submitting Paytrail payload:', payload);

      // Call Supabase Edge Function to create Paytrail payment
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke(
        'payments_create_paytrail',
        {
          method: 'POST',
          body: payload,
        }
      );

      // Debug log
      console.log('Paytrail response:', data, error);

      // Check for Supabase function error
      if (error) {
        console.error('Payment creation error:', error);
        setIsProcessing(false);
        toast.error(
          language === 'fi'
            ? 'Maksun aloitus epäonnistui. Yritä uudelleen.'
            : 'We couldn\'t start the payment. Please try again.'
        );
        return;
      }

      // Check for backend error response
      if (data && data.error) {
        console.error('Backend error:', data);
        setIsProcessing(false);
        toast.error(
          language === 'fi'
            ? `Virhe: ${data.message || 'Maksun aloitus epäonnistui'}`
            : `Error: ${data.message || 'Payment creation failed'}`
        );
        return;
      }

      // Check for redirect_url
      if (!data || !data.redirect_url) {
        console.error('Invalid payment response - no redirect_url:', data);
        setIsProcessing(false);
        toast.error(
          language === 'fi'
            ? 'Virheellinen vastaus palvelimelta'
            : 'Invalid response from server'
        );
        return;
      }

      // Success - redirect to Paytrail
      console.log('Payment initiated successfully, redirecting to:', data.redirect_url);
      window.location.href = data.redirect_url;

    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessing(false);
      
      toast.error(
        language === 'fi'
          ? 'Maksun aloitus epäonnistui. Yritä uudelleen.'
          : 'We couldn\'t start the payment. Please try again.'
      );
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const vatAmount = totalPrice * VAT_RATE;
  const shippingCost = totalPrice > 200 ? 0 : 15;
  const subtotalWithVat = totalPrice * VAT_MULTIPLIER;
  const finalTotal = subtotalWithVat + shippingCost;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-[#E2E8F0]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <ArrowLeft className="size-5" />
            <span className="text-sm">{t('backToCart')}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className={`text-3xl sm:text-4xl mb-8 ${
          theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
        }`}>
          {t('checkout')}
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
              {/* Contact Information */}
              <Card className={`p-6 ${
                theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <User className={`size-5 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`} />
                  <h2 className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                    {t('contactInfo')}
                  </h2>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                      {t('firstName')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      autoComplete="given-name"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`mt-1 ${
                        theme === 'dark'
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-white border-[#E2E8F0] text-[#0F172A]'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                      {t('lastName')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      autoComplete="family-name"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`mt-1 ${
                        theme === 'dark'
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-white border-[#E2E8F0] text-[#0F172A]'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                      {t('email')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`mt-1 ${
                        theme === 'dark'
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-white border-[#E2E8F0] text-[#0F172A]'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                      {t('phone')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      onBlur={(e) => handleInputChange('phone', normalizeFinnishPhoneInput(e.target.value))}
                      placeholder={FINNISH_PHONE_PREFIX}
                      className={`mt-1 ${
                        theme === 'dark'
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-white border-[#E2E8F0] text-[#0F172A]'
                      }`}
                    />
                  </div>
                </div>
              </Card>

              {/* Shipping Address */}
              <Card className={`p-6 ${
                theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <Truck className={`size-5 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`} />
                  <h2 className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                    {t('shippingAddress')}
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shippingAddress" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                      {t('address')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="shippingAddress"
                      name="shippingAddress"
                      autoComplete="shipping street-address"
                      required
                      value={formData.shippingAddress}
                      onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                      className={`mt-1 ${
                        theme === 'dark'
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-white border-[#E2E8F0] text-[#0F172A]'
                      }`}
                    />
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shippingCity" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                        {t('city')} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="shippingCity"
                        name="shippingCity"
                        autoComplete="shipping address-level2"
                        required
                        value={formData.shippingCity}
                        onChange={(e) => handleInputChange('shippingCity', e.target.value)}
                        className={`mt-1 ${
                          theme === 'dark'
                            ? 'bg-white/5 border-white/10 text-white'
                            : 'bg-white border-[#E2E8F0] text-[#0F172A]'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="shippingPostalCode" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                        {t('postalCode')} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="shippingPostalCode"
                        name="shippingPostalCode"
                        autoComplete="shipping postal-code"
                        inputMode="numeric"
                        required
                        value={formData.shippingPostalCode}
                        onChange={(e) => handleInputChange('shippingPostalCode', e.target.value)}
                        className={`mt-1 ${
                          theme === 'dark'
                            ? 'bg-white/5 border-white/10 text-white'
                            : 'bg-white border-[#E2E8F0] text-[#0F172A]'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Billing Address */}
              <Card className={`p-6 ${
                theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <Building className={`size-5 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`} />
                  <h2 className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                    {t('billingAddress')}
                  </h2>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    id="sameAsShipping"
                    checked={formData.sameAsShipping}
                    onCheckedChange={(checked) => handleInputChange('sameAsShipping', checked as boolean)}
                  />
                  <Label 
                    htmlFor="sameAsShipping" 
                    className={`cursor-pointer ${theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}`}
                  >
                    {t('sameAsShipping')}
                  </Label>
                </div>

                {!formData.sameAsShipping && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="billingAddress" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                        {t('address')} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="billingAddress"
                        name="billingAddress"
                        autoComplete="billing street-address"
                        required={!formData.sameAsShipping}
                        value={formData.billingAddress}
                        onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                        className={`mt-1 ${
                          theme === 'dark'
                            ? 'bg-white/5 border-white/10 text-white'
                            : 'bg-white border-[#E2E8F0] text-[#0F172A]'
                        }`}
                      />
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingCity" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                          {t('city')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="billingCity"
                          name="billingCity"
                          autoComplete="billing address-level2"
                          required={!formData.sameAsShipping}
                          value={formData.billingCity}
                          onChange={(e) => handleInputChange('billingCity', e.target.value)}
                          className={`mt-1 ${
                            theme === 'dark'
                              ? 'bg-white/5 border-white/10 text-white'
                              : 'bg-white border-[#E2E8F0] text-[#0F172A]'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="billingPostalCode" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                          {t('postalCode')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="billingPostalCode"
                          name="billingPostalCode"
                          autoComplete="billing postal-code"
                          inputMode="numeric"
                          required={!formData.sameAsShipping}
                          value={formData.billingPostalCode}
                          onChange={(e) => handleInputChange('billingPostalCode', e.target.value)}
                          className={`mt-1 ${
                            theme === 'dark'
                              ? 'bg-white/5 border-white/10 text-white'
                              : 'bg-white border-[#E2E8F0] text-[#0F172A]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                />
                <Label 
                  htmlFor="acceptTerms" 
                  className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}`}
                >
                  {language === 'fi' ? 'Hyväksyn ' : 'I accept the '} 
                  <a 
                    href="/legal" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline hover:no-underline ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {language === 'fi' ? 'Käyttöehdot ja Tietosuojaselosteen' : 'Terms & Conditions and Privacy Policy'}
                  </a>
                  {' '}<span className="text-red-500">*</span>
                </Label>
              </div>

              {/* Submit Button - Mobile */}
              <Button
                type="submit"
                disabled={isProcessing || !formData.acceptTerms}
                className="w-full lg:hidden bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white h-12 transition-transform hover:scale-[1.02] disabled:opacity-50"
                style={{ boxShadow: '0 2px 12px rgba(255, 107, 0, 0.25)' }}
              >
                <Lock className="size-5 mr-2" />
                {isProcessing ? t('processing') : t('placeOrder')}
              </Button>

              {/* Subtle Cancel Link - Mobile */}
              <div className="mt-3 text-center lg:hidden">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={isProcessing}
                  className={`text-xs transition-colors opacity-40 hover:opacity-60 disabled:opacity-20 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  {t('cancelOrder')}
                </button>
              </div>
            </form>
          </div>

          {/* Right - Order Summary */}
          <div className="lg:col-span-1">
            <div className={`sticky top-6 rounded-xl border p-6 ${
              theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-[#E2E8F0]'
            }`}>
              <h2 className={`text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                {t('orderSummary')}
              </h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => {
                  const linePricing = calculateLinePricing(
                    item.base_price ?? item.price ?? 0,
                    item.quantity,
                    item.pricing_rules ?? item.product?.pricing_rules ?? null,
                  );

                  return (
                    <div key={item.id} className="flex gap-3">
                        <div className={`size-16 rounded-lg overflow-hidden flex-shrink-0 ${
                          theme === 'dark' ? 'bg-[#2C2C2E]' : 'bg-gray-100'
                        }`}>
                          {item.product.image_url && (
                            <img
                              src={item.product.image_url}
                              alt={`${item.product.brand} ${item.product.model}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${
                            theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                          }`}>
                            {item.product.brand} {item.product.model}
                          </p>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                          }`}>
                            {item.quantity} × €{(linePricing.effectiveUnitPriceEur * VAT_MULTIPLIER).toFixed(2)}
                          </p>
                          <p className="text-sm text-[#FF6B00] mt-1">
                            €{(linePricing.lineTotalEur * VAT_MULTIPLIER).toFixed(2)}
                          </p>
                        </div>
                      </div>
                  );
                })}
              </div>

              <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-[#E2E8F0]'} />

              <div className="space-y-2 my-4">
                <div className="flex items-center justify-between text-sm">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}>
                    {t('subtotal')}
                  </span>
                  <span className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}>
                    €{subtotalWithVat.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}>
                    {t('shipping')}
                  </span>
                  <span className={`${
                    shippingCost === 0 ? 'text-green-600' : theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                  }`}>
                    {shippingCost === 0 ? t('freeShipping') : `€${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'}>
                    {t('vat')}
                  </span>
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'}>
                    €{vatAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-[#E2E8F0]'} />

              <div className="flex items-center justify-between mt-4 mb-6">
                <span className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                  {t('total')}
                </span>
                <span className="text-2xl text-[#FF6B00]">
                  €{finalTotal.toFixed(2)}
                </span>
              </div>

              {/* Submit Button - Desktop */}
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isProcessing || !formData.acceptTerms}
                className="w-full hidden lg:flex bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white h-12 transition-transform hover:scale-[1.02] disabled:opacity-50"
                style={{ boxShadow: '0 2px 12px rgba(255, 107, 0, 0.25)' }}
              >
                <Lock className="size-5 mr-2" />
                {isProcessing ? t('processing') : t('placeOrder')}
              </Button>

              <p className={`text-xs text-center mt-4 ${
                theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'
              }`}>
                {t('secureCheckout')}
              </p>

              {/* Subtle Cancel Link - Desktop */}
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={isProcessing}
                  className={`text-xs transition-colors opacity-40 hover:opacity-60 disabled:opacity-20 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  {t('cancelOrder')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
