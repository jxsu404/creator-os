import { describe, expect, it } from "vitest";
import {
  isSchemaMissingError,
  shouldFailOpenUsagePersistence,
  UsagePersistenceError,
} from "@/lib/billing/usage";

describe("usage persistence fail mode", () => {
  it("detects missing schema errors", () => {
    expect(isSchemaMissingError({ code: "42P01", message: "relation missing" })).toBe(true);
    expect(isSchemaMissingError({ code: "PGRST205", message: "Could not find the table" })).toBe(true);
    expect(isSchemaMissingError({ message: "function increment_ai_generation does not exist" })).toBe(true);
    expect(isSchemaMissingError({ message: "timeout" })).toBe(false);
  });

  it("fails open outside production", () => {
    expect(shouldFailOpenUsagePersistence({ nodeEnv: "development", rpcError: { message: "timeout" }, upsertError: { message: "timeout" } })).toBe(true);
  });

  it("fails closed in production on transient errors", () => {
    expect(shouldFailOpenUsagePersistence({ nodeEnv: "production", rpcError: { message: "timeout" }, upsertError: { message: "connection reset" } })).toBe(false);
  });

  it("fails open in production when schema is clearly missing", () => {
    expect(shouldFailOpenUsagePersistence({ nodeEnv: "production", rpcError: { code: "42P01", message: "relation usage_monthly" }, upsertError: { message: "ignored" } })).toBe(true);
  });

  it("exposes a Spanish persistence error", () => {
    const err = new UsagePersistenceError();
    expect(err.code).toBe("usage_persistence");
    expect(err.status).toBe(500);
    expect(err.message).toMatch(/no pude registrar/i);
  });
});
