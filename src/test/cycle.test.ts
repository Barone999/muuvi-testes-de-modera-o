import { describe, expect, it } from "vitest";
import { cycleDay, phaseForDay, parseDate } from "@/lib/cycle";
import { programProgress } from "@/lib/program";

const s = { last_period_start: "2026-01-01", cycle_length: 28, period_length: 5 };

describe("cycle phases", () => {
  it("day 1 is the period start", () => {
    expect(cycleDay(parseDate("2026-01-01"), s)).toBe(1);
  });
  it("wraps to day 1 after cycle length", () => {
    expect(cycleDay(parseDate("2026-01-29"), s)).toBe(1);
  });
  it("menstrual during period length", () => {
    expect(phaseForDay(5, s)).toBe("menstrual");
    expect(phaseForDay(6, s)).toBe("folicular");
  });
  it("ovulatory around cycle_length - 14", () => {
    expect(phaseForDay(14, s)).toBe("ovulatoria");
    expect(phaseForDay(16, s)).toBe("lutea");
  });
});

describe("program locking", () => {
  it("week 2 locked until week 1 sessions done", () => {
    expect(programProgress([], 3).weeks[1]!.unlocked).toBe(false);
    const done = [1, 2, 3].map((session) => ({ week: 1, session }));
    expect(programProgress(done, 3).weeks[1]!.unlocked).toBe(true);
  });
});
