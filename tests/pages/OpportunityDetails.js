import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';
import path from 'path';

export class OpportunityDetails extends BasePage {
    constructor(page) {
        super(page);
        this.page = page;
        this.searchInput = this.getByTestId('search-opportunities');
        
        // Opp Table
        this.oppTable = page.locator('#opportunities-table');
        this.oppRows = this.oppTable.locator(
            'tbody tr[data-table-sort-target="row"]'
        );

        // Documents
        this.documentsUploadBtn = this.page.locator('#documents-upload-button');
        this.documentsWidget = this.documentsUploadBtn.locator('xpath=ancestor::div[@data-controller="document-upload"][1]');
        this.uploadForm = this.documentsWidget.locator('[data-document-upload-target="uploadForm"]');
        this.descriptionTextarea = this.documentsWidget.locator('[data-document-upload-target="descriptionInput"]');
        this.categorySelect = this.documentsWidget.locator('[data-document-upload-target="categoryInput"]');
        this.statementMonthSelect = this.documentsWidget.locator('[data-document-upload-target="statementMonthInput"]');
        this.statementYearSelect  = this.documentsWidget.locator('[data-document-upload-target="statementYearInput"]');
        this.fileInput = this.documentsWidget.locator('[data-document-upload-target="fileInput"]');
        this.uploadFileBtn = this.documentsWidget.locator('[data-document-upload-target="submitButton"]');
        this.documentsSearchInput = this.documentsWidget.locator('[data-document-upload-target="searchInput"]');
        this.documentsList = this.documentsWidget.locator('[data-document-upload-target="documentsList"]');
        this.selectAllDocumentsBtn = this.documentsWidget.locator('#documents-select-all-button');
        this.documentCheckboxes = this.documentsWidget.locator('[data-document-upload-target="documentCheckbox"]');
        this.directCashGroupDownloadBtn = this.documentsWidget.locator('a[id$="-direct-cash-group"]');
        this.documentModal = this.page.locator('div.fixed.inset-0').filter({ has: this.page.locator('[data-document-modal-target="content"]') }).first();
        this.documentModalTitle = this.documentModal.locator('[data-document-modal-target="title"]');
        this.documentModalSubtitle = this.documentModal.locator('[data-document-modal-target="subtitle"]');
        this.documentModalType = this.documentModal.locator('[data-document-modal-target="documentType"]');
        this.documentModalFileSize = this.documentModal.locator('[data-document-modal-target="fileSize"]');
        this.documentModalUploadDate = this.documentModal.locator('[data-document-modal-target="uploadDate"]');
        this.documentModalPeriod = this.documentModal.locator('[data-document-modal-target="periodTime"]');
        this.documentModalPreviewIframe = this.documentModal.locator('[data-document-modal-target="previewContainer"] iframe').first();
        this.documentModalCloseBtn = this.documentModal.locator('#document-modal-close-button, #document-modal-close-x').first();
        this.firstDocumentCard = this.documentsList.locator('[id^="document_"]').first();
        this.firstDocumentOpenBtn = this.firstDocumentCard.locator('button[data-action*="document-modal#open"]').first();
    }


  isRetriableError(err) {
    const msg = String(err?.message || err);
    return (
      msg.includes('Timeout') ||
      msg.includes('not visible') ||
      msg.includes('detached') ||
      msg.includes('Element is not attached') ||
      msg.includes('Execution context was destroyed') ||
      msg.includes('waiting for') ||
      msg.includes('strict mode violation')
    );
  }

