import React, { useEffect, useState } from 'react';
import { useCart } from '../cart/CartContext';
import { useTheme } from '../../../theme/ThemeContext';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Separator } from '../../ui/separator';
import { Card } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { ArrowLeft, Package, CreditCard, Truck, MapPin, Mail, Phone, User, Building, Warehouse, Mailbox, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getSupabaseClient } from '../../../utils/supabase/client';
import { getProductCommerceSnapshot } from '../../../utils/productCommerce';
import { FINNISH_PHONE_PREFIX, hasFinnishPhoneValue, normalizeFinnishPhone, normalizeFinnishPhoneInput } from '../../../utils/phone';
import { trackClarityEvent, upgradeClaritySession } from '../../../lib/clarity';

const VAT_RATE = 0.255;
const VAT_PERCENT = 25.5;
const VAT_MULTIPLIER = 1 + VAT_RATE;
const CHECKOUT_DRAFT_STORAGE_KEY = 'mitra-auto-checkout-draft';
const HOME_DELIVERY_FEE_EUR = 50;
const GARAGE_SHIPPING_ADDRESS = {
  streetAddress: 'Mitra Auto',
  postalCode: '00390',
  city: 'Helsinki',
  country: 'Finland',
};

const defaultCheckoutFormData = {
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
  shippingMethod: 'garage',
  
  // Options
  sameAsShipping: true,
  acceptTerms: false,
  
  // Notes
  orderNotes: '',
};

type CheckoutFormData = typeof defaultCheckoutFormData;

function loadCheckoutDraft(): CheckoutFormData {
  if (typeof window === 'undefined') return defaultCheckoutFormData;

  try {
    const rawDraft = window.sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY);
    if (!rawDraft) return defaultCheckoutFormData;
    const parsed = JSON.parse(rawDraft);
    if (!parsed || typeof parsed !== 'object') return defaultCheckoutFormData;

    return {
      ...defaultCheckoutFormData,
      ...parsed,
      phone: String(parsed.phone || FINNISH_PHONE_PREFIX),
      sameAsShipping: parsed.sameAsShipping !== false,
      acceptTerms: parsed.acceptTerms === true,
    };
  } catch (error) {
    console.warn('Failed to restore checkout draft:', error);
    return defaultCheckoutFormData;
  }
}

function saveCheckoutDraft(formData: CheckoutFormData) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, JSON.stringify(formData));
  } catch (error) {
    console.warn('Failed to save checkout draft:', error);
  }
}

export function clearCheckoutDraft() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
}

function resolveCheckoutProductSize(product: any) {
  if (product?.product_type === 'tire' || product?.type === 'tire') {
    return String(
      product?.size_text ||
      product?.size_string ||
      `${product?.tire_width ?? ''}/${product?.aspect_ratio ?? ''} ${product?.construction ?? 'R'}${product?.rim_diameter ?? ''}`
    ).trim();
  }

  return String(
    product?.size_text ||
    `${product?.rim_width ?? ''}×${product?.rim_diameter ?? ''}" ET${product?.et_offset ?? ''}`
  ).trim();
}

function resolveDeliveryDayRange(product: any) {
  const explicitMin = Number(product?.delivery_days_min);
  const explicitMax = Number(product?.delivery_days_max);
  if (Number.isFinite(explicitMin) && explicitMin > 0) {
    return {
      min: Math.round(explicitMin),
      max: Number.isFinite(explicitMax) && explicitMax > 0 ? Math.round(explicitMax) : Math.round(explicitMin),
    };
  }

  const label = String(product?.delivery_days ?? '').trim();
  const match = label.match(/(\d+)(?:\s*-\s*(\d+))?/);
  if (!match) return { min: null, max: null };

  const min = Number(match[1]);
  const max = Number(match[2] ?? match[1]);
  return {
    min: Number.isFinite(min) && min > 0 ? Math.round(min) : null,
    max: Number.isFinite(max) && max > 0 ? Math.round(max) : null,
  };
}

