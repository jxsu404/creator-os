import { afterEach, describe, expect, it } from "vitest";
import { inviteOnlyEnabled } from "@/lib/invite-access";

describe("inviteOnlyEnabled", () => {
  const original = process.env.INVITE_ONLY;

  afterEach(() => {
    if (original === undefined) delete process.env.INVITE_ONLY;
    else process.env.INVITE_ONLY = original;
  });

  it("is off by default", () => {
    delete process.env.INVITE_ONLY;
    expect(inviteOnlyEnabled()).toBe(false);
    process.env.INVITE_ONLY = "false";
    expect(inviteOnlyEnabled()).toBe(false);
  });

  it("is on for true or 1", () => {
    process.env.INVITE_ONLY = "true";
    expect(inviteOnlyEnabled()).toBe(true);
    process.env.INVITE_ONLY = "1";
    expect(inviteOnlyEnabled()).toBe(true);
  });
});
