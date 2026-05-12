// GitHub-Releases-based update check.
//
// Visa Master ships via GitHub Releases (not the Chrome Web Store), so
// Chrome's native auto-update path is unavailable for unpacked installs.
// Instead the user runs a manual check from Settings → About:
//
//   1. SettingsPage sends { type: 'CHECK_UPDATE' } to the SW
//   2. SW calls checkForUpdate()
//   3. We request the api.github.com optional host permission (cheap one-time
//      prompt the first time, silent after)
//   4. GET https://api.github.com/repos/<repo>/releases/latest, read tag_name,
//      strip the leading 'v', compare to manifest.version semver-style
//   5. Return { currentVersion, latestVersion, isUpdateAvailable, releaseUrl }
//
// Privacy: a single HTTPS GET to GitHub's public API. No auth header sent,
// so GitHub sees only the request IP. No telemetry payload. Aligned with
// the privacy-first posture documented in privacy/GUARDRAILS.md.

const REPO = 'torlyai/Schengen-master';
const RELEASES_LATEST_API = `https://api.github.com/repos/${REPO}/releases/latest`;
const RELEASES_LATEST_HTML = `https://github.com/${REPO}/releases/latest`;
const PERMISSION_ORIGIN = 'https://api.github.com/*';
const REQUEST_TIMEOUT_MS = 8000;

export interface UpdateCheckResult {
  /** Current installed version, from manifest.version (e.g. "1.0.7"). */
  currentVersion: string;
  /** Latest release tag, stripped of the leading "v" (e.g. "1.0.8"). null on error. */
  latestVersion: string | null;
  /** True iff latestVersion > currentVersion under semver comparison. */
  isUpdateAvailable: boolean;
  /** URL the user should visit to download the new ZIP. */
  releaseUrl: string;
  /**
   * Diagnostic — set when the check failed.
   * Stable codes the UI can localise:
   *   'permission-denied'  user declined the api.github.com permission
   *   'network'            fetch failed (offline / timeout / DNS / CORS)
   *   'http-<status>'      GitHub returned a non-2xx response
   *   'parse'              response wasn't shaped like a Release object
   */
  error?: string;
}

// ---------- Semver comparison ----------

/** Return >0 if a > b, <0 if a < b, 0 if equal. Tolerates extra dot-segments. */
function compareVersions(a: string, b: string): number {
  const parse = (v: string): number[] =>
    v
      .split('.')
      .map((seg) => parseInt(seg.replace(/[^\d].*$/, ''), 10) || 0);
  const av = parse(a);
  const bv = parse(b);
  const len = Math.max(av.length, bv.length);
  for (let i = 0; i < len; i++) {
    const ai = av[i] ?? 0;
    const bi = bv[i] ?? 0;
    if (ai !== bi) return ai - bi;
  }
  return 0;
}

// ---------- Permission gate ----------

async function ensureGithubPermission(): Promise<boolean> {
  try {
    const has = await chrome.permissions.contains({ origins: [PERMISSION_ORIGIN] });
    if (has) return true;
    return await chrome.permissions.request({ origins: [PERMISSION_ORIGIN] });
  } catch {
    return false;
  }
}

// ---------- Main entrypoint ----------

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  const currentVersion = chrome.runtime.getManifest().version;
  const baseResult: UpdateCheckResult = {
    currentVersion,
    latestVersion: null,
    isUpdateAvailable: false,
    releaseUrl: RELEASES_LATEST_HTML,
  };

  const granted = await ensureGithubPermission();
  if (!granted) {
    return { ...baseResult, error: 'permission-denied' };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const resp = await fetch(RELEASES_LATEST_API, {
      method: 'GET',
      headers: {
        // GitHub recommends an Accept header on API requests.
        accept: 'application/vnd.github+json',
      },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) {
      return { ...baseResult, error: `http-${resp.status}` };
    }
    const body = (await resp.json()) as { tag_name?: string; html_url?: string };
    const tag = (body.tag_name ?? '').trim();
    if (!tag) {
      return { ...baseResult, error: 'parse' };
    }
    const latestVersion = tag.replace(/^v/i, '');
    const cmp = compareVersions(latestVersion, currentVersion);
    return {
      currentVersion,
      latestVersion,
      isUpdateAvailable: cmp > 0,
      releaseUrl: body.html_url ?? RELEASES_LATEST_HTML,
    };
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    // AbortError or any fetch failure — uniformly 'network'.
    return { ...baseResult, error: 'network', /* preserve original for logs */ ...({ debug: msg } as object) };
  }
}
