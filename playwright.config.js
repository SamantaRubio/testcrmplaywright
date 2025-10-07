import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.BASE_URL;

export default defineConfig({
 //  globalSetup: './global-setup.js',
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  // Retries and workers adapted to CI
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  // Reports: console + html + json
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ['json', { outputFile: 'results.json' }],
    ['line']
  ],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    // video: "retain-on-failure",
    video: "on",
    screenshot: "only-on-failure",
    // Anonymous storage by default (we already include it in /storage)
    storageState: "storage/anon.json",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    // Best practices for stability in CI
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    // Attribute for data-test=""
    testIdAttribute: "id",
  },

  projects: [
    // Desktop
    {
      name: "setup",
      use: { 
        ...devices["Desktop Chrome"]
      },
      testMatch: /.*\.setup\.js/,
    },
    {
      name: "desktop-chromium",
      use: { 
        ...devices["Desktop Chrome"],
        storageState: "storage/auth.json",
      },
      dependencies: ["setup"],
    },
    // {
    //   name: "desktop-firefox",
    //   use: { 
    //     ...devices["Desktop Firefox"],
    //     storageState: "storage/auth.json", 
    //   },
    //   dependencies: ["setup"],
    // },
  //   {
  //     name: "desktop-webkit",
  //     use: { 
  //       ...devices["Desktop Safari"],
  //       storageState: "storage/auth.json",
  //     },
  //     dependencies: ["setup"],
  //   },

  // //  Mobile (IOS & Android)
  //   {
  //     name: "mobile-iphone15",
  //     use: { 
  //       ...devices["iPhone 15 Pro"],
  //       storageState: "storage/auth.json",
  //     },
  //     dependencies: ["setup"],
  //   },
    // {
    //   name: "mobile-android",
    //   use: { 
    //     ...devices["Pixel 7"],
    //     storageState: "storage/auth.json",
    //   },
    //   dependencies: ["setup"],
    // },

  ],
});