  async retry(fn, { retries = 4, delayMs = 250 } = {}) {
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

  
    async open() {
        await this.goto('/opportunities');
    }

    async oppSearch(value){
        await this.searchInput.fill('');
        await this.searchInput.type(value, { delay: 120 });
        await this.page.waitForTimeout(600);
        await this.page.waitForLoadState('networkidle');
    }

    async verifySearch(value) {
        await expect(this.oppTable).toBeVisible();
    
        const rowCount = await this.oppRows.count();
    
        // Case 1: no results
        if (rowCount === 0) {
        await expect(this.oppRows).toHaveCount(0);
        return;
        }
    
        // Case 2: one result
        await expect(this.oppRows).toHaveCount(1);
    
        const row = this.oppRows.first();
    
        await expect(
        row,
        `Opportunity with value "${value}" was found`
        ).toContainText(value, { ignoreCase: true });
    }

    async getFirstOppName() {
        const firstRowLink = this.page
          .locator('#opportunities-container tr')
          .first()
          .locator('td[data-column="name"] a');
      
        await expect(firstRowLink).toBeVisible();
        const fullText = (await firstRowLink.textContent()).trim();
        const oppName = fullText.split(' - ')[0];
        return oppName;
    }

    async openRowByName(searchTerm) {
        const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(esc(searchTerm), 'i');
      
        const row = this.oppTable
          .filter({ hasText: pattern })
          .first();
      
        await expect(
          row,
          `A row with the name: ${searchTerm} was not found`
        ).toBeVisible();
      
        const nameLink = row.locator('a[href^="/opportunities/"]').first();
      
        await expect(
          nameLink,
          `A link with the name: ${searchTerm} was not found`
        ).toBeVisible();
      
        await nameLink.scrollIntoViewIfNeeded();
        await nameLink.click();
        await expect(this.page.locator('h1.text-xl.text-gray-900')).toContainText(searchTerm);
    }

    getFileNameFromPath(fixturePath) {
        return path.basename(fixturePath);
      }

    async _waitUploadFormOpened({ timeout = 15000 } = {}) {
      await expect
        .poll(async () => {
          const attached = await this.uploadForm.count();
          if (!attached) return false;
    
          const isHiddenByClass = await this.uploadForm.evaluate((el) =>
            el.classList.contains('hidden')
          ).catch(() => true);
    
          if (isHiddenByClass) return false;
    
          const visible = await this.uploadForm.isVisible().catch(() => false);
          return visible;
        }, { timeout })
        .toBe(true);
    
      return true;
    }

    async openUploadForm() {
      await this.documentsWidget.scrollIntoViewIfNeeded();
      await expect(this.documentsUploadBtn).toBeVisible({ timeout: 20000 });
      await expect(this.documentsUploadBtn).toBeEnabled({ timeout: 20000 });

      const form = this.uploadForm; // locator: [data-document-upload-target="uploadForm"]

      for (let i = 0; i < 3; i++) {
        await this.documentsUploadBtn.click({ trial: true }).catch(() => {});
        await this.documentsUploadBtn.click({ timeout: 10000 }).catch(async () => {

          await this.documentsUploadBtn.click({ force: true, timeout: 10000 });
        });

        const opened = await this._waitUploadFormOpened({ timeout: 7000 }).catch(() => false);
        if (opened) return;

        await this.page.waitForTimeout(250);
      }

      const finalOk = await this._waitUploadFormOpened({ timeout: 20000 });
      if (!finalOk) {
        throw new Error('Upload form did not open (still hidden) after clicking Upload.');
      }
    }

    async fillDocumentDescription(description) {
        await expect(this.descriptionTextarea).toBeVisible();
        await this.descriptionTextarea.fill(description);
    }

    async selectDocumentCategory(categoryLabel = 'Bank Statement') {
        await expect(this.categorySelect).toBeVisible();
        await this.categorySelect.selectOption({ label: categoryLabel });
    }

    async selectStatementPeriod({ month, year }) {
      await expect(this.statementMonthSelect).toBeVisible({ timeout: 15000 });
      await expect(this.statementYearSelect).toBeVisible({ timeout: 15000 });
    
      if (typeof month === 'number') {
        await this.statementMonthSelect.selectOption(String(month));
      } else {
        await this.statementMonthSelect.selectOption({ label: month });
      }
    
      await this.statementYearSelect.selectOption(String(year));
    
      await expect(this.statementMonthSelect).not.toHaveValue('', { timeout: 10000 });
      await expect(this.statementYearSelect).not.toHaveValue('', { timeout: 10000 });
    }    

    async uploadDocumentFile(fixturePath) {
        const absolutePath = path.resolve(process.cwd(), fixturePath);
        const fileName = path.basename(fixturePath);
      
        await expect(this.fileInput).toBeVisible();
        await this.fileInput.setInputFiles(absolutePath);
      
        // Click upload y espera el POST /documents (esto confirma que el servidor lo recibió)
        await expect(this.uploadFileBtn).toBeEnabled();
      
        await Promise.all([
          this.page.waitForResponse((r) =>
            r.url().includes('/documents') &&
            r.request().method() === 'POST' &&
            r.ok()
          , { timeout: 30000 }),
          this.uploadFileBtn.click(),
        ]);
      
        return fileName; // ✅ esto lo usas para buscar
    }
      
    buildDocumentSearchToken(filePathOrName) {
        const base = filePathOrName.includes('/')
          ? path.basename(filePathOrName)
          : filePathOrName;
      
        // quita la extensión (.pdf, .png, etc.)
        return base.replace(/\.[^/.]+$/, '');
    }
    
    async searchDocumentUsingWidgetAndVerify(filePathOrName) {
        const searchToken = this.buildDocumentSearchToken(filePathOrName);
      
        await expect(this.documentsSearchInput).toBeVisible();
        await this.documentsSearchInput.click();
        await this.documentsSearchInput.fill(searchToken);
      
        const resultBtn = this.documentsList
          .locator('button[data-action*="document-modal#open"]', {
            hasText: searchToken,
          })
          .first();
      
        await expect(resultBtn).toBeVisible({ timeout: 20000 });
    }
    
    async selectFirstDocumentAndVerify() {
      const firstCheckbox = this.documentsList
        .locator('[data-document-upload-target="documentCheckbox"]')
        .first();
    
      await expect(firstCheckbox).toBeVisible();
      await firstCheckbox.check(); 
    
      await expect(firstCheckbox).toBeChecked();
    }

    async selectAllDocumentsAndVerify() {
      await expect(this.documentsWidget).toBeVisible({ timeout: 20000 });
      await expect(this.documentsList).toBeVisible({ timeout: 20000 });
    
      // Asegura que haya al menos 1 checkbox
      await expect(this.documentCheckboxes.first()).toBeVisible({ timeout: 20000 });
      await expect(this.selectAllDocumentsBtn).toBeVisible({ timeout: 20000 });
      await expect(this.selectAllDocumentsBtn).toBeEnabled({ timeout: 20000 });
    
      const total = await this.documentCheckboxes.count();
      if (total === 0) throw new Error('No document checkboxes found to Select All');
    
      // Click "Select All" (con mini-retry por re-render)
      for (let i = 0; i < 3; i++) {
        await this.selectAllDocumentsBtn.click({ trial: true }).catch(() => {});
        await this.selectAllDocumentsBtn.click({ timeout: 10000 }).catch(async () => {
          await this.selectAllDocumentsBtn.click({ force: true, timeout: 10000 }).catch(() => {});
        });
    
        // Señal 1: el botón suele cambiar a "Deselect All"
        const btnText = (await this.selectAllDocumentsBtn.textContent().catch(() => '')) || '';
        if (/Deselect All/i.test(btnText)) break;
    
        await this.page.waitForTimeout(250);
      }
    
      await expect
      .poll(async () => {
        const n = await this.documentCheckboxes.count();
        if (n === 0) return false;

        let checked = 0;
        for (let i = 0; i < n; i++) {
          const cb = this.documentCheckboxes.nth(i);
          const isChecked = await cb.isChecked().catch(() => false);
          if (isChecked) checked++;
        }

        // ✅ condición estable: todo lo que está actualmente en DOM está checked
        return checked === n;
      }, { timeout: 20000 })
      .toBe(true);

    }
    
    async deselectAllDocumentsAndVerify() {
      await expect(this.documentsWidget).toBeVisible({ timeout: 20000 });
      await expect(this.documentsList).toBeVisible({ timeout: 20000 });
    
      await expect(this.documentCheckboxes.first()).toBeVisible({ timeout: 20000 });
      await expect(this.selectAllDocumentsBtn).toBeVisible({ timeout: 20000 });
      await expect(this.selectAllDocumentsBtn).toBeEnabled({ timeout: 20000 });
    
      const total = await this.documentCheckboxes.count();
      if (total === 0) throw new Error('No document checkboxes found to Deselect All');
    
      // Debe decir "Deselect All" antes de intentar deseleccionar (pero si no, igual clickeamos)
      const preText = (await this.selectAllDocumentsBtn.textContent().catch(() => '')) || '';
      // Click "Deselect All" con mini-retry
      for (let i = 0; i < 3; i++) {
        await this.selectAllDocumentsBtn.click({ trial: true }).catch(() => {});
        await this.selectAllDocumentsBtn.click({ timeout: 10000 }).catch(async () => {
          await this.selectAllDocumentsBtn.click({ force: true, timeout: 10000 }).catch(() => {});
        });
    
        // Señal 1: vuelve a "Select All" (si aplica)
        const btnText = (await this.selectAllDocumentsBtn.textContent().catch(() => '')) || '';
        if (/Select All/i.test(btnText)) break;
    
        // Si antes ni siquiera estaba en "Deselect All", no nos atoramos aquí
        if (!/Deselect All/i.test(preText)) break;
    
        await this.page.waitForTimeout(250);
      }
    
    // Esperar a que TODAS queden unchecked
    await expect
      .poll(async () => {
        const n = await this.documentCheckboxes.count();
        if (n === 0) return true; // si no hay docs, está "deselected"

        let checked = 0;
        for (let i = 0; i < n; i++) {
          const cb = this.documentCheckboxes.nth(i);
          const isChecked = await cb.isChecked().catch(() => false);
          if (isChecked) checked++;
        }

        return checked === 0;
      }, { timeout: 20000 })
      .toBe(true);

    }    

    async resetDocumentsWidgetState() {
      await expect(this.documentsWidget).toBeVisible();
    
      if (await this.documentsSearchInput.isVisible().catch(() => false)) {
        await this.documentsSearchInput.fill('');
      }
    
      if (await this.uploadForm.isVisible().catch(() => false)) {
        if (this.cancelUploadBtn) {
          await this.cancelUploadBtn.click();
          await expect(this.uploadForm).toBeHidden();
        }
      }
    
      const btnText = await this.selectAllDocumentsBtn.textContent().catch(() => '');
      if (/Deselect All/i.test(btnText || '')) {
        await this.selectAllDocumentsBtn.click();
        await this.waitForDocumentsIdle();
      }
    
      await expect(this.documentsList).toBeVisible();
      await expect(this.documentCheckboxes.first()).toBeVisible();
    }
    
    async verifyFirstDocumentDirectCashGroupDownload() {
      const widget = this.page.locator('div[data-controller="document-upload"]').first();
    
      const firstCard = widget
        .locator('[data-document-upload-target="documentsList"]')
        .locator('[id^="document_"]')
        .first();
    
      await expect(firstCard).toBeVisible({ timeout: 20000 });
    
      const directCashBtn = firstCard.locator('a[id$="-direct-cash-group"]').first();
      await expect(directCashBtn).toBeVisible();
    
      const href = await directCashBtn.getAttribute('href');
      expect(href).toBeTruthy();
    
      expect(href).toContain('/watermark');
      expect(href).toContain('template=direct-cash-group');
    
      const absoluteUrl = new URL(href, this.page.url()).toString();
      const resp = await this.page.request.get(absoluteUrl);
      expect(resp.ok()).toBeTruthy();
    
      const contentType = (resp.headers()['content-type'] || '').toLowerCase();
      expect(contentType).toContain('application/pdf');
    }
    
    async verifyFirstDocumentSuperCashGroupDownload() {
      const widget = this.page.locator('div[data-controller="document-upload"]').first();
    
      const firstCard = widget
        .locator('[data-document-upload-target="documentsList"]')
        .locator('[id^="document_"]')
        .first();
    
      await expect(firstCard).toBeVisible({ timeout: 20000 });
    
      const superCashBtn = firstCard.locator('a[id$="-super-cash-group"]').first();
      await expect(superCashBtn).toBeVisible();
    
      const href = await superCashBtn.getAttribute('href');
      expect(href).toBeTruthy();
    
      expect(href).toContain('/watermark');
      expect(href).toContain('template=super-cash-group');
    
      const absoluteUrl = new URL(href, this.page.url()).toString();
      const resp = await this.page.request.get(absoluteUrl);
    
      expect(resp.ok()).toBeTruthy();
    
      const contentType = (resp.headers()['content-type'] || '').toLowerCase();
      expect(contentType).toContain('application/pdf');
    }

    async openFirstDocumentPreviewAndVerify() {
      // Locators más directos (tu snapshot muestra este id)
      const modal = this.page.locator('#document-preview-modal');
    
      // 0) Card y botón existen
      await expect(this.firstDocumentCard).toBeVisible({ timeout: 20000 });
      await expect(this.firstDocumentOpenBtn).toBeVisible({ timeout: 20000 });
      await this.firstDocumentOpenBtn.scrollIntoViewIfNeeded();
    
      // 1) Asegurar modal cerrado al inicio (si quedó abierto de un intento anterior)
      if (await modal.isVisible().catch(() => false)) {
        await this.page.keyboard.press('Escape').catch(() => {});
        await expect(modal).toHaveClass(/hidden/, { timeout: 15000 });
      }
    
      // 2) Click “humano” + retry (re-render safe)
      await this.retry(async () => {
        await expect(this.firstDocumentOpenBtn).toBeVisible({ timeout: 10000 });
        await expect(this.firstDocumentOpenBtn).toBeEnabled({ timeout: 10000 });
    
        // Algunas UIs responden mejor a mousedown que a click “puro”
        await this.firstDocumentOpenBtn.dispatchEvent('mousedown', { button: 0 }).catch(() => {});
        await this.firstDocumentOpenBtn.click({ force: true });
    
        // Esperar condición REAL: que el modal pierda `hidden`
        await expect(modal).not.toHaveClass(/hidden/, { timeout: 15000 });
      }, { retries: 4, delayMs: 300 });
    
      // 3) Verificaciones base
      await expect(this.documentModalTitle).toBeVisible();
      await expect(this.documentModalSubtitle).toBeVisible();
    
      await expect(this.documentModalType).toBeVisible();
      await expect(this.documentModalFileSize).toBeVisible();
      await expect(this.documentModalUploadDate).toBeVisible();
    
      const documentTypeText = (await this.documentModalType.innerText()).trim();
      const fileSizeText = (await this.documentModalFileSize.innerText()).trim();
      const uploadDateText = (await this.documentModalUploadDate.innerText()).trim();
    
      expect(documentTypeText.length).toBeGreaterThan(0);
      expect(fileSizeText.length).toBeGreaterThan(0);
      expect(uploadDateText.length).toBeGreaterThan(0);
    
      if (documentTypeText.toLowerCase() === 'bank statement') {
        await expect(this.documentModalPeriod).toBeVisible();
        const periodText = (await this.documentModalPeriod.innerText()).trim();
        expect(periodText).not.toBe('');
        expect(periodText).not.toBe('-');
      }
    
      // 4) Iframe y request
      await expect(this.documentModalPreviewIframe).toBeVisible({ timeout: 20000 });
    
      const src = await this.documentModalPreviewIframe.getAttribute('src');
      expect(src).toBeTruthy();
    
      const absoluteUrl = new URL(src, this.page.url()).toString();
      const resp = await this.page.request.get(absoluteUrl);
      expect(resp.ok()).toBeTruthy();
    
      const ct = (resp.headers()['content-type'] || '').toLowerCase();
      expect(ct.length).toBeGreaterThan(0);
    
      // 5) Cerrar modal seguro
      await expect(this.documentModalCloseBtn).toBeVisible();
      await this.documentModalCloseBtn.click();
      await expect(modal).toHaveClass(/hidden/, { timeout: 20000 });
    } 
    
    async verifyModalNavigationArrowsWork() {
      const modal = this.page.locator('#document-preview-modal:not(.hidden)');
    
      const widget = this.page.locator('div[data-controller="document-upload"]').first();
      const firstOpenBtn = widget
        .locator('[data-document-upload-target="documentsList"]')
        .locator('button[data-action*="document-modal#open"]')
        .first();
    
      if (!(await modal.isVisible().catch(() => false))) {
        await expect(firstOpenBtn).toBeVisible({ timeout: 20000 });
        await firstOpenBtn.click();
      }
    
      await expect(modal).toBeVisible({ timeout: 15000 });
    
      const counter = modal.locator('[data-document-modal-target="documentCounter"]');
      const nextBtn = modal.locator('#document-modal-next-button');
      const prevBtn = modal.locator('#document-modal-prev-button');
    
      await expect(counter).toBeVisible();
      await expect(nextBtn).toBeVisible();
      await expect(prevBtn).toBeVisible();
    
      const readCounter = async () => {
        const txt = (await counter.innerText()).trim();
        const m = txt.match(/(\d+)\s*\/\s*(\d+)/);
        if (!m) throw new Error(`No pude parsear documentCounter: "${txt}"`);
        return { current: Number(m[1]), total: Number(m[2]), raw: txt };
      };
    
      const start = await readCounter();
    
      if (start.total <= 1) {
        await expect(nextBtn).toBeDisabled();
        await expect(prevBtn).toBeDisabled();
        return;
      }
    
      await nextBtn.click();
      await expect
        .poll(async () => (await readCounter()).current, { timeout: 10000 })
        .not.toBe(start.current);
    
      const afterNext = await readCounter();
    
      await prevBtn.click();
      await expect
        .poll(async () => (await readCounter()).current, { timeout: 10000 })
        .toBe(start.current);
    
      const maxSteps = start.total + 2;
      
      // for (let i = 0; i < maxSteps; i++) {
      //   const c = await readCounter();
      //   if (c.current === c.total) break;
      //   await nextBtn.click();
      //   await expect
      //     .poll(async () => (await readCounter()).current, { timeout: 10000 })
      //     .toBeGreaterThanOrEqual(c.current);
      // }
    
      // const end = await readCounter();
      // if (end.current === end.total) {
      //   await expect(nextBtn).toBeDisabled();
      // }
    
      // for (let i = 0; i < maxSteps; i++) {
      //   const c = await readCounter();
      //   if (c.current === 1) break;
      //   await prevBtn.click();
      //   await expect
      //     .poll(async () => (await readCounter()).current, { timeout: 10000 })
      //     .toBeLessThanOrEqual(c.current);
      // }
    
      const first = await readCounter();
      if (first.current === 1) {
        await expect(prevBtn).toBeDisabled();
      }
    }
    
    // Gravity froms validations
    oppFieldRootByKey(fieldKey) {
      return this.page.locator(`[id$="-${fieldKey}"]`).first();
    }

    buildExpectedVariants(newValue) {
      const raw = String(newValue || "").trim();
      const { host, pathname } = this.safeUrlParts(raw);

      const pathNoSlash = pathname.replace(/^\/+/, "");
      const pathWithSlash = pathNoSlash ? `/${pathNoSlash}` : "";

      const variants = new Set();

      if (raw) variants.add(this.normalizeText(raw));
      if (host && pathNoSlash) variants.add(`${host}/${pathNoSlash}`);
      if (pathNoSlash) variants.add(pathNoSlash);
      if (pathWithSlash) variants.add(pathWithSlash);

      return [...variants].filter(Boolean);
    }

    normalizeText(s) {
      return String(s || "")
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/+$/, "");
    }
  
