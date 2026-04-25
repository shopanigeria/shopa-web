import {
  formatNaira,
  calculateServiceFee,
  calculatePaystackFee,
  truncate,
  getInitials,
  capitalize,
  formatOrderStatus,
} from "@/lib/utils";

describe("formatNaira", () => {
  it("formats 1500 as ₦1,500", () => {
    expect(formatNaira(1500)).toBe("₦1,500");
  });

  it("formats 0 as ₦0", () => {
    expect(formatNaira(0)).toBe("₦0");
  });

  it("formats large amounts with commas", () => {
    expect(formatNaira(1000000)).toBe("₦1,000,000");
  });

  it("rounds decimals — no fractional naira", () => {
    expect(formatNaira(1500.75)).toBe("₦1,501");
  });
});

describe("calculateServiceFee", () => {
  it("returns 7.5% of subtotal", () => {
    expect(calculateServiceFee(10000)).toBe(750);
  });

  it("rounds fractional fees", () => {
    expect(calculateServiceFee(1000)).toBe(75);
  });

  it("returns 0 for zero subtotal", () => {
    expect(calculateServiceFee(0)).toBe(0);
  });
});

describe("calculatePaystackFee", () => {
  it("returns 1.5% of amount for small transactions", () => {
    expect(calculatePaystackFee(10000)).toBe(150);
  });

  it("caps fee at ₦2000 for large transactions", () => {
    expect(calculatePaystackFee(500000)).toBe(2000);
  });

  it("returns 0 for zero amount", () => {
    expect(calculatePaystackFee(0)).toBe(0);
  });
});

describe("truncate", () => {
  it("truncates text longer than maxLength and appends ...", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  it("returns original text when within maxLength", () => {
    expect(truncate("Hi", 5)).toBe("Hi");
  });

  it("returns original text when exactly at maxLength", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });
});

describe("getInitials", () => {
  it("returns uppercased first letters of first and last name", () => {
    expect(getInitials("John", "Doe")).toBe("JD");
  });

  it("works with lowercase input", () => {
    expect(getInitials("ayomide", "lawal")).toBe("AL");
  });

  it("handles empty strings gracefully", () => {
    expect(getInitials("", "")).toBe("");
  });
});

describe("capitalize", () => {
  it("capitalizes first letter and lowercases rest", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("lowercases subsequent letters", () => {
    expect(capitalize("hELLO")).toBe("Hello");
  });

  it("handles single character", () => {
    expect(capitalize("a")).toBe("A");
  });
});

describe("formatOrderStatus", () => {
  it("replaces underscores with spaces and title-cases each word", () => {
    expect(formatOrderStatus("under_review")).toBe("Under Review");
  });

  it("handles single-word status", () => {
    expect(formatOrderStatus("pending")).toBe("Pending");
  });

  it("handles already-spaced input (uppercases each word boundary)", () => {
    // The function replaces _ then title-cases word boundaries.
    // All-caps input has no underscores, so each letter after a boundary is uppercased
    // and the rest remain as-is — "IN PROGRESS" stays "IN PROGRESS".
    expect(formatOrderStatus("IN PROGRESS")).toBe("IN PROGRESS");
  });

  it("handles multi-word underscored status", () => {
    expect(formatOrderStatus("vendor_responded")).toBe("Vendor Responded");
  });
});
