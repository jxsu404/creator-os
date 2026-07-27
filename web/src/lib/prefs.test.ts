import { describe, expect, it } from "vitest";
import { APP_VERSION } from "@/lib/app-version";
import { currentRelease, RELEASES } from "@/lib/releases";
import {
  normalizePrefs,
  resolveTheme,
  speechLangFromLocale,
} from "@/lib/prefs";
import { translate } from "@/lib/i18n/t";
import packageJson from "../../package.json";

describe("app-version / releases", () => {
  it("matches package.json version", () => {
    expect(APP_VERSION).toBe(packageJson.version);
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("includes the current version in RELEASES", () => {
    expect(RELEASES.some((r) => r.version === APP_VERSION)).toBe(true);
    expect(currentRelease().version).toBe(APP_VERSION);
    expect(RELEASES.some((r) => r.version === "1.7.0")).toBe(true);
  });
});

describe("prefs", () => {
  it("normalizes unknown prefs to defaults", () => {
    expect(normalizePrefs(null)).toEqual({
      theme: "system",
      locale: "es",
      reduceMotion: false,
      thumbnailStylePrompt: "",
    });
  });

  it("keeps valid prefs", () => {
    expect(
      normalizePrefs({
        theme: "light",
        locale: "en",
        reduceMotion: true,
        thumbnailStylePrompt: "neon anime",
      })
    ).toEqual({
      theme: "light",
      locale: "en",
      reduceMotion: true,
      thumbnailStylePrompt: "neon anime",
    });
  });

  it("maps locale to speech BCP-47", () => {
    expect(speechLangFromLocale("es")).toBe("es-MX");
    expect(speechLangFromLocale("en")).toBe("en-US");
  });

  it("resolveTheme honors explicit values", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });
});

describe("i18n", () => {
  it("translates keys and interpolates", () => {
    expect(translate("es", "profile.settings")).toBe("Ajustes");
    expect(translate("en", "profile.settings")).toBe("Settings");
    expect(translate("es", "profile.versionBadge", { version: "2.0.0" })).toBe(
      "Ideazo v2.0.0"
    );
  });
});
