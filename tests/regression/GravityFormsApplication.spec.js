import { test, expect } from '@playwright/test';
import { GravityFormPage } from '../pages/GravityFormsApplication';
import { GlobalSearch } from '../pages/GlobalSearchComponent.js';
import { ContactsPage } from '../pages/ContactsPage.js';
import { OpportunityDetails } from '../pages/OpportunityDetails.js';
import data from '../fixtures/gf-application-data.json' assert { type: 'json' };

const unique = `${Date.now()}`;
const unique2 = unique.slice(-9);
const phone = unique.slice(-10);
const company =`${data.business.company} ${unique}`;
const first = `${data.owner.first} ${unique}`;
const email = data.owner.email.replace('@', `+${unique}@`);
const taxId = `${data.owner.taxId} ${unique2}`;
const newContact = `${data.owner.first} ${unique} ${data.owner.last}`;

test.describe('Gravity forms -> CRM verification', () => {
  test.use({
    storageState: 'storage/auth.json',
  });

  test('submit external application and verify in CRM', async ({ page }) => {
    
  
    
    const external = new GravityFormPage(
      page,
      process.env.GRAVITY_FORMS_APPLICATION_URL
    );
    const gs = new GlobalSearch(page);

    // Unique values for searching
    
    
    
    

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
          { type: 'Contacts',      value: data.owner.first,      selectorType: 'h1' }
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

  test('Validate new Contact', async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.open();
    await contacts.contactsSearch(newContact);
    await contacts.expectContactInResults(newContact);
    await contacts.openRowByName(newContact);
    await contacts.verifyInputsFromGravityF('first_name', first);
    await contacts.verifyInputsFromGravityF('last_name', data.owner.last);
    await contacts.verifyInputsFromGravityF('last_name', data.owner.last);
    await contacts.verifyInputsFromGravityF('account_id', company);
    await contacts.verifyInputsFromGravityF('account_id', company);
    await contacts.verifyInputsFromGravityF('email', email);
    await contacts.validateDateGravityF('born_on', data.owner.dob);
    await contacts.verifyInputsFromGravityF('ownership_percentage', data.owner.ownership);
    await contacts.verifyInputsFromGravityF('ssn', data.owner.ssn);
    await contacts.verifyInputsFromGravityF('street1', data.owner.homeStreet);
    await contacts.verifyInputsFromGravityF('city', data.owner.homeCity);
    await contacts.verifyInputsFromGravityF('state', data.owner.homeState);
    await contacts.verifyInputsFromGravityF('zipcode', data.owner.homeZip);
  });

  test('Validate new Opportunity', async ({ page }) => {
    const oppPage = new OpportunityDetails(page);
    await oppPage.open();
    await oppPage.oppSearch(company);
    await oppPage.openRowByName(company);
    await oppPage.verifyInputsFromGravityF('amount', data.funding.capitalVerification);
    await oppPage.validateBankStatementsCount({ expectedCount: 3 });
    await oppPage.validateRelatedSpansGravityF(company, newContact, email, phone);
  });


});
