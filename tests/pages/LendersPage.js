// pages/LendersPage.js
import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

export default class LendersPage extends BasePage {
  constructor(page) {
    super(page);
    this.page = page;

    // ---------- CREATE: /lenders/new ----------
    this.form = page.locator('form#new_lender');
    this.saveLenderBtn = page.locator('input[type="submit"][value="Save Lender"]');

    // Basic Information (new form)
    this.nameInput = page.locator('#lender_name');
    this.emailInput = page.locator('#lender_email');
    this.phoneInput = page.locator('#lender_phone');
    this.websiteInput = page.locator('#lender_website');
    this.opportunityTemplateSelect = page.locator('#lender_opportunity_template_id');
    this.renewalPercentageInput = page.locator('#lender_lender_renewal_percentage');
    this.backgroundTextarea = page.locator('#lender_background_info');

    // API Configuration (new form)
    this.apiEnabledCheckbox = page.locator('#api-enabled-new');
    this.apiFields = page.locator('[data-lender-form-target="apiFields"]');
    this.apiBaseUrlInput = page.locator('#lender_api_base_url');
    this.apiTestUrlInput = page.locator('#lender_api_test_url');
    this.apiKeyInput = page.locator('#lender_api_key');
    this.apiSecretInput = page.locator('#lender_api_secret');
    this.webhookUrlInput = page.locator('#lender_webhook_url');
    this.webhookSecretInput = page.locator('#lender_webhook_secret');

    // Supported Features (new form)
    this.supportsPrequalification = page.locator('#lender_supports_prequalification');
    this.supportsPreapproval = page.locator('#lender_supports_preapproval');
    this.supportsFullApplication = page.locator('#lender_supports_full_application');
    this.supportsDocumentUpload = page.locator('#lender_supports_document_upload');
    this.supportsRenewal = page.locator('#lender_supports_renewal');
    this.supportsWebhooks = page.locator('#lender_supports_webhooks');

    // Email Configuration (new form)
    this.emailEnabledCheckbox = page.locator('#email-enabled-new');
    this.emailFields = page.locator('[data-lender-form-target="emailFields"]');
    this.ccEmailInput = page.locator('#lender_cc_email');

    // ---------- INDEX: /lenders ----------
    this.lendersSearchInput = page.locator('#search-lenders');
    this.lendersTable = page.locator('#lenders-table');
    this.lenderRows = page.locator('#lenders-container tr[data-table-sort-target="row"]');

    // ---------- EDIT/SHOW: inline edit ----------
    // Root: cada field inline tiene id="lender-<id>-<field>"
    // Ejemplo: lender-397-name, lender-397-email, ...
  }

  // ---------- helpers anti flaky ----------
  isRetriableError(err) {
    const msg = String(err?.message || err);

    return (
      msg.includes('Timeout') ||
      msg.includes('not visible') ||
      msg.includes('detached') ||
      msg.includes('Execution context was destroyed') ||
      msg.includes('waiting for') ||
      msg.includes('Element is not attached') ||
      msg.includes('strict mode violation') ||
      msg.includes('Target page, context or browser has been closed') ||
      msg.includes('has been closed')
    );
  }

