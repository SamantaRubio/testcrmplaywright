import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

export class LeadsPage extends BasePage {
    constructor(page) {
        super(page);
        this.importCsvButton = this.getByTestId('import_csv_button');
        this.chooseFileButton = this.getByTestId('choose_file_button');
        this.tagNameInput = this.getByTestId('tag_name_input');
        this.uploadProcessButton = this.getByTestId('upload_process_button');
        this.importStatusLabel = this.getByTestId('import_status');
        this.leadsContainer = this.getByTestId('leads-table');
        this.searchInput = this.getByTestId('search-leads');
        this.createLeadButton = this.getByTestId('create-lead-button');
        this.createLeadFrame = page.locator('#lead_form');
        this.actionsButton = this.page.locator('button[id^="lead-actions-button-"]');
        this.convertButton = this.page.locator('a[id^="lead-convert-button-"]');
        this.contactsTable = this.page.locator('#contacts-table');
        this.convertButton2 = page.locator('a[href$="/convert"]');


        // ==== Basic Information ====
        this.firstNameInput = page.locator('#lead-first-name-input');
        this.lastNameInput = page.locator('#lead-last-name-input');
        this.titleInput = page.locator('#lead-title-input');
        this.companyInput = page.locator('#lead-company-input');
        this.referredByInput = page.locator('#lead-referred-by-input');
        this.doNotCallCheckbox = page.locator('#lead-do-not-call-input');
        this.backgroundInput = page.locator('#lead-background-info-input');
        this.tagsSelect = page.locator('#lead_tag_list');

        // ==== Business Information ====
        this.industrySelect = page.locator('#lead-industry-input');
        this.stateSelect = page.locator('#lead-state-input');
        this.citySelect = page.locator('#lead-city-input');
        this.businessDescriptionInput = page.locator('#lead-business-description-input');

        // ==== Status & Assignment ====
        this.statusSelect = page.locator('#lead-status-input');
        this.assignedToSelect = page.locator('#lead-assigned-to-input');
        this.ratingSelect = page.locator('#lead-rating-input');
        this.campaignSelect = page.locator('#lead-campaign-input');
        this.sourceSelect = page.locator('#lead-source-input');
        this.accessSelect = page.locator('#lead-access-input');

        // ==== Contact Information ====
        this.emailInput = page.locator('#lead-email-input');
        this.phoneInput = page.locator('#lead-phone-input');
        this.mobileInput = page.locator('#lead-mobile-input');
        this.altEmailInput = page.locator('#lead-alt-email-input');
        this.lastEmailDateInput = page.locator('#lead-last-email-date-input');
        this.lastTextDateInput = page.locator('#lead-last-text-date-input');

        // ==== Web Information ====
        this.blogInput = page.locator('#lead_blog');
        this.linkedinInput = page.locator('#lead_linkedin');
        this.facebookInput = page.locator('#lead_facebook');
        this.twitterInput = page.locator('#lead_twitter');

        // Submit
        this.createLeadSubmitButton = page.locator('#create-lead-submit-button');

        // leads table
        this.rejectLeadButton = page.locator('a[id^="lead-reject-button-"]');
        this.reopenLeadButton = page.locator('a[id^="lead-reopen-button-"]');

        // lead Details
        this.rejectButtonDetails = page.locator('a[data-action="click->leads#confirmReject"]');
        this.reopenButtonDetails = page.locator('a[data-action="click->leads#confirmReopen"]');

        // Headers de sort
        this.sortByNameHeader = page.locator('#sort-by-name');
        this.sortByMobileHeader = page.locator('#sort-by-mobile');
        this.sortByEmailHeader = page.locator('#sort-by-email');
        
        // filter
        this.leadRows = this.leadsContainer.locator('tr[data-lead-id]');
        this.filterButton = page.locator('#filter-leads-button');
        this.filterDropdown = page.locator('[data-leads-filter-target="dropdown"]');
        this.clearFiltersButton = page.locator('#clear-filters-button');

    }

    async open() {
        await this.goto('/leads');
    }

    async leadsSearch(value){
      await this.searchInput.fill('');
      await this.searchInput.type(value, { delay: 120 });
      await this.page.waitForTimeout(600);
      await this.page.waitForLoadState('networkidle');
    }

