import { test, expect } from '@playwright/test';
import { LeadsPage } from '../../pages/LeadsPage.js';
import { ContactsPage } from '../../pages/ContactsPage';
import leadsData from '../../fixtures/newleads.json' assert { type: 'json' };

let unique = Date.now().toString();
let firstName = `${unique}`;
let phone = `314${unique.slice(-7)}`; 
let mobile = `341${unique.slice(-7)}`; 
let email = `playwrightmanuallead${unique}@mailinator.com`;
let altEmail = `samanta.rubio+${unique}@mailinator.com`;
let company = `PlaywrightCompany${unique}`;

test('Create and Search Lead', async ({ page }) => {
    const leadsPage = new LeadsPage(page);
    await leadsPage.open();
    await leadsPage.openCreateModal();
    await leadsPage.fillLeadForm({
      ...leadsData.lead1, 
      firstName,
      company,
      phone,
      mobile,
      email,
      altEmail
    });
    await leadsPage.submitCreateLead();
    await leadsPage.verifyNewLead(mobile);

});

test('Reject Lead', async ({ page }) => {
  const leadsPage = new LeadsPage(page);
  await leadsPage.open();
  await leadsPage.rejectLead(mobile);
});

test('Reopen Lead', async ({ page }) => {
  const leadsPage = new LeadsPage(page);
  await leadsPage.open();
  await leadsPage.reopenLead(mobile);
});

test('Edit Lead', async ({ page }) => {
  test.setTimeout(60_000);
  const leadsPage = new LeadsPage(page);
  await leadsPage.open();
  await leadsPage.leadsSearch(firstName);
  await leadsPage.openRowByName(firstName);

  firstName = `${unique}edited`;
  phone = `312${unique.slice(-7)}`; 
  mobile = `312${unique.slice(-7)}`; 
  email = `playwrightupdated${unique}@mailinator.com`;
  altEmail = `samanta.rubio+${unique}@mailinator.com`;
  company = `UpdatedPlayCompany${unique}`;

  await leadsPage.inlineEditField('first_name', firstName);
  await leadsPage.inlineEditField('last_name', leadsData.lead2.lastName);
  await leadsPage.inlineEditField('title', leadsData.lead2.title);
  await leadsPage.inlineEditField('company', company);
  await leadsPage.inlineEditField('referred_by', leadsData.lead2.referredBy);
  await leadsPage.inlineEditField('email', email);
  await leadsPage.inlineEditField('alt_email', altEmail);


  await leadsPage.inlineEditField('phone', phone);
  await leadsPage.inlineEditField('mobile', mobile);
  await leadsPage.inlineEditField('blog', leadsData.lead2.blog);
  await leadsPage.inlineEditField('facebook', leadsData.lead2.facebook);
  await leadsPage.inlineEditField('twitter', leadsData.lead2.twitter);
  await leadsPage.inlineEditField('linkedin', leadsData.lead2.linkedin);
  await leadsPage.inlineEditField('assigned_to', leadsData.lead2.assignedTo);
  await leadsPage.inlineEditField('background_info', leadsData.lead2.background);
  await leadsPage.inlineEditDate('last_email_date', leadsData.lead2.lastEmailDate);
  await leadsPage.inlineEditDate('last_text_date', leadsData.lead2.lastTextDate);


  await leadsPage.editTags(leadsData.lead2.tags);
  await leadsPage.addComment(leadsData.lead2.addComment);

  await expect(
    page.getByRole('heading', { level: 1 })
  ).toContainText(leadsData.lead2.lastName);

  await expect(page.getByText(leadsData.lead2.addComment)).toBeVisible();

});

test('Verify Convert Lead link Lead Details View', async({ page }) =>{
  const leadsPage = new LeadsPage(page);
  await leadsPage.open();
  await leadsPage.verifyConverLeadLink(firstName);
})

test('Convert Lead from Leads View', async({ page }) =>{
  const leadsPage = new LeadsPage(page);
  const contactsPage = new ContactsPage(page);
  await leadsPage.open();
  await leadsPage.convertLead(firstName, company, leadsData.convertLead);
  await leadsPage.open();
  await contactsPage.verifyConvertedLead(phone,firstName);
})

test('Sort Leads by Lead Name', async ({ page }) => {
  const leadsPage = new LeadsPage(page);
  await leadsPage.open();
  await leadsPage.verifySortByLeadName(10); //asc and desc - first 10 rows
});

test('Sort Leads by Mobile Phone', async ({ page }) => {
  const leadsPage = new LeadsPage(page);
  await leadsPage.open();
  await leadsPage.verifySortByMobilePhone(10); //asc and desc - first 10 rows
});

test('Sort Leads by Email Address', async ({ page }) => {
  const leadsPage = new LeadsPage(page);
  await leadsPage.open();
  await leadsPage.verifySortByEmailAddress(10); //asc and desc - first 10 rows
});


