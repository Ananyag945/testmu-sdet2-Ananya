import { Page } from '@playwright/test';

/**
 * BasePage is the foundation of all Page Object classes.
 * Contains generic actions for browser lifecycle, page navigation, and DOM events.
 * It contains zero locators or test validation assertions.
 */
export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigates to a specific sub-path, extending the standard baseURL.
   * @param path Target page path (e.g. '/login')
   */
  public async navigate(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Helper that waits for the DOM load states to settle.
   */
  public async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('load');
  }

  /**
   * Utility to capture screenshots during test iterations or verification.
   * @param name Filename context of the screenshot
   */
  public async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}_${Date.now()}.png`,
      fullPage: true,
    });
  }

  /**
   * Obtains the page title from the active page instance.
   */
  public async getTitle(): Promise<string> {
    return this.page.title();
  }
}
