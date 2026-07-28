import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import type { BillingSnapshot } from "@/lib/billing/plans";

const {
  getApiAuth,
  unauthorizedApiResponse,
  consumeGeneration,
  getBillingSnapshot,
  userHasInviteAccess,
  inviteOnlyEnabled,
} = vi.hoisted(() => ({
  getApiAuth: vi.fn(),
  unauthorizedApiResponse: vi.fn(),
  consumeGeneration: vi.fn(),
  getBillingSnapshot: vi.fn(),
  userHasInviteAccess: vi.fn(),
  inviteOnlyEnabled: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getApiAuth,
}));

vi.mock("@/lib/supabase/require-api-user", () => ({
  unauthorizedApiResponse,
}));

vi.mock("@/lib/billing/usage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/billing/usage")>();
  return {
    ...actual,
    consumeGeneration,
    getBillingSnapshot,
  };
});

vi.mock("@/lib/invite-access", () => ({
  inviteOnlyEnabled,
  userHasInviteAccess,
}));

import { gateAiGeneration } from "@/lib/billing/gate";
import { UsageLimitError } from "@/lib/billing/usage";

const freeSnapshot: BillingSnapshot = {
  plan: "free",
  status: "active",
  used: 1,
  limit: 15,
  remaining: 14,
  month: "2026-07",
};

describe("gateAiGeneration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unauthorizedApiResponse.mockResolvedValue(null);
    inviteOnlyEnabled.mockReturnValue(false);
    userHasInviteAccess.mockResolvedValue(true);
    consumeGeneration.mockResolvedValue(freeSnapshot);
    getBillingSnapshot.mockResolvedValue(freeSnapshot);
  });

  it("returns 401 when unauthorized", async () => {
    const denied = NextResponse.json({ error: "No autenticado" }, { status: 401 });
    unauthorizedApiResponse.mockResolvedValue(denied);

    const result = await gateAiGeneration();

    expect(result.blocked).toBe(denied);
    expect(consumeGeneration).not.toHaveBeenCalled();
  });

  it("passes through local mode without auth", async () => {
    getApiAuth.mockResolvedValue(null);

    const result = await gateAiGeneration();

    expect(result).toEqual({ blocked: null, billing: null });
    expect(consumeGeneration).not.toHaveBeenCalled();
  });

  it("blocks invite-only users without access", async () => {
    inviteOnlyEnabled.mockReturnValue(true);
    userHasInviteAccess.mockResolvedValue(false);
    getApiAuth.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {},
    });

    const result = await gateAiGeneration();

    expect(result.blocked?.status).toBe(403);
    expect(consumeGeneration).not.toHaveBeenCalled();
    const body = await result.blocked!.json();
    expect(body.code).toBe("invite_required");
  });

  it("consumes quota when invite-only and access granted", async () => {
    inviteOnlyEnabled.mockReturnValue(true);
    userHasInviteAccess.mockResolvedValue(true);
    getApiAuth.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {},
    });

    const result = await gateAiGeneration();

    expect(result).toEqual({ blocked: null, billing: freeSnapshot });
    expect(consumeGeneration).toHaveBeenCalledOnce();
  });

  it("returns 402 on usage limit", async () => {
    getApiAuth.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {},
    });
    consumeGeneration.mockRejectedValue(new UsageLimitError(freeSnapshot));

    const result = await gateAiGeneration();

    expect(result.blocked?.status).toBe(402);
    const body = await result.blocked!.json();
    expect(body.code).toBe("usage_limit");
  });

  it("preflight blocks at limit without consuming", async () => {
    getApiAuth.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {},
    });
    getBillingSnapshot.mockResolvedValue({
      ...freeSnapshot,
      used: 15,
      remaining: 0,
    });

    const result = await gateAiGeneration({ consume: false });

    expect(result.blocked?.status).toBe(402);
    expect(consumeGeneration).not.toHaveBeenCalled();
  });

  it("bill false reads snapshot without consuming", async () => {
    getApiAuth.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {},
    });

    const result = await gateAiGeneration({ bill: false });

    expect(result).toEqual({ blocked: null, billing: freeSnapshot });
    expect(getBillingSnapshot).toHaveBeenCalledOnce();
    expect(consumeGeneration).not.toHaveBeenCalled();
  });
});