    safeUrlParts(raw) {
        const s = String(raw || "").trim();
        try {
          const u = new URL(s.includes("://") ? s : `https://${s}`);
          return {
            host: (u.host || "").toLowerCase(),
            pathname: (u.pathname || "").replace(/\/+$/, ""),
          };
        } catch {
          return { host: "", pathname: "" };
        }
    }

    async verifyInputsFromGravityF(fieldKey, newValue){
      const root = this.oppFieldRootByKey(fieldKey);
      await expect(root).toBeVisible({ timeout: 20000 });
      await root.scrollIntoViewIfNeeded();

      const expectedVariants = this.buildExpectedVariants(newValue);

      await expect
        .poll(async () => {
          const shown = this.normalizeText(await root.innerText());
          return expectedVariants.some(v =>
            shown.includes(this.normalizeText(v))
          );
        }, { timeout: 20000 })
        .toBe(true);
    }

    async validateBankStatementsCount({ expectedCount = 3 } = {}) {
      // 1) contenedor de Documents (evita agarrar otros lists)
      const root = this.page.locator('[data-controller="document-upload"]').first();
      await expect(root).toBeVisible({ timeout: 20000 });

      // 2) items de bank statement (esto es súper estable)
      const bankItems = root.locator('[id^="document_"][data-document-category="bank statement"]');
      await expect(bankItems).toHaveCount(expectedCount, { timeout: 20000 });

      // 3) validar que sus nombres empiecen con "bank statement" (flexible)
      //    - acepta: "BankStatement123.pdf", "bank statement 123.pdf", etc.
      const startsWith = /^bank\s*statement/i;

      await expect.poll(async () => {
        const count = await bankItems.count();
        if (count !== expectedCount) return false;

        for (let i = 0; i < count; i++) {
          const item = bankItems.nth(i);

          // preferimos data-document-name (más “source of truth” que el UI)
          const rawName =
            (await item.getAttribute('data-document-name')) ||
            (await item.locator('button[id^="document-link-"]').first().innerText().catch(() => '')) ||
            '';

          const name = String(rawName).trim();
          if (!startsWith.test(name)) return false;
        }
        return true;
      }, { timeout: 20000 }).toBe(true);
    }

    async validateRelatedSpansGravityF(account, contactName, contactEmail, contactPhone){
      const accountLink = this.page.locator('#opportunity-account-link');
      await expect(accountLink).toHaveText(account, { timeout: 20000 });

      const relatedAccountCard = this.page.locator('#opportunity-related-account-link');
      const relatedAccountName = relatedAccountCard.locator('div.text-sm.font-semibold.text-gray-900').first();
      await expect(relatedAccountName).toHaveText(account, { timeout: 20000 });

      const contactCard = this.page.locator('[id^="opportunity-contact-link-"]').first();

      // Nombre (h4)
      await expect(contactCard.locator('h4').first())
        .toHaveText(contactName, { timeout: 20000 });

      // Email (p que contiene @)
      await expect(contactCard.locator('p', { hasText: '@' }).first())
        .toHaveText(contactEmail, { timeout: 20000 });

      // Phone (p que contiene +)
      await expect(contactCard.locator('p', { hasText: '+' }).first())
        .toContainText(contactPhone, { timeout: 20000 });
    }

}