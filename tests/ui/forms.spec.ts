import { test, expect } from '../../src/fixtures/auth.fixtures';
import { DashboardPage } from '../../src/pages/DashboardPage';

test.describe('Form Validations', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.navigate('/dashboard');
    // Simulate navigation to the Profile/Resource form section
    await dashboardPage.navigateTo('Settings');
  });

  // 1. Required field empty check
  test('Should display inline error when required field is submitted empty', async () => {
    // Attempt submitting with an empty Name field
    await dashboardPage.submitForm('', 'user@example.com', 'Valid Description');

    const nameError = await dashboardPage.getFormFieldError('name');
    expect(nameError).toMatch(/(required|empty|cannot be blank)/i);
  });

  // 2. Invalid email format check
  test('Should display inline error when email format is invalid', async () => {
    // Attempt submitting with malformed email structure
    await dashboardPage.submitForm('Test Name', 'invalidemail-no-domain', 'Valid Description');

    const emailError = await dashboardPage.getFormFieldError('email');
    expect(emailError).toMatch(/(invalid|format|email)/i);
  });

  // 3. Character limit checks
  test('Should display inline error or reject entry when description character limit is exceeded', async () => {
    // Description exceeds maximum character limit boundary (e.g. 500 characters)
    const longDescription = 'A'.repeat(550);
    await dashboardPage.submitForm('Test Name', 'user@example.com', longDescription);

    const descError = await dashboardPage.getFormFieldError('description');
    expect(descError).toMatch(/(limit|exceeded|too long|maximum)/i);
  });

  // 4. Parameterized valid submissions
  const validDataSets = [
    {
      name: "Standard Suite A",
      email: "suite-a@example.com",
      description: "Baseline automated acceptance scenario suite."
    },
    {
      name: "Core Integration Suite B",
      email: "core-b@example.com",
      description: "Full end-to-end regression validation metrics."
    },
    {
      name: "Staging Sanity Checks",
      email: "sanity@example.com",
      description: "Verification tests executed before shipping to staging."
    }
  ];

  for (const [index, dataset] of validDataSets.entries()) {
    test(`Should successfully submit valid dataset #${index + 1}: ${dataset.name}`, async () => {
      await dashboardPage.submitForm(dataset.name, dataset.email, dataset.description);

      const successMessage = await dashboardPage.getFormSuccessMessage();
      expect(successMessage).toMatch(/(success|saved|created|completed)/i);
    });
  }
});
