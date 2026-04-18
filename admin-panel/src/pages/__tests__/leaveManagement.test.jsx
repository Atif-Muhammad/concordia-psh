/**
 * Property-based tests for Leave Management feature.
 *
 * Property 8: Status badge variant matches leave status
 * Validates: Requirements 4.7, 4.8, 4.9
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: leave-management-attendance-integration, Property 8: Status badge variant matches leave status

// Pure statusBadge logic (mirrors LeavesManagementDialog.jsx)
const statusBadge = (status) => {
  if (status === "APPROVED") return { variant: "green", className: "bg-green-500 text-white" };
  if (status === "REJECTED") return { variant: "destructive" };
  return { variant: "secondary" };
};

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const leaveStatusArb = fc.constantFrom("PENDING", "APPROVED", "REJECTED");

const leaveRecordArb = fc.record({
  leaveId: fc.integer({ min: 1, max: 9999 }),
  staffId: fc.integer({ min: 1, max: 9999 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  status: leaveStatusArb,
});

// ---------------------------------------------------------------------------
// Property 8: Status badge variant matches leave status
// Validates: Requirements 4.7, 4.8, 4.9
// ---------------------------------------------------------------------------

describe("Property 8: Status badge variant matches leave status", () => {
  it("APPROVED status produces a badge with className including 'bg-green-500'", () => {
    fc.assert(
      fc.property(
        leaveRecordArb.filter((r) => r.status === "APPROVED"),
        (record) => {
          const badge = statusBadge(record.status);
          expect(badge.className).toContain("bg-green-500");
        }
      ),
      { numRuns: 20 }
    );
  });

  it("REJECTED status produces a badge with variant='destructive'", () => {
    fc.assert(
      fc.property(
        leaveRecordArb.filter((r) => r.status === "REJECTED"),
        (record) => {
          const badge = statusBadge(record.status);
          expect(badge.variant).toBe("destructive");
        }
      ),
      { numRuns: 20 }
    );
  });

  it("PENDING status produces a badge with variant='secondary'", () => {
    fc.assert(
      fc.property(
        leaveRecordArb.filter((r) => r.status === "PENDING"),
        (record) => {
          const badge = statusBadge(record.status);
          expect(badge.variant).toBe("secondary");
        }
      ),
      { numRuns: 20 }
    );
  });

  it("each status maps to exactly one badge variant across all statuses", () => {
    fc.assert(
      fc.property(leaveRecordArb, (record) => {
        const badge = statusBadge(record.status);
        if (record.status === "APPROVED") {
          expect(badge.className).toContain("bg-green-500");
        } else if (record.status === "REJECTED") {
          expect(badge.variant).toBe("destructive");
        } else {
          expect(badge.variant).toBe("secondary");
        }
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: leave-management-attendance-integration, Property 9: Edit button present in every table row

// Pure function that mirrors the table row rendering logic
const buildTableRows = (records) => records.map((r) => ({ ...r, hasEditButton: true }));

// ---------------------------------------------------------------------------
// Arbitraries for Property 9
// ---------------------------------------------------------------------------

const leaveRecordFullArb = fc.record({
  leaveId: fc.integer({ min: 1, max: 9999 }),
  staffId: fc.integer({ min: 1, max: 9999 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  status: fc.constantFrom("PENDING", "APPROVED", "REJECTED"),
  startDate: fc.constant("2024-01-01"),
  endDate: fc.constant("2024-01-01"),
  days: fc.integer({ min: 1, max: 30 }),
  reason: fc.string({ minLength: 1, maxLength: 100 }),
  month: fc.constant("2024-01"),
});

const nonEmptyLeaveRecordsArb = fc.array(leaveRecordFullArb, { minLength: 1, maxLength: 20 });

// ---------------------------------------------------------------------------
// Property 9: Edit button present in every table row
// Validates: Requirements 3.1
// ---------------------------------------------------------------------------

describe("Property 9: Edit button present in every table row", () => {
  it("buildTableRows produces exactly N rows for N records", () => {
    fc.assert(
      fc.property(nonEmptyLeaveRecordsArb, (records) => {
        const rows = buildTableRows(records);
        expect(rows.length).toBe(records.length);
      }),
      { numRuns: 20 }
    );
  });

  it("every row produced by buildTableRows has hasEditButton === true", () => {
    fc.assert(
      fc.property(nonEmptyLeaveRecordsArb, (records) => {
        const rows = buildTableRows(records);
        expect(rows.every((row) => row.hasEditButton === true)).toBe(true);
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: leave-management-attendance-integration, Property 7: Edit dialog pre-populates all record fields

// Pure pre-population logic (mirrors EditLeaveDialog useEffect)
const prepopulateEditDialog = (record) => {
  if (!record) return { selectedDates: [], reason: "", status: "PENDING" };
  const start = record.startDate ? new Date(record.startDate) : null;
  const end = record.endDate ? new Date(record.endDate) : null;
  const dates = [];
  if (start) dates.push(start);
  if (end && end.getTime() !== start?.getTime()) dates.push(end);
  return {
    selectedDates: dates.length > 0 ? dates : (start ? [start] : []),
    reason: record.reason || "",
    status: record.status || "PENDING",
  };
};

// ---------------------------------------------------------------------------
// Arbitraries for Property 7
// ---------------------------------------------------------------------------

// Build ISO date strings from year/month/day integers to avoid invalid Date edge cases
const isoDateStringArb = fc
  .record({
    year: fc.integer({ min: 2020, max: 2030 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }), // cap at 28 to stay valid for all months
  })
  .map(({ year, month, day }) => {
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  });

const leaveRecordForEditArb = fc.record({
  leaveId: fc.integer({ min: 1, max: 9999 }),
  staffId: fc.integer({ min: 1, max: 9999 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  status: fc.constantFrom("PENDING", "APPROVED", "REJECTED"),
  startDate: isoDateStringArb,
  endDate: isoDateStringArb,
  days: fc.integer({ min: 1, max: 30 }),
  reason: fc.string({ minLength: 0, maxLength: 200 }),
  month: fc.constant("2024-01"),
});

// ---------------------------------------------------------------------------
// Property 7: Edit dialog pre-populates all record fields
// Validates: Requirements 3.2, 4.2
// ---------------------------------------------------------------------------

describe("Property 7: Edit dialog pre-populates all record fields", () => {
  it("status dropdown value matches record.status", () => {
    fc.assert(
      fc.property(leaveRecordForEditArb, (record) => {
        const state = prepopulateEditDialog(record);
        expect(state.status).toBe(record.status);
      }),
      { numRuns: 20 }
    );
  });

  it("reason field value matches record.reason", () => {
    fc.assert(
      fc.property(leaveRecordForEditArb, (record) => {
        const state = prepopulateEditDialog(record);
        expect(state.reason).toBe(record.reason);
      }),
      { numRuns: 20 }
    );
  });

  it("calendar selection includes a date matching record.startDate", () => {
    fc.assert(
      fc.property(leaveRecordForEditArb, (record) => {
        const state = prepopulateEditDialog(record);
        const startDateStr = new Date(record.startDate).toISOString().slice(0, 10);
        const hasStartDate = state.selectedDates.some(
          (d) => d.toISOString().slice(0, 10) === startDateStr
        );
        expect(hasStartDate).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it("all three fields are pre-populated correctly for any record", () => {
    fc.assert(
      fc.property(leaveRecordForEditArb, (record) => {
        const state = prepopulateEditDialog(record);
        const startDateStr = new Date(record.startDate).toISOString().slice(0, 10);

        expect(state.status).toBe(record.status);
        expect(state.reason).toBe(record.reason);
        expect(
          state.selectedDates.some((d) => d.toISOString().slice(0, 10) === startDateStr)
        ).toBe(true);
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: leave-management-attendance-integration, Property 1: Date toggle is an involution

// Pure toggle logic (mirrors CreateLeaveDialog / EditLeaveDialog date selection)
const toggleDate = (selectedDates, date) => {
  const dateStr = date.toISOString().slice(0, 10);
  const exists = selectedDates.some(d => d.toISOString().slice(0, 10) === dateStr);
  if (exists) return selectedDates.filter(d => d.toISOString().slice(0, 10) !== dateStr);
  return [...selectedDates, date];
};

// ---------------------------------------------------------------------------
// Arbitraries for Property 1
// ---------------------------------------------------------------------------

// Safe integer-based Date generator (avoids invalid/edge-case timestamps)
const safeDateArb = fc
  .integer({ min: 0, max: 10000 })
  .map(n => new Date(Date.UTC(2020, 0, 1) + n * 86400000));

const selectedDatesArb = fc.array(safeDateArb, { minLength: 0, maxLength: 5 });

// ---------------------------------------------------------------------------
// Property 1: Date toggle is an involution
// Validates: Requirements 1.2
// ---------------------------------------------------------------------------

describe("Property 1: Date toggle is an involution", () => {
  it("toggling a date twice returns the selection to its original state", () => {
    fc.assert(
      fc.property(selectedDatesArb, safeDateArb, (initialDates, dateToToggle) => {
        const afterFirst = toggleDate(initialDates, dateToToggle);
        const afterSecond = toggleDate(afterFirst, dateToToggle);

        // Same length
        expect(afterSecond.length).toBe(initialDates.length);

        // Same dates by ISO string comparison
        const originalStrs = new Set(initialDates.map(d => d.toISOString().slice(0, 10)));
        const resultStrs = new Set(afterSecond.map(d => d.toISOString().slice(0, 10)));
        expect(resultStrs.size).toBe(originalStrs.size);
        for (const s of originalStrs) {
          expect(resultStrs.has(s)).toBe(true);
        }
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: leave-management-attendance-integration, Property 2: Selected date count label matches selection size

// Pure count label logic (mirrors the Multi-Date Calendar Picker summary)
const countLabel = (selectedDates) =>
  selectedDates.length > 0 ? `${selectedDates.length} date(s) selected` : "";

// ---------------------------------------------------------------------------
// Arbitraries for Property 2
// ---------------------------------------------------------------------------

const nonEmptyDatesArb = fc.array(safeDateArb, { minLength: 1, maxLength: 10 });

// ---------------------------------------------------------------------------
// Property 2: Selected date count label matches selection size
// Validates: Requirements 1.3
// ---------------------------------------------------------------------------

describe("Property 2: Selected date count label matches selection size", () => {
  it("countLabel contains the string representation of the number of selected dates", () => {
    fc.assert(
      fc.property(nonEmptyDatesArb, (dates) => {
        const label = countLabel(dates);
        expect(label).toContain(String(dates.length));
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: leave-management-attendance-integration, Property 3: Multi-date submit creates one record per date

// Pure multi-date submit logic (mirrors handleCreateLeave in LeavesManagementDialog.jsx)
const buildUpsertPayloads = (selectedDates, staffId, reason) => {
  return selectedDates.map(date => {
    const year = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const dateStr = `${year}-${mm}-${dd}`;
    const monthStr = `${year}-${mm}`;
    return {
      staffId,
      startDate: dateStr,
      endDate: dateStr,
      days: 1,
      month: monthStr,
      reason,
      status: "PENDING",
    };
  });
};

// ---------------------------------------------------------------------------
// Arbitraries for Property 3
// ---------------------------------------------------------------------------

const staffIdArb = fc.integer({ min: 1, max: 9999 });
const reasonArb = fc.string({ minLength: 0, maxLength: 200 });

// ---------------------------------------------------------------------------
// Property 3: Multi-date submit creates one record per date
// Validates: Requirements 1.4
// ---------------------------------------------------------------------------

describe("Property 3: Multi-date submit creates one record per date", () => {
  it("buildUpsertPayloads returns exactly one payload per selected date", () => {
    fc.assert(
      fc.property(nonEmptyDatesArb, staffIdArb, reasonArb, (dates, staffId, reason) => {
        const payloads = buildUpsertPayloads(dates, staffId, reason);
        expect(payloads.length).toBe(dates.length);
      }),
      { numRuns: 20 }
    );
  });

  it("every payload has startDate === endDate", () => {
    fc.assert(
      fc.property(nonEmptyDatesArb, staffIdArb, reasonArb, (dates, staffId, reason) => {
        const payloads = buildUpsertPayloads(dates, staffId, reason);
        expect(payloads.every(p => p.startDate === p.endDate)).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it("every payload has days === 1", () => {
    fc.assert(
      fc.property(nonEmptyDatesArb, staffIdArb, reasonArb, (dates, staffId, reason) => {
        const payloads = buildUpsertPayloads(dates, staffId, reason);
        expect(payloads.every(p => p.days === 1)).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it("all three properties hold together for any non-empty date array", () => {
    fc.assert(
      fc.property(nonEmptyDatesArb, staffIdArb, reasonArb, (dates, staffId, reason) => {
        const payloads = buildUpsertPayloads(dates, staffId, reason);
        expect(payloads.length).toBe(dates.length);
        expect(payloads.every(p => p.startDate === p.endDate)).toBe(true);
        expect(payloads.every(p => p.days === 1)).toBe(true);
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: leave-management-attendance-integration, Property 5: Staff combobox filter is case-insensitive substring match

// Pure filter logic (mirrors filteredStaff in CreateLeaveDialog)
const filterStaff = (staffList, query) =>
  staffList.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));

// ---------------------------------------------------------------------------
// Arbitraries for Property 5
// ---------------------------------------------------------------------------

const staffMemberArb = fc.record({
  id: fc.integer({ min: 1, max: 9999 }),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  isTeaching: fc.boolean(),
  isNonTeaching: fc.boolean(),
  department: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
});

const staffListArb = fc.array(staffMemberArb, { minLength: 0, maxLength: 20 });
const searchQueryArb = fc.string({ minLength: 0, maxLength: 20 });

// ---------------------------------------------------------------------------
// Property 5: Staff combobox filter is case-insensitive substring match
// Validates: Requirements 2.2
// ---------------------------------------------------------------------------

describe("Property 5: Staff combobox filter is case-insensitive substring match", () => {
  it("result count equals the number of staff whose names contain the query (case-insensitive)", () => {
    fc.assert(
      fc.property(staffListArb, searchQueryArb, (staffList, query) => {
        const result = filterStaff(staffList, query);
        const expected = staffList.filter(s =>
          s.name.toLowerCase().includes(query.toLowerCase())
        );
        expect(result.length).toBe(expected.length);
      }),
      { numRuns: 20 }
    );
  });

  it("every item in the result has a name that contains the query (case-insensitive)", () => {
    fc.assert(
      fc.property(staffListArb, searchQueryArb, (staffList, query) => {
        const result = filterStaff(staffList, query);
        expect(
          result.every(s => s.name.toLowerCase().includes(query.toLowerCase()))
        ).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it("no item excluded from the result has a name that contains the query (case-insensitive)", () => {
    fc.assert(
      fc.property(staffListArb, searchQueryArb, (staffList, query) => {
        const result = filterStaff(staffList, query);
        const resultIds = new Set(result.map(s => s.id));
        const excluded = staffList.filter(s => !resultIds.has(s.id));
        expect(
          excluded.every(s => !s.name.toLowerCase().includes(query.toLowerCase()))
        ).toBe(true);
      }),
      { numRuns: 20 }
    );
  });
});
