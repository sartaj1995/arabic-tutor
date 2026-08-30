// Every batch of 10 levels is authored around one theme — naming the group
// makes the level list read like a curriculum's table of contents instead of a
// flat checklist. Shared with the glossary, whose level filter is expressed in
// the same units so the two pages describe the curriculum the same way.
// Units beyond what's named here fall back to a generic "Unit N" label rather
// than crashing.

export const UNIT_SIZE = 10;

export const UNIT_THEMES: { title: string; arabic: string }[] = [
  { title: "Foundations", arabic: "الأساسيات" },
  { title: "Verbs & Grammar", arabic: "الأفعال" },
  { title: "Past Tense & Plurals", arabic: "الماضي" },
  { title: "Everyday Structures", arabic: "الحياة اليومية" },
  { title: "Real-World Arabic", arabic: "الحياة العملية" },
  { title: "Complex Sentences", arabic: "الجمل المركبة" },
  { title: "Daily Life Expanded", arabic: "الحياة اليومية الموسعة" },
  { title: "Practical Fluency", arabic: "الطلاقة العملية" },
  { title: "Everyday Fluency", arabic: "الطلاقة اليومية" },
  { title: "Graduation", arabic: "التخرج" },
];

export function unitTheme(unitIndex: number): { title: string; arabic: string } {
  return UNIT_THEMES[unitIndex] ?? { title: `Unit ${unitIndex + 1}`, arabic: "" };
}

/** 0-based unit index for a 1-based level number. */
export function unitIndexForLevel(levelNumber: number): number {
  return Math.floor((levelNumber - 1) / UNIT_SIZE);
}

export function unitLevelRange(unitIndex: number): { first: number; last: number } {
  return { first: unitIndex * UNIT_SIZE + 1, last: (unitIndex + 1) * UNIT_SIZE };
}
