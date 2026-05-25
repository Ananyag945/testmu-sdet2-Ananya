/**
 * 🔗 INTEGRATION PATTERN: API-Seeded UI Validation
 * 
 * WHY THIS TEST EXISTS:
 * E2E tests that perform setup steps exclusively via the UI (e.g. clicking through menus,
 * writing values into multiple form pages, submitting, and waiting) are extremely slow and 
 * highly vulnerable to UI flakiness. 
 * 
 * A robust alternative is this hybrid pattern:
 * 1. SEED DATA via high-speed, direct API calls (Phase 1).
 * 2. NAVIGATE UI to verify that the front-end page accurately pulls, formats, and renders the 
 *    new database records (Phase 2).
 * 3. TEARDOWN DATA programmatically via the API in a test.afterAll loop to leave the database clean,
 *    regardless of whether the UI verification succeeded or failed.
 */

import { test, expect } from '../../src/fixtures/auth.fixtures';
import { ApiClient, API_ENDPOINTS } from '../../src/api/ApiClient';
import { LoginPage } from '../../src/pages/LoginPage';
import { DashboardPage } from '../../src/pages/DashboardPage';

test.describe('Integrated API-UI Verification', () => {
  let apiClient: ApiClient;
  let createdResourceId: string | null = null;
  const testResourceName = `Integration_Suite_${Date.now()}`;

  test.beforeEach(async ({ request }) => {
    // Standard API client setup
    apiClient = new ApiClient(request);
    apiClient.setAuthToken('mock-integration-write-token');
  });

  test.afterAll(async ({ request }) => {
    // API Clean up: Always guarantee database teardown
    if (createdResourceId) {
      console.log(`🧹 [Integration Cleanup] Deleting seeded resource ID: ${createdResourceId}`);
      const cleanupClient = new ApiClient(request);
      cleanupClient.setAuthToken('mock-integration-write-token');
      await cleanupClient.delete(API_ENDPOINTS.RESOURCE_BY_ID(createdResourceId));
    }
  });

  test('Should seed resource via API and verify presence in UI list view @smoke', async ({ page }) => {
    // --- STEP 1: API Resource Seeding ---
    const resourcePayload = {
      name: testResourceName,
      type: 'automated',
      owner: 'QA Integration Team',
      itemsCount: 99
    };

    console.log(`🚀 [Integration Step 1] Seeding resource via API: "${testResourceName}"`);
    const response = await apiClient.post(API_ENDPOINTS.RESOURCES, resourcePayload);
    expect(response.status()).toBe(201);
    
    const responseBody = await response.json();
    createdResourceId = responseBody.id;
    expect(createdResourceId).toBeDefined();
    console.log(`✅ [Integration Step 1] API seeding complete. Seeded ID: "${createdResourceId}"`);

    // --- STEP 2: UI Authentication and Navigation ---
    console.log('🚀 [Integration Step 2] Initializing UI login POM and dashboard validation...');
    const loginPage = new LoginPage(page);
    await loginPage.navigate('/login');
    
    // Log in using standard admin credentials
    await loginPage.login('admin@example.com', 'securepassword');
    const isLoggedIn = await loginPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate('/dashboard');
    // Navigate to resource list section
    await dashboardPage.navigateTo('Reports');

    // --- STEP 3: UI Assertions ---
    console.log(`🚀 [Integration Step 3] Asserting presence of seeded resource name: "${testResourceName}"`);
    
    // Locate the newly created resource in the report grid/list view
    const resourceLocator = page.locator(`[data-testid="resource-row-${createdResourceId}"]`);
    await resourceLocator.waitFor({ state: 'visible', timeout: 5000 });

    const resourceTitleText = await page.locator(`[data-testid="resource-title-${createdResourceId}"]`).textContent();
    expect(resourceTitleText).toBe(testResourceName);
    
    const resourceItemCount = await page.locator(`[data-testid="resource-items-${createdResourceId}"]`).textContent();
    expect(resourceItemCount).toContain('99');
    
    console.log('✅ [Integration Step 3] UI successfully rendered the exact API-seeded resource.');
  });
});
