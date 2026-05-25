import { test, expect } from '../../src/fixtures/auth.fixtures';
import { DashboardPage } from '../../src/pages/DashboardPage';
import users from '../../test-data/users.json';

test.describe('Dashboard Verification', () => {
  // Utilizing the storageState injected pre-authenticated page fixture
  test('Should render dashboard view elements and navigation tabs successfully @smoke', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    
    // Navigate directly to dashboard - bypassed standard login form inputs!
    await dashboardPage.navigate('/dashboard');

    // Assert: page heading text is present and visible
    const headingText = await dashboardPage.getPageHeading();
    expect(headingText).toContain('Workspace Dashboard');

    // Assert: welcome banner renders containing user name/role metadata
    const welcomeMessage = await dashboardPage.getWelcomeMessage();
    
    const adminUser = users.find(u => u.role === 'admin' && u.expectedOutcome === 'success');
    const targetIndicator = adminUser ? 'Admin' : 'User';
    expect(welcomeMessage).toContain(targetIndicator);

    // Assert: at least 2 key navigation links are visible on the dashboard UI
    const isReportsLinkActive = await dashboardPage.isNavLinkVisible('Reports');
    const isSettingsLinkActive = await dashboardPage.isNavLinkVisible('Settings');

    expect(isReportsLinkActive).toBe(true);
    expect(isSettingsLinkActive).toBe(true);
  });
});
