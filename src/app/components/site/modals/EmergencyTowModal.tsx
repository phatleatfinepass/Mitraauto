import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';
import { MapPin, Phone, Loader2, CheckCircle2, AlertCircle, Navigation, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../LanguageContext';
import { supabase } from '../../../utils/supabase/client';

interface EmergencyTowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'choose' | 'gps' | 'manual';

export function EmergencyTowModal({ open, onOpenChange }: EmergencyTowModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('choose');
  
  // Debug logging
  React.useEffect(() => {
    console.log('🔔 EmergencyTowModal state changed - open:', open);
  }, [open]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    licensePlate: '',
    street: '',
    postcode: '',
    city: '',
    coordinates: '',
    phone: '',
    lat: null as number | null,
    lng: null as number | null,
  });

  const handleChooseGPS = () => {
    setError('');
    setGpsLoading(true);

    if (!navigator.geolocation) {
      setError(t('emergency.error.noGps'));
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        setFormData((prev) => ({
          ...prev,
          coordinates,
          lat: latitude,
          lng: longitude,
        }));
        setStep('gps');
        setGpsLoading(false);
      },
      (error) => {
        let errorMessage;
        
        if (error.code === 1) {
          errorMessage = t('emergency.error.gpsPermission');
        } else if (error.code === 2) {
          errorMessage = t('emergency.error.gpsUnavailable');
        } else if (error.code === 3) {
          errorMessage = t('emergency.error.gpsTimeout');
        } else {
          errorMessage = t('emergency.error.gpsGeneral');
        }
        
        setError(errorMessage);
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleChooseManual = () => {
    setError('');
    setStep('manual');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate phone number
    if (!formData.customerName || formData.customerName.trim().length < 2) {
      setError(t('emergency.error.noName'));
      setLoading(false);
      return;
    }

    if (!formData.licensePlate || formData.licensePlate.trim().length < 2) {
      setError(t('emergency.error.noLicensePlate'));
      setLoading(false);
      return;
    }

    if (!formData.phone || formData.phone.trim().length < 6) {
      setError(t('emergency.error.noPhone'));
      setLoading(false);
      return;
    }

    // Validate based on mode
    if (step === 'gps') {
      if (!formData.lat || !formData.lng) {
        setError(t('emergency.error.noLocation'));
        setLoading(false);
        return;
      }
    } else if (step === 'manual') {
      if (!formData.street.trim() || !formData.postcode.trim() || !formData.city.trim()) {
        setError(t('emergency.error.noLocation'));
        setLoading(false);
        return;
      }
    }

    try {
      // Prepare payload for Supabase RPC
      let payload: any;

      if (step === 'gps') {
        payload = {
          p_customer_name: formData.customerName.trim(),
          p_license_plate: formData.licensePlate.trim().toUpperCase(),
          p_phone: formData.phone.trim(),
          p_lat: formData.lat,
          p_lng: formData.lng,
        };
      } else {
        payload = {
          p_customer_name: formData.customerName.trim(),
          p_license_plate: formData.licensePlate.trim().toUpperCase(),
          p_phone: formData.phone.trim(),
          p_street_address: formData.street.trim(),
          p_postcode: formData.postcode.trim(),
          p_city: formData.city.trim(),
        };
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('SUPABASE URL:', supabase.url);
        console.log('ANON KEY prefix:', supabase.key.slice(0, 8));
        console.log('RPC payload keys:', Object.keys(payload));
      }

      console.log('📞 Calling emergency_roadside_create RPC with payload:', payload);

      // Call Supabase RPC
      const { data, error: rpcError } = await supabase.rpc('emergency_roadside_create', payload);

      if (rpcError) {
        console.error('❌ RPC Error:', rpcError);
        throw new Error(rpcError.message || 'Failed to submit request');
      }

      console.log('✅ Emergency request created:', data);
      
      setRequestId(data?.request_id ?? null);
      setSuccess(true);
      setLoading(false);

      // Reset form and close after success message
      setTimeout(() => {
        handleReset();
        onOpenChange(false);
      }, 5000);
    } catch (err: any) {
      console.error('❌ Submit error:', err);
      setError(err.message || t('emergency.error.submit'));
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('choose');
    setSuccess(false);
    setError('');
    setRequestId(null);
    setFormData({
      customerName: '',
      licensePlate: '',
      street: '',
      postcode: '',
      city: '',
      coordinates: '',
      phone: '',
      lat: null,
      lng: null,
    });
  };

  const handleClose = () => {
    if (!loading && !gpsLoading) {
      handleReset();
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    setError('');
    setStep('choose');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} modal>
      <DialogContent className="w-full min-w-[320px] max-w-[calc(100vw-2rem)] sm:max-w-[500px] md:max-w-[560px] max-h-[90vh] overflow-y-auto">
        {/* Subtle Gradient Blobs Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-ring/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/3 rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-full bg-accent/10 p-2 transition-all hover:shadow-[0_0_20px_rgba(231,76,60,0.3)] hover:bg-accent/15">
              <Phone className="h-5 w-5 text-accent" />
            </div>
            {t('emergency.title')}
          </DialogTitle>
          <DialogDescription>
            {t('emergency.description')}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8">
            <Alert className="border-green-500/50 bg-green-500/10 transition-all hover:shadow-[0_0_30px_rgba(52,199,89,0.2)] hover:border-green-500/70">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <AlertDescription className="ml-2 text-green-600 dark:text-green-400">
                {t('emergency.success')}
                {requestId && (
                  <span className="block mt-2 text-xs opacity-80">
                    Request ID: {requestId}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            {/* Step 1: Choose Method */}
            {step === 'choose' && (
              <div className="space-y-4 py-4">
                <div className="text-center space-y-2 mb-6 transition-all hover:shadow-[0_0_25px_rgba(0,113,227,0.1)]">
                  <h3 className="font-semibold">{t('emergency.chooseMethod')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('emergency.chooseMethodDesc')}
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive" className="transition-all hover:shadow-[0_0_30px_rgba(255,59,48,0.2)] hover:border-destructive/70">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Button
                    type="button"
                    className="w-full h-14 bg-accent hover:bg-accent/90 text-white"
                    onClick={handleChooseGPS}
                    disabled={gpsLoading}
                  >
                    {gpsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t('emergency.gettingLocation')}
                      </>
                    ) : (
                      <>
                        <Navigation className="mr-2 h-5 w-5" />
                        {t('emergency.useGpsButton')}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14"
                    onClick={handleChooseManual}
                    disabled={gpsLoading}
                  >
                    <MapPin className="mr-2 h-5 w-5" />
                    {t('emergency.useManualButton')}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2a: GPS Location Form */}
            {step === 'gps' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mb-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('emergency.switchToManual')}
                </Button>

                {/* GPS Coordinates Display */}
                <Alert className="bg-green-500/10 border-green-500/50 transition-all hover:shadow-[0_0_30px_rgba(52,199,89,0.2)] hover:border-green-500/70">
                  <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="ml-2 text-green-600 dark:text-green-400">
                    {t('emergency.gpsActive')}: {formData.coordinates}
                  </AlertDescription>
                </Alert>

                {/* Phone Number */}
                <div className="space-y-2 group">
                  <Label htmlFor="customer-name-gps" className="transition-all group-hover:text-ring">{t('emergency.customerName')}</Label>
                  <Input
                    id="customer-name-gps"
                    type="text"
                    placeholder={t('emergency.customerNamePlaceholder')}
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                    required
                  />
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="license-plate-gps" className="transition-all group-hover:text-ring">{t('emergency.licensePlate')}</Label>
                  <Input
                    id="license-plate-gps"
                    type="text"
                    placeholder={t('emergency.licensePlatePlaceholder')}
                    value={formData.licensePlate}
                    onChange={(e) =>
                      setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })
                    }
                    className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                    required
                  />
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="phone-gps" className="transition-all group-hover:text-ring">{t('emergency.phone')}</Label>
                  <Input
                    id="phone-gps"
                    type="tel"
                    placeholder="+358 40 123 4567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="transition-all hover:shadow-[0_0_30px_rgba(255,59,48,0.2)] hover:border-destructive/70">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 h-12"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('emergency.sending')}
                    </>
                  ) : (
                    t('emergency.submit')
                  )}
                </Button>
              </form>
            )}

            {/* Step 2b: Manual Address Form */}
            {step === 'manual' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mb-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('emergency.switchToGps')}
                </Button>

                {/* Manual Address Fields */}
                <div className="space-y-3">
                  <div className="space-y-2 group">
                    <Label htmlFor="street" className="transition-all group-hover:text-ring">{t('emergency.street')}</Label>
                    <Input
                      id="street"
                      type="text"
                      placeholder={t('emergency.streetPlaceholder')}
                      value={formData.street}
                      onChange={(e) =>
                        setFormData({ ...formData, street: e.target.value })
                      }
                      className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2 group">
                      <Label htmlFor="postcode" className="transition-all group-hover:text-ring">{t('emergency.postcode')}</Label>
                      <Input
                        id="postcode"
                        type="text"
                        placeholder="00100"
                        value={formData.postcode}
                        onChange={(e) =>
                          setFormData({ ...formData, postcode: e.target.value })
                        }
                        className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <Label htmlFor="city" className="transition-all group-hover:text-ring">{t('emergency.city')}</Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="Helsinki"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2 group">
                  <Label htmlFor="customer-name-manual" className="transition-all group-hover:text-ring">{t('emergency.customerName')}</Label>
                  <Input
                    id="customer-name-manual"
                    type="text"
                    placeholder={t('emergency.customerNamePlaceholder')}
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                    required
                  />
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="license-plate-manual" className="transition-all group-hover:text-ring">{t('emergency.licensePlate')}</Label>
                  <Input
                    id="license-plate-manual"
                    type="text"
                    placeholder={t('emergency.licensePlatePlaceholder')}
                    value={formData.licensePlate}
                    onChange={(e) =>
                      setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })
                    }
                    className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                    required
                  />
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="phone-manual" className="transition-all group-hover:text-ring">{t('emergency.phone')}</Label>
                  <Input
                    id="phone-manual"
                    type="tel"
                    placeholder="+358 40 123 4567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="transition-all hover:shadow-[0_0_30px_rgba(255,59,48,0.2)] hover:border-destructive/70">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 h-12"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('emergency.sending')}
                    </>
                  ) : (
                    t('emergency.submit')
                  )}
                </Button>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
