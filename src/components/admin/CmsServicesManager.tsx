import React, { useEffect, useState } from 'react';
import { ListChecks, RefreshCcw, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { getSupabaseClient } from '../../utils/supabase/client';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';

interface CmsService {
  id: string;
  name: string;
  category?: string;
  price?: number | null;
  is_active?: boolean | null;
  description?: string | null;
}

const fallbackServices: CmsService[] = [
  { id: 'tire-change', name: 'Tire Change', category: 'Tire Work', price: 49.9, is_active: true },
  { id: 'tire-storage', name: 'Tire Storage', category: 'Tire Hotel', price: 99, is_active: true },
  { id: 'inspection', name: 'Vehicle Inspection', category: 'Maintenance', price: 89, is_active: true },
  { id: 'oil-change', name: 'Oil Change', category: 'Maintenance', price: 69, is_active: true },
];

export function CmsServicesManager() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [services, setServices] = useState<CmsService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServices = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { data, error: fetchError } = await supabase
        .from('services')
        .select('id, name, category, price, is_active, description')
        .order('name');

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setServices(data);
      } else {
        setServices(fallbackServices);
        setError(
          language === 'fi'
            ? 'Palveluita ei löytynyt CMS:stä. Näytetään esimerkkilista.'
            : 'No services found in CMS. Showing sample list instead.'
        );
      }
    } catch (err) {
      console.error('Error loading CMS services list:', err);
      setServices(fallbackServices);
      setError(
        language === 'fi'
          ? 'Palvelulistaa ei voitu ladata Supabasesta. Näytetään esimerkit.'
          : 'Could not load services from Supabase. Showing sample data instead.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  return (
    <Card className={theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : ''}>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                <ListChecks className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Palvelulistan hallinta' : 'Services list manager'}
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fi'
                    ? 'CMS ohjaa varauspalvelun ja palvelusivun sisältöä.'
                    : 'Control the services shown in the booking flow and services page.'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadServices} className={theme === 'dark' ? 'border-white/10 text-white' : ''}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              {language === 'fi' ? 'Päivitä' : 'Refresh'}
            </Button>
          </div>
        </div>

        <Separator className={theme === 'dark' ? 'bg-white/10' : ''} />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : services.length === 0 ? (
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
            {language === 'fi' ? 'Ei palveluja näytettäväksi.' : 'No services to display.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'fi' ? 'Palvelu' : 'Service'}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {language === 'fi' ? 'Kategoria' : 'Category'}
                  </TableHead>
                  <TableHead>{language === 'fi' ? 'Hinta' : 'Price'}</TableHead>
                  <TableHead>{language === 'fi' ? 'Tila' : 'Status'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {service.name}
                        </span>
                        {service.description && (
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {service.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          {service.category || (language === 'fi' ? 'Määrittelemätön' : 'Unspecified')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.price != null ? `${service.price.toFixed(2)} €` : language === 'fi' ? 'N/A' : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {service.is_active === false ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <ToggleLeft className="w-3 h-3 mr-1" />
                          {language === 'fi' ? 'Poissa' : 'Inactive'}
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                          <ToggleRight className="w-3 h-3 mr-1" />
                          {language === 'fi' ? 'Aktiivinen' : 'Active'}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {language === 'fi'
            ? 'Näkyy CMS:ssä aina – jos Supabase-taulu on tyhjä, näytetään esimerkit, jotta hallintanäkymä ei katoa.'
            : 'Always visible in CMS – if the Supabase table is empty, sample data is shown so the manager never disappears.'}
        </p>
      </div>
    </Card>
  );
}