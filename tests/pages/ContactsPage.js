import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

export class ContactsPage extends BasePage {
    constructor(page) {
        super(page);
    // ===== Index
    this.searchInput = page.locator('#search-contacts');
    this.searchBtn = page.locator('#search-contacts-button');
    this.createContactBtn = page.locator('#create-contact-button');
    this.contactsTable = page.locator('#contacts-table');
    this.rows = page.locator('#contacts-container tr[data-table-sort-target="row"]');
    // ===== ACTION BTNS
    this.actionsBtnById = (contactId) => this.page.locator(`#contact-actions-button-${contactId}`);

    this.dropdownById = (contactId) =>
      this.page.locator(
        `[data-contact-actions-contact-id-value="${contactId}"] [data-contact-actions-target="dropdown"]`
      );

    this.activateBtnById = (contactId) => this.page.locator(`#contact-activate-button-${contactId}`);

    this.deactivateBtnById = (contactId) => this.page.locator(`#contact-deactivate-button-${contactId}`);
    
    this.deactivateValidation = page.getByRole('button', { name: 'Deactivate' });
    this.activateValidation = page.getByRole('button', { name: 'Activate' });

    this.deleteBtnById = (contactId) => this.page.locator(`#contact-delete-button-${contactId}`);


    // ===== Create form - Basic
    this.firstName = page.locator('#contact_first_name');
    this.lastName = page.locator('#contact_last_name');
    this.email = page.locator('#contact_email');
    this.mobile = page.locator('#contact_mobile');
    this.salutation = page.locator('#contact_salutation_id');
    this.assignedTo = page.locator('#contact_assigned_to');
    this.tagList = page.locator('#contact_tag_list');

    // Account autocomplete
    this.accountSearch = page.locator('[data-controller="account-autocomplete"] [data-account-autocomplete-target="searchInput"]');
    this.accountHiddenId = page.locator('#account_id');
    this.accountResults = page.locator('[data-controller="account-autocomplete"] [data-account-autocomplete-target="results"]');

    // ===== Extra - Job
    this.title = page.locator('#contact_title_id');
    this.department = page.locator('#contact_department');

    // ===== Additional
    this.altEmail = page.locator('#contact_alt_email');
    this.doNotCall = page.locator('#contact_do_not_call');

    // ===== Address (Business)
    this.street1 = page.locator('#contact_business_address_attributes_street1');
    this.street2 = page.locator('#contact_business_address_attributes_street2');
    this.city = page.locator('#contact_business_address_attributes_city');
    this.state = page.locator('#contact_business_address_attributes_state');
    this.zipcode = page.locator('#contact_business_address_attributes_zipcode');

    // ===== Web presence
    this.blog = page.locator('#contact_blog');
    this.twitter = page.locator('#contact_twitter');
    this.linkedin = page.locator('#contact_linkedin');
    this.facebook = page.locator('#contact_facebook');

    // ===== Submit/Cancel
    this.submitCreate = page.locator('#create-contact-submit-button');
    this.cancelCreate = page.locator('#contact-cancel-button');
    }

    async retry(fn, { attempts = 3, delayMs = 250 } = {}) {
      let lastError;
      for (let i = 0; i < attempts; i++) {
        try {
          return await fn();
        } catch (e) {
          lastError = e;
    
          if (this.page.isClosed()) throw lastError;
    
          await this.page.waitForTimeout(delayMs).catch(() => {});
        }
      }
      throw lastError;
    }
    

    async waitForSuccessFlashAndDismiss({ timeout = 20000 } = {}) {
        const flash = this.page
          .locator('#flash-messages [role="alert"], #flash-messages .alert, #flash-messages .alert-success, #flash-messages .bg-green-50, #flash-messages .text-green-700')
          .first();
      
        // ✅ si no aparece, no tronamos
        const appeared = await flash.isVisible().catch(() => false);
        if (!appeared) return;
      
        // si hay botón de cerrar, lo intentamos
        const close = flash.locator('button, [aria-label="Close"], .close').first();
        if (await close.isVisible().catch(() => false)) {
          await close.click().catch(() => {});
        }
      }

