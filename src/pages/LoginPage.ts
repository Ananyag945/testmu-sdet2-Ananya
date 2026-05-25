import { BasePage } from './BasePage';

/**
 * LoginPage POM representing the authentication screen.
 */
export class LoginPage extends BasePage {
  /** @placeholder — update data-testid to match actual app */
  private readonly emailInput = '[data-testid="login-email"]';

  /** @placeholder — update data-testid to match actual app */
  private readonly passwordInput = '[data-testid="login-password"]';

  /** @placeholder — update data-testid to match actual app */
  private readonly submitButton = '[data-testid="login-submit"]';

  /** @placeholder — update data-testid to match actual app */
  private readonly errorMessage = '[data-testid="login-error-message"]';

  /** @placeholder — update data-testid to match actual app */
  private readonly userMenu = '[data-testid="user-menu"]';

  /**
   * Action: Performs a standard user sign-in process.
   * @param email User login email
   * @param password User login password
   */
  public async login(email: string, password: string): Promise<void> {
    // We target inputs with Playwright's locator API to ensure robust actions
    await this.page.fill(this.emailInput, email);
    await this.page.fill(this.passwordInput, password);
    await this.page.click(this.submitButton);
    await this.waitForPageLoad();
  }

  /**
   * Reads error displays from failed sign-in attempts.
   */
  public async getErrorMessage(): Promise<string> {
    const errorLocator = this.page.locator(this.errorMessage);
    await errorLocator.waitFor({ state: 'visible', timeout: 5000 });
    return (await errorLocator.textContent()) || '';
  }

  /**
   * Evaluates if session authentication is successful.
   */
  public async isLoggedIn(): Promise<boolean> {
    try {
      const menuLocator = this.page.locator(this.userMenu);
      await menuLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
