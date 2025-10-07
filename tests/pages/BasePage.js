export class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async goto(path = "/") {
    await this.page.goto(path);
  }

  getByTestId(id) {
    return this.page.getByTestId(id);
  }
}