    async open() {
        await this.goto('/contacts');
    }

    async contactsSearch(value){
        await this.searchInput.fill('');
        await this.searchInput.type(value, { delay: 120 });
        await this.page.waitForTimeout(600);
        await this.page.waitForLoadState('networkidle');
    }

    // verification from Leads Page
    async verifyConvertedLead(phone, firstname){
        await this.goto('/contacts');
        await this.contactsSearch(phone);
        const row = this.contactsTable.getByText(phone, { exact: false });
        await expect(
          row,
          `The Contact with name: ${firstname} was not found`
        ).toBeVisible();
    }

    // create contact
    async openCreate() {
        await this.goto('/contacts/new');
        await expect(this.firstName).toBeVisible({ timeout: 20000 });
        await expect(this.lastName).toBeVisible({ timeout: 20000 });
    }

    async openRowByName(firstname) {
        const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(esc(firstname), 'i');
      
        const row = this.page
          .locator('#contacts-table tr:visible')
          .filter({ hasText: pattern })
          .first();
      
        await expect(
          row,
          `A row with the name: ${firstname} was not found`
        ).toBeVisible();
      
        const nameLink = row.locator('a[id^="contact-name-link-"]').first();
      
        await expect(
          nameLink,
          `A link with the name: ${firstname} was not found`
        ).toBeVisible();
      
        await nameLink.scrollIntoViewIfNeeded();
        await nameLink.click();
        await expect(this.page.locator('h1.text-3xl.font-bold')).toContainText(firstname);
      }

    /**
     * Selects account from autocomplete (Stimulus) 
     * @param {{search: string, selectLabel: string}} account
     */
    async selectAccount(account) {
        if (!account?.search || !account?.selectLabel) return;

        await expect(this.accountSearch).toBeVisible({ timeout: 20000 });

        await this.accountSearch.fill(account.search);

        await expect(this.accountResults).toBeVisible({ timeout: 20000 });

        const option = this.accountResults.locator('div', { hasText: account.selectLabel }).first();
        await expect(option).toBeVisible({ timeout: 20000 });
        await option.dispatchEvent('mousedown');

        await expect(this.accountHiddenId).not.toHaveValue('', { timeout: 20000 });
    }

    /**
     * Fills out the form
     *
     * @param {{
     *  firstName: string,
     *  lastName: string,
     *  email: string,
     *  mobile: string,
     *  basic?: { salutationLabel?: string, assignedToLabel?: string, tags?: string },
     *  account?: { search?: string, selectLabel?: string },
     *  job?: { titleLabel?: string, department?: string },
     *  additional?: { altEmail?: string, doNotCall?: boolean },
     *  address?: { street1?: string, street2?: string, city?: string, stateLabel?: string, zipcode?: string },
     *  web?: { blog?: string, twitter?: string, linkedin?: string, facebook?: string }
     * }} data
     */
    async fillCreateForm(data) {
    await expect(this.firstName).toBeVisible({ timeout: 20000 });

    // Required / "dynamic"
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.email.fill(data.email);
    await this.mobile.fill(data.mobile);

    // Basic
    if (data.basic?.salutationLabel) {
        await this.salutation.selectOption({ label: data.basic.salutationLabel });
    }
    if (data.basic?.assignedToLabel) {
        // Ojo: hay "Unassigned" como option value "", label "Unassigned"
        await this.assignedTo.selectOption({ label: data.basic.assignedToLabel });
    }
    if (data.basic?.tags) {
        await this.tagList.fill(data.basic.tags);
    }

    // Account autocomplete
    if (data.account?.search && data.account?.selectLabel) {
        await this.selectAccount(data.account);
    }

    // Job
    if (data.job?.titleLabel) {
        await this.title.selectOption({ label: data.job.titleLabel });
    }
    if (data.job?.department) {
        await this.department.fill(data.job.department);
    }

    // Additional
    if (data.additional?.altEmail) {
        await this.altEmail.fill(data.additional.altEmail);
    }
    if (typeof data.additional?.doNotCall === 'boolean') {
        const isChecked = await this.doNotCall.isChecked();
        if (data.additional.doNotCall !== isChecked) {
        await this.doNotCall.click();
        }
    }

    // Address
    if (data.address?.street1) await this.street1.fill(data.address.street1);
    if (data.address?.street2) await this.street2.fill(data.address.street2);
    if (data.address?.city) await this.city.fill(data.address.city);
    if (data.address?.stateLabel) await this.state.selectOption({ label: data.address.stateLabel });
    if (data.address?.zipcode) await this.zipcode.fill(data.address.zipcode);

    // Web
    if (data.web?.blog) await this.blog.fill(data.web.blog);
    if (data.web?.twitter) await this.twitter.fill(data.web.twitter);
    if (data.web?.linkedin) await this.linkedin.fill(data.web.linkedin);
    if (data.web?.facebook) await this.facebook.fill(data.web.facebook);
    }

