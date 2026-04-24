import { test, expect } from "@playwright/test";

// These tests require a logged-in session.
// We use the mock-login flow which sets the auth cookie without needing real credentials.
test.describe("Customer home page", () => {
  test.beforeEach(async ({ page }) => {
    // Use mock login to bypass auth in development
    await page.goto("/vendor/mock-login");
    // Wait for redirect to complete, then go to a customer page
    // Note: in full E2E you would use a real customer mock-login endpoint
    await page.goto("/login");
  });

  test("login page is accessible", async ({ page }) => {
    await expect(page).toHaveURL(/login/);
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });
});

test.describe("Home page (unauthenticated redirect)", () => {
  test("redirects /home to login when unauthenticated", async ({ page }) => {
    await page.goto("/home");
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test("redirects /cart to login when unauthenticated", async ({ page }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL(/login/);
  });

  test("redirects /orders to login when unauthenticated", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Public pages", () => {
  test("/ renders without crashing", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/login renders without crashing", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/signup renders without crashing", async ({ page }) => {
    const response = await page.goto("/signup");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/forgot-password renders without crashing", async ({ page }) => {
    const response = await page.goto("/forgot-password");
    expect(response?.status()).toBeLessThan(500);
  });
});
