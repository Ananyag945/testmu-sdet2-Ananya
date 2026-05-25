import { test as base, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { envConfig } from '../../config/env.config';
import { mockDb } from '../utils/mockDb';
import * as fs from 'fs';
import * as path from 'path';

type CustomFixtures = {
  authenticatedPage: Page;
};

/**
 * High-fidelity client-side browser mock routing.
 * Injects responsive interactive elements into DOM to verify POM behaviors.
 */
async function setupUiMockInterceptors(page: Page): Promise<void> {
  const isMockActive = envConfig.baseUrl.includes('example.com');
  if (!isMockActive) return; // Skip if targeting real deployment

  // 1. Intercept /login route
  await page.route('**/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>TestMu AI - Login</title>
        </head>
        <body>
          <div id="login-container">
            <h2>Sign In</h2>
            <input data-testid="login-email" type="text" placeholder="Email" />
            <input data-testid="login-password" type="password" placeholder="Password" />
            <button data-testid="login-submit">Login</button>
            <div data-testid="login-error-message" style="display:none; color:red;"></div>
            <div data-testid="user-menu" style="display:none;">Menu Active</div>
          </div>
          <script>
            const submitBtn = document.querySelector('[data-testid="login-submit"]');
            const emailInput = document.querySelector('[data-testid="login-email"]');
            const passwordInput = document.querySelector('[data-testid="login-password"]');
            const errorDiv = document.querySelector('[data-testid="login-error-message"]');
            const userMenu = document.querySelector('[data-testid="user-menu"]');

            submitBtn.onclick = () => {
              const email = emailInput.value.trim();
              const password = passwordInput.value.trim();
              
              errorDiv.style.display = 'none';

              if (!email) {
                errorDiv.innerText = "Email is required";
                errorDiv.style.display = "block";
              } else if (!password) {
                errorDiv.innerText = "Password is required";
                errorDiv.style.display = "block";
              } else if (email === 'locked@example.com') {
                errorDiv.innerText = "Account locked: contact admin";
                errorDiv.style.display = "block";
              } else if (password === 'wrongpassword') {
                errorDiv.innerText = "Invalid credentials: password incorrect";
                errorDiv.style.display = "block";
              } else if (password === 'securepassword' || password === 'readerpassword') {
                // Mock cookie auth
                document.cookie = "session=mock-cookie-auth";
                userMenu.style.display = "block";
                setTimeout(() => {
                  window.location.href = '/dashboard';
                }, 50);
              } else {
                errorDiv.innerText = "Invalid credentials";
                errorDiv.style.display = "block";
              }
            };
          </script>
        </body>
        </html>
      `
    });
  });

  // 2. Intercept /dashboard route (incorporating settings, profiles, and reports grids)
  await page.route('**/dashboard', async (route) => {
    // Generate dynamic grid records from mockDb to support integration tests
    const reportsTableRowsHtml = mockDb.getResources().map(r => `
      <tr data-testid="resource-row-${r.id}">
        <td data-testid="resource-title-${r.id}">${r.name}</td>
        <td data-testid="resource-items-${r.id}">${r.itemsCount}</td>
      </tr>
    `).join('');

    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>TestMu AI - Dashboard</title>
          <style>
            .hidden { display: none; }
            .visible { display: block; }
          </style>
        </head>
        <body>
          <div id="dashboard-container">
            <h1 data-testid="dashboard-heading">Workspace Dashboard</h1>
            <div data-testid="welcome-message">Welcome, Admin User</div>
            
            <!-- Side Navbar Options -->
            <nav>
              <a data-testid="nav-link-reports" href="#reports" id="reports-tab-link">Reports</a>
              <a data-testid="nav-link-settings" href="#settings" id="settings-tab-link">Settings</a>
            </nav>

            <div data-testid="user-menu">Menu Profile Active</div>

            <!-- View Sections -->
            <div id="reports-section" class="visible">
              <h3>Reports Grid</h3>
              <table>
                <thead>
                  <tr><th>Title</th><th>Items</th></tr>
                </thead>
                <tbody id="reports-grid">
                  ${reportsTableRowsHtml}
                </tbody>
              </table>
            </div>

            <div id="settings-section" class="hidden">
              <h3>Profile Settings Form</h3>
              <div id="form-container">
                <input data-testid="form-name" type="text" placeholder="Name" />
                <input data-testid="form-email" type="text" placeholder="Contact Email" />
                <textarea data-testid="form-description" placeholder="Description"></textarea>
                <button data-testid="form-submit">Save changes</button>
                
                <!-- Errors and Success -->
                <div data-testid="form-error-name" class="hidden" style="color:red;"></div>
                <div data-testid="form-error-email" class="hidden" style="color:red;"></div>
                <div data-testid="form-error-description" class="hidden" style="color:red;"></div>
                <div data-testid="form-success" class="hidden" style="color:green;"></div>
              </div>
            </div>
          </div>

          <script>
            const reportsLink = document.getElementById('reports-tab-link');
            const settingsLink = document.getElementById('settings-tab-link');
            const reportsDiv = document.getElementById('reports-section');
            const settingsDiv = document.getElementById('settings-section');

            // Handle Spa Navigation
            const showTab = (tab) => {
              if (tab === 'settings') {
                reportsDiv.className = 'hidden';
                settingsDiv.className = 'visible';
              } else {
                reportsDiv.className = 'visible';
                settingsDiv.className = 'hidden';
              }
            };

            reportsLink.onclick = () => showTab('reports');
            settingsLink.onclick = () => showTab('settings');

            // Listen for hash triggers to help POM navigation calls
            window.onhashchange = () => {
              if(window.location.hash === '#settings') showTab('settings');
              else showTab('reports');
            };

            // Form Submit Interceptions
            const submitBtn = document.querySelector('[data-testid="form-submit"]');
            const nameInput = document.querySelector('[data-testid="form-name"]');
            const emailInput = document.querySelector('[data-testid="form-email"]');
            const descInput = document.querySelector('[data-testid="form-description"]');
            
            const errName = document.querySelector('[data-testid="form-error-name"]');
            const errEmail = document.querySelector('[data-testid="form-error-email"]');
            const errDesc = document.querySelector('[data-testid="form-error-description"]');
            const successBanner = document.querySelector('[data-testid="form-success"]');

            submitBtn.onclick = () => {
              // Reset views
              errName.className = 'hidden';
              errEmail.className = 'hidden';
              errDesc.className = 'hidden';
              successBanner.className = 'hidden';

              const nameVal = nameInput.value.trim();
              const emailVal = emailInput.value.trim();
              const descVal = descInput.value.trim();

              let hasError = false;

              if (!nameVal) {
                errName.innerText = "Name field is required";
                errName.className = 'visible';
                hasError = true;
              }

              if (emailVal && !emailVal.includes('@')) {
                errEmail.innerText = "Invalid email format";
                errEmail.className = 'visible';
                hasError = true;
              }

              if (descVal.length > 500) {
                errDesc.innerText = "Description character limit exceeded: too long";
                errDesc.className = 'visible';
                hasError = true;
              }

              if (!hasError) {
                successBanner.innerText = "Profile saved successfully!";
                successBanner.className = 'visible';
              }
            };
          </script>
        </body>
        </html>
      `
    });
  });
}