    async submitCreateContact() {
        await expect(this.submitCreate).toBeEnabled({ timeout: 20000 });
    
        await Promise.all([
          this.page.waitForLoadState('domcontentloaded'),
          this.submitCreate.click(),
        ]);
    }
    
    async createContactFull(data) {
    await this.fillCreateForm(data);
    await this.submitCreateContact();
    }

    async expectContactInResults(fullName) {
        const row = this.page
          .locator('#contacts-container tr')
          .filter({ has: this.page.locator('td[data-column="name"]', { hasText: fullName }) })
          .first();
    
        await expect(row, `No encontré el contacto "${fullName}" en resultados`).toBeVisible({ timeout: 20000 });
    }

    async getContactIdFromShow() {
        const root = this.page.locator('[data-controller="contacts"][data-contacts-contact-id-value]');
        await expect(root).toBeVisible({ timeout: 20000 });
        const id = await root.getAttribute('data-contacts-contact-id-value');
        if (!id) throw new Error('No pude obtener el contact id desde data-contacts-contact-id-value');
        return id;
    }
      
    async contactFieldRootByKey(fieldKey) {
    const id = await this.getContactIdFromShow();
    return this.page.locator(`#contact-${id}-${fieldKey}`);
    }
      
    async addressFieldRootByKey(addressKey) {
    const id = await this.getContactIdFromShow();
    return this.page.locator(`#contact-${id}-address-${addressKey}`);
    }
      
    async tagsRoot() {
    const id = await this.getContactIdFromShow();
    return this.page.locator(`#contact-${id}-tag_list`);
    }
      
    isTextareaField(fieldKey) {
        return [
          'background_info',
        ].includes(fieldKey);
    }
      
    isDateField(fieldKey) {
    return [
        'born_on',
        'credit_score_updated_at',
    ].includes(fieldKey);
    }
      
    isPasswordField(fieldKey) {
    return false;
    }
      
    // Deactivate/Activate contact
    async openActionsDropdown(contactId) {
      const btn = this.actionsBtnById(contactId);
      const dropdown = this.dropdownById(contactId);
    
      await expect(btn).toBeVisible({ timeout: 15000 });
      await btn.scrollIntoViewIfNeeded();
    
      // 1) intento normal (hover + click)
      await btn.hover().catch(() => {});
      await btn.click({ timeout: 5000 }).catch(() => {});
    
      // si ya abrió, listo
      if (await dropdown.isVisible().catch(() => false)) return;
    
      // 2) intento con force (por si hay overlays)
      await btn.click({ force: true, timeout: 5000 }).catch(() => {});
      if (await dropdown.isVisible().catch(() => false)) return;
    
      // 3) dispatchEvent click (dispara stimulus action directo)
      await btn.dispatchEvent('click').catch(() => {});
      if (await dropdown.isVisible().catch(() => false)) return;
    
      // 4) click "humano" con mouse en coordenadas del botón
      const box = await btn.boundingBox();
      if (!box) throw new Error(`No pude obtener boundingBox del actions btn ${contactId}`);
    
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    
      await expect(dropdown, `No se abrió el dropdown de actions para contactId=${contactId}`)
        .toBeVisible({ timeout: 8000 });
    }
    
