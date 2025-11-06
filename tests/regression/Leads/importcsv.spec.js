import { test, expect } from '@playwright/test'; //Import directly from playwright and not from a fixture
import { LeadsPage } from '../../pages/LeadsPage.js';
import fs from 'fs';
import path from 'path';

// ----------------- REQUIRES ADJUSTMENTS

//read phones from csv
// function phonesFromCsv(csvPath) {
//   const content = fs.readFileSync(csvPath, 'utf8');
//   const [headerLine, ...lines] = content.split(/\r?\n/).filter(Boolean);
//   const headers = headerLine.split(',');
//   const idxPhone = headers.indexOf('phone');
//   return lines.map(l => l.split(',')[idxPhone]).filter(Boolean);
// }

// test('Import valid csv', async ({ page }) => {
//   const importcsv = new LeadsPage(page);
//   await importcsv.open();
  
//   const csvPath = 'tests/fixtures/leadsData.csv'; 
//   const phones = phonesFromCsv(csvPath);
//   await importcsv.uploadCsvAndProcess({
//     filePath: csvPath,
//     tag: 'VALID_IMPORT_PLAYWRIGHT'
// });

//   // Validations
//   await expect(importcsv.importStatusLabel).toContainText('Import completed successfully!');
//   await expect(importcsv.importStatusLabel).toContainText('Success Rate: 100%');
//   await importcsv.verifyImportedLeads(phones);

// });

// test('Handle duplicated csv', async ({ page }) => {
//     const importcsv = new LeadsPage(page);
//     await importcsv.open();
    
//     const csvPath = 'tests/fixtures/leadsData.csv'; 
//     await importcsv.uploadCsvAndProcess({
//       filePath: csvPath,
//       tag: 'DUPLICATED_IMPORT_PLAYWRIGHT'
//   });
  
//     // Validations
//     await expect(importcsv.importStatusLabel).toContainText('Import completed successfully!');
//     await expect(importcsv.importStatusLabel).toContainText('Success Rate: 0%');
//     await expect(importcsv.importStatusLabel).toContainText('Mobile has already been taken');
  
//   });

  
// test('Delete imported leads', async ({ page }) => {
//     const leadsPage = new LeadsPage(page);
  
//     await leadsPage.open();
  
//     const csvPath = path.resolve('tests/fixtures/leadsData.csv');
//     const phones = phonesFromCsv(csvPath);
  
//     await leadsPage.deleteImportedLeads(phones);
//     await leadsPage.confirmDeletedLeads(phones);
// });