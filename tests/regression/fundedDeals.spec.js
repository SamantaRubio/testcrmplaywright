import { test, expect } from '@playwright/test';
import { FundedDealsPage } from '../pages/FundedDealsPage.js';
import fundedDeals from '../fixtures/fundedDeals.json' assert { type: 'json' };

test.describe.serial('Funded Deals - dependent tests', () => {
let searchTerm;

test('Choose Funded Deal', async ({ page }) => {
    const dealsPage = new FundedDealsPage(page);
    await dealsPage.open();
    searchTerm = await dealsPage.chooseFirstPendingApprovalDeal();
    expect(searchTerm, 'No Pending Approval deal found').toBeTruthy();
    // await dealsPage.dealsSearch(searchTerm);
    // searchTerm = await dealsPage.getFirstDealAccountName();
});

test('Search Funded Deal', async ({ page }) => {
    const dealsPage = new FundedDealsPage(page);
    await dealsPage.open();
    await dealsPage.dealsSearch(searchTerm);
    await dealsPage.verifySearch(searchTerm);
});

test('Visualize Total Commisions', async ({ page }) => {
    const dealsPage = new FundedDealsPage(page);
    await dealsPage.open();
    await dealsPage.visualizeTotalCommissions();
});

test('Sort Funded Deals', async ({ page }) => {
    const dealsPage = new FundedDealsPage(page);
    await dealsPage.open();
    await dealsPage.verifySortingForAllColumns(10);
});

test('View Funded Deal Details', async({page}) => {
    const dealsPage = new FundedDealsPage(page);
    await dealsPage.open();
    await dealsPage.dealsSearch(searchTerm);
    await dealsPage.verifySearch(searchTerm);
    await dealsPage.openRowByName(searchTerm);
});

test('Edit Funded Deal Details', async({page}) =>{
    const dealsPage = new FundedDealsPage(page);
    const {
        accountName,
        owner,
        notes,
        amount,
        dealType,
        payment,
        termAmount,
        termSchedule,
        buyRate,
        sellRate,
        feePercentage,
        net,
        commissionPercentage,
        position,
        positionType,
        approvalExpirationDate,
        exclusivityExpirationDate,
        renewalDate,
        lenderPaid,
        repPaid,
      } = fundedDeals;
    await dealsPage.open();
    await dealsPage.dealsSearch(searchTerm);
    await dealsPage.verifySearch(searchTerm);
    await dealsPage.openRowByName(searchTerm);

    // Additional Information
    await dealsPage.updateAccountName(accountName);
    searchTerm = accountName;
    await dealsPage.updateOwner(owner);
    await dealsPage.updateNotes(notes);

    // Financial Details
    await dealsPage.updateAmount(amount);
    await dealsPage.updateDealType(dealType);
    await dealsPage.updatePayment(payment);
    await dealsPage.updateTermAmount(termAmount);
    await dealsPage.updateTermSchedule(termSchedule);
    await dealsPage.updateBuyRate(buyRate);
    await dealsPage.updateSellRate(sellRate);
    await dealsPage.updateFeePercentage(feePercentage);
    await dealsPage.updateNet(net);
    await dealsPage.updateCommissionPercentage(commissionPercentage);
    await dealsPage.updatePosition(position);
    await dealsPage.updatePositionType(positionType);

    // Important Dates
    await dealsPage.updateApprovalExpirationDate(approvalExpirationDate);
    await dealsPage.updateExclusivityExpirationDate(exclusivityExpirationDate);
    await dealsPage.updateRenewalDate(renewalDate);

    // Payment Status
    await dealsPage.updateLenderPaid(lenderPaid);
    await dealsPage.updateRepPaid(repPaid);
});

test('Approve Funded Deal', async({page}) =>{
    const dealsPage = new FundedDealsPage(page);
    await dealsPage.open();
    await dealsPage.dealsSearch(searchTerm);
    await dealsPage.verifySearch(searchTerm);
    await dealsPage.openRowByName(searchTerm);
    await dealsPage.approveFundedDeal();
});

test('Reopen Funded Deal', async({page}) =>{
    const dealsPage = new FundedDealsPage(page);
    await dealsPage.open();
    await dealsPage.dealsSearch(searchTerm);
    await dealsPage.verifySearch(searchTerm);
    await dealsPage.openRowByName(searchTerm);
    await dealsPage.reopenFundedDeal();
});

test('Delete Funded Deal', async({page}) => {
    const dealsPage = new FundedDealsPage(page);
    await dealsPage.open();
    await dealsPage.dealsSearch(searchTerm);
    await dealsPage.deleteFundedDeal(searchTerm);
});

});