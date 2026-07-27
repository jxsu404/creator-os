import { describe, expect, it } from "vitest";
import {
  FREE_MONTHLY_GENERATIONS,
  PRO_MONTHLY_GENERATIONS,
  currentUsageMonth,
  monthlyLimitFor,
} from "@/lib/billing/plans";
import { evaluateGo, type DogfoodAnswers } from "@/lib/dogfood";

describe("billing plans", () => {
  it("gives free a real trial loop budget", () => {
    expect(FREE_MONTHLY_GENERATIONS).toBeGreaterThanOrEqual(10);
    expect(monthlyLimitFor("free")).toBe(FREE_MONTHLY_GENERATIONS);
  });

  it("gives pro a high soft cap", () => {
    expect(PRO_MONTHLY_GENERATIONS).toBeGreaterThan(FREE_MONTHLY_GENERATIONS);
    expect(monthlyLimitFor("pro")).toBe(PRO_MONTHLY_GENERATIONS);
  });

  it("formats UTC usage month", () => {
    expect(currentUsageMonth(new Date("2026-07-27T12:00:00Z"))).toBe(
      "2026-07"
    );
  });
});

describe("dogfood go gate", () => {
  it("requires 6 yes including #3 and #6", () => {
    const answers: DogfoodAnswers = {
      "1": true,
      "2": true,
      "3": true,
      "4": true,
      "5": true,
      "6": true,
      "7": false,
      "8": false,
    };
    const result = evaluateGo(answers);
    expect(result.yesCount).toBe(6);
    expect(result.go).toBe(true);
  });

  it("blocks go when #3 is missing even with 6 yes", () => {
    const answers: DogfoodAnswers = {
      "1": true,
      "2": true,
      "3": false,
      "4": true,
      "5": true,
      "6": true,
      "7": true,
      "8": true,
    };
    const result = evaluateGo(answers);
    expect(result.go).toBe(false);
    expect(result.missingRequired).toContain(3);
  });
});
