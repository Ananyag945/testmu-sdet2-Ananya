import { BasePage } from './BasePage';

/**
 * DashboardPage POM representing the primary post-auth landing view, including core form elements.
 */
export class DashboardPage extends BasePage {
  /** @placeholder — update data-testid to match actual app */
  private readonly pageHeading = '[data-testid="dashboard-heading"]';

  /** @placeholder — update data-testid to match actual app */
  private readonly welcomeMsg = '[data-testid="welcome-message"]';

  /** @placeholder — update data-testid to match actual app */
  private readonly navLinkTemplate = (section: string) => `[data-testid="nav-link-${section.toLowerCase()}"]`;

  // Form Selectors
  /** @placeholder — update data-testid to match actual app */
  private readonly formNameInput = '[data-testid="form-name"]';
  
  /** @placeholder — update data-testid to match actual app */
  private readonly formEmailInput = '[data-testid="form-email"]';
  
  /** @placeholder — update data-testid to match actual app */
  private readonly formDescriptionInput = '[data-testid="form-description"]';
  
  /** @placeholder — update data-testid to match actual app */
  private readonly formSubmitButton = '[data-testid="form-submit"]';
  
  /** @placeholder — update data-testid to match actual app */
  private readonly formErrorTemplate = (field: string) => `[data-testid="form-error-${field}"]`;
  
  /** @placeholder — update data-testid to match actual app */
  private readonly formSuccessBanner = '[data-testid="form-success"]';

  /**
   * Retrieves the current dashboard page title text.
   */
  public async getPageHeading(): Promise<string> {
    const heading = this.page.locator(this.pageHeading);
    await heading.waitFor({ state: 'visible', timeout: 5000 });
    return (await heading.textContent()) || '';
  }

  /**
   * Retrieves the personalized user greetings content.
   */
  public async getWelcomeMessage(): Promise<string> {
    const welcome = this.page.locator(this.welcomeMsg);
    await welcome.waitFor({ state: 'visible', timeout: 5000 });
    return (await welcome.textContent()) || '';
  }

  /**
   * Navigates to a specific segment of the dashboard using navigation links.
   * @param section Sidebar/navbar link target identifier (e.g. 'settings', 'reports')
   */
  public async navigateTo(section: string): Promise<void> {
    const selector = this.navLinkTemplate(section);
    await this.page.click(selector);
    await this.waitForPageLoad();
  }

  /**
   * Evaluates if a specified sidebar/navbar navigation option is rendered.
   * @param label Name label representing the section option (e.g. 'Admin', 'Reports')
   */
  public async isNavLinkVisible(label: string): Promise<boolean> {
    const selector = this.navLinkTemplate(label);
    const navItem = this.page.locator(selector);
    try {
      await navItem.waitFor({ state: 'visible', timeout: 3000 });
      return await navItem.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Actions: Enters user values into the profile configuration form and clicks submit.
   * @param name Text for the resource/profile name
   * @param email Contact email address
   * @param description Brief profile/resource description
   */
  public async submitForm(name: string, email: string, description: string): Promise<void> {
    await this.page.fill(this.formNameInput, name);
    await this.page.fill(this.formEmailInput, email);
    await this.page.fill(this.formDescriptionInput, description);
    await this.page.click(this.formSubmitButton);
    await this.waitForPageLoad();
  }

  /**
   * Action: Obtains inline error indicators mapping to standard input forms.
   * @param field input field descriptor identifier (e.g., 'name', 'email')
   */
  public async getFormFieldError(field: string): Promise<string> {
    const errorSelector = this.formErrorTemplate(field);
    const errorLocator = this.page.locator(errorSelector);
    try {
      await errorLocator.waitFor({ state: 'visible', timeout: 2000 });
      return (await errorLocator.textContent()) || '';
    } catch {
      return '';
    }
  }

  /**
   * Action: Reads the text contained in the success banner after a valid form post.
   */
  public async getFormSuccessMessage(): Promise<string> {
    const successLocator = this.page.locator(this.formSuccessBanner);
    await successLocator.waitFor({ state: 'visible', timeout: 3000 });
    return (await successLocator.textContent()) || '';
  }
}
