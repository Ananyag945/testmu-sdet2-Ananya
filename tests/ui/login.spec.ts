import { test, expect } from '../../src/fixtures/auth.fixtures';
import { LoginPage } from '../../src/pages/LoginPage';
import users from '../../test-data/users.json';

test.describe('Login Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate('/login');
  });

  test('Valid login succeeds and redirects to dashboard @smoke @browser', async ({ page }) => {
    const successUser = users.find(u => u.expectedOutcome === 'success');
    if (!successUser) {
      throw new Error('No successful credential defined in users.json data fixture.');
    }

    await loginPage.login(successUser.email, successUser.password);

    // Verify redirected dashboard URL or state check
    await expect(page).toHaveURL(/.*dashboard/);
    const isLoggedIn = await loginPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);
  });

  test('Empty email field shows custom or browser validation message', async () => {
    await loginPage.login('', 'somepassword');

    // Asserts that standard error messaging or page elements are visible
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain('Email');
  });

  test('Empty password field shows validation message', async () => {
    await loginPage.login('admin@example.com', '');

    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain('Password');
  });

  // Parameterized tests for negative credential cases
  const negativeCases = users.filter(user => user.expectedOutcome !== 'success');

  for (const scenario of negativeCases) {
    test(`Failed login scenario: ${scenario.label}`, async () => {
      await loginPage.login(scenario.email, scenario.password);

      const errorMessage = await loginPage.getErrorMessage();
      
      if (scenario.expectedOutcome === 'invalid_credentials') {
        expect(errorMessage).toMatch(/(invalid|credentials|password|email|incorrect)/i);
      } else if (scenario.expectedOutcome === 'account_locked') {
        expect(errorMessage).toMatch(/(locked|suspended|contact admin)/i);
      }
    });
  }
});
