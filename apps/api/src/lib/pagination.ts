import { createHmac, timingSafeEqual } from 'crypto';
import { HTTPException } from 'hono/http-exception';
import type { CursorPagination } from '@novabots/types';

export interface CursorPayload {
  created_at: string;
  id: string;
  workspace_id: string;
}

function getSigningSecret(): string {
  const secret = process.env.CURSOR_SIGNING_SECRET;
  if (!secret) {
    throw new Error('CURSOR_SIGNING_SECRET is not set');
  }
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function encodeCursor(payload: CursorPayload): string {
  const secret = getSigningSecret();
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = sign(encoded, secret);
  return `${encoded}.${sig}`;
}

export function decodeCursor(cursor: string, workspaceId: string): CursorPayload {
  const dotIndex = cursor.lastIndexOf('.');
  if (dotIndex === -1) {
    throw new HTTPException(400, { message: 'Invalid cursor format' });
  }

  const encoded = cursor.slice(0, dotIndex);
  const suppliedSig = cursor.slice(dotIndex + 1);

  const secret = getSigningSecret();
  const expectedSig = sign(encoded, secret);

  const suppliedBuf = Buffer.from(suppliedSig, 'base64url');
  const expectedBuf = Buffer.from(expectedSig, 'base64url');

  if (suppliedBuf.length !== expectedBuf.length || !timingSafeEqual(suppliedBuf, expectedBuf)) {
    throw new HTTPException(400, { message: 'Invalid cursor' });
  }

  let payload: CursorPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as CursorPayload;
  } catch {
    throw new HTTPException(400, { message: 'Invalid cursor' });
  }

  if (payload.workspace_id !== workspaceId) {
    throw new HTTPException(403, { message: 'Cursor workspace mismatch' });
  }

  return payload;
}

export function parseCursor(cursor: string | undefined): string | undefined {
  return cursor ?? undefined;
}

export function buildPaginatedResponse<T extends { id: string }>(
  data: T[],
  limit: number,
): { data: T[]; pagination: CursorPagination } {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  return {
    data: items,
    pagination: {
      next_cursor: hasMore ? items[items.length - 1]!.id : null,
      has_more: hasMore,
    },
  };
}
