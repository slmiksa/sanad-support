import { describe, expect, it } from "vitest";
import { MEMBER_COLUMNS, assertMemberCapacity, memberRoleSchema, validateMemberSheet } from "./member-import";
const header = MEMBER_COLUMNS.map(([, label]) => label);
const valid = ["سالم", "salem@example.com", "SecurePass123", "00500", "010", "تقنية", "الدعم", "0501234567"];
describe("membership Excel rules", () => {
  for (let column = 0; column < 8; column++) it(`requires ${header[column]}`, () => {
    const row = [...valid]; row[column] = "";
    expect(validateMemberSheet([header, row]).errors).toHaveLength(1);
  });
  it("preserves employee number and extension and mobile leading zeroes", () => {
    const member = validateMemberSheet([header, valid]).rows[0]?.member;
    expect(member?.employee_no).toBe("00500"); expect(member?.extension).toBe("010"); expect(member?.phone).toBe("0501234567");
  });
  it("rejects duplicate emails", () => expect(validateMemberSheet([header, valid, valid]).errors).toHaveLength(1));
  it("allows exactly 500 memberships but rejects the 501st", () => {
    expect(() => assertMemberCapacity(499, 500, 1)).not.toThrow();
    expect(() => assertMemberCapacity(500, 500, 1)).toThrow();
    expect(() => assertMemberCapacity(499, 500, 2)).toThrow();
  });
  it("allows only employee, support, or company admin batch roles", () => {
    for (const role of ["employee", "agent", "company_admin"]) expect(memberRoleSchema.safeParse(role).success).toBe(true);
    expect(memberRoleSchema.safeParse("super_admin").success).toBe(false);
  });
});