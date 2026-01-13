import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },

  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],

  use: {
    baseURL: process.env.BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ignoreHTTPSErrors: true,
  },

  projects: [
    // =========================
    // DESKTOP
    // =========================
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "Desktop Safari",
      use: {
        ...devices["Desktop Safari"],
      },
    },

    // =========================
    // MOBILE – CHROMIUM
    // =========================
    {
      name: "Android Chrome (Pixel 7)",
      use: {
        ...devices["Pixel 7"],
      },
    },

    // =========================
    // MOBILE – iOS (SAFARI)
    // =========================
    {
      name: "iPhone 14 Safari",
      use: {
        ...devices["iPhone 14"],
      },
    },
    {
      name: "iPad Pro 11 Safari",
      use: {
        ...devices["iPad Pro 11"],
      },
    },
  ],
});
