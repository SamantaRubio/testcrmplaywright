import { test, expect } from '@playwright/test';
import { GravityFormPage } from '../pages/GravityFormsApplication';
import { GlobalSearch } from '../pages/GlobalSearchComponent.js';
import data from '../fixtures/gf-application-data.json' assert { type: 'json' };


test.describe('Gravity forms -> CRM verification', () => {
  test.use({
    storageState: 'storage/auth.json',
  });

  test('submit external application and verify in CRM', async ({ page }) => {
    const unique = `${Date.now()}`;
    const unique2 = unique.slice(-9);
    const phone = unique.slice(-10);
    const external = new GravityFormPage(
      page,
      process.env.GRAVITY_FORMS_APPLICATION_URL
    );
    const gs = new GlobalSearch(page);

    // Unique values for searching
    const company = `${data.business.company} ${unique}`;
    const first = `${data.owner.first} ${unique}`;
    const email = data.owner.email.replace('@', `+${unique}@`);
    const taxId = `${data.owner.taxId} ${unique2}`;

    await test.step('Open and fill Gravity Forms', async () => {
      await external.open();
      await external.fillBusinessInfo({
        ...data.business,
        company,
        taxId
      });
      await external.fillOwnerInfo(0, {
        ...data.owner,
        first,
        email,
        phone
      });
      await external.fillFundingAmounts(data.funding);
      await external.uploadBankStatements(data.pdfs);
      await external.agreeAndSign();
      await external.submit();
      await external.expectConfirmation();

      await test.step('Verify records in CRM via Global Search', async () => {

        const categories = [
          { type: 'Opportunities', value: company,               selectorType: 'h1' },
          { type: 'Accounts',      value: company,               selectorType: 'h1' },
          { type: 'Contacts',      value: data.owner.first,      selectorType: 'h1' },
         // { type: 'Leads',         value: data.owner.first,      selectorType: 'h1' },
        ];

        for (const item of categories) {
          // Search
          await gs.openAndType(item.value);
          await gs.waitForAnyResult();
  
          // Dynamic Selection
          if (['Contacts', 'Opportunities'].includes(item.type)) {
            await gs.selectSecondResult();
          } else {
            await gs.selectFirstResult();
          }
  
          // Validations per selector type
          switch (item.selectorType) {
            case 'h1':
              await expect(page.locator('h1')).toContainText(new RegExp(item.value, 'i'));
              break;
            default:
              throw new Error(`No selectorType for ${item.type}`);
          }
        }
      });

    });
  });


});
