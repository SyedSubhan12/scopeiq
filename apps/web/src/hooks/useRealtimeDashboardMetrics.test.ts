import { afterEach, describe, expect, it, vi } from "vitest";
import { dashboardQueryKey } from "./query-keys";

type PostgresChangeHandler = () => void;

type ChannelMock = {
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => {
  let channel: ChannelMock;
  channel = {
    on: vi.fn(() => channel),
    subscribe: vi.fn(),
  };

  const queryClient = {
    invalidateQueries: vi.fn(),
  };

  const removeChannel = vi.fn();
  const supabaseChannel = vi.fn(() => channel);
  let cleanup: (() => void) | undefined;

  return {
    channel,
    cleanupRef: {
      get current() {
        return cleanup;
      },
      set current(value: (() => void) | undefined) {
        cleanup = value;
      },
    },
    queryClient,
    removeChannel,
    supabaseChannel,
  };
});

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useEffect(effect: () => void | (() => void)) {
      mocks.cleanupRef.current = effect() ?? undefined;
    },
    useRef<T>(initial: T) {
      return { current: initial };
    },
  };
});

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mocks.queryClient,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    channel: mocks.supabaseChannel,
    removeChannel: mocks.removeChannel,
  },
}));

import { useRealtimeDashboardMetrics } from "./useRealtimeDashboardMetrics";

describe("useRealtimeDashboardMetrics", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mocks.cleanupRef.current = undefined;
  });

  it("registers realtime invalidation against the shared dashboard query key", () => {
    useRealtimeDashboardMetrics("workspace-1");

    expect(mocks.supabaseChannel).toHaveBeenCalledWith(
      "dashboard-metrics-workspace-1",
    );
    expect(mocks.channel.on).toHaveBeenCalledTimes(4);
    expect(mocks.channel.subscribe).toHaveBeenCalledTimes(1);

    const firstSubscription = mocks.channel.on.mock.calls[0];
    if (!firstSubscription) {
      throw new Error("Expected at least one realtime subscription");
    }

    expect(firstSubscription[0]).toBe("postgres_changes");
    expect(firstSubscription[1]).toEqual({
      event: "*",
      schema: "public",
      table: "projects",
      filter: "workspace_id=eq.workspace-1",
    });

    const onCallbacks = mocks.channel.on.mock.calls.map((call: unknown[]) => {
      const handler = call[2];
      if (typeof handler !== "function") {
        throw new Error("Expected a subscription callback");
      }

      return handler as PostgresChangeHandler;
    });

    const firstCallback = onCallbacks[0];
    if (!firstCallback) {
      throw new Error("Expected a realtime callback");
    }

    firstCallback();

    expect(mocks.queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: dashboardQueryKey,
    });
  });

  it("skips channel setup when workspace id is missing", () => {
    useRealtimeDashboardMetrics(null);

    expect(mocks.supabaseChannel).not.toHaveBeenCalled();
    expect(mocks.channel.on).not.toHaveBeenCalled();
    expect(mocks.cleanupRef.current).toBeUndefined();
  });
});
