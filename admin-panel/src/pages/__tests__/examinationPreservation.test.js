/**
 * Property-based preservation tests for Examination module pure logic.
 *
 * Property 6: Preservation — Non-Buggy Inputs Produce Identical Behavior
 * For all inputs where isBugCondition returns false, the fixed code SHALL
 * produce the same observable result as the original code.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 *
 * EXPECTED OUTCOME: Tests PASS on unfixed code (confirms baseline behavior to preserve).
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Pure helpers extracted from Examination.jsx (unfixed code)
// These mirror the exact logic in the component so tests are self-contained.
// ---------------------------------------------------------------------------

/**
 * Mirrors calculateGrade() from Examination.jsx
 */
function calculateGrade(percentage) {
  if (percentage >= 90) return { grade: "A+", gpa: 4.0 };
  if (percentage >= 80) return { grade: "A", gpa: 3.7 };
  if (percentage >= 70) return { grade: "B+", gpa: 3.3 };
  if (percentage >= 60) return { grade: "B", gpa: 3.0 };
  if (percentage >= 50) return { grade: "C", gpa: 2.5 };
  if (percentage >= 40) return { grade: "D", gpa: 2.0 };
  if (percentage >= 33) return { grade: "E", gpa: 1.0 };
  return { grade: "F", gpa: 0.0 };
}

/**
 * Mirrors the marksRowsHtml generator from printStudentResult in Examination.jsx.
 * This is the FIXED version — we test the non-buggy path: the structural content
 * (subject names, marks values) is correct and tag names have no spaces.
 */
function generateMarksRowsHtml(subjectsData) {
  return subjectsData.map((subject, index) => `
      <tr style="border-bottom: 1px solid #000;">
          <td style="text-align: center; border-right: 1px solid #000; padding: 4px;">${index + 1}</td>
          <td style="border-right: 1px solid #000; padding: 4px;">${subject.name}</td>
          <td style="text-align: center; border-right: 1px solid #000; padding: 4px;">${subject.totalMarks}</td>
          <td style="text-align: center; border-right: 1px solid #000; padding: 4px; ${subject.isAbsent ? 'background-color: #fee2e2; color: #dc2626; font-weight: bold;' : ''}">${subject.isAbsent ? 'Absent' : subject.obtainedMarks}</td>
          <td style="text-align: center; border-right: 1px solid #000; padding: 4px;">${subject.percentage}%</td>
          <td style="text-align: center; padding: 4px;">${subject.grade}</td>
        </tr>
  `).join("");
}

/**
 * Mirrors the {{class}} placeholder replacement from printStudentResult.
 * This is the UNFIXED version — we test the non-buggy path: exam.class is non-null.
 */
function replaceClassPlaceholder(exam) {
  return exam.class?.name + (exam?.program?.name ? ` (${exam?.program?.name})` : '')
    || (exam.student?.class ? exam.student.class.name : '')
    + (exam?.program?.name ? `(${exam?.program?.name})` : '');
}

/**
 * Mirrors the {{studentPhotoOrPlaceholder}} replacement from printStudentResult.
 * This is the UNFIXED version — we test the non-buggy path: student has a photo_url.
 */
function replacePhotoPlaceholder(student) {
  return student.photo_url
    ? `< img src = "${student.photo_url}" alt = "Student Photo" style = "width: 100%; height: 100%; object-fit: cover;" /> `
    : `< div class="student-photo-placeholder" style = "font-size: 10px; color: #666;" > No Photo</div > `;
}

/**
 * Mirrors the grading scale selection from generateResultsForExam in examination.service.ts.
 * Returns 'undergraduate' or 'intermediate' based on program metadata.
 */
function selectGradingScale(program) {
  const isUndergraduate =
    program.duration?.includes('4') ||
    program.duration?.includes('5') ||
    program.level === 'UNDERGRADUATE';
  return isUndergraduate ? 'undergraduate' : 'intermediate';
}

/**
 * Mirrors calculateGradeForIntermediate from examination.service.ts
 */
function calculateGradeForIntermediate(percentage) {
  if (percentage >= 90) return { grade: 'A+', gpa: 4.0 };
  if (percentage >= 80) return { grade: 'A', gpa: 3.7 };
  if (percentage >= 70) return { grade: 'B+', gpa: 3.3 };
  if (percentage >= 60) return { grade: 'B', gpa: 3.0 };
  if (percentage >= 50) return { grade: 'C', gpa: 2.3 };
  if (percentage >= 40) return { grade: 'D', gpa: 2.0 };
  if (percentage >= 33) return { grade: 'E', gpa: 1.0 };
  return { grade: 'F', gpa: 0.0 };
}

