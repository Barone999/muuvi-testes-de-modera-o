import { describe, expect, it } from "vitest";
import { dueDateFromWeeks, gestation } from "./pregnancy";
import { buildIntervals, pregnancyWeek } from "./program";

const today = new Date(2026, 9, 9);

describe("gestação", () => {
  it("20 semanas → DPP em 20 semanas e 2º trimestre", () => {
    const due = dueDateFromWeeks(20, today);
    expect(due).toBe("2027-02-26");
    expect(gestation(due, today)).toMatchObject({ week: 21, trimester: 2 });
  });
  it("semana 13 é 1º trimestre, semana 28 é 3º", () => {
    expect(gestation(dueDateFromWeeks(12, today), today).trimester).toBe(1);
    expect(gestation(dueDateFromWeeks(27, today), today).trimester).toBe(3);
  });
  it("treino gestante não tem corrida e tem pausas de hidratação", () => {
    const iv = buildIntervals(pregnancyWeek(3));
    expect(iv.some((i) => i.kind === "run")).toBe(false);
    expect(iv.some((i) => i.kind === "hydrate")).toBe(true);
  });
});