    async uploadCsvAndProcess({ filePath, tag, routePattern = /\/api\/leads\/import/ }) {
        await expect(this.importCsvButton).toBeVisible();
        await this.importCsvButton.click();
        await expect(this.page).toHaveURL(/\/leads\/import/);
        await expect(this.chooseFileButton).toBeVisible();
        await expect(this.tagNameInput).toBeVisible();
        await expect(this.uploadProcessButton).toBeVisible();
        // 1) Select file
        await this.chooseFileButton.setInputFiles(filePath);
      
        // 2) Tag (mandatory)
        await this.tagNameInput.fill(tag);
      
        // 3) Click + wait for request/response
        const [resp] = await Promise.all([
            this.page.waitForResponse(res =>
            routePattern.test(res.url()) && res.request().method() === 'POST'
            ).catch(() => null),
            this.uploadProcessButton.click(),
        ]);
      
        // 4) Visual Confirmation
        await expect(this.importStatusLabel).toBeVisible();
      
       
    }
      
    /**
   * @param {string[]} phones - CSV phone numbers
   */
    
    async verifyImportedLeads(phones = []) {
        await this.goto('/leads');
        await expect(this.leadsContainer).toBeVisible();
      
        for (const phone of phones) {
          // 1) Buscar por teléfono
          await this.leadsSearch(phone);
          const rowWithPhone = this.leadsContainer.getByText(phone, { exact: false });
      
          await expect(
            rowWithPhone,
            `Lead with value: ${phone} was not found`
          ).toBeVisible({ timeout: 10000 });
        }
    }

    async deleteImportedLeads(phones = []) {
      await this.goto('/leads');
      await expect(this.leadsContainer).toBeVisible();

      for (const phone of phones) {
        // 1) Buscar el lead por teléfono
        await this.leadsSearch(phone);

        const row = this.leadsContainer
          .locator('tr[data-lead-id]')
          .filter({ hasText: phone })
          .first();

        await expect(
          row,
          `No se encontró el lead con phone ${phone}`
        ).toBeVisible();

        // 2) Abrir el menú de acciones (botón de 3 puntitos)
        const actionsButton = row.locator('button[id^="lead-actions-button-"]');
        await actionsButton.click();

        // 3) Localizar el botón Delete dentro del dropdown de ESA fila
        const deleteButton = row.locator(
          'button[id^="lead-delete-button-"], button:has-text("Delete")'
        );
        await expect(deleteButton).toBeVisible();

        // 4) Registrar el handler del dialog ANTES del click
        this.page.once('dialog', dialog => {
          console.log('➡️ Dialog:', dialog.type(), dialog.message());
          return dialog.accept();
        });

        // 5) Click en Delete + esperar que termine la navegación/refresh
        await Promise.all([
          this.page.waitForLoadState('networkidle'),
          deleteButton.click(),
        ]);

        // 6) Verificar que ya no exista esa fila (lead eliminado)
        await expect(
          this.leadsContainer
            .locator('tr[data-lead-id]')
            .filter({ hasText: phone })
        ).toHaveCount(0);
      }
    }
    
    async confirmDeletedLeads(phones = []) {
        await this.goto('/leads');
        await expect(this.leadsContainer).toBeVisible();
      
        for (const phone of phones) {
          // Espera que no exista ningún div que contenga ese número
          await expect(
            this.leadsContainer.locator(`div:has-text("${phone}")`)
          ).toHaveCount(0, { timeout: 10_000 });
        }
    }

    // Create Lead Modal

    async openCreateModal() {
      await expect(this.createLeadButton).toBeVisible();
      await this.createLeadButton.click();
      await expect(this.createLeadFrame).toBeVisible();
    }