interface CheckoutPageProps {
  onBack: () => void;
  onComplete: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBack, onComplete }) => {
  const { items, totalPrice, clearCart } = useCart();
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  const [formData, setFormData] = useState<CheckoutFormData>(() => loadCheckoutDraft());

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    saveCheckoutDraft(formData);
  }, [formData]);

  const checkoutText = (key: string) => t(`checkout.${key}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // STRICT VALIDATION - Check cart is not empty
    if (!items || items.length === 0) {
      toast.error(checkoutText('error.emptyCart'));
      return;
    }

    // Validate terms acceptance
    if (!formData.acceptTerms) {
      toast.error(checkoutText('error.acceptTerms'));
      return;
    }

    // Validate required fields - Contact Information
    if (!formData.firstName || !formData.lastName) {
      toast.error(checkoutText('error.nameRequired'));
      return;
    }

    // Validate email contains @
    if (!formData.email || !formData.email.includes('@')) {
      toast.error(checkoutText('error.invalidEmail'));
      return;
    }

    // Validate phone
    const normalizedPhone = normalizeFinnishPhone(formData.phone);

    if (!hasFinnishPhoneValue(normalizedPhone)) {
      toast.error(checkoutText('error.phoneRequired'));
      return;
    }

    if (formData.shippingMethod === 'home') {
      if (!formData.shippingAddress) {
        toast.error(checkoutText('error.shippingAddressRequired'));
        return;
      }

      if (!formData.shippingCity) {
        toast.error(checkoutText('error.cityRequired'));
        return;
      }

      if (!formData.shippingPostalCode) {
        toast.error(checkoutText('error.postalCodeRequired'));
        return;
      }

      if (!formData.shippingCountry) {
        toast.error(checkoutText('error.countryRequired'));
        return;
      }
    }

    setIsProcessing(true);
    saveCheckoutDraft(formData);
    trackClarityEvent('checkout_payment_started', {
      cart_lines: items.length,
      cart_items: items.reduce((sum, item) => sum + item.quantity, 0),
      delivery_method: formData.shippingMethod,
      language,
    });
    upgradeClaritySession('checkout_started');

    try {
      // Build items array in correct Paytrail format
      const paytrailItems = items.map(item => {
        const productName = String(
          item.product.title ||
          item.product.name ||
          `${item.product.brand || ''} ${item.product.model || ''}`.trim() ||
          'Product'
        ).trim();
        const commerce = getProductCommerceSnapshot(item.product, {
          quantity: item.quantity,
          displayName: productName,
        });
        const stockLimit = commerce.stockQuantity;
        if (stockLimit && item.quantity > stockLimit) {
          const productLabel = `${item.product.brand || ''} ${item.product.model || item.product.name || ''}`.trim();
          throw new Error(
            `${productLabel}: ${checkoutText('error.onlyStockAvailable')} ${Math.floor(stockLimit)} ${checkoutText('error.availableSuffix')}`
          );
        }
        const deliveryRange = resolveDeliveryDayRange(item.product);

        return {
          qty: item.quantity,
          client_unit_price_cents: commerce.unitPriceInclVatCents,
          sku: commerce.sku || item.id,
          gtin: commerce.gtin,
          mpn: commerce.mpn,
          name: productName,
          vatPercentage: VAT_PERCENT,
          image_url: commerce.primaryImageUrl,
          brand: commerce.brand,
          model: commerce.model,
          size_text: resolveCheckoutProductSize(item.product),
          product_type: commerce.productType,
          stock_qty: commerce.stockQuantity,
          delivery_days_min: deliveryRange.min ?? commerce.deliveryDaysMin,
          delivery_days_max: deliveryRange.max ?? commerce.deliveryDaysMax,
          line_total_cents: commerce.lineTotalInclVatCents,
        };
      });

      const shippingCents = Math.round(shippingCost * 100);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mitra-auto.fi';
      const shippingAddress = formData.shippingMethod === 'home'
        ? {
          streetAddress: formData.shippingAddress,
          postalCode: formData.shippingPostalCode,
          city: formData.shippingCity,
          country: formData.shippingCountry,
        }
        : GARAGE_SHIPPING_ADDRESS;
      const billingAddress = formData.sameAsShipping
        ? shippingAddress
        : {
          streetAddress: formData.billingAddress,
          postalCode: formData.billingPostalCode,
          city: formData.billingCity,
          country: formData.billingCountry,
        };

      // Build payload for Paytrail payment
      const payload = {
        items: paytrailItems,
        currency: 'EUR',
        language,
        shipping_cents: shippingCents,
        customer: {
          email: formData.email,
          phone: normalizedPhone,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        success_url: `${origin}/checkout/success`,
        cancel_url: `${origin}/checkout/cancel`,
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
        saveCheckoutDraft(formData);
        toast.error(checkoutText('error.paymentStartFailed'));
        return;
      }

      // Check for backend error response
      if (data && data.error) {
        console.error('Backend error:', data);
        setIsProcessing(false);
        saveCheckoutDraft(formData);
        toast.error(`Error: ${data.message || checkoutText('error.paymentCreationFailed')}`);
        return;
      }

      // Check for redirect_url
      if (!data || !data.redirect_url) {
        console.error('Invalid payment response - no redirect_url:', data);
        setIsProcessing(false);
        saveCheckoutDraft(formData);
        toast.error(checkoutText('error.invalidServerResponse'));
        return;
      }

      // Success - redirect to Paytrail
      console.log('Payment initiated successfully, redirecting to:', data.redirect_url);
      saveCheckoutDraft(formData);
      window.location.href = data.redirect_url;

    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessing(false);
      saveCheckoutDraft(formData);

      const message = error instanceof Error ? error.message : '';
      toast.error(message || checkoutText('error.paymentStartFailed'));
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const vatAmount = totalPrice * VAT_RATE;
  const shippingCost = formData.shippingMethod === 'home' ? HOME_DELIVERY_FEE_EUR : 0;
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
            <span className="text-sm">{checkoutText('backToCart')}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className={`text-3xl sm:text-4xl mb-8 ${
          theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
        }`}>
          {checkoutText('title')}
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
              <input type="hidden" name="shippingCountry" autoComplete="shipping country-name" value={formData.shippingCountry} readOnly />
              <input type="hidden" name="billingCountry" autoComplete="billing country-name" value={formData.sameAsShipping ? formData.shippingCountry : formData.billingCountry} readOnly />
              {/* Contact Information */}
              <Card className={`p-6 ${
                theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <User className={`size-5 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`} />
                  <h2 className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                    {checkoutText('contactInfo')}
                  </h2>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="given-name" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                      {checkoutText('firstName')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="given-name"
                      name="given-name"
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
                    <Label htmlFor="family-name" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                      {checkoutText('lastName')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="family-name"
                      name="family-name"
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
                      {checkoutText('email')} <span className="text-red-500">*</span>
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
                    <Label htmlFor="tel" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                      {checkoutText('phone')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tel"
                      type="tel"
                      name="tel"
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
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
	                    <Truck className={`size-5 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`} />
	                    <h2 className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
	                      {checkoutText('deliveryMethod')}
	                    </h2>
	                  </div>

                  <div className={`inline-grid grid-cols-2 rounded-xl border p-1 ${
                    theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-[#E2E8F0] bg-[#F8FAFC]'
                  }`}>
	                    {([
                      { value: 'garage', label: checkoutText('garageDeliveryOption'), icon: Warehouse },
                      { value: 'home', label: checkoutText('homeDeliveryOption'), icon: Mailbox },
	                    ] as const).map((option) => {
                      const Icon = option.icon;
                      const active = formData.shippingMethod === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleInputChange('shippingMethod', option.value)}
                          className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            active
                              ? 'bg-[#FF6B00] text-white shadow-sm'
                              : theme === 'dark'
                                ? 'text-gray-300 hover:bg-white/10'
                                : 'text-[#475569] hover:bg-white'
                          }`}
                        >
                          <Icon className="size-4" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.shippingMethod === 'garage' ? (
                  <div className={`rounded-xl border p-4 ${
                    theme === 'dark' ? 'border-green-500/20 bg-green-500/10' : 'border-green-200 bg-green-50'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-green-200' : 'text-green-800'}`}>
                          {checkoutText('garageAddress')}
                        </p>
                        <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-[#475569]'}`}>
                          {checkoutText('garageShippingDescription')}
                        </p>
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                        {checkoutText('freeShipping')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="shipping-address-line1" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                        {checkoutText('address')} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="shipping-address-line1"
                        name="shipping address-line1"
                        autoComplete="shipping address-line1"
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
                        <Label htmlFor="shipping-address-level2" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                          {checkoutText('city')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shipping-address-level2"
                          name="shipping address-level2"
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
                        <Label htmlFor="shipping-postal-code" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                          {checkoutText('postalCode')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shipping-postal-code"
                          name="shipping postal-code"
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
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>
                      {checkoutText('homeShippingDescription')} €{HOME_DELIVERY_FEE_EUR.toFixed(2)}
                    </p>
                  </div>
                )}
              </Card>

              {/* Billing Address */}
              <Card className={`p-6 ${
                theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <Building className={`size-5 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`} />
                  <h2 className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                    {checkoutText('billingAddress')}
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
                    {checkoutText('sameAsShipping')}
                  </Label>
                </div>

                {!formData.sameAsShipping && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="billing-address-line1" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                        {checkoutText('address')} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="billing-address-line1"
                        name="billing address-line1"
                        autoComplete="billing address-line1"
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
                        <Label htmlFor="billing-address-level2" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                          {checkoutText('city')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="billing-address-level2"
                          name="billing address-level2"
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
                        <Label htmlFor="billing-postal-code" className={theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}>
                          {checkoutText('postalCode')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="billing-postal-code"
                          name="billing postal-code"
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
                  {checkoutText('acceptTermsPrefix')}
                  <a 
                    href="/legal" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline hover:no-underline ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {checkoutText('acceptTermsLink')}
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
                {isProcessing ? checkoutText('processing') : checkoutText('placeOrder')}
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
                  {checkoutText('cancelOrder')}
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
                {checkoutText('orderSummary')}
              </h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => {
                  const commerce = getProductCommerceSnapshot(item.product, {
                    quantity: item.quantity,
                    displayName: `${item.product.brand || ''} ${item.product.model || item.product.name || ''}`.trim(),
                  });

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
                            {item.quantity} × €{commerce.unitPriceInclVatEur.toFixed(2)}
                          </p>
                          <p className="text-sm text-[#FF6B00] mt-1">
                            €{commerce.lineTotalInclVatEur.toFixed(2)}
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
                    {checkoutText('subtotal')}
                  </span>
                  <span className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}>
                    €{subtotalWithVat.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}>
                    {formData.shippingMethod === 'home' ? checkoutText('homeDelivery') : checkoutText('deliveryToGarage')}
                  </span>
                  <span className={`${
                    shippingCost === 0 ? 'text-green-600' : theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                  }`}>
                    {shippingCost === 0 ? checkoutText('freeShipping') : `€${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'}>
                    {checkoutText('vat')}
                  </span>
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'}>
                    €{vatAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-[#E2E8F0]'} />

              <div className="flex items-center justify-between mt-4 mb-6">
                <span className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                  {checkoutText('total')}
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
                {isProcessing ? checkoutText('processing') : checkoutText('placeOrder')}
              </Button>

              <p className={`text-xs text-center mt-4 ${
                theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'
              }`}>
                {checkoutText('secureCheckout')}
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
                  {checkoutText('cancelOrder')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
