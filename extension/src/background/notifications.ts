// Desktop notifications (chrome.notifications).
//
// Wireframes §10: three string sets. Title is always "Visa Master"; the
// body starts with the OUTCOME (slot, challenge, logout), not the brand.
// Click handler focuses the watched TLS tab — never opens a new tab.

import type { ExtState } from '../shared/states';
import { getSettings, getState } from '../shared/storage';

const ICON_URL = chrome.runtime.getURL('public/icons/icon-128.png');

// Stable notification IDs per state so we don't spam the OS.
const NOTIF_ID_PREFIX = 'vm-';
const idFor = (state: ExtState): string => `${NOTIF_ID_PREFIX}${state}`;

interface NotifContent {
  title: string;
  message: string;
}

function contentFor(state: ExtState, centre: string | null): NotifContent {
  const c = centre ?? 'your centre';
  switch (state) {
    case 'SLOT_AVAILABLE':
      return {
        title: 'Visa Master',
        message: `Slot available — TLScontact ${c}\nClick to open`,
      };
    case 'CLOUDFLARE':
      return {
        title: 'Visa Master',
        message: 'Cloudflare check needed\nClick to resolve in the TLS tab',
      };
    case 'LOGGED_OUT':
      return {
        title: 'Visa Master',
        message: 'TLScontact session expired\nLog back in to resume monitoring',
      };
    // PRD 14 §6 coverage matrix rows 9, 10 — desktop pings for previously
    // popup-only states. Body text intentionally short.
    case 'UNKNOWN':
      return {
        title: 'Visa Master',
        message: `Page needs classification — ${c}\nClick to open Visa Master`,
      };
    case 'WRONG_PAGE':
      return {
        title: 'Visa Master',
        message: `Wrong page — ${c}\nOpen the booking workflow page`,
      };
    default:
      return { title: 'Visa Master', message: 'Status update' };
  }
}

/**
 * PRD 14 §6 row 12 — auto-stop watchdog desktop ping. Separate from
 * contentFor() because the source state is IDLE by the time we fire,
 * but the user needs to know *why* monitoring stopped (CLOUDFLARE /
 * LOGGED_OUT timed out at 15 min).
 */
export async function notifyAutoStopDesktop(
  blockerKind: 'CLOUDFLARE' | 'LOGGED_OUT',
  centre: string | null,
): Promise<void> {
  const settings = await getSettings();
  if (!settings.notifDesktop) return;

  const c = centre ?? 'your centre';
  const reason = blockerKind === 'CLOUDFLARE' ? 'Cloudflare' : 'logged-out';
  const id = `${NOTIF_ID_PREFIX}AUTO_STOP`;

  try {
    await chrome.notifications.create(id, {
      type: 'basic',
      iconUrl: ICON_URL,
      title: 'Visa Master',
      message: `Monitoring stopped — ${c}\n${reason} unresolved for 15 min`,
      priority: 1,
      silent: true,
    });
  } catch {
    try {
      await chrome.notifications.create(id, {
        type: 'basic',
        iconUrl: ICON_URL,
        title: 'Visa Master',
        message: `Monitoring stopped — ${c}`,
      });
    } catch {
      /* ignore */
    }
  }
}

export async function notify(state: ExtState, centre: string | null): Promise<void> {
  const settings = await getSettings();
  if (!settings.notifDesktop) return;

  const content = contentFor(state, centre);

  try {
    await chrome.notifications.create(idFor(state), {
      type: 'basic',
      iconUrl: ICON_URL,
      title: content.title,
      message: content.message,
      priority: state === 'SLOT_AVAILABLE' ? 2 : 1,
      requireInteraction: state === 'SLOT_AVAILABLE',
      silent: !settings.notifSound,
    });
  } catch {
    // Some chrome versions reject `requireInteraction` or `silent`. Retry minimal.
    try {
      await chrome.notifications.create(idFor(state), {
        type: 'basic',
        iconUrl: ICON_URL,
        title: content.title,
        message: content.message,
      });
    } catch {
      /* ignore */
    }
  }
}

export async function clearNotification(state: ExtState): Promise<void> {
  try {
    await chrome.notifications.clear(idFor(state));
  } catch {
    /* ignore */
  }
}

/**
 * Wire up the OS-level click handler. Called once at SW startup.
 *
 * Click always focuses the watched TLS tab. Never opens a new tab.
 */
export function installNotificationClickHandler(): void {
  if (!chrome.notifications?.onClicked) return;

  chrome.notifications.onClicked.addListener(async (notificationId) => {
    if (!notificationId.startsWith(NOTIF_ID_PREFIX)) return;

    const persisted = await getState();
    const tabId = persisted.watchedTabId;

    if (tabId !== null && tabId !== undefined) {
      try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.windowId !== undefined) {
          await chrome.windows.update(tab.windowId, { focused: true });
        }
        await chrome.tabs.update(tabId, { active: true });
      } catch {
        // Tab is gone — open the popup instead by clearing the notification.
      }
    }

    await chrome.notifications.clear(notificationId);
  });
}
