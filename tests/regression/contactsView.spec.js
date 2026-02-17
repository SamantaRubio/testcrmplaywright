import { test } from '@playwright/test';
import { ContactsPage } from '../pages/ContactsPage.js';
import contactFixture from '../fixtures/contacts-data.json' assert { type: 'json' };

test.describe.serial('Contacts', () => {

    let createdContactFullName;
    let createdContactFirstName;
    let createdContactLastName;
    let ts;

  test('Create and search contact', async ({ page }) => {
    const contacts = new ContactsPage(page);

    ts = Date.now();

    createdContactFirstName = `Playwright${ts}`;
    createdContactLastName = `Contact`;
    const email = `playwright.contact.${ts}@mailinator.com`;
    const mobile = `312${String(ts).slice(-7)}`;
    createdContactFullName = `${createdContactFirstName} ${createdContactLastName}`;
    const altEmail = `${contactFixture.additional.altEmailPrefix}.${ts}@mailinator.com`;

    await contacts.openCreate();

    await contacts.createContactFull({
      firstName: createdContactFirstName,
      lastName: createdContactLastName,
      email,
      mobile,

      basic: {
        salutationLabel: contactFixture.basic.salutationLabel,
        assignedToLabel: contactFixture.basic.assignedToLabel,
        tags: contactFixture.basic.tags,
      },

      account: {
        search: contactFixture.account.search,
        selectLabel: contactFixture.account.selectLabel,
      },

      job: {
        titleLabel: contactFixture.job.titleLabel,
        department: contactFixture.job.department,
      },

      additional: {
        altEmail,
        doNotCall: contactFixture.additional.doNotCall,
      },

      address: {
        street1: contactFixture.address.street1,
        street2: contactFixture.address.street2,
        city: contactFixture.address.city,
        stateLabel: contactFixture.address.state,
        zipcode: contactFixture.address.zipcode,
      },

      web: {
        blog: contactFixture.web.blog,
        twitter: contactFixture.web.twitter,
        linkedin: contactFixture.web.linkedin,
        facebook: contactFixture.web.facebook,
      },
    });

    await contacts.open();
    await contacts.contactsSearch(createdContactFullName);
    await contacts.expectContactInResults(createdContactFullName);

    console.log(`[CONTACT CREATED] ${createdContactFullName} | ${email}`);
  });

  test('Edit Contact', async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.open();
    await contacts.contactsSearch(createdContactFirstName);
    await contacts.expectContactInResults(createdContactFirstName);
    await contacts.openRowByName(createdContactFirstName);

    createdContactFirstName = `Playwright${ts} Edited`;
    createdContactLastName = `ContactEdit`;
    const email = `playwright.contact.${ts}.edited@mailinator.com`;
    const mobile = `416${String(ts).slice(-7)}`;
    createdContactFullName = `${createdContactFirstName} ${createdContactLastName}`;
    const altEmail = `${contactFixture.edit.additional.altEmail}.${ts}@mailinator.com`;
  
    // NO fixture
    await contacts.inlineEditField('first_name', createdContactFirstName);
    await contacts.inlineEditField('email', email);
    await contacts.inlineEditField('middle_name', contactFixture.edit.basic.middleName);
    await contacts.inlineEditField('alt_email', altEmail);
    await contacts.inlineEditField('last_name', createdContactLastName);
    await contacts.inlineEditField('mobile', mobile);
    await contacts.inlineEditField('nickname', contactFixture.edit.basic.nickname);
    await contacts.inlineEditField('mobile_2', mobile);
    await contacts.inlineEditField('title_id', contactFixture.edit.basic.titleLabel); //select
    await contacts.inlineEditField('mobile_3', mobile);
    await contacts.inlineEditField('department', contactFixture.edit.basic.department);
    await contacts.inlineEditField('do_not_call', contactFixture.edit.additional.doNotCall); //select
    await contacts.inlineEditField('ownership_percentage', contactFixture.edit.additional.ownership);
    await contacts.inlineEditField('assigned_to', contactFixture.edit.additional.assignedTo); //select
    await contacts.inlineEditField('source', contactFixture.edit.additional.source);
    await contacts.inlineEditField('access', contactFixture.edit.additional.access);
    await contacts.inlineEditField('status', contactFixture.edit.additional.status); //select to deactivate
    //date
    await contacts.inlineEditDate('born_on', contactFixture.edit.basic.bornOn);


    // address
    await contacts.inlineEditField('street1', contactFixture.edit.address.street1);
    await contacts.inlineEditField('street2', contactFixture.edit.address.street2);
    await contacts.inlineEditField('city', contactFixture.edit.address.city);
    await contacts.inlineEditField('state', contactFixture.edit.address.state); //Select
    await contacts.inlineEditField('zipcode', contactFixture.edit.address.zipcode);

    // web presence
    await contacts.inlineEditField('blog', contactFixture.edit.web.blog);
    await contacts.inlineEditField('linkedin', contactFixture.edit.web.linkedin);
    await contacts.inlineEditField('facebook', contactFixture.edit.web.facebook);
   // await contacts.inlineEditField('twitter', contactFixture.edit.web.twitter);

    // background
    await contacts.inlineEditField('background_info', contactFixture.edit.backgroundInfo);

    // Financial
    await contacts.inlineEditField('ssn', contactFixture.edit.financial.ssn);
    await contacts.inlineEditField('estimated_credit_score', contactFixture.edit.financial.estimatedCreditScore);
  
    // Tags
    await contacts.editTags(contactFixture.edit.tags);
  
    // Comment
    await contacts.addComment(contactFixture.edit.comment);
  });
  
  test('Activate Contact', async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.open();
    await contacts.contactsSearch(createdContactFullName);
    await contacts.expectContactInResults(createdContactFullName);
    await contacts.activateContact(createdContactFullName);
  });

  test('Deactivate Contact', async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.open();
    await contacts.contactsSearch(createdContactFullName);
    await contacts.expectContactInResults(createdContactFullName);
    await contacts.deactivateContact(createdContactFullName);
  });

  test('Delete Contact', async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.open();
    await contacts.contactsSearch(createdContactFullName);
    await contacts.expectContactInResults(createdContactFullName);
    await contacts.deleteContact(createdContactFullName);
  });

  test('Sort Table', async ({ page }) => {
    const contacts = new ContactsPage(page);

    await contacts.open();

    // NAME
    await contacts.sortAndValidate(
      contacts.sortByNameHeader,
      'name'
    );

    // MOBILE
    await contacts.sortAndValidate(
      contacts.sortByMobileHeader,
      'mobile'
    );

    // EMAIL
    await contacts.sortAndValidate(
      contacts.sortByEmailHeader,
      'email'
    );
  });

  
});
