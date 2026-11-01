import { isManagerRole, roleLabel } from "./managerAccess";

describe("manager role access", () => {
  test.each(["moderator", "manager"])("%s is allowed", (role) => {
    expect(isManagerRole(role)).toBe(true);
    expect(roleLabel(role)).toBe("Manager");
  });

  test.each(["admin", "staff", "citizen", null, undefined])("%s is not allowed", (role) => {
    expect(isManagerRole(role)).toBe(false);
  });
});