    async fillLeadForm(data) {
      // Basic info (first/last name son requeridos)
      if (data.firstName) await this.firstNameInput.fill(data.firstName);
      if (data.lastName) await this.lastNameInput.fill(data.lastName);
      if (data.title) await this.titleInput.fill(data.title);
      if (data.company) await this.companyInput.fill(data.company);
      if (data.referredBy) await this.referredByInput.fill(data.referredBy);
  
      if (data.doNotCall !== undefined) {
        const checked = await this.doNotCallCheckbox.isChecked();
        if (data.doNotCall !== checked) {
          await this.doNotCallCheckbox.check();
        }
      }
  
      if (data.background) await this.backgroundInput.fill(data.background);
  
      if (data.tags && data.tags.length) {
        // select2, pero el <select> sigue ahí: se puede usar selectOption
        await this.tagsSelect.selectOption(
          data.tags.map(t => ({ label: t }))
        );
      }
  
      // Business info
      if (data.industry) {
        await this.industrySelect.selectOption({ label: data.industry });
      }
      if (data.state) {
        await this.stateSelect.selectOption({ label: data.state });
      }
      if (data.city) {
        await this.citySelect.selectOption({ label: data.city });
      }
      if (data.businessDescription) {
        await this.businessDescriptionInput.fill(data.businessDescription);
      }
  
      // Status & Assignment (status y access ya tienen valores por default)
      if (data.status) {
        await this.statusSelect.selectOption({ value: data.status }); // new/contacted/...
      }
      if (data.assignedTo) {
        await this.assignedToSelect.selectOption({ label: data.assignedTo });
      }
      if (data.rating) {
        await this.ratingSelect.selectOption({ value: String(data.rating) });
      }
      if (data.campaign) {
        await this.campaignSelect.selectOption({ label: data.campaign });
      }
      if (data.source) {
        await this.sourceSelect.selectOption({ label: data.source });
      }
      if (data.access) {
        await this.accessSelect.selectOption({ value: data.access });
      }
  
      // Contact info
      if (data.email) await this.emailInput.fill(data.email);
      if (data.phone) await this.phoneInput.fill(data.phone);
      if (data.mobile) await this.mobileInput.fill(data.mobile);
      if (data.altEmail) await this.altEmailInput.fill(data.altEmail);
      if (data.lastEmailDate) await this.lastEmailDateInput.fill(data.lastEmailDate);
      if (data.lastTextDate) await this.lastTextDateInput.fill(data.lastTextDate);
  
      // Web info
      if (data.blog) await this.blogInput.fill(data.blog);
      if (data.linkedin) await this.linkedinInput.fill(data.linkedin);
      if (data.facebook) await this.facebookInput.fill(data.facebook);
      if (data.twitter) await this.twitterInput.fill(data.twitter);
    }
  
    async submitCreateLead() {
      await Promise.all([
        this.page.waitForLoadState('networkidle'),
        this.createLeadSubmitButton.click(),
      ]);
    }

    async verifyNewLead(phone) {
      await this.goto('/leads');
      await expect(this.leadsContainer).toBeVisible();
    
        // 1) Buscar por teléfono
        await this.leadsSearch(phone);
        const phoneSpan = this.leadsContainer
      .locator('span.text-sm.text-gray-900')
      .filter({ hasText: phone })
      .first();
    
        await expect(
          phoneSpan,
          `Lead with value: ${phone} was not found`
        ).toBeVisible({ timeout: 10000 });
  
  }

    // Edit Lead

    async openRowByName(firstname) {
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(esc(firstname), 'i');
    
      const row = this.page
        .locator('#leads-container tr:visible')
        .filter({ hasText: pattern })
        .first();
    
      await expect(
        row,
        `A row with the name: ${firstname} was not found`
      ).toBeVisible();
    
      const nameLink = row.locator('a[id^="lead-name-link-"]').first();
    
      await expect(
        nameLink,
        `A link with the name: ${firstname} was not found`
      ).toBeVisible();
    
      await nameLink.scrollIntoViewIfNeeded();
      await nameLink.click();
      await expect(this.page.locator('h1.text-2xl.font-bold')).toContainText(firstname);
    }

    root(fieldName) {
      return this.page.locator(
        `[data-inline-edit-field-name-value="${fieldName}"][data-inline-edit-target="field"]`
      );
    }

    trigger(fieldName) {
      return this.page
        .locator(
          // Caso 1: el mismo elemento tiene field_name y target
          `[data-inline-edit-field-name-value="${fieldName}"][data-inline-edit-target="field"],` +
          // Caso 2: el target está en un hijo dentro del contenedor con field_name
          `[data-inline-edit-field-name-value="${fieldName}"] [data-inline-edit-target="field"]`
        )
        .first();
    }