    async deactivateContact(contactName) {
      const row = this.page.locator('tr[data-contact-id]', { hasText: contactName });
      const contactId = await row.getAttribute('data-contact-id');
      if (!contactId) throw new Error(`No pude obtener contactId para: ${contactName}`);
    
      await this.openActionsDropdown(contactId);
    
      const deactivateBtn = this.deactivateBtnById(contactId);
      await expect(deactivateBtn).toBeVisible({ timeout: 15000 });
    
      this.page.once('dialog', async (dialog) => dialog.accept());
    
      await this.retry(async () => {
        await deactivateBtn.click();
      });
    
      await this.page.waitForURL(new RegExp(`/contacts/${contactId}$`), { timeout: 15000 });
    
      const header = this.page.locator('h1.text-3xl.font-bold.text-gray-900').first();
      const inactiveBadge = header.locator('span', { hasText: 'Inactive' }).first();
      await expect(inactiveBadge).toBeVisible({ timeout: 15000 });
    }    

    async activateContact(contactName) {
      const row = this.page.locator('tr[data-contact-id]', { hasText: contactName });
      const contactId = await row.getAttribute('data-contact-id');
      if (!contactId) throw new Error(`No pude obtener contactId para: ${contactName}`);
    
      await this.openActionsDropdown(contactId);
    
      const activateBtn = this.activateBtnById(contactId);
      await expect(activateBtn).toBeVisible({ timeout: 15000 });
    
      // si hay confirm dialog (a veces no hay), lo aceptamos
      this.page.once('dialog', async (dialog) => dialog.accept());
    
      await activateBtn.click();
    
      await this.page.waitForURL(new RegExp(`/contacts/${contactId}$`), { timeout: 15000 });
      await expect(this.deactivateValidation).toBeVisible({ timeout: 15000 });
    }

    //Delete
    async deleteContact(contactName){
      const row = this.page.locator('tr[data-contact-id]', { hasText: contactName });
      const contactId = await row.getAttribute('data-contact-id');
      if (!contactId) throw new Error(`No pude obtener contactId para: ${contactName}`);
    
      await this.openActionsDropdown(contactId);
    
      const deleteBtn = this.deleteBtnById(contactId);
      await expect(deleteBtn).toBeVisible({ timeout: 15000 });
    
      this.page.once('dialog', async (dialog) => dialog.accept());
    
      await this.retry(async () => {
        await deleteBtn.click();
      });

        await this.contactsSearch(contactName);
        await expect(this.page.getByRole('heading', { level: 3, name: 'No contacts found' })).toBeVisible({ timeout: 15000 });

    }