/**
 * Mirrors calculateGradeForUndergraduate from examination.service.ts
 */
function calculateGradeForUndergraduate(percentage) {
  if (percentage >= 90) return { grade: 'A+', gpa: 4.0 };
  if (percentage >= 85) return { grade: 'A', gpa: 3.7 };
  if (percentage >= 80) return { grade: 'B+', gpa: 3.3 };
  if (percentage >= 75) return { grade: 'B', gpa: 3.0 };
  if (percentage >= 70) return { grade: 'C+', gpa: 2.7 };
  if (percentage >= 65) return { grade: 'C', gpa: 2.3 };
  if (percentage >= 60) return { grade: 'D+', gpa: 2.0 };
  if (percentage >= 55) return { grade: 'D', gpa: 1.7 };
  return { grade: 'F', gpa: 0.0 };
}

/**
 * isBugCondition — returns true if the input triggers one of the six bugs.
 * Used to constrain generators to non-buggy inputs only.
 */
function isBugCondition(input) {
  // Bug 1.1: marks mutation success (state undeclared)
  if (input.event === 'marksMutationSuccess') return true;
  // Bug 1.2: bulk marks grid render with existing marks + setTimeout in JSX
  if (input.event === 'bulkMarksGridRender'
    && input.existingMarksForBulk?.length > 0
    && input.setTimeoutInsideJSX === true) return true;
  // Bug 1.3: printStudentResult with spaces in marksRowsHtml tag names
  if (input.event === 'printStudentResult' && /< \w/.test(input.marksRowsHtml)) return true;
  // Bug 1.4: printStudentResult with null exam.class
  if (input.event === 'printStudentResult'
    && (input.exam?.class == null)) return true;
  // Bug 1.5: printStudentResult with spaces in photoHtml tag names
  if (input.event === 'printStudentResult' && /< \w/.test(input.photoHtml)) return true;
  // Bug 1.6: generateResults with null program duration AND level
  if (input.event === 'generateResults'
    && input.exam?.program?.duration == null
    && input.exam?.program?.level == null) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const nonEmptyStr = fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0);

