import { test, expect } from '@playwright/test';
import { OpportunityDetails } from '../../pages/OpportunityDetails.js';

test.describe.serial('Opportunity Details - dependent tests', () => {
    let searchTerm = 'Playwright';     

    test('Choose Opportunity', async ({ page }) => {
        const oppPage = new OpportunityDetails(page);
        await oppPage.open();
        await oppPage.oppSearch(searchTerm);
        searchTerm = await oppPage.getFirstOppName();
    });

    test('Search Opportunity', async ({ page }) => {
        const oppPage = new OpportunityDetails(page);
        await oppPage.open();
        await oppPage.oppSearch(searchTerm);
        await oppPage.verifySearch(searchTerm);
    });

    test('Upload Bank Statement and Search in Documents', async ({ page }) => {
        const oppPage = new OpportunityDetails(page);
        await oppPage.open();
        await oppPage.oppSearch(searchTerm);
        await oppPage.openRowByName(searchTerm);
        await oppPage.resetDocumentsWidgetState();
      
        const fixturePath = 'tests/fixtures/BankStatementPlay.pdf';
      
        await oppPage.openUploadForm();
        await oppPage.fillDocumentDescription('Uploaded by Playwright Automation');
        await oppPage.selectDocumentCategory('Bank Statement');
        await oppPage.selectStatementPeriod({ month: 'December', year: 2025 });

        const uploadedFileName = await oppPage.uploadDocumentFile(fixturePath);
        await oppPage.searchDocumentUsingWidgetAndVerify(uploadedFileName);
    });

    test('Select document in Documents widget', async ({ page }) => {
        const oppPage = new OpportunityDetails(page);
        await oppPage.open();
        await oppPage.oppSearch(searchTerm);
        await oppPage.openRowByName(searchTerm);
        await oppPage.resetDocumentsWidgetState();
        await oppPage.selectFirstDocumentAndVerify();
    });

    test('Select/Deselect all documents', async ({ page }) => {
        const oppPage = new OpportunityDetails(page);
        await oppPage.open();
        await oppPage.oppSearch(searchTerm);
        await oppPage.openRowByName(searchTerm);
        await oppPage.resetDocumentsWidgetState();
        await oppPage.selectAllDocumentsAndVerify();
        await oppPage.deselectAllDocumentsAndVerify();
    });

    test('Download document with Direct Cash Group Watermark', async ({ page }) => {
        const oppPage = new OpportunityDetails(page);
      
        await oppPage.open();
        await oppPage.oppSearch(searchTerm);
        await oppPage.openRowByName(searchTerm);
        await oppPage.resetDocumentsWidgetState();
        await oppPage.verifyFirstDocumentDirectCashGroupDownload();
    });

    test('Download document with Super Cash Group Watermark', async ({ page }) => {
        const oppPage = new OpportunityDetails(page);
      
        await oppPage.open();
        await oppPage.oppSearch(searchTerm);
        await oppPage.openRowByName(searchTerm);
        await oppPage.resetDocumentsWidgetState();
        await oppPage.verifyFirstDocumentSuperCashGroupDownload();
    });

    test('Preview in Modal and navigation', async ({ page }) => {
        const oppPage = new OpportunityDetails(page);
        await oppPage.open();
        await oppPage.oppSearch(searchTerm);
        await oppPage.openRowByName(searchTerm);
        await oppPage.resetDocumentsWidgetState();
        await oppPage.openFirstDocumentPreviewAndVerify();
        await oppPage.verifyModalNavigationArrowsWork();
    });

});