    async inlineEditField(fieldName, newValue) {
      await expect(
        this.page.getByRole('heading', { level: 2, name: 'Lead Information' })
      ).toBeVisible();
    
      const trigger = this.trigger(fieldName);
    
      await expect(
        trigger,
        `Inline-edit ${fieldName} no está visible`
      ).toBeVisible();
    
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
    
      const editor = this.page
        .locator(
          `[data-inline-edit-field-name-value="${fieldName}"] input, ` +
          `[data-inline-edit-field-name-value="${fieldName}"] textarea, ` +
          `[data-inline-edit-field-name-value="${fieldName}"] select`
        )
        .first();
    
      await editor.waitFor({ state: 'visible' });
    
      const tagName = await editor.evaluate(el => el.tagName.toLowerCase());
    
      if (tagName === 'select') {
        await editor.selectOption({ label: newValue });
      } else {
        await editor.fill(newValue);
        await editor.press('Enter');
      }
    
      const textToCheck = newValue.split('://').pop();
    
      // Para tag_list dejamos que lo valide editTags()
      if (fieldName !== 'tag_list') {
        await expect(this.trigger(fieldName)).toContainText(textToCheck);
      }
    }    

    async inlineEditDate(fieldName, valueISO) {
      const root = this.root(fieldName);
      const trigger = this.trigger(fieldName);
  
      await trigger.click();
  
      const dateInput = root.locator('input[type="date"]');
      await dateInput.waitFor({ state: 'visible' });
  
      await dateInput.fill(valueISO); // formato correcto para type=date
      await dateInput.press('Enter');
  
      // Verifica que el value "real" se actualizó
      await expect(root).toHaveAttribute(
        'data-inline-edit-current-value-value',
        valueISO
      );
    }

    async editTags(tagsArray) {
      const value = tagsArray.join(', ');
      await this.inlineEditField('tag_list', value);
    
      // Contenedor específico de las tags (tiene el field_name tag_list)
      const tagsContainer = this.page.locator(
        '[data-inline-edit-field-name-value="tag_list"]'
      );
    
      // Validar que el primer tag sea visible dentro de ese contenedor
      await expect(
        tagsContainer.getByText(tagsArray[0], { exact: true })
      ).toBeVisible();
    }

    async addComment(commentText) {
      const textarea = this.page.locator('textarea[name="comment[comment]"]');
      await textarea.waitFor({ state: 'visible' });
      await textarea.fill(commentText);
  
      const submit = this.page.locator(
        'input[type="submit"][value="Add Comment"]'
      );
      await submit.click();
  
      // Esperar a que el comentario aparezca en el timeline
      await expect(this.page.getByText(commentText)).toBeVisible();
    }

    // Reject/Reopen Lead

    async rejectLead(mobile) {
      await this.leadsSearch(mobile);
      await expect (this.rejectLeadButton).toBeVisible();

      this.page.once('dialog', d => d.accept());
      await Promise.all([
        this.page.waitForLoadState('networkidle'),
        this.rejectLeadButton.click(),
      ]);

      await this.leadsSearch(mobile);
      await expect (this.reopenLeadButton).toBeVisible();

    }  

    async rejectLeadFromDetails(mobile, firstName) {
      await this.leadsSearch(mobile);
      await this.openRowByName(firstName);
    
      this.page.once('dialog', d => d.accept());
    
      const [response] = await Promise.all([
        this.page.waitForResponse(res =>
          res.url().includes('/reject') && res.request().method() === 'PUT'
        ),
        this.rejectButtonDetails.click(),
      ]);
    
      expect(response.status()).toBe(200);
    
      await this.page.waitForLoadState('networkidle');
      await this.leadsSearch(mobile);
    
      await expect(this.reopenLeadButton).toBeVisible();
    }
    
    async reopenLead(mobile) {
      await this.leadsSearch(mobile);
      await expect (this.reopenLeadButton).toBeVisible();

      this.page.once('dialog', d => d.accept());
      await Promise.all([
        this.page.waitForLoadState('networkidle'),
        this.reopenLeadButton.click(),
      ]);

      await this.leadsSearch(mobile);
      await expect (this.rejectLeadButton).toBeVisible();

    }
  

    // async reopenLeadFromDetails(mobile, firstName) {
    //   await this.leadsSearch(mobile);
    //   await this.openRowByName(firstName);

    //   this.page.once('dialog', d => d.accept());
    //   await Promise.all([
    //     this.page.waitForLoadState('networkidle'),
    //     this.reopenButtonDetails.click(),
    //   ]);

