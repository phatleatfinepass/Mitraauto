import React from 'react';
import { useTheme } from '../ThemeContext';
import { AdminSchedulePage } from './AdminSchedulePage';
import { CmsServicesManager } from './CmsServicesManager';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowDown, Calendar, ListChecks } from 'lucide-react';

export function CmsBetaPage() {
  const { theme } = useTheme();

  return (
    <div className={theme === 'dark' ? 'bg-[#11141A]' : 'bg-gray-50'}>
      <div
        className={`border-b ${
          theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-6 py-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-3">
              <Badge className="bg-amber-500 hover:bg-amber-500 text-white">v0.1 Beta</Badge>
              <h1 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                CMS control center
              </h1>
            </div>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
              Manage the admin schedule and services list from a single CMS view. Use the quick links below to jump to
              the section you want to update.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
                <a href="#cms-schedule" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule controls
                  <ArrowDown className="w-4 h-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className={theme === 'dark' ? 'border-white/10 text-white' : ''}>
                <a href="#cms-services" className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4" />
                  Services manager
                  <ArrowDown className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              theme === 'dark' ? 'bg-white/5 text-gray-200' : 'bg-gray-50 text-gray-700'
            }`}
          >
            <div className="font-semibold">Why this matters</div>
            <p className="mt-1">
              Both the schedule and services depend on Supabase. Keeping them together highlights missing tables or
              permissions early.
            </p>
          </div>
        </div>
      </div>

      <div id="cms-schedule" className="max-w-[1800px] mx-auto px-6 pt-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className={`text-xs uppercase tracking-wide ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Schedule
            </p>
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              CMS-powered booking controls
            </h2>
          </div>
        </div>
        <AdminSchedulePage />
      </div>

      <div id="cms-services" className="max-w-[1800px] mx-auto px-6 pb-12">
        <Separator className={`my-10 ${theme === 'dark' ? 'bg-white/10' : ''}`} />
                <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <p className={`text-xs uppercase tracking-wide ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Services
            </p>
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              CMS services list manager
            </h2>
          </div>
        </div>
        <CmsServicesManager />
      </div>
    </div>
  );
}