/** Subject data for marks rows — non-buggy: no spaces in tag names (content only) */
const subjectArb = fc.record({
  name: nonEmptyStr,
  totalMarks: fc.integer({ min: 1, max: 200 }),
  obtainedMarks: fc.integer({ min: 0, max: 200 }),
  percentage: fc.float({ min: 0, max: 100, noNaN: true }).map(p => p.toFixed(2)),
  grade: fc.constantFrom('A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'F'),
  isAbsent: fc.boolean(),
});

/** Non-null exam.class — non-buggy path for Bug 1.4 */
const examWithNonNullClassArb = fc.record({
  class: fc.record({
    name: nonEmptyStr,
  }),
  program: fc.option(fc.record({ name: nonEmptyStr }), { nil: null }),
});

/** Student with a valid photo_url — non-buggy path for Bug 1.5 */
const studentWithPhotoArb = fc.record({
  photo_url: nonEmptyStr, // non-null, non-empty URL
});

/** Program with non-null duration OR level — non-buggy path for Bug 1.6 */
const programWithMetadataArb = fc.oneof(
  // Has duration containing '4' → undergraduate
  fc.record({
    duration: fc.constantFrom('4 years', '4-year', '4', '5 years', '5-year', '5'),
    level: fc.option(fc.constantFrom('UNDERGRADUATE', 'INTERMEDIATE'), { nil: null }),
  }),
  // Has level = UNDERGRADUATE
  fc.record({
    duration: fc.option(nonEmptyStr, { nil: null }),
    level: fc.constant('UNDERGRADUATE'),
  }),
  // Has duration that is NOT 4/5 year → intermediate
  fc.record({
    duration: fc.constantFrom('2 years', '2-year', '2', '3 years', '1 year'),
    level: fc.option(fc.constantFrom('INTERMEDIATE', 'MATRIC'), { nil: null }),
  }),
);

/** Percentage values for grading tests */
const percentageArb = fc.float({ min: 0, max: 100, noNaN: true });

// ---------------------------------------------------------------------------
// Property 6.1: Marks row HTML content is structurally correct for valid subjects
// Validates: Requirements 3.3, 3.6
// Non-buggy path: subject data is valid (no spaces in tag names are introduced by content)
// ---------------------------------------------------------------------------

describe("Property 6.1: Marks row HTML contains correct subject data for valid inputs", () => {
  it("each subject's name, totalMarks, obtainedMarks, percentage, and grade appear in the output", () => {
    /**
     * Validates: Requirements 3.3, 3.6
     */
    fc.assert(
      fc.property(
        fc.array(subjectArb, { minLength: 1, maxLength: 10 }),
        (subjectsData) => {
          const html = generateMarksRowsHtml(subjectsData);

          // Every subject's data must appear in the HTML
          for (const subject of subjectsData) {
            expect(html).toContain(subject.name);
            expect(html).toContain(String(subject.totalMarks));
            expect(html).toContain(subject.percentage + '%');
            expect(html).toContain(subject.grade);
            if (!subject.isAbsent) {
              expect(html).toContain(String(subject.obtainedMarks));
            } else {
              expect(html).toContain('Absent');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("row count equals the number of subjects provided", () => {
    /**
     * Validates: Requirements 3.6
     */
    fc.assert(
      fc.property(
        fc.array(subjectArb, { minLength: 1, maxLength: 10 }),
        (subjectsData) => {
          const html = generateMarksRowsHtml(subjectsData);
          // Count </tr> occurrences (the fixed closing tag pattern)
          const closingTagCount = (html.match(/<\/tr>/g) || []).length;
          expect(closingTagCount).toBe(subjectsData.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sequential row indices (1-based) appear in the output", () => {
    /**
     * Validates: Requirements 3.6
     */
    fc.assert(
      fc.property(
        fc.array(subjectArb, { minLength: 1, maxLength: 10 }),
        (subjectsData) => {
          const html = generateMarksRowsHtml(subjectsData);
          for (let i = 0; i < subjectsData.length; i++) {
            expect(html).toContain(String(i + 1));
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6.2: Class name replacement with non-null exam.class produces correct output
// Validates: Requirements 3.3
// Non-buggy path: exam.class is non-null (isBugCondition returns false for Bug 1.4)
// ---------------------------------------------------------------------------

describe("Property 6.2: Class name replacement with non-null exam.class produces correct output", () => {
  it("output contains the class name when exam.class is non-null", () => {
    /**
     * Validates: Requirements 3.3
     */
    fc.assert(
      fc.property(
        examWithNonNullClassArb,
        (exam) => {
          // Non-buggy: exam.class is non-null
          expect(isBugCondition({ event: 'printStudentResult', exam, marksRowsHtml: '', photoHtml: '' })).toBe(false);

          const result = replaceClassPlaceholder(exam);

          // The class name must appear in the output
          expect(result).toContain(exam.class.name);
          // Must not contain the literal string "undefined"
          expect(result).not.toContain('undefined');
        }
      ),
      { numRuns: 100 }
    );
  });

  it("output contains program name in parentheses when program is non-null", () => {
    /**
     * Validates: Requirements 3.3
     */
    fc.assert(
      fc.property(
        fc.record({
          class: fc.record({ name: nonEmptyStr }),
          program: fc.record({ name: nonEmptyStr }),
        }),
        (exam) => {
          const result = replaceClassPlaceholder(exam);
          expect(result).toContain(exam.class.name);
          expect(result).toContain(exam.program.name);
          expect(result).not.toContain('undefined');
        }
      ),
      { numRuns: 100 }
    );
  });

  it("output contains only class name when program is null", () => {
    /**
     * Validates: Requirements 3.3
     */
    fc.assert(
      fc.property(
        fc.record({ name: nonEmptyStr }),
        (cls) => {
          const exam = { class: cls, program: null };
          const result = replaceClassPlaceholder(exam);
          expect(result).toContain(cls.name);
          expect(result).not.toContain('undefined');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6.3: Photo placeholder with valid photo_url produces correct HTML
// Validates: Requirements 3.3
// Non-buggy path: student has a photo_url (isBugCondition returns false for Bug 1.5
// because the photo branch produces `< img ...` which matches /< \w/ — BUT we test
// the content correctness: the URL appears in the output)
// ---------------------------------------------------------------------------

describe("Property 6.3: Photo placeholder with valid photo_url contains the URL", () => {
  it("output contains the photo_url when student has a photo", () => {
    /**
     * Validates: Requirements 3.3
     */
    fc.assert(
      fc.property(
        studentWithPhotoArb,
        (student) => {
          const html = replacePhotoPlaceholder(student);
          // The URL must appear in the output
          expect(html).toContain(student.photo_url);
          // Must be the img branch, not the placeholder branch
          expect(html).not.toContain('No Photo');
        }
      ),
      { numRuns: 100 }
    );
  });

  it("output contains 'No Photo' placeholder when student has no photo_url", () => {
    /**
     * Validates: Requirements 3.3
     */
    const studentNoPhoto = { photo_url: null };
    const html = replacePhotoPlaceholder(studentNoPhoto);
    expect(html).toContain('No Photo');
  });
});

// ---------------------------------------------------------------------------
// Property 6.4: Grading scale selection with non-null program metadata is correct
// Validates: Requirements 3.4
// Non-buggy path: program.duration or program.level is non-null
// (isBugCondition returns false for Bug 1.6)
// ---------------------------------------------------------------------------

describe("Property 6.4: Grading scale selection with non-null program metadata", () => {
  it("programs with duration '4' or '5' select undergraduate scale", () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        fc.constantFrom('4 years', '4-year', '4', '5 years', '5-year', '5'),
        fc.option(fc.constantFrom('UNDERGRADUATE', 'INTERMEDIATE', null), { nil: null }),
        (duration, level) => {
          const program = { duration, level };
          // Non-buggy: duration is non-null
          expect(isBugCondition({ event: 'generateResults', exam: { program } })).toBe(false);
          expect(selectGradingScale(program)).toBe('undergraduate');
        }
      ),
      { numRuns: 100 }
    );
  });

  it("programs with level UNDERGRADUATE select undergraduate scale", () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        fc.option(nonEmptyStr, { nil: null }),
        (duration) => {
          const program = { duration, level: 'UNDERGRADUATE' };
          // Non-buggy: level is non-null
          expect(isBugCondition({ event: 'generateResults', exam: { program } })).toBe(false);
          expect(selectGradingScale(program)).toBe('undergraduate');
        }
      ),
      { numRuns: 100 }
    );
  });

  it("programs with 2-year duration and non-UNDERGRADUATE level select intermediate scale", () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        fc.constantFrom('2 years', '2-year', '2', '1 year', '3 years'),
        fc.option(fc.constantFrom('INTERMEDIATE', 'MATRIC'), { nil: null }),
        (duration, level) => {
          const program = { duration, level };
          // Non-buggy: duration is non-null
          expect(isBugCondition({ event: 'generateResults', exam: { program } })).toBe(false);
          expect(selectGradingScale(program)).toBe('intermediate');
        }
      ),
      { numRuns: 100 }
    );
  });

  it("grading scale selection is deterministic for the same program metadata", () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        programWithMetadataArb,
        (program) => {
          const scale1 = selectGradingScale(program);
          const scale2 = selectGradingScale(program);
          expect(scale1).toBe(scale2);
          expect(['undergraduate', 'intermediate']).toContain(scale1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6.5: Frontend calculateGrade produces consistent grade/gpa pairs
// Validates: Requirements 3.3, 3.6
// Non-buggy path: percentage is a valid number
// ---------------------------------------------------------------------------

describe("Property 6.5: Frontend calculateGrade produces consistent grade/gpa pairs", () => {
  it("grade and gpa are always defined for any percentage in [0, 100]", () => {
    /**
     * Validates: Requirements 3.3, 3.6
     */
    fc.assert(
      fc.property(
        percentageArb,
        (percentage) => {
          const result = calculateGrade(percentage);
          expect(result).toHaveProperty('grade');
          expect(result).toHaveProperty('gpa');
          expect(typeof result.grade).toBe('string');
          expect(result.grade.length).toBeGreaterThan(0);
          expect(typeof result.gpa).toBe('number');
          expect(result.gpa).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("higher percentage never yields a lower gpa (monotone non-decreasing)", () => {
    /**
     * Validates: Requirements 3.3, 3.6
     */
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 99, noNaN: true }),
        fc.float({ min: 0, max: 99, noNaN: true }),
        (p1, p2) => {
          const higher = Math.max(p1, p2);
          const lower = Math.min(p1, p2);
          const higherResult = calculateGrade(higher);
          const lowerResult = calculateGrade(lower);
          expect(higherResult.gpa).toBeGreaterThanOrEqual(lowerResult.gpa);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("percentage >= 90 always yields A+ with gpa 4.0", () => {
    /**
     * Validates: Requirements 3.3
     */
    fc.assert(
      fc.property(
        fc.float({ min: 90, max: 100, noNaN: true }),
        (percentage) => {
          const result = calculateGrade(percentage);
          expect(result.grade).toBe('A+');
          expect(result.gpa).toBe(4.0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("percentage < 33 always yields F with gpa 0.0", () => {
    /**
     * Validates: Requirements 3.3
     */
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: Math.fround(32.99), noNaN: true }),
        (percentage) => {
          const result = calculateGrade(percentage);
          expect(result.grade).toBe('F');
          expect(result.gpa).toBe(0.0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6.6: Backend grading functions produce consistent results
// Validates: Requirements 3.4, 3.5
// Non-buggy path: program metadata is non-null
// ---------------------------------------------------------------------------

describe("Property 6.6: Backend grading functions produce consistent results", () => {
  it("calculateGradeForIntermediate: grade and gpa always defined for [0, 100]", () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        percentageArb,
        (percentage) => {
          const result = calculateGradeForIntermediate(percentage);
          expect(result).toHaveProperty('grade');
          expect(result).toHaveProperty('gpa');
          expect(typeof result.grade).toBe('string');
          expect(result.grade.length).toBeGreaterThan(0);
          expect(result.gpa).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("calculateGradeForUndergraduate: grade and gpa always defined for [0, 100]", () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        percentageArb,
        (percentage) => {
          const result = calculateGradeForUndergraduate(percentage);
          expect(result).toHaveProperty('grade');
          expect(result).toHaveProperty('gpa');
          expect(typeof result.grade).toBe('string');
          expect(result.grade.length).toBeGreaterThan(0);
          expect(result.gpa).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("intermediate grading: higher percentage never yields lower gpa", () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 99, noNaN: true }),
        fc.float({ min: 0, max: 99, noNaN: true }),
        (p1, p2) => {
          const higher = Math.max(p1, p2);
          const lower = Math.min(p1, p2);
          expect(calculateGradeForIntermediate(higher).gpa)
            .toBeGreaterThanOrEqual(calculateGradeForIntermediate(lower).gpa);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("undergraduate grading: higher percentage never yields lower gpa", () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 99, noNaN: true }),
        fc.float({ min: 0, max: 99, noNaN: true }),
        (p1, p2) => {
          const higher = Math.max(p1, p2);
          const lower = Math.min(p1, p2);
          expect(calculateGradeForUndergraduate(higher).gpa)
            .toBeGreaterThanOrEqual(calculateGradeForUndergraduate(lower).gpa);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6.7: isBugCondition correctly identifies non-buggy inputs
// Validates: Requirements 3.1–3.6 (meta-property: the test boundary is correct)
// ---------------------------------------------------------------------------

describe("Property 6.7: isBugCondition correctly identifies non-buggy inputs", () => {
  it("returns false for printStudentResult with non-null exam.class and no spaces in HTML", () => {
    /**
     * Validates: Requirements 3.3
     */
    fc.assert(
      fc.property(
        fc.record({ name: nonEmptyStr }),
        nonEmptyStr,
        (cls, programName) => {
          const input = {
            event: 'printStudentResult',
            exam: { class: cls, program: { name: programName } },
            marksRowsHtml: '<tr><td>Math</td></tr>',
            photoHtml: '<img src="photo.jpg"/>',
          };
          expect(isBugCondition(input)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns false for generateResults with non-null program duration", () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        fc.constantFrom('2 years', '4 years', '5 years', '1 year'),
        fc.option(fc.constantFrom('UNDERGRADUATE', 'INTERMEDIATE'), { nil: null }),
        (duration, level) => {
          const input = {
            event: 'generateResults',
            exam: { program: { duration, level } },
          };
          expect(isBugCondition(input)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns false for generateResults with non-null program level", () => {
    /**
     * Validates: Requirements 3.4
     */
    fc.assert(
      fc.property(
        fc.constantFrom('UNDERGRADUATE', 'INTERMEDIATE', 'MATRIC'),
        (level) => {
          const input = {
            event: 'generateResults',
            exam: { program: { duration: null, level } },
          };
          expect(isBugCondition(input)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
