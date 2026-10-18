import { describe, it, expect } from "vitest";
import { assertStatusPermission, membershipAuthUpdate, memberStatusSchema } from "./member-status";
describe("membership activation", () => {
  it("disabling bans sign in", () => expect(membershipAuthUpdate(false)).toEqual({ ban_duration: "876000h" }));
  it("enabling removes the ban", () => expect(membershipAuthUpdate(true)).toEqual({ ban_duration: "none" }));
  it("allows company admin for own company", () => expect(() => assertStatusPermission("a", "b", "c", [{role:"company_admin",company_id:"c"}], [{role:"employee"}])).not.toThrow());
  it("rejects another company", () => expect(() => assertStatusPermission("a", "b", "c", [{role:"company_admin",company_id:"d"}], [{role:"employee"}])).toThrow());
  it("rejects self disable", () => expect(() => assertStatusPermission("a", "a", "c", [{role:"super_admin",company_id:null}], [{role:"company_admin"}])).toThrow());
  it("rejects platform targets", () => expect(() => assertStatusPermission("a", "b", "c", [{role:"super_admin",company_id:null}], [{role:"super_admin"}])).toThrow());
  it("requires a boolean status", () => expect(memberStatusSchema.safeParse({user_id:"9b5a68d0-b3db-4894-88b9-079384b4e501",is_active:"false"}).success).toBe(false));
});