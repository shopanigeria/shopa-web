import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows the login form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows validation errors on empty form submit", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    // At least one error message should appear
    await expect(page.locator("text=/required/i").first()).toBeVisible();
  });

  test("shows error message with invalid credentials", async ({ page }) => {
    await page.getByPlaceholder(/email/i).fill("wrong@test.com");
    await page.getByPlaceholder(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Error toast or inline error should appear
    await expect(
      page.locator("text=/invalid|incorrect|wrong|credentials/i").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("has link to vendor login", async ({ page }) => {
    await expect(page.getByRole("link", { name: /vendor login/i })).toBeVisible();
  });

  test("has link to admin login", async ({ page }) => {
    await expect(page.getByRole("link", { name: /admin login/i })).toBeVisible();
  });
});
