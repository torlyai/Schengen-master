// Shared types for Premium state components.
// Premium state files all consume StatusPayload + send the same way as Free
// state files, so we re-export StateProps here to keep imports concise.

import type { Msg, StatusPayload } from '../../../shared/messages';

export interface PremiumStateProps {
  status: StatusPayload;
  send: (msg: Msg) => Promise<unknown>;
}

export type { StatusPayload, Msg };
