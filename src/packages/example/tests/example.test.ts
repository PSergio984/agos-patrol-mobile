import { greet } from "../index";

describe("example package", () => {
  it("greets through the entry point", () => {
    expect(greet("world")).toBe("Hello, world!");
  });
});
