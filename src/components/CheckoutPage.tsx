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
import { createPaytrailPayment } from '../lib/paytrailClient';
import { PaytrailCreateItem } from '../lib/paytrailContract';
import {
  CHECKOUT_CANCEL_URL,
  CHECKOUT_SUCCESS_URL,
} from './appConfig';

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
    phone: '',
    
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
      placeOrder: { fi: 'Siirry maksamaan', en: 'Proceed to Payment' },
      processing: { fi: 'Käsitellään...', en: 'Processing...' },
      acceptTerms: { fi: 'Hyväksyn käyttöehdot ja tietosuojakäytännön', en: 'I accept the terms and conditions and privacy policy' },
      required: { fi: 'pakollinen', en: 'required' },
      items: { fi: 'tuotetta', en: 'items' },
      perPcs: { fi: 'kpl', en: 'pcs' },
      freeShipping: { fi: 'Ilmainen toimitus', en: 'Free Shipping' },
      secureCheckout: { fi: 'Turvallinen maksu', en: 'Secure Checkout' },
      cancelOrder: { fi: 'Peruuta tilaus', en: 'Cancel order' },
      paymentError: { fi: 'Maksun luonti epäonnistui', en: 'Payment creation failed' },
      redirectingToPayment: { fi: 'Ohjataan maksupalveluun...', en: 'Redirecting to payment service...' },
    };
    return translations[key]?.[language] || key;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.acceptTerms) {
      toast.error(
        language === 'fi' 
          ? 'Sinun on hyväksyttävä käyttöehdot jatkaaksesi' 
          : 'You must accept the terms and conditions to continue'
      );
      return;
    }

    if (items.length === 0) {
      toast.error(
        language === 'fi'
          ? 'Ostoskori on tyhjä'
          : 'Cart is empty'
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Convert cart items to Paytrail format
      const paytrailItems: PaytrailCreateItem[] = items.map((item) => {
        const unitPriceEur = item.price;
        const unitPriceCents = Math.round(unitPriceEur * 100);
        
        // Generate product code from product data
        const productCode = item.product.article_nr || 
                           item.product.ean || 
                           item.product.id || 
                           'UNKNOWN';
        
        // Generate description
        const description = `${item.product.brand || ''} ${item.product.model || ''}`.trim() || 
                          item.product.name || 
                          'Product';

        return {
          unitPrice: unitPriceCents,
          units: item.quantity,
          productCode: String(productCode),
          vatPercentage: 25.5, // Finnish VAT rate as per legal docs
          description,
        };
      });
      
      // Call Paytrail API
      const response = await createPaytrailPayment({
        items: paytrailItems,
        customer: {
          email: formData.email || null,
          phone: formData.phone || null,
          firstName: formData.firstName || null,
          lastName: formData.lastName || null,
        },
        return_url: CHECKOUT_SUCCESS_URL,
        cancel_url: CHECKOUT_CANCEL_URL,
        metadata: {
          source: 'web_checkout',
          language,
          shipping_address: formData.shippingAddress,
          shipping_city: formData.shippingCity,
          shipping_postal_code: formData.shippingPostalCode,
          order_notes: formData.orderNotes || null,
        },
      });

      if (response.ok) {
        // Success - store order ID and redirect to Paytrail
        sessionStorage.setItem('mitra_last_order_id', response.order_id);
        
        toast.success(t('redirectingToPayment'));
        
        // Redirect to Paytrail payment page
        setTimeout(() => {
          window.location.href = response.redirect_url;
        }, 500);
      } else {
        // Error response from backend
        console.error('Payment creation error:', response);
        
        // Show specific error message based on error type
        let errorMessage = response.message || 'Unknown error';
        
        if (response.error === 'endpoint_not_found') {
          errorMessage = language === 'fi'
            ? 'Maksupalvelu ei ole käytettävissä. Ota yhteyttä asiakaspalveluun.'
            : 'Payment service is not available. Please contact customer support.';
        }
        
        toast.error(`${t('paymentError')}: ${errorMessage}`);
        
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment creation exception:', error);
      
      toast.error(
        language === 'fi'
          ? 'Yhteysvirhe maksupalveluun. Yritä uudelleen.'
          : 'Connection error to payment service. Please try again.'
      );
      
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const vatAmount = totalPrice * 0.255;
  const shippingCost = totalPrice > 200 ? 0 : 15;
  const finalTotal = totalPrice + shippingCost;

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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
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
                  className={`cursor-pointer text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}`}
                >
                  {t('acceptTerms')} <span className="text-red-500">*</span>
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
                {items.map((item) => (
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
                        {item.quantity} × €{item.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-[#FF6B00] mt-1">
                        €{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-[#E2E8F0]'} />

              <div className="space-y-2 my-4">
                <div className="flex items-center justify-between text-sm">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}>
                    {t('subtotal')}
                  </span>
                  <span className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}>
                    €{totalPrice.toFixed(2)}
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
