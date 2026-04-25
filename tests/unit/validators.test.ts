import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
} from "@/lib/validators/auth.validators";

// ── loginSchema ───────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("rejects empty email/phone", () => {
    const result = loginSchema.safeParse({ email: "", password: "Secret1" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "user@test.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({ email: "user@test.com", password: "Secret1" });
    expect(result.success).toBe(true);
  });

  it("accepts a phone number in the email field (flexible field)", () => {
    const result = loginSchema.safeParse({ email: "08012345678", password: "Secret1" });
    expect(result.success).toBe(true);
  });
});

// ── signupSchema ──────────────────────────────────────────────────────────────

const validSignup = {
  firstName: "Sade",
  lastName: "Bello",
  email: "sade@crawford.edu",
  confirmEmail: "sade@crawford.edu",
  phone: "08012345678",
  password: "Secret123",
  confirmPassword: "Secret123",
};

describe("signupSchema", () => {
  it("accepts a fully valid signup payload", () => {
    const result = signupSchema.safeParse(validSignup);
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      confirmPassword: "WrongPass1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("confirmPassword");
    }
  });

  it("rejects an invalid Nigerian phone number", () => {
    const result = signupSchema.safeParse({ ...validSignup, phone: "12345678" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid Nigerian phone number starting with 0", () => {
    const result = signupSchema.safeParse({ ...validSignup, phone: "08012345678" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid Nigerian phone number starting with +234", () => {
    const result = signupSchema.safeParse({ ...validSignup, phone: "+2348012345678" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty phone (optional field)", () => {
    const result = signupSchema.safeParse({ ...validSignup, phone: "" });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: "Sec1",
      confirmPassword: "Sec1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no uppercase letter", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: "secret123",
      confirmPassword: "secret123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no number", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: "SecretPass",
      confirmPassword: "SecretPass",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email format", () => {
    const result = signupSchema.safeParse({ ...validSignup, email: "not-an-email", confirmEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched email confirmation", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      confirmEmail: "different@test.com",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("confirmEmail");
    }
  });

  it("rejects missing firstName", () => {
    const result = signupSchema.safeParse({ ...validSignup, firstName: "" });
    expect(result.success).toBe(false);
  });
});

// ── forgotPasswordSchema ──────────────────────────────────────────────────────

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "user@test.com" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email format", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});