  async retry(fn, { retries = 3, delayMs = 250 } = {}) {
    let lastErr;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn(i);
      } catch (err) {
        lastErr = err;
        if (!this.isRetriableError(err) || i === retries - 1) throw err;
        await this.page.waitForTimeout(delayMs);
      }
    }
    throw lastErr;
  }

  // ---------- CREATE ----------
  async openNew() {
    await this.page.goto('/lenders/new', { waitUntil: 'domcontentloaded' });
    await expect(this.form).toBeVisible({ timeout: 20000 });
    await expect(this.nameInput).toBeVisible({ timeout: 20000 });
  }

  async openIndex() {
    await this.page.goto('/lenders', { waitUntil: 'domcontentloaded' });
    await expect(this.lendersSearchInput).toBeVisible({ timeout: 20000 });
    await expect(this.lendersTable).toBeVisible({ timeout: 20000 });
  }

  async fillBasicInformation(data) {
    await this.retry(async () => {
      await expect(this.nameInput).toBeVisible({ timeout: 15000 });
      await this.nameInput.scrollIntoViewIfNeeded();
      await this.nameInput.fill(data.name);
    });

    if (data.email) await this.emailInput.fill(data.email);
    if (data.phone) await this.phoneInput.fill(data.phone);
    if (data.website) await this.websiteInput.fill(data.website);

    if (data.opportunityTemplateLabel) {
      await this.opportunityTemplateSelect.selectOption({ label: data.opportunityTemplateLabel });
    }

    if (data.renewalPercentage !== undefined && data.renewalPercentage !== null) {
      await this.renewalPercentageInput.fill(String(data.renewalPercentage));
    }

    if (data.background) await this.backgroundTextarea.fill(data.background);
  }

  async enableApiAndFill(data) {
    if (!data?.enabled) return;

    await this.retry(async () => {
      await expect(this.apiEnabledCheckbox).toBeVisible({ timeout: 15000 });
      await this.apiEnabledCheckbox.scrollIntoViewIfNeeded();
      await this.apiEnabledCheckbox.check({ force: true });
    });

    await expect(this.apiFields).toBeVisible({ timeout: 20000 });

    if (data.baseUrl) await this.apiBaseUrlInput.fill(data.baseUrl);
    if (data.testUrl) await this.apiTestUrlInput.fill(data.testUrl);
    if (data.apiKey) await this.apiKeyInput.fill(data.apiKey);
    if (data.apiSecret) await this.apiSecretInput.fill(data.apiSecret);
    if (data.webhookUrl) await this.webhookUrlInput.fill(data.webhookUrl);
    if (data.webhookSecret) await this.webhookSecretInput.fill(data.webhookSecret);

    if (data.features?.prequalification) await this.supportsPrequalification.check({ force: true });
    if (data.features?.preapproval) await this.supportsPreapproval.check({ force: true });
    if (data.features?.fullApplication) await this.supportsFullApplication.check({ force: true });
    if (data.features?.documentUpload) await this.supportsDocumentUpload.check({ force: true });
    if (data.features?.renewal) await this.supportsRenewal.check({ force: true });
    if (data.features?.webhooks) await this.supportsWebhooks.check({ force: true });
  }

  async enableEmailAndFill(data) {
    if (!data?.enabled) return;

    await this.retry(async () => {
      await expect(this.emailEnabledCheckbox).toBeVisible({ timeout: 15000 });
      await this.emailEnabledCheckbox.scrollIntoViewIfNeeded();
      await this.emailEnabledCheckbox.check({ force: true });
    });

    await expect(this.emailFields).toBeVisible({ timeout: 20000 });

    if (data.ccEmail) await this.ccEmailInput.fill(data.ccEmail);
  }

  async saveLenderAndVerify() {
    await this.retry(async () => {
      await expect(this.saveLenderBtn).toBeVisible({ timeout: 15000 });
      await expect(this.saveLenderBtn).toBeEnabled({ timeout: 15000 });
      await this.saveLenderBtn.scrollIntoViewIfNeeded();
    });

    await Promise.all([
      this.page.waitForURL(/\/lenders(\/\d+)?/, { timeout: 30000 }),
      this.saveLenderBtn.click(),
    ]);

    await expect(this.page).toHaveURL(/\/lenders(\/\d+)?/);
  }

  // ---------- INDEX HELPERS ----------
  async searchLender(term) {
    await expect(this.lendersSearchInput).toBeVisible({ timeout: 15000 });
  
    await this.lendersSearchInput.fill('');
    await this.lendersSearchInput.type(term, { delay: 120 });
  
    // pequeño debounce para que aplique el filtro
    await this.page.waitForTimeout(600);
  
    // Esperar a que exista al menos 1 row visible tras filtrar
    await expect
      .poll(async () => {
        const first = this.lenderRows.first();
        return await first.isVisible();
      }, { timeout: 15000 })
      .toBeTruthy();
  
    return this.lenderRows.first();
  }

  async getLenderIdFromRow(row) {
    // opción 1: del id del <tr> => lender_397
    const trId = await row.getAttribute('id');
    const m1 = trId?.match(/^lender_(\d+)$/);
    if (m1) return m1[1];

    // opción 2: del href del link => /lenders/397
    const link = row.locator('td[data-column="name"] a').first();
    const href = await link.getAttribute('href');
    const m2 = href?.match(/\/lenders\/(\d+)/);
    if (m2) return m2[1];

    throw new Error(`No pude obtener lenderId del row. trId="${trId}", href="${href}"`);
  }

  async findLenderIdByName(name) {
    const row = await this.searchLender(name);
    return await this.getLenderIdFromRow(row);
  }

  async openFirstResultByClickingName() {
    const firstRow = this.lenderRows.first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });

    const nameLink = firstRow.locator('td[data-column="name"] a').first();
    await expect(nameLink).toBeVisible({ timeout: 15000 });

    await Promise.all([
      this.page.waitForURL(/\/lenders\/\d+/, { timeout: 30000 }),
      nameLink.click(),
    ]);
  }

  // ---------- INLINE EDIT HELPERS ----------
  lenderFieldRootByName(fieldName) {
    // id="lender-397-name" etc, pero el 397 cambia
    return this.page.locator(`[id^="lender-"][id$="-${fieldName}"][data-controller="inline-edit"]`).first();
  }

    // ---------- FLASH ALERT HELPERS ----------
  async waitForSuccessFlashAndDismiss({ timeout = 20000 } = {}) {
    // toma el último alert visible (a veces salen 2)
    const alerts = this.page.locator('[data-controller="flash-alert"]:visible');
    await expect(alerts.first()).toBeVisible({ timeout });

    const lastAlert = alerts.last();
    await expect(lastAlert).toContainText('successfully', { timeout });

    // intentar cerrar TODOS (por si salen duplicadas)
    const closeBtns = this.page.locator(
      '[data-controller="flash-alert"] [data-action*="flash-alert#dismiss"]'
    );

    // click con tolerancia a "detached"
    await this.retry(async () => {
      const count = await closeBtns.count();
      for (let i = 0; i < count; i++) {
        const btn = closeBtns.nth(i);
        if (await btn.isVisible().catch(() => false)) {
          await btn.click({ trial: false }).catch(() => {});
        }
      }
    }, { retries: 2, delayMs: 150 });

    // esperar a que ya no haya alerts visibles (pero sin ser súper frágil)
    await expect
      .poll(async () => await this.page.locator('[data-controller="flash-alert"]:visible').count(), { timeout })
      .toBe(0);
  }
  
  isPasswordField(fieldName) {
    return ['api_key', 'api_secret', 'webhook_secret'].includes(fieldName);
  }

  // async inlineEditText(fieldName, newValue) {
  //   const root = this.lenderFieldRootByName(fieldName);
  //   await expect(root).toBeVisible({ timeout: 20000 });
  //   await root.scrollIntoViewIfNeeded();
  
  //   // abrir editor
  //   await this.retry(async () => {
  //     await root.click();
  //   });
  
  //   // input / textarea
  //   const input = root.locator('input, textarea').first();
  //   await expect(input).toBeVisible({ timeout: 20000 });
  
  //   await input.fill(String(newValue));
  //   const tag = await input.evaluate((el) => el.tagName.toLowerCase());
  //   if (tag === 'textarea') {
  //     await input.blur();
  //   } else {
  //     await input.press('Enter');
  //   }

  //   await expect(input).toBeHidden({ timeout: 20000 });
  
  //   // secret keys
  //   const valueText = root.locator('.text-sm.text-gray-900').first();
  //   if (['api_key', 'api_secret', 'webhook_secret'].includes(fieldName)) {
  //     await expect(valueText).toBeVisible({ timeout: 200000 });
  //     await expect(valueText).toContainText('•', { timeout: 200000 }); // password
  //     return;
  //   }

  //   await expect(valueText).toContainText(String(newValue), { timeout: 200000 });
  // }

  async inlineEditText(fieldName, newValue) {
    const root = this.lenderFieldRootByName(fieldName);
    await expect(root).toBeVisible({ timeout: 20000 });
    await root.scrollIntoViewIfNeeded();

    // abrir editor
    await this.retry(async () => {
      await root.click();
    });

    const input = root.locator('input, textarea').first();
    await expect(input).toBeVisible({ timeout: 20000 });

    const tag = await input.evaluate((el) => el.tagName.toLowerCase());
    const isPassword = this.isPasswordField(fieldName);

    // ⚠️ password fields: usar type con delay (evita que se quede vacío)
    await input.click({ force: true });

    // limpiar primero (sin confiar en fill para password)
    await input.press('Control+A').catch(() => {});
    await input.press('Backspace').catch(() => {});

    if (isPassword) {
      await input.type(String(newValue), { delay: 50 });
      // guardar con blur/tab (más confiable que Enter en estos inline-edit)
      await input.press('Tab').catch(() => {});
    } else if (tag === 'textarea') {
      // textarea: Enter mete salto; mejor blur para guardar
      await input.fill(String(newValue));
      await input.blur();
    } else {
      // text/number/etc: Enter suele guardar bien
      await input.fill(String(newValue));
      await input.press('Enter').catch(() => {});
      if (await input.isVisible().catch(() => false)) {
        await input.blur().catch(() => {});
      }
    }

    // ✅ en lugar de esperar input hidden (muy flaky), validamos por flash success
    await this.waitForSuccessFlashAndDismiss({ timeout: 20000 });

    // ✅ verificación final:
    // - password: solo verificamos que esté en modo “bullets” (no el valor real)
    if (isPassword) {
      const bullets = root.locator('.text-sm.text-gray-900').first();
      await expect(bullets).toBeVisible({ timeout: 20000 });
      await expect(bullets).toContainText('•', { timeout: 20000 });
      return;
    }

    // - renewalPercentage: UI agrega %, aquí solo verificamos que contenga el número
    if (fieldName === 'lender_renewal_percentage') {
      await expect(root).toContainText(String(newValue), { timeout: 20000 });
      return;
    }

    // - normal: validar que contenga el valor
    await expect(root).toContainText(String(newValue), { timeout: 20000 });
  }

  async inlineEditSelectByLabel(fieldName, label) {
    const root = this.lenderFieldRootByName(fieldName);
    await expect(root).toBeVisible({ timeout: 20000 });
    await root.scrollIntoViewIfNeeded();

    await root.click();

    const select = root.locator('select').first();
    await expect(select).toBeVisible({ timeout: 15000 });

    await select.selectOption({ label });

    // a veces el select guarda con blur
    await select.press('Tab');

    // verify display label
    await expect(root).toContainText(label, { timeout: 20000 });
  }

  async checkboxToggleById(checkboxId, shouldBeChecked) {
    const checkbox = this.page.locator(`#${checkboxId}`).first();
    await expect(checkbox).toBeVisible({ timeout: 15000 });
    await checkbox.scrollIntoViewIfNeeded();

    if (shouldBeChecked) {
      await checkbox.check({ force: true });
      await expect(checkbox).toBeChecked({ timeout: 15000 });
    } else {
      await checkbox.uncheck({ force: true });
      await expect(checkbox).not.toBeChecked({ timeout: 15000 });
    }
  }

  async editLenderAndVerify(editData) {
    // BASIC inline fields
    if (editData.basic?.name) await this.inlineEditText('name', editData.basic.name);
    if (editData.basic?.email) await this.inlineEditText('email', editData.basic.email);
    if (editData.basic?.phone) await this.inlineEditText('phone', editData.basic.phone);
    if (editData.basic?.website) await this.inlineEditText('website', editData.basic.website);

    if (editData.basic?.opportunityTemplateLabel) {
      await this.inlineEditSelectByLabel('opportunity_template_id', editData.basic.opportunityTemplateLabel);
    }

    if (editData.basic?.renewalPercentage !== undefined && editData.basic?.renewalPercentage !== null) {
      // fieldName en HTML: lender_renewal_percentage
      await this.inlineEditText('lender_renewal_percentage', String(editData.basic.renewalPercentage));
      // la UI lo muestra con %; verifico que el número esté ahí
      const root = this.lenderFieldRootByName('lender_renewal_percentage');
      await expect(root).toContainText(String(editData.basic.renewalPercentage), { timeout: 20000 });
    }

    if (editData.basic?.background) {
      await this.inlineEditText('background_info', editData.basic.background);
    }

    // API (checkbox-toggle en show/edit)
    if (editData.api?.enabled !== undefined) {
      await this.checkboxToggleById('api-enabled', !!editData.api.enabled);
    }

    if (editData.api?.enabled) {
      if (editData.api.baseUrl) await this.inlineEditText('api_base_url', editData.api.baseUrl);
      if (editData.api.testUrl) await this.inlineEditText('api_test_url', editData.api.testUrl);

      // Password fields (api_key/api_secret/webhook_secret) son tipo password
      // Inline edit igual funciona: click -> input -> enter -> vuelve a "••••"
      if (editData.api.apiKey) await this.inlineEditText('api_key', editData.api.apiKey);
      if (editData.api.apiSecret) await this.inlineEditText('api_secret', editData.api.apiSecret);
      if (editData.api.webhookUrl) await this.inlineEditText('webhook_url', editData.api.webhookUrl);
      if (editData.api.webhookSecret) await this.inlineEditText('webhook_secret', editData.api.webhookSecret);

      // Supported features toggles (ids del HTML que mandaste)
      if (editData.api.features) {
        await this.checkboxToggleById('feature-prequalification', !!editData.api.features.prequalification);
        await this.checkboxToggleById('feature-preapproval', !!editData.api.features.preapproval);
        await this.checkboxToggleById('feature-full-application', !!editData.api.features.fullApplication);
        await this.checkboxToggleById('feature-document-upload', !!editData.api.features.documentUpload);
        await this.checkboxToggleById('feature-renewal', !!editData.api.features.renewal);
        await this.checkboxToggleById('feature-webhooks', !!editData.api.features.webhooks);
      }
    }

    // EMAIL
    if (editData.email?.enabled !== undefined) {
      await this.checkboxToggleById('email-enabled', !!editData.email.enabled);
    }
    if (editData.email?.enabled && editData.email.ccEmail) {
      await this.inlineEditText('cc_email', editData.email.ccEmail);
    }
  }

  // --------- LENDER TABLE ---------------
  rowById(lenderId) {
    return this.page.locator(`#lender_${lenderId}`);
  }

  async openRowActionsMenuById(lenderId) {
    const row = this.rowById(lenderId);
    await expect(row).toBeVisible({ timeout: 20000 });
  
    const menuBtn = row.locator('button[onclick*="toggleDropdown"]').first();
    await expect(menuBtn).toBeVisible({ timeout: 15000 });
  
    await this.retry(async () => {
      await menuBtn.click();
    });
  
    const dropdown = row.locator('.dropdown-menu').first();
    await expect(dropdown).toBeVisible({ timeout: 15000 });
  
    return dropdown;
  }

  async viewDetailsById(lenderId) {
    const dropdown = await this.openRowActionsMenuById(lenderId);
  
    const viewLink = dropdown
      .locator(`a[href="/lenders/${lenderId}"]`)
      .filter({ hasText: 'View Details' })
      .first();
  
    await expect(viewLink).toBeVisible({ timeout: 15000 });
  
    await Promise.all([
      this.page.waitForURL(new RegExp(`/lenders/${lenderId}$`), { timeout: 30000 }),
      viewLink.click(),
    ]);
  }

  async sortBy(columnName) {
    const header = this.page
      .locator(`th[data-column="${columnName}"][data-table-sort-target="header"]`)
      .first();
  
    await expect(header).toBeVisible({ timeout: 20000 });
  
    await this.retry(async () => {
      await header.click();
    });
  
    // mini buffer para re-render
    await this.page.waitForTimeout(500);
  }

  async deleteById(lenderId) {
    const row = this.rowById(lenderId);
    await expect(row).toBeVisible({ timeout: 20000 });
  
    const dropdown = await this.openRowActionsMenuById(lenderId);
  
    const deleteBtn = dropdown
      .locator('button[type="submit"]')
      .filter({ hasText: 'Delete' })
      .first();
  
    await expect(deleteBtn).toBeVisible({ timeout: 15000 });
  
    // aceptar confirm dialog
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
  
    await this.retry(async () => {
      await deleteBtn.click();
    });
  
    await expect(this.rowById(lenderId)).toHaveCount(0, { timeout: 30000 });
  }

  
  
}