    //   await this.leadsSearch(mobile);
    //   await expect (this.rejectLeadButton).toBeVisible();

    // }

    async reopenLeadFromDetails(mobile, firstName) {
      await this.leadsSearch(mobile);
      await this.openRowByName(firstName);
    
      // Aceptar el dialog de confirm
      this.page.once('dialog', d => d.accept());
    
      const [response] = await Promise.all([
        this.page.waitForResponse(res =>
          res.url().includes('/reopen') && res.request().method() === 'PUT'
        ),
        this.reopenButtonDetails.click(),
      ]);
    
      expect(response.status()).toBe(200);
    
      await this.page.waitForLoadState('networkidle');
    
      await this.leadsSearch(mobile);
    
      await expect(this.rejectLeadButton).toBeVisible();
    }    

    async expectLeadNotInList(mobile) {
      await this.leadsSearch(mobile);
      const pattern = new RegExp(esc(mobile), 'i');
      const match = this.leadsContainer
        .locator('tbody td[data-column="mobile"]')
        .filter({ hasText: pattern });
      await expect(match).toHaveCount(0);
    }

    // Convert lead
    async convertLead(firstName, expectedAccountName, data){
      await this.leadsSearch(firstName);
      const row = this.leadsContainer.locator('tr[data-lead-id]')
          .filter({ hasText: firstName })
          .first();
          
      await expect(
        row,
        `Lead with name ${firstName} was not found`
      ).toBeVisible();

      await this.convertButton.click();
      await expect(this.page.locator('h1.text-4xl')).toContainText('Convert Lead');

      //Fill info
      const accountNameInput = this.page.locator('#account_name');
      await expect(accountNameInput).toHaveValue(expectedAccountName);

      if (data?.assignedTo) {
        await this.page
          .locator('#account_user_id')
          .selectOption({ label: data.assignedTo });
      }

      if (data?.opportunityStage) {
        await this.page
          .locator('#opportunity_stage')
          .selectOption(data.opportunityStage);
      }

      if (data?.permissionsAccess === 'Private') {
        await this.page.locator('#access_Private').check();
      } else if (data?.permissionsAccess === 'Lead') {
        await this.page.locator('#access_Lead').check();
      }

      const submit = this.page.locator(
        'input[type="submit"][value="Convert Lead"]'
      );
    
      await Promise.all([
        this.page.waitForLoadState('networkidle'),
        submit.click(),
      ]);

    }

    async verifyConverLeadLink(firstname){
      await this.openRowByName(firstname);
      this.convertButton2.click();
      await expect(this.page.locator('h1.text-4xl')).toContainText('Convert Lead');
    }

    // SORTING

