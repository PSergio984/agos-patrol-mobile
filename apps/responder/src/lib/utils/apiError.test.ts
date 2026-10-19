import { AxiosError } from "axios";
import { apiErrorMessage } from "./apiError";

const FALLBACK = "Something went wrong";

function axiosErr(data: unknown): AxiosError {
  const err = new AxiosError("Request failed");
  err.response = { data, status: 422, statusText: "", headers: {}, config: {} as never };
  return err;
}

describe("apiErrorMessage", () => {
  it("returns detail when it's a plain string (HTTPException)", () => {
    expect(
      apiErrorMessage(axiosErr({ detail: "Phone number not registered." }), FALLBACK)
    ).toBe("Phone number not registered.");
  });

  it("joins msg fields when detail is a Pydantic v2 validation array", () => {
    const detail = [
      { type: "missing", loc: ["body", "phone_number"], msg: "Field required", input: {}, ctx: {} },
      { type: "string_type", loc: ["body", "code"], msg: "Input should be a valid string", input: 1, ctx: {} },
    ];
    expect(apiErrorMessage(axiosErr({ detail }), FALLBACK)).toBe(
      "Field required. Input should be a valid string"
    );
  });

  it("falls back when detail objects have no msg", () => {
    expect(apiErrorMessage(axiosErr({ detail: [{ type: "x" }] }), FALLBACK)).toBe(FALLBACK);
  });

  it("uses message when detail is absent", () => {
    expect(apiErrorMessage(axiosErr({ message: "nope" }), FALLBACK)).toBe("nope");
  });

  it("falls back for non-axios errors and missing bodies", () => {
    expect(apiErrorMessage(new Error("x"), FALLBACK)).toBe(FALLBACK);
    expect(apiErrorMessage(axiosErr(undefined), FALLBACK)).toBe(FALLBACK);
    expect(apiErrorMessage(null, FALLBACK)).toBe(FALLBACK);
  });
});