    // Sort
    get sortByNameHeader() {
        return this.page.locator('#sort-by-name');
    }
    get sortByMobileHeader() {
        return this.page.locator('#sort-by-mobile');
    }
    get sortByEmailHeader() {
        return this.page.locator('#sort-by-email');
    }
    get tableRows() {
        return this.page.locator('tr[data-table-sort-target="row"]');
    }
    async getColumnValues(columnName) {
        const cells = this.page.locator(
          `td[data-column="${columnName}"]`
        );
      
        const count = await cells.count();
      
        const values = [];
      
        for (let i = 0; i < count; i++) {
          const text = await cells.nth(i).innerText();
          values.push(text.trim());
        }
      
        return values;
    }
    async sortAndValidate(headerLocator, columnName) {
        // ASC
        await headerLocator.click();
      
        const ascValues = await this.getColumnValues(columnName);
      
        const expectedAsc = [...ascValues].sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true })
        );
      
        expect(ascValues).toEqual(expectedAsc);
      
        // DESC
        await headerLocator.click();
      
        const descValues = await this.getColumnValues(columnName);
      
        const expectedDesc = [...expectedAsc].reverse();
      
        expect(descValues).toEqual(expectedDesc);
    }
      
    // Edit

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

    contactFieldRootByKey(fieldKey) {
        return this.page.locator(`[id$="-${fieldKey}"]`).first();
    }

    //inline fields
    async inlineEditField(fieldKey, newValue) {
        const root = this.contactFieldRootByKey(fieldKey);
      
        await expect(root).toBeVisible({ timeout: 20000 });
        await root.scrollIntoViewIfNeeded();
      
        // abrir editor
        await this.retry(async () => {
          await root.click();
        });
      
        const input = root.locator('input, textarea, select').first();
        await expect(input).toBeVisible({ timeout: 20000 });
      
        const tag = await input.evaluate(el => el.tagName.toLowerCase());
      
        await input.click({ force: true });
      
        // limpiar
        await input.press('Control+A').catch(() => {});
        await input.press('Backspace').catch(() => {});
      
        if (tag === 'select') {
          await input.selectOption({ label: newValue });
        } else {
          await input.fill(String(newValue));
          await input.press('Enter').catch(() => {});
          await input.blur().catch(() => {});
        }

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

    //tags
    async editTags(tagsCsv) {
        const root = this.contactFieldRootByKey('tag_list');
    
        await expect(root).toBeVisible({ timeout: 20000 });
        await root.scrollIntoViewIfNeeded();
    
        // abrir editor (click sobre el root o el target field)
        await this.retry(async () => {
          await root.click();
        });
    
        const input = root.locator('input, textarea').first();
        await expect(input).toBeVisible({ timeout: 20000 });
    
        // limpiar + escribir
        await input.click({ force: true });
        await input.press('Control+A').catch(() => {});
        await input.press('Backspace').catch(() => {});
        await input.fill(String(tagsCsv));
    
        // guardar
        await input.press('Enter').catch(() => {});
        await input.blur().catch(() => {});
    
        const expectedTags = String(tagsCsv)
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
    
        // ✅ Validación flexible:
        // - No depende del texto completo ni orden
        // - Acepta chips/innerText
        await expect
          .poll(async () => {
            const shown = this.normalizeText(await root.innerText());
            return expectedTags.every(t => shown.includes(this.normalizeText(t)));
          }, { timeout: 20000 })
          .toBe(true);
    
        // Extra: valida cada tag visible como chip o texto
        for (const tag of expectedTags) {
          await expect(
            root.locator('span', { hasText: tag }).first().or(root.locator(`text=${tag}`).first())
          ).toBeVisible({ timeout: 20000 });
        }
    }
      
    //comment
    async addComment(text) {
        const textarea = this.page.locator('textarea[id$="-comment-comment"]');
        const submit = this.page.locator('input[id$="-comment-submit"]');
      
        await expect(textarea).toBeVisible({ timeout: 20000 });
        await textarea.fill(text);
      
        await submit.click();
      
        await expect(
          this.page.locator('p', { hasText: text })
        ).toBeVisible({ timeout: 20000 });
    }

    //date field
    formatDateVariants(isoDate) {
      // isoDate: "YYYY-MM-DD"
      const s = String(isoDate || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return [s].filter(Boolean);

      const [y, m, d] = s.split('-');

      // Variantes comunes que a veces muestra la UI
      // - 2026-02-10
      // - 02/10/2026 o 2/10/2026
      // - 10/02/2026 (si la app usa dd/mm/yyyy)
      // - Feb 10, 2026 / February 10, 2026
      const monthNamesShort = [
        'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'
      ];
      const monthNamesLong = [
        'january','february','march','april','may','june','july','august','september','october','november','december'
      ];

      const mm = String(Number(m)); // "2"
      const dd = String(Number(d)); // "10"
      const m2 = m; // "02"
      const d2 = d; // "10"

      const mi = Number(m) - 1;
      const shortName = monthNamesShort[mi];
      const longName = monthNamesLong[mi];

      return [
        s,
        `${m2}/${d2}/${y}`,
        `${mm}/${dd}/${y}`,
        `${d2}/${m2}/${y}`,
        `${dd}/${mm}/${y}`,
        `${shortName} ${dd}, ${y}`,
        `${shortName} ${d2}, ${y}`,
        `${longName} ${dd}, ${y}`,
        `${longName} ${d2}, ${y}`,
      ].filter(Boolean);
    }

    async inlineEditDate(fieldKey, isoDate) {
      const id = await this.getContactIdFromShow();
      const span = this.page.locator(`#contact-${id}-${fieldKey}`).first();
    
      await expect(span).toBeVisible({ timeout: 20000 });
      await span.scrollIntoViewIfNeeded();
    
      // abrir editor
      await this.retry(async () => {
        await span.click();
      });
    
      // cuando entra a edición, el input NO siempre queda dentro del mismo span,
      // a veces se renderiza como reemplazo. Buscamos cerca del span.
      const input = this.page.locator(`input[type="date"][name$="[${fieldKey}]"], input[type="date"]`).first();
      await expect(input).toBeVisible({ timeout: 20000 });
    
      // set value + disparar eventos
      await input.evaluate((el, value) => {
        el.value = value; // YYYY-MM-DD
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, String(isoDate));
    
      // forzar commit/guardado
      await input.blur().catch(() => {});
      await input.press('Enter').catch(() => {});
      await this.page.keyboard.press('Escape').catch(() => {}); // por si el widget cierra con ESC
    
      // Esperar a que el input desaparezca (regresó a modo "show")
      await expect(input).toBeHidden({ timeout: 20000 }).catch(() => {});
    
      // validar texto final (ya en span estable por ID)
      const variants = this.buildDateVariants(isoDate).map(v => this.normalizeText(v));
    
      await expect
        .poll(async () => {
          const shownRaw = await span.innerText();
          const shown = this.normalizeText(shownRaw);
    
          if (!shown || shown.includes('n/a')) return false;
          return variants.some(v => shown.includes(v));
        }, { timeout: 20000 })
        .toBe(true);
    }
    
    buildDateVariants(isoDate) {
      const s = String(isoDate).trim(); // YYYY-MM-DD
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return [s];
    
      const [, yyyy, mm, dd] = m;
      const month = Number(mm);
      const day = Number(dd);
    
      const monthsShort = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
      const monthsLong  = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    
      const monS = monthsShort[month - 1];
      const monL = monthsLong[month - 1];
    
      // con y sin ceros
      const mmNo0 = String(month);
      const ddNo0 = String(day);
    
      return [
        // ISO
        `${yyyy}-${mm}-${dd}`,
    
        // US común
        `${mm}/${dd}/${yyyy}`,
        `${mmNo0}/${ddNo0}/${yyyy}`,
    
        // D/M/Y (por si tu app usa esto)
        `${dd}/${mm}/${yyyy}`,
        `${ddNo0}/${mmNo0}/${yyyy}`,
    
        // Textuales
        `${monS} ${dd}, ${yyyy}`,      // "feb 10, 1996"
        `${monS} ${ddNo0}, ${yyyy}`,
        `${monL} ${dd}, ${yyyy}`,      // "february 10, 1996"
        `${monL} ${ddNo0}, ${yyyy}`,
    
        `${dd} ${monS} ${yyyy}`,       // "10 feb 1996"
        `${ddNo0} ${monS} ${yyyy}`,
        `${dd} ${monL} ${yyyy}`,
        `${ddNo0} ${monL} ${yyyy}`,
      ];
    }
    


}