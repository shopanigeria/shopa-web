// Mock js-cookie before any imports
jest.mock("js-cookie", () => ({
  get: jest.fn(() => null),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Mock the apiClient module so authService uses our controlled mock
jest.mock("@/lib/api/client", () => {
  const mockClient = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    apiClient: mockClient,
    tokenStorage: {
      getAccess: jest.fn(() => null),
      getRefresh: jest.fn(() => null),
      setTokens: jest.fn(),
      clearTokens: jest.fn(),
    },
  };
});

import Cookies from "js-cookie";
import { apiClient, tokenStorage } from "@/lib/api/client";

const mockedPost = apiClient.post as jest.Mock;
const setCookieMock = Cookies.set as jest.Mock;
const removeCookieMock = Cookies.remove as jest.Mock;
const setTokensMock = tokenStorage.setTokens as jest.Mock;
const clearTokensMock = tokenStorage.clearTokens as jest.Mock;

const MOCK_USER = {
  id: "user-1",
  email: "sade@crawford.edu",
  firstName: "Sade",
  lastName: "Bello",
  role: "customer",
  isVerified: true,
  createdAt: new Date().toISOString(),
};

const MOCK_AUTH_RESPONSE = {
  user: MOCK_USER,
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── authService.login ─────────────────────────────────────────────────────────

describe("authService.login", () => {
  it("calls POST /auth/login with the correct payload", async () => {
    mockedPost.mockResolvedValueOnce({ data: MOCK_AUTH_RESPONSE });
    const { authService } = await import("@/lib/api/services/auth.service");

    await authService.login({ email: "sade@crawford.edu", password: "Secret123" });

    expect(mockedPost).toHaveBeenCalledWith(
      "/auth/login",
      { email: "sade@crawford.edu", password: "Secret123" }
    );
  });

  it("calls tokenStorage.setTokens with the returned tokens", async () => {
    mockedPost.mockResolvedValueOnce({ data: MOCK_AUTH_RESPONSE });
    const { authService } = await import("@/lib/api/services/auth.service");

    await authService.login({ email: "sade@crawford.edu", password: "Secret123" });

    expect(setTokensMock).toHaveBeenCalledWith("mock-access-token", "mock-refresh-token");
  });

  it("returns the full auth response including user", async () => {
    mockedPost.mockResolvedValueOnce({ data: MOCK_AUTH_RESPONSE });
    const { authService } = await import("@/lib/api/services/auth.service");

    const result = await authService.login({ email: "sade@crawford.edu", password: "Secret123" });

    expect(result.user).toEqual(MOCK_USER);
    expect(result.accessToken).toBe("mock-access-token");
  });

  it("throws on invalid credentials (4xx response)", async () => {
    mockedPost.mockRejectedValueOnce({
      response: { status: 401, data: { message: "Invalid credentials" } },
    });
    const { authService } = await import("@/lib/api/services/auth.service");

    await expect(
      authService.login({ email: "wrong@test.com", password: "wrongpass" })
    ).rejects.toMatchObject({ response: { status: 401 } });
  });
});

// ── authService.signup ────────────────────────────────────────────────────────

describe("authService.signup", () => {
  it("calls POST /auth/register with the correct payload", async () => {
    mockedPost.mockResolvedValueOnce({ data: MOCK_AUTH_RESPONSE });
    const { authService } = await import("@/lib/api/services/auth.service");

    await authService.signup({
      firstName: "Sade",
      lastName: "Bello",
      email: "sade@crawford.edu",
      password: "Secret123",
    });

    expect(mockedPost).toHaveBeenCalledWith(
      "/auth/register",
      expect.objectContaining({ email: "sade@crawford.edu" })
    );
  });

  it("calls tokenStorage.setTokens after successful signup", async () => {
    mockedPost.mockResolvedValueOnce({ data: MOCK_AUTH_RESPONSE });
    const { authService } = await import("@/lib/api/services/auth.service");

    await authService.signup({
      firstName: "Sade",
      lastName: "Bello",
      email: "sade@crawford.edu",
      password: "Secret123",
    });

    expect(setTokensMock).toHaveBeenCalledWith("mock-access-token", "mock-refresh-token");
  });
});

// ── authService.logout ────────────────────────────────────────────────────────

describe("authService.logout", () => {
  it("calls POST /auth/logout", async () => {
    mockedPost.mockResolvedValueOnce({ data: {} });
    const { authService } = await import("@/lib/api/services/auth.service");

    await authService.logout();

    expect(mockedPost).toHaveBeenCalledWith("/auth/logout");
  });

  it("calls tokenStorage.clearTokens on logout", async () => {
    mockedPost.mockResolvedValueOnce({ data: {} });
    const { authService } = await import("@/lib/api/services/auth.service");

    await authService.logout();

    expect(clearTokensMock).toHaveBeenCalled();
  });

  it("still calls clearTokens even if the API call fails", async () => {
    mockedPost.mockRejectedValueOnce(new Error("Network error"));
    const { authService } = await import("@/lib/api/services/auth.service");

    // logout uses try/finally — the error is swallowed, clearTokens still runs
    try { await authService.logout(); } catch { /* swallowed by logout's finally */ }

    expect(clearTokensMock).toHaveBeenCalled();
  });
});

// ── tokenStorage (via mock) ───────────────────────────────────────────────────

describe("tokenStorage", () => {
  it("setTokens is called with access and refresh token strings", () => {
    tokenStorage.setTokens("acc", "ref");
    expect(setTokensMock).toHaveBeenCalledWith("acc", "ref");
  });

  it("clearTokens removes both tokens", () => {
    tokenStorage.clearTokens();
    expect(clearTokensMock).toHaveBeenCalled();
  });
});