// Extend base Playwright fixture with custom routing interceptors
export const test = base.extend<CustomFixtures>({
  page: async ({ page }, use) => {
    await setupUiMockInterceptors(page);
    await use(page);
  },
  authenticatedPage: async ({ browser }, use) => {
    // Unique caching key mapped to current worker thread to support safe parallel shards
    const workerId = process.env.TEST_WORKER_INDEX || '0';
    const authFile = path.resolve(`test-results/.auth/user_worker_${workerId}.json`);
    const authDir = path.dirname(authFile);

    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    if (!fs.existsSync(authFile)) {
      console.log(`🔑 [Auth Fixture] Worker #${workerId} initializing serialized credentials cache...`);
      const context = await browser.newContext();
      const setupPage = await context.newPage();
      
      try {
        await setupUiMockInterceptors(setupPage);
        const loginPage = new LoginPage(setupPage);
        await loginPage.navigate('/login');
        await loginPage.login(envConfig.credentials.email, envConfig.credentials.password);
        
        const loggedIn = await loginPage.isLoggedIn();
        if (!loggedIn) {
          throw new Error('Credential menu visibility failed during Setup.');
        }

        await context.storageState({ path: authFile });
        console.log(`💾 [Auth Fixture] Worker #${workerId} successfully serialized credentials at: ${authFile}`);
      } finally {
        await setupPage.close();
        await context.close();
      }
    }

    const authenticatedContext = await browser.newContext({
      storageState: authFile,
    });
    
    const pageInstance = await authenticatedContext.newPage();
    // Re-attach our mock routes interceptors on the authenticated page context
    await setupUiMockInterceptors(pageInstance);
    
    await use(pageInstance);

    await pageInstance.close();
    await authenticatedContext.close();
  },
});

export { expect };
