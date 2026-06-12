import React, { useState, useEffect, useRef } from 'react';
import AdminNav from '../../components/AdminNav.jsx';
import { adminGetSiteContent, adminSaveSiteContent, adminUploadLegalDoc } from '../../utils/api.js';

// ── small helpers ────────────────────────────────────────────────────────────

function Section({ title, description, children }) {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
      {description && <p className="text-sm text-gray-500 mb-5">{description}</p>}
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
        checked ? 'bg-brand-600' : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function SaveBtn({ saving, saved, error, onClick, label = 'Save' }) {
  return (
    <div className="flex items-center gap-3 mt-5">
      <button onClick={onClick} disabled={saving} className="btn-primary px-5 py-2 text-sm">
        {saving ? 'Saving…' : label}
      </button>
      {saved && <span className="text-sm text-emerald-600 font-medium">✓ Saved</span>}
      {error && <span className="text-sm text-rose-600">{error}</span>}
    </div>
  );
}

function useSave() {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');
  const timer = useRef(null);

  async function save(keys) {
    setSaving(true); setSaved(false); setError('');
    try {
      await adminSaveSiteContent(keys);
      setSaved(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }
  return { saving, saved, error, save };
}

// ── main component ───────────────────────────────────────────────────────────

export default function SiteSettings() {
  const [loaded, setLoaded] = useState(false);

  // Maintenance
  const [maintEnabled, setMaintEnabled] = useState(false);
  const [maintMessage, setMaintMessage] = useState('');
  const [maintStart,   setMaintStart]   = useState('');
  const [maintEnd,     setMaintEnd]     = useState('');
  const maint = useSave();

  // Banner
  const [bannerEnabled,  setBannerEnabled]  = useState(false);
  const [bannerMessage,  setBannerMessage]  = useState('');
  const banner = useSave();

  // Business info
  const [bizName,    setBizName]    = useState('');
  const [bizAbn,     setBizAbn]     = useState('');
  const [bizPhone,   setBizPhone]   = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizEmail,   setBizEmail]   = useState('');
  const [bizHours,   setBizHours]   = useState('');
  const biz = useSave();

  // Landing page
  const [heroHeadline,    setHeroHeadline]    = useState('');
  const [heroSubheadline, setHeroSubheadline] = useState('');
  const [heroTagline,     setHeroTagline]     = useState('');
  const [heroCtaText,     setHeroCtaText]     = useState('');
  const landing = useSave();

  // Legal docs
  const [termsFilename,   setTermsFilename]   = useState('');
  const [privacyFilename, setPrivacyFilename] = useState('');
  const [termsUploading,   setTermsUploading]   = useState(false);
  const [privacyUploading, setPrivacyUploading] = useState(false);
  const [termsUploadMsg,   setTermsUploadMsg]   = useState('');
  const [privacyUploadMsg, setPrivacyUploadMsg] = useState('');
  const termsRef   = useRef(null);
  const privacyRef = useRef(null);

  useEffect(() => {
    adminGetSiteContent()
      .then(({ data }) => {
        const v = (k) => data[k]?.value ?? '';
        setMaintEnabled(v('maintenance_enabled') === '1');
        setMaintMessage(v('maintenance_message'));
        setMaintStart(v('maintenance_start') ? toLocalDatetime(v('maintenance_start')) : '');
        setMaintEnd(v('maintenance_end')     ? toLocalDatetime(v('maintenance_end'))   : '');
        setBannerEnabled(v('banner_enabled') === '1');
        setBannerMessage(v('banner_message'));
        setBizName(v('business_name'));
        setBizAbn(v('business_abn'));
        setBizPhone(v('business_phone'));
        setBizAddress(v('business_address'));
        setBizEmail(v('business_email'));
        setBizHours(v('business_hours'));
        setHeroHeadline(v('hero_headline'));
        setHeroSubheadline(v('hero_subheadline'));
        setHeroTagline(v('hero_tagline'));
        setHeroCtaText(v('hero_cta_text'));
        setTermsFilename(v('legal_terms_filename'));
        setPrivacyFilename(v('legal_privacy_filename'));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  function toLocalDatetime(isoUtc) {
    if (!isoUtc) return '';
    const d = new Date(isoUtc);
    if (isNaN(d)) return '';
    // datetime-local expects YYYY-MM-DDTHH:mm in local time
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function toUtcIso(localDatetime) {
    if (!localDatetime) return '';
    return new Date(localDatetime).toISOString();
  }

  async function handleUpload(type, file) {
    if (!file) return;
    const setUploading = type === 'terms' ? setTermsUploading : setPrivacyUploading;
    const setMsg       = type === 'terms' ? setTermsUploadMsg : setPrivacyUploadMsg;
    const setFilename  = type === 'terms' ? setTermsFilename  : setPrivacyFilename;
    setUploading(true); setMsg('');
    try {
      const { filename } = await adminUploadLegalDoc(type, file);
      setFilename(filename);
      setMsg(`✓ Uploaded: ${filename}`);
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }

  if (!loaded) {
    return (
      <div className="p-8 text-center text-gray-500">
        <AdminNav />
        <p className="mt-8">Loading site settings…</p>
      </div>
    );
  }

  return (
    <>
      <AdminNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage maintenance mode, site content, and legal documents. Changes publish immediately after saving.
          </p>
        </div>

        {/* ── 1. Maintenance Mode ── */}
        <Section
          title="Maintenance Mode"
          description="When enabled, the public site shows a maintenance page. Admin access is never blocked."
        >
          <div className="flex items-center gap-3 mb-5">
            <Toggle checked={maintEnabled} onChange={setMaintEnabled} label="Enable maintenance mode" />
            <span className={`text-sm font-medium ${maintEnabled ? 'text-amber-600' : 'text-gray-500'}`}>
              {maintEnabled ? 'Maintenance is ON' : 'Site is live'}
            </span>
          </div>

          <Field label="Maintenance Message" hint="Shown to visitors during maintenance.">
            <textarea
              value={maintMessage}
              onChange={e => setMaintMessage(e.target.value)}
              rows={3}
              className="input w-full"
              placeholder="The site is currently undergoing scheduled maintenance. We will be back shortly."
            />
          </Field>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Optional Schedule — leave blank for manual on/off
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Start date & time">
                <input
                  type="datetime-local"
                  value={maintStart}
                  onChange={e => setMaintStart(e.target.value)}
                  className="input w-full"
                />
              </Field>
              <Field label="End date & time">
                <input
                  type="datetime-local"
                  value={maintEnd}
                  onChange={e => setMaintEnd(e.target.value)}
                  className="input w-full"
                />
              </Field>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              If a schedule is set, the maintenance page only shows within that window (maintenance must also be enabled above).
            </p>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => maint.save({
                maintenance_enabled: maintEnabled ? '1' : '0',
                maintenance_message: maintMessage,
                maintenance_start:   toUtcIso(maintStart),
                maintenance_end:     toUtcIso(maintEnd),
              })}
              disabled={maint.saving}
              className="btn-primary px-5 py-2 text-sm"
            >
              {maint.saving ? 'Saving…' : 'Save Maintenance Settings'}
            </button>
            <button
              onClick={() => {
                setMaintEnabled(false);
                setMaintStart('');
                setMaintEnd('');
                maint.save({ maintenance_enabled: '0', maintenance_start: '', maintenance_end: '' });
              }}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Cancel / Disable
            </button>
            {maint.saved  && <span className="text-sm text-emerald-600 font-medium">✓ Saved</span>}
            {maint.error  && <span className="text-sm text-rose-600">{maint.error}</span>}
          </div>
        </Section>

        {/* ── 2. Announcement Banner ── */}
        <Section
          title="Announcement Banner"
          description="A dismissible notice bar shown at the top of every public page. Use for special offers, seasonal messages, or important notices."
        >
          <div className="flex items-center gap-3 mb-4">
            <Toggle checked={bannerEnabled} onChange={setBannerEnabled} label="Show banner" />
            <span className={`text-sm font-medium ${bannerEnabled ? 'text-brand-600' : 'text-gray-500'}`}>
              {bannerEnabled ? 'Banner is visible' : 'Banner is hidden'}
            </span>
          </div>
          <Field label="Banner Message">
            <textarea
              value={bannerMessage}
              onChange={e => setBannerMessage(e.target.value)}
              rows={2}
              className="input w-full"
              placeholder="e.g. 🎉 Book before Friday and get 10% off with code EARLYBIRD"
            />
          </Field>
          <SaveBtn
            {...banner}
            label="Save Banner"
            onClick={() => banner.save({ banner_enabled: bannerEnabled ? '1' : '0', banner_message: bannerMessage })}
          />
        </Section>

        {/* ── 3. Business Information ── */}
        <Section
          title="Business Information"
          description="Displayed in the site header, footer, emails, and booking confirmations."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Business Name">
              <input value={bizName} onChange={e => setBizName(e.target.value)} className="input w-full" />
            </Field>
            <Field label="ABN" hint="e.g. 12 345 678 901">
              <input value={bizAbn} onChange={e => setBizAbn(e.target.value)} className="input w-full" placeholder="XX XXX XXX XXX" />
            </Field>
            <Field label="Phone Number">
              <input value={bizPhone} onChange={e => setBizPhone(e.target.value)} className="input w-full" placeholder="0434 620 086" />
            </Field>
            <Field label="Contact Email">
              <input type="email" value={bizEmail} onChange={e => setBizEmail(e.target.value)} className="input w-full" placeholder="info@example.com.au" />
            </Field>
          </div>
          <Field label="Business Address">
            <input value={bizAddress} onChange={e => setBizAddress(e.target.value)} className="input w-full" placeholder="483 Hume Highway, Yagoona NSW 2199" />
          </Field>
          <Field label="Trading Hours" hint="Shown in the footer and landing page.">
            <input value={bizHours} onChange={e => setBizHours(e.target.value)} className="input w-full" placeholder="Mon – Sat · 8:00 AM – 6:00 PM AEST" />
          </Field>
          <SaveBtn
            {...biz}
            label="Save Business Info"
            onClick={() => biz.save({
              business_name: bizName, business_abn: bizAbn, business_phone: bizPhone,
              business_address: bizAddress, business_email: bizEmail, business_hours: bizHours,
            })}
          />
        </Section>

        {/* ── 4. Landing Page Content ── */}
        <Section
          title="Landing Page"
          description="Text shown in the hero section of the home page."
        >
          <Field label="Main Headline" hint="Large bold text at the top of the page.">
            <input value={heroHeadline} onChange={e => setHeroHeadline(e.target.value)} className="input w-full" />
          </Field>
          <Field label="Subheadline" hint="One sentence below the headline.">
            <input value={heroSubheadline} onChange={e => setHeroSubheadline(e.target.value)} className="input w-full" />
          </Field>
          <Field label="Tagline" hint="Smaller supporting text below the subheadline.">
            <textarea value={heroTagline} onChange={e => setHeroTagline(e.target.value)} rows={2} className="input w-full" />
          </Field>
          <Field label="CTA Button Text" hint='The main action button, e.g. "Check Availability".'>
            <input value={heroCtaText} onChange={e => setHeroCtaText(e.target.value)} className="input w-full" />
          </Field>
          <SaveBtn
            {...landing}
            label="Publish Landing Content"
            onClick={() => landing.save({
              hero_headline: heroHeadline, hero_subheadline: heroSubheadline,
              hero_tagline: heroTagline, hero_cta_text: heroCtaText,
            })}
          />
        </Section>

        {/* ── 5. Legal Documents ── */}
        <Section
          title="Legal Documents"
          description="Upload a PDF to replace the default Terms & Conditions or Privacy Policy page. The uploaded file is served directly — visitors can view or download it. Max 10 MB per file."
        >
          {/* Terms */}
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Terms &amp; Conditions</p>
            {termsFilename ? (
              <p className="text-xs text-gray-500 mb-3">
                Current file: <a href="/uploads/legal/terms.pdf" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{termsFilename}</a>
              </p>
            ) : (
              <p className="text-xs text-gray-400 mb-3">No PDF uploaded — default built-in page is shown.</p>
            )}
            <div className="flex items-center gap-3">
              <input
                ref={termsRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => handleUpload('terms', e.target.files?.[0])}
              />
              <button
                onClick={() => termsRef.current?.click()}
                disabled={termsUploading}
                className="btn-secondary px-4 py-1.5 text-sm"
              >
                {termsUploading ? 'Uploading…' : termsFilename ? 'Replace PDF' : 'Upload PDF'}
              </button>
              {termsUploadMsg && (
                <span className={`text-xs ${termsUploadMsg.startsWith('Error') ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {termsUploadMsg}
                </span>
              )}
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Privacy Policy</p>
            {privacyFilename ? (
              <p className="text-xs text-gray-500 mb-3">
                Current file: <a href="/uploads/legal/privacy.pdf" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{privacyFilename}</a>
              </p>
            ) : (
              <p className="text-xs text-gray-400 mb-3">No PDF uploaded — default built-in page is shown.</p>
            )}
            <div className="flex items-center gap-3">
              <input
                ref={privacyRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => handleUpload('privacy', e.target.files?.[0])}
              />
              <button
                onClick={() => privacyRef.current?.click()}
                disabled={privacyUploading}
                className="btn-secondary px-4 py-1.5 text-sm"
              >
                {privacyUploading ? 'Uploading…' : privacyFilename ? 'Replace PDF' : 'Upload PDF'}
              </button>
              {privacyUploadMsg && (
                <span className={`text-xs ${privacyUploadMsg.startsWith('Error') ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {privacyUploadMsg}
                </span>
              )}
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
