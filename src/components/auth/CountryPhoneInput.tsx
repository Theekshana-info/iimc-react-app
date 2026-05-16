import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getCountries, getCountryCallingCode, CountryCode } from 'libphonenumber-js';
import { Label } from '@/components/ui/label';
import { ChevronDown, Search, Phone } from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

const COUNTRY_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

/** flagcdn.com gives a reliable 20×15 PNG for any ISO 3166-1 code */
function getFlagUrl(code: string): string {
  return `https://flagcdn.com/20x15/${code.toLowerCase()}.png`;
}

interface CountryEntry {
  code: CountryCode;
  name: string;
  dialCode: string;
}

function buildCountryList(): CountryEntry[] {
  return getCountries()
    .flatMap((code) => {
      try {
        return [{
          code,
          name: COUNTRY_NAMES.of(code) ?? code,
          dialCode: `+${getCountryCallingCode(code)}`,
        }];
      } catch {
        return [];
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

const ALL_COUNTRIES = buildCountryList();

/** Best-effort: derive country from browser locale (e.g. "en-LK" → "LK") */
function detectCountry(): CountryCode {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const tag = (new Intl.Locale(locale) as any).region as string | undefined;
    if (tag && ALL_COUNTRIES.some((c) => c.code === tag)) return tag as CountryCode;
  } catch { /* ignore */ }
  return 'LK';
}

// ─── FlagImg component ───────────────────────────────────────────────────────

const FlagImg = ({ code, size = 'sm' }: { code: string; size?: 'sm' | 'md' }) => (
  <img
    src={getFlagUrl(code)}
    alt={code}
    width={size === 'md' ? 24 : 20}
    height={size === 'md' ? 18 : 15}
    className="rounded-[2px] object-cover shrink-0"
    loading="lazy"
    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
  />
);

// ─── component ───────────────────────────────────────────────────────────────

interface CountryPhoneInputProps {
  /** Called whenever the combined value changes, e.g. "+94 771234567" */
  onChange?: (value: string) => void;
  /** Validation error message */
  error?: string;
  /** Prefilled value, e.g. "+94 771234567" */
  value?: string;
  /** Default country code for initial selection */
  defaultCountry?: CountryCode;
  /** Optional label override */
  label?: string;
  /** Hide the label when a parent renders its own */
  showLabel?: boolean;
}

export const CountryPhoneInput = React.forwardRef<
  HTMLInputElement,
  CountryPhoneInputProps
>(({ onChange, error, value, defaultCountry, label, showLabel = true }, ref) => {
  const [selected, setSelected] = useState<CountryEntry>(() => {
    const code = defaultCountry && ALL_COUNTRIES.some((c) => c.code === defaultCountry)
      ? defaultCountry
      : detectCountry();
    return ALL_COUNTRIES.find((c) => c.code === code) ?? ALL_COUNTRIES[0];
  });
  const [phoneLocal, setPhoneLocal] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const lastValueRef = useRef<string | undefined>(undefined);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const setInputRef = (node: HTMLInputElement | null) => {
    (phoneRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
  };

  // Notify parent
  useEffect(() => {
    const localDigits = phoneLocal.replace(/\D/g, '');
    const full = localDigits
      ? `${selected.dialCode} ${localDigits}`
      : '';
    lastValueRef.current = full;
    onChange?.(full);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, phoneLocal]);

  useEffect(() => {
    if (value === undefined) return;
    if (value === lastValueRef.current) return;
    lastValueRef.current = value;
    const trimmed = value.trim();
    if (!trimmed) {
      setPhoneLocal('');
      return;
    }
    const normalized = trimmed.replace(/\s+/g, '');
    if (normalized.startsWith('+')) {
      const match = ALL_COUNTRIES
        .map((c) => c.dialCode)
        .filter((dial) => normalized.startsWith(dial))
        .sort((a, b) => b.length - a.length)[0];

      if (match) {
        const found = ALL_COUNTRIES.find((c) => c.dialCode === match);
        if (found) setSelected(found);
        setPhoneLocal(normalized.slice(match.length));
        return;
      }
    }

    setPhoneLocal(normalized.replace(/^\+/, ''));
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [search]);

  const selectCountry = (c: CountryEntry) => {
    setSelected(c);
    setOpen(false);
    setSearch('');
    setTimeout(() => phoneRef.current?.focus(), 40);
  };

  return (
    <div className="space-y-1.5 w-full">
      {showLabel && (
        <Label htmlFor="phoneLocal" className={error ? 'text-destructive' : ''}>
          {label || 'Phone Number'}
        </Label>
      )}

      {/* ── Unified wrapper: matches h-12 rounded-xl neu-inset from Input ─ */}
      <div className="relative" ref={wrapperRef}>
        <div
          className={[
            'flex items-stretch h-12 w-full rounded-xl bg-background',
            'transition-all duration-150 neu-inset',
            // focus / error ring to match the Input component exactly
            isFocused || open
              ? 'outline outline-2 outline-[#268ad1]'
              : '',
            error
              ? 'outline outline-2 outline-destructive'
              : '',
          ].join(' ')}
        >
          {/* ── Country trigger ──────────────────────────────────────── */}
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={`Country: ${selected.name} ${selected.dialCode}`}
            onClick={() => setOpen((o) => !o)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={[
              'flex items-center gap-2 pl-4 pr-3 shrink-0 rounded-l-xl',
              'hover:bg-white/30 dark:hover:bg-white/10 transition-colors duration-150',
              'focus:outline-none',
            ].join(' ')}
          >
            <FlagImg code={selected.code} />
            <span className="text-foreground/80 font-medium text-sm tabular-nums leading-none">
              {selected.dialCode}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 ${open ? 'rotate-180' : ''
                }`}
            />
          </button>

          {/* ── Thin vertical divider ─────────────────────────────── */}
          <span className="w-px self-stretch my-2.5 bg-foreground/10 shrink-0" aria-hidden />

          {/* ── Number input ─────────────────────────────────────── */}
          <input
            id="phoneLocal"
            ref={setInputRef}
            type="tel"
            inputMode="numeric"
            placeholder="Enter phone number"
            value={phoneLocal}
            autoComplete="tel-national"
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d\s\-()]/g, '');
              setPhoneLocal(val);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={[
              'flex-1 min-w-0 bg-transparent px-3 py-2 outline-none',
              'text-sm md:text-sm placeholder:text-muted-foreground rounded-r-xl',
            ].join(' ')}
          />
        </div>

        {/* ── Dropdown ─────────────────────────────────────────────── */}
        {open && (
          <div
            role="listbox"
            aria-label="Select country"
            className={[
              'absolute left-0 top-[calc(100%+6px)] z-50',
              'w-full min-w-[17rem]',
              'bg-popover border border-border/70 rounded-xl shadow-2xl',
              'overflow-hidden',
              'animate-in fade-in-0 zoom-in-95 duration-150',
            ].join(' ')}
          >
            {/* Search bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <Search className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search country or dial code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 text-foreground"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-muted-foreground/50 hover:text-foreground text-xs leading-none px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Country list */}
            <ul className="max-h-52 overflow-y-auto overscroll-contain">
              {filtered.length === 0 ? (
                <li className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  No countries found
                </li>
              ) : (
                filtered.map((c) => {
                  const isActive = c.code === selected.code;
                  return (
                    <li
                      key={c.code}
                      role="option"
                      aria-selected={isActive}
                      onClick={() => selectCountry(c)}
                      className={[
                        'flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm',
                        'transition-colors duration-100',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/50',
                      ].join(' ')}
                    >
                      <FlagImg code={c.code} size="md" />
                      <span className="flex-1 truncate">{c.name}</span>
                      <span
                        className={`tabular-nums text-xs shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'
                          }`}
                      >
                        {c.dialCode}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs font-medium text-destructive animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
});

CountryPhoneInput.displayName = 'CountryPhoneInput';
