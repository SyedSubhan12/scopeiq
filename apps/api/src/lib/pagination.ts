import type { CursorPagination } from "@novabots/types";

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
