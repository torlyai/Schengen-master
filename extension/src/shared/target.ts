// Parse a TLScontact URL and extract { country, centre, subjectCode }.
//
// Real-world URL shape (PRD §7.1):
//   https://visas-fr.tlscontact.com/workflow/appointment-booking/gbMNC2fr/<caseId>
//
// The "subjectCode" embeds three things in a deterministic order:
//   country-of-residence (gb) | centre (MNC) | "2" | destination-country (fr/it/de/…)
//
// We're conservative: if we don't recognise the centre code, we still return a
// sensible centre = MNC (the raw 3-letter code uppercased) so the UI can show
// *something*. The country we return is the *destination* (i.e. the visa
// country), not the country-of-residence, because that's what the user thinks
// about when they say "France visa".

export interface ParsedTarget {
  country: string;       // destination visa country, lower-case 2-letter (e.g. 'fr')
  centre: string;        // display name (e.g. 'Manchester')
  subjectCode: string;   // full code as found in URL (e.g. 'gbMNC2fr')
}

// Centre code -> display name. UK is the primary focus for V1.
// Lower-case keys for tolerant matching.
const CENTRE_NAMES: Record<string, string> = {
  // United Kingdom
  mnc: 'Manchester',
  lon: 'London',
  edi: 'Edinburgh',
  edb: 'Edinburgh',
  bel: 'Belfast',
  // Common other UK / EU centres we may add later
  bir: 'Birmingham',
  car: 'Cardiff',
  // United States
  nyc: 'New York',
  was: 'Washington',
  lax: 'Los Angeles',
  chi: 'Chicago',
  hou: 'Houston',
  // Canada
  yto: 'Toronto',
  yvr: 'Vancouver',
  ymq: 'Montreal',
};

// The subdomain on tlscontact.com encodes the visa destination country.
// e.g. https://visas-fr.tlscontact.com → France
const SUBDOMAIN_COUNTRY_RE = /^visas?-([a-z]{2})$/i;

// Subject code shape: <2 letters country-of-residence><3 letters centre><digit><2 letters destination>
//   e.g. gbMNC2fr  →  GB | MNC | 2 | fr
const SUBJECT_CODE_RE = /([a-z]{2})([a-z]{3})(\d)([a-z]{2})/i;

/**
 * Parse a URL string and return target info, or null if this URL isn't a
 * TLScontact appointment workflow URL.
 */
export function parseTlsUrl(rawUrl: string): ParsedTarget | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  // Must be on tlscontact.com (any subdomain).
  if (!url.hostname.endsWith('.tlscontact.com') && url.hostname !== 'tlscontact.com') {
    return null;
  }

  // Only treat appointment-booking workflow paths as monitorable targets.
  // We allow /workflow/ anywhere in the path to be future-proof against minor
  // re-orderings, but at minimum we want to see "appointment-booking".
  const path = url.pathname;
  const isWorkflow =
    path.includes('/workflow/') ||
    path.includes('appointment-booking') ||
    path.includes('appointment');

  if (!isWorkflow) {
    return null;
  }

  // Try the subdomain for destination country (fast, deterministic).
  let destCountry: string | null = null;
  const subdomain = url.hostname.split('.')[0];
  if (subdomain) {
    const m = subdomain.match(SUBDOMAIN_COUNTRY_RE);
    if (m && m[1]) destCountry = m[1].toLowerCase();
  }

  // Look for a subject code in the whole URL (path + query).
  const haystack = `${url.pathname} ${url.search}`;
  const codeMatch = haystack.match(SUBJECT_CODE_RE);
  if (!codeMatch) {
    // No subject code found — we cannot meaningfully monitor a non-workflow URL.
    return null;
  }

  const subjectCode = codeMatch[0]; // preserve original casing
  const centreCodeRaw = (codeMatch[2] ?? '').toLowerCase();
  const destFromCode = (codeMatch[4] ?? '').toLowerCase();

  const centre = CENTRE_NAMES[centreCodeRaw] ?? centreCodeRaw.toUpperCase();
  const country = destCountry ?? destFromCode ?? '??';

  return {
    country,
    centre,
    subjectCode,
  };
}

/**
 * Cheap predicate — does this URL look like a TLScontact page at all?
 * Used by the SW to identify the tab we want to reload, regardless of whether
 * the user is currently on the workflow page or on a sibling page.
 */
export function isTlsUrl(rawUrl: string | undefined | null): boolean {
  if (!rawUrl) return false;
  try {
    const u = new URL(rawUrl);
    return (
      u.hostname.endsWith('.tlscontact.com') || u.hostname === 'tlscontact.com'
    );
  } catch {
    return false;
  }
}