    normalizeText(text) {
      return text
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)[0] || '';
    }

    async getFirstNColumnValues(columnName, limit = 10) {
      const cells = this.leadsContainer.locator(
        `tr td[data-column="${columnName}"]`
      );
  
      const count = await cells.count();
      const max = Math.min(count, limit);
  
      const values = [];
      for (let i = 0; i < max; i++) {
        const raw = await cells.nth(i).innerText();
        const value =
          columnName === 'name'
            ? this.normalizeText(raw) // para name solo queremos la primera línea (Lead Name)
            : raw.trim();             // mobile / email es simple texto
  
        values.push(value);
      }
  
      return values;
    }

    isSortedAsc(arr) {
      const normalized = arr.map(v => v.toLowerCase());
      for (let i = 0; i < normalized.length - 1; i++) {
        if (normalized[i].localeCompare(normalized[i + 1]) > 0) {
          return false;
        }
      }
      return true;
    }
  
    isSortedDesc(arr) {
      const normalized = arr.map(v => v.toLowerCase());
      for (let i = 0; i < normalized.length - 1; i++) {
        if (normalized[i].localeCompare(normalized[i + 1]) < 0) {
          return false;
        }
      }
      return true;
    }

    async verifySortForColumn(headerLocator, columnName, limit = 10) {
      await expect(this.leadsContainer).toBeVisible();
  
      // Primer click
      await headerLocator.click();
      await this.page.waitForLoadState('networkidle');
      const firstOrder = await this.getFirstNColumnValues(columnName, limit);
  
      // Segundo click
      await headerLocator.click();
      await this.page.waitForLoadState('networkidle');
      const secondOrder = await this.getFirstNColumnValues(columnName, limit);
  
      // Necesitamos al menos 2 filas para que tenga sentido
      expect(firstOrder.length).toBeGreaterThan(1);
      expect(secondOrder.length).toBe(firstOrder.length);
  
      const firstAsc = this.isSortedAsc(firstOrder);
      const firstDesc = this.isSortedDesc(firstOrder);
      const secondAsc = this.isSortedAsc(secondOrder);
      const secondDesc = this.isSortedDesc(secondOrder);
  
      // Ambos estados deben estar ordenados de alguna forma
      expect(firstAsc || firstDesc).toBeTruthy();
      expect(secondAsc || secondDesc).toBeTruthy();
  
      // Y deben ser opuestos (uno asc y el otro desc)
      const oneAscOtherDesc =
        (firstAsc && secondDesc) || (firstDesc && secondAsc);
  
      expect(
        oneAscOtherDesc,
        `Expected one click to sort ${columnName} ascending and the next click to sort descending (or vice versa)`
      ).toBeTruthy();
    }

    async verifySortByLeadName(limit = 10) {
      await this.verifySortForColumn(this.sortByNameHeader, 'name', limit);
    }
  
    async verifySortByMobilePhone(limit = 10) {
      await this.verifySortForColumn(this.sortByMobileHeader, 'mobile', limit);
    }
  
    async verifySortByEmailAddress(limit = 10) {
      await this.verifySortForColumn(this.sortByEmailHeader, 'email', limit);
    }

    async filterByStatusAndVerify(assignmentValue, statusValue, limit = 10) {
      // Mapa de value -> texto visible esperado en la tabla SOLO cuando aplica
      const statusLabelMap = {
        converted: 'converted',
      };
    
      // 1) Abrir dropdown de filtros
      await this.filterButton.click();
      await expect(this.filterDropdown).toBeVisible();
    
      // 2) Seleccionar checkbox del status
      const checkbox = this.page.locator(
        `input[data-filter-type="${assignmentValue}"][data-filter-value="${statusValue}"]`
      );
      await checkbox.check();
    
      // Esperar a que se apliquen los filtros
      await this.page.waitForLoadState('networkidle');
    
      // 3) Cerrar dropdown dando click otra vez en Filter
      await this.filterButton.click();
      await expect(this.filterDropdown).not.toBeVisible();
    
      // 4) Verificar primeros N rows
      await expect(this.leadsContainer).toBeVisible();
    
      const totalRows = await this.leadRows.count();
      const rowsToCheck = Math.min(totalRows, limit);
    
      // Por si algún filtro deja la lista vacía
      expect(
        rowsToCheck,
        `No se encontraron rows después de aplicar el filtro "${statusValue}"`
      ).toBeGreaterThan(0);
    
      for (let i = 0; i < rowsToCheck; i++) {
        const row = this.leadRows.nth(i);
    
        await expect(
          row,
          `El row #${i + 1} no es visible después de aplicar el filtro`
        ).toBeVisible();
    
        if (statusValue === 'converted') {
          // Caso 1: converted -> el row tiene texto "converted"
          await expect(
            row,
            `El row #${i + 1} no contiene el texto "converted" para el filtro converted`
          ).toContainText(/converted/i);
        } else if (statusValue === 'rejected') {
          // Caso 2: rejected -> el row tiene un botón/enlace "Reopen"
          const reopenButton = row
            .locator('a,button')
            .filter({ hasText: /reopen/i })
            .first();
    
          await expect(
            reopenButton,
            `El row #${i + 1} no tiene botón "Reopen" para el filtro rejected`
          ).toBeVisible();
        } else {
          // Caso 3: new / contacted -> no hay indicador en la tabla :(
          // Aquí solo hacemos validaciones genéricas
          // (ej: al menos los rows están visibles y hay resultados)
          // No hay forma de asegurar al 100% el status solo desde esta tabla.
          await expect(
            row,
            `El row #${i + 1} debería estar visible para el filtro "${statusValue}"`
          ).toBeVisible();
        }
      }
    
      // (Opcional) limpiar filtros al final
      await this.filterButton.click();
      await expect(this.filterDropdown).toBeVisible();
      await this.clearFiltersButton.click();
      await this.page.waitForLoadState('networkidle');
    }
    
    
  
}
