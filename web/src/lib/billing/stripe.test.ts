import { afterEach, describe, expect, it, vi } from "vitest";
import { appOrigin } from "@/lib/billing/stripe";

describe("appOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers NEXT_PUBLIC_APP_URL and strips trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://ideazo.co/");
    const request = new Request("https://evil.example/checkout", {
      headers: { host: "evil.example" },
    });
    expect(appOrigin(request)).toBe("https://ideazo.co");
  });

  it("requires NEXT_PUBLIC_APP_URL in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    const request = new Request("https://evil.example/checkout", {
      headers: { host: "evil.example" },
    });
    expect(() => appOrigin(request)).toThrow("NEXT_PUBLIC_APP_URL");
  });

  it("falls back to forwarded host outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    const request = new Request("http://localhost:3000/checkout", {
      headers: {
        host: "localhost:3000",
        "x-forwarded-proto": "https",
      },
    });
    expect(appOrigin(request)).toBe("https://localhost:3000");
  });
});
