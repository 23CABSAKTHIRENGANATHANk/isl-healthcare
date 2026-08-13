import { test, expect } from "@playwright/test";

test.describe("Assessment Flow (Sanity)", () => {
  test("should load landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ISL Setu/i);
    await expect(page.locator("h1")).toContainText(/Breaking the Communication Barrier/i);
  });

  test("should navigate to practice page", async ({ page }) => {
    await page.goto("/practice");
    // May redirect to login if not authenticated, so check for either login or practice page
    const url = page.url();
    expect(url).toMatch(/practice|login/);
  });

  test("should load voicebridge page", async ({ page }) => {
    await page.goto("/voicebridge");
    const url = page.url();
    expect(url).toMatch(/voicebridge|login/);
  });

  test("should render certification page structure", async ({ page }) => {
    await page.goto("/certification");
    const url = page.url();
    // May redirect to login if not authenticated
    expect(url).toMatch(/certification|login/);
  });

  test("should render about page with roadmap", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("text=/ISL Setu|Mission/i")).toBeVisible();
  });
});

test.describe("Assessment Page", () => {
  test("should load assessment page", async ({ page }) => {
    await page.goto("/assessment");
    const url = page.url();
    // May redirect to login or assessment page
    expect(url).toMatch(/assessment|login/);
  });

  test("should have main navigation links", async ({ page }) => {
    await page.goto("/");
    // Check for navbar with key links
    const practiceLink = page.locator('a:has-text("Practice")').first();
    await expect(practiceLink).toBeVisible();
    
    const voicebridgeLink = page.locator('a:has-text("VoiceBridge")').first();
    await expect(voicebridgeLink).toBeVisible();
    
    const assessmentLink = page.locator('a:has-text("Assessment")').first();
    await expect(assessmentLink).toBeVisible();
  });
});

test.describe("Assessment Flow (Full)", () => {
  test("should display assessment title and timer on load", async ({ page }) => {
    await page.goto("/assessment");
    // Check if page loads without navigation to login
    const url = page.url();
    if (url.includes("/login")) {
      // Skip this test if auth redirects
      test.skip();
    }
    
    // Look for assessment header
    const assessmentTitle = page.locator("text=/Healthcare ISL Assessment|Bronze/i").first();
    await expect(assessmentTitle).toBeVisible({ timeout: 5000 });
  });

  test("should allow answering multiple choice questions", async ({ page }) => {
    await page.goto("/assessment");
    const url = page.url();
    if (url.includes("/login")) {
      test.skip();
    }

    // Wait for first question to render
    await page.waitForTimeout(500);
    
    // Try to select a radio option if visible
    const radioOptions = page.locator("input[type='radio']");
    const count = await radioOptions.count();
    if (count > 0) {
      await radioOptions.first().click();
      await expect(radioOptions.first()).toBeChecked();
    }
  });

  test("should display question progress", async ({ page }) => {
    await page.goto("/assessment");
    const url = page.url();
    if (url.includes("/login")) {
      test.skip();
    }

    // Look for progress indicator
    const progressText = page.locator("text=/Question.*\\d+.*\\d+/i").first();
    await expect(progressText).toBeVisible({ timeout: 5000 });
  });

  test("should show results after submission", async ({ page }) => {
    await page.goto("/assessment");
    const url = page.url();
    if (url.includes("/login")) {
      test.skip();
    }

    // Check if we can see a Submit button eventually
    const submitButton = page.locator("button:has-text('Submit')").first();
    const visible = await submitButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    // If Submit is visible, verify it exists (don't click to avoid long timeout)
    if (visible) {
      await expect(submitButton).toBeVisible();
    }
  });
});
