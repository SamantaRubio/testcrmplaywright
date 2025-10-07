import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

export class LoginPage extends BasePage {
  //Constructor: define all the page elements
  constructor(page) {
    super(page);
    this.usernameInput = this.getByTestId('email_input');
    this.passwordInput = this.getByTestId('password_input');
    this.loginBtn = this.getByTestId('sign_in_button');
    this.dashboard = page.getByRole('heading', { name: 'Dashboard'});
  }

  // Action Methods: Perform actions using the page's elements

  async open() {
    await this.goto('/users/sign_in'); // uses baseURL from config
    // Makes sure you are in the login page and the form is ready
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginBtn).toBeVisible();
    
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginBtn.click();
    await expect(this.dashboard).toBeVisible();
  }
}
