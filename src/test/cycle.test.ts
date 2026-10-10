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

import { referenceAfterRemoval } from "@/lib/cycle";
import { isWorkoutComplete, minSecondsToComplete, totalMinutes } from "@/lib/program";

describe("weekly goal changes", () => {
  const w1 = [1, 2, 3].map((session) => ({ week: 1, session }));
  const w2 = [{ week: 2, session: 1 }];
  it("raising goal from 3 to 5 keeps week 2 unlocked when she already trained in it", () => {
    expect(programProgress([...w1, ...w2], 5).weeks[1]!.unlocked).toBe(true);
  });
  it("raising goal keeps earlier weeks unlocked when she trained in a later week", () => {
    const w3 = [{ week: 3, session: 1 }];
    const p = programProgress([...w1, ...w3], 7);
    expect(p.weeks[1]!.unlocked).toBe(true);
    expect(p.weeks[2]!.unlocked).toBe(true);
    expect(p.weeks[3]!.unlocked).toBe(false);
  });
  it("without later sessions, a higher goal still requires more week-1 sessions", () => {
    expect(programProgress(w1, 5).weeks[1]!.unlocked).toBe(false);
  });
  it("duplicate session records count once", () => {
    const dup = [{ week: 1, session: 1 }, { week: 1, session: 1 }, { week: 1, session: 1 }];
    expect(programProgress(dup, 3).weeks[0]!.completed).toBe(1);
    expect(programProgress(dup, 3).weeks[1]!.unlocked).toBe(false);
  });
  it("light walk and pregnancy walks do not unlock program weeks", () => {
    expect(programProgress([{ week: 0, session: 1 }, { week: 102, session: 1 }], 3).weeks[1]!.unlocked).toBe(false);
  });
});

describe("workout completion", () => {
  it("a few seconds is not complete", () => {
    expect(isWorkoutComplete(1, 10)).toBe(false);
  });
  it("week 1 completes once all intervals before the 5-min cooldown are done", () => {
    expect(minSecondsToComplete(1)).toBe(totalMinutes(1) * 60 - 300);
    expect(isWorkoutComplete(1, totalMinutes(1) * 60 - 301)).toBe(false);
    expect(isWorkoutComplete(1, totalMinutes(1) * 60 - 300)).toBe(true);
  });
  it("light walk needs 80% (16 of 20 min)", () => {
    expect(isWorkoutComplete(0, 16 * 60 - 1)).toBe(false);
    expect(isWorkoutComplete(0, 16 * 60)).toBe(true);
  });
});

describe("unmarking a period start", () => {
  it("falls back to the latest remaining earlier start", () => {
    expect(referenceAfterRemoval("2026-03-01", "2026-03-01", ["2026-01-05", "2026-02-02", "2026-03-01"])).toBe("2026-02-02");
  });
  it("keeps the reference when another date was unmarked", () => {
    expect(referenceAfterRemoval("2026-03-01", "2026-02-02", ["2026-02-02", "2026-03-01"])).toBe("2026-03-01");
  });
  it("uses a later remaining start if one exists", () => {
    expect(referenceAfterRemoval("2026-03-01", "2026-03-01", ["2026-02-02", "2026-03-20"])).toBe("2026-03-20");
  });
  it("clears the reference when no start remains", () => {
    expect(referenceAfterRemoval("2026-03-01", "2026-03-01", ["2026-03-01"])).toBeNull();
  });
});
