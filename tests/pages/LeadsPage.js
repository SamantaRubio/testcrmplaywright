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
        this.leadsContainer = this.getByTestId('leadsContainer');
    }

    async open() {
        await this.goto('/leads');
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

        for (const phone of phones){
            const leadDiv = this.leadsContainer.locator(`div:has-text("${phone}")`).first();
            await expect(leadDiv).toBeVisible();   
        }
    }
    
    async deleteImportedLeads(phones = []) {
        await this.goto('/leads');
        await expect(this.leadsContainer).toBeVisible();

        for (const phone of phones){
            const leadDiv = this.leadsContainer.locator(`div:has-text("${phone}")`).first();
            await expect(leadDiv).toBeVisible();

            const deleteBtn = leadDiv.locator('a[data-method="delete"]');
            
                // Click + aceptar el confirm en paralelo (sin handlers globales)
            await Promise.all([
                this.page.waitForEvent('dialog').then(d => d.accept()),
                deleteBtn.click(),
            ]);
            
        }
        await this.page.reload({ waitUntil: 'networkidle' });
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
  
}
