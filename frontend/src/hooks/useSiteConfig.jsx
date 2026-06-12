import React, { createContext, useContext, useEffect, useState } from 'react';

const DEFAULTS = {
  business_name:          'Special Need Vehicle Rental',
  business_abn:           '',
  business_phone:         '',
  business_address:       '',
  business_email:         '',
  business_hours:         'Mon – Sat · 8:00 AM – 6:00 PM AEST',
  hero_headline:          'Special Need Vehicle Rental',
  hero_subheadline:       'Our vehicles, available to you — safe, accessible hire for our community.',
  hero_tagline:           'The same fleet our elderly care residents rely on, available to hire when not in use. Trusted, insured, and ready.',
  hero_cta_text:          'Check Availability',
  banner_enabled:         '0',
  banner_message:         '',
  maintenance_enabled:    '0',
  maintenance_message:    'The site is currently undergoing scheduled maintenance. We will be back shortly.',
  maintenance_start:      '',
  maintenance_end:        '',
  legal_terms_filename:   '',
  legal_privacy_filename: '',
};

export function isMaintenanceActive(config) {
  if (config.maintenance_enabled !== '1') return false;
  if (!config.maintenance_start || !config.maintenance_end) return true;
  const now = Date.now();
  const start = new Date(config.maintenance_start).getTime();
  const end   = new Date(config.maintenance_end).getTime();
  if (isNaN(start) || isNaN(end)) return true;
  return now >= start && now <= end;
}

const SiteConfigContext = createContext(DEFAULTS);

export function SiteConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULTS);

  useEffect(() => {
    fetch('/api/v1/public/site-config', { credentials: 'include' })
      .then(r => r.json())
      .then(json => { if (json?.data) setConfig({ ...DEFAULTS, ...json.data }); })
      .catch(() => {});
  }, []);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
