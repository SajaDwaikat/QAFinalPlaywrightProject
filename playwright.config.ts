// playwright.config.ts
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  reporter: 'html',

  use: {
    baseURL: process.env.BASE_URL || 'https://practicesoftwaretesting.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { browserName: 'chromium' }, 
    },

   
    {
      name: 'Chromium',
      dependencies: ['setup'],
      use: {
        browserName: 'chromium',
        storageState: 'utils/storageState.json',
      },
    },
    {
      name: 'Firefox',
      dependencies: ['setup'],
      use: {
        browserName: 'firefox',
        storageState: 'utils/storageState.json',
      },
    },
  ],
});
