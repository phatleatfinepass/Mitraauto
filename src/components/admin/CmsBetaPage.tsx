import React from 'react';
import { useTheme } from '../ThemeContext';
import { AdminSchedulePage } from './AdminSchedulePage';
import { CmsServicesManager } from './CmsServicesManager';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowDown, Calendar, ListChecks, LogOut } from 'lucide-react';

interface CmsBetaPageProps {
  onLogout: () => Promise<void>;
}

export function CmsBetaPage({ onLogout }: CmsBetaPageProps) {
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
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-green-500 hover:bg-green-500 text-white">CMS Admin</Badge>
              <h1 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Content Management System
              </h1>
            </div>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
              Manage schedules and services from a unified control panel. Changes are saved directly to the database.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
                <a href="#cms-schedule" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule Manager
                  <ArrowDown className="w-4 h-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className={theme === 'dark' ? 'border-white/10 text-white' : ''}>
                <a href="#cms-services" className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4" />
                  Services Manager
                  <ArrowDown className="w-4 h-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                onClick={onLogout}
                className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-white/10' : ''}`}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              theme === 'dark' ? 'bg-white/5 text-gray-200' : 'bg-gray-50 text-gray-700'
            }`}
          >
            <div className="font-semibold">Admin Access</div>
            <p className="mt-1">
              You have full CMS permissions.
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