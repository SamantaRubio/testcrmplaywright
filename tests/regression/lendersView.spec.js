import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import LendersPage from '../pages/LendersPage';

function withUniqueEmail(originalEmail, unique) {
  const [local, domain] = originalEmail.split('@');
  return `${local}+${unique}@${domain}`;
}

test.describe.serial('Lenders View', () => {
  test.describe.configure({ timeout: 60000 });
  test.use({ expect: { timeout: 20000 } });

  let lenderId;      
  let createdName;       
  let createdEmail;
  let currentName;

  test('Create and Search Lender', async ({ page }) => {
    const lendersPage = new LendersPage(page);

    const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/lender-data.json');
    const lenderData = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

    const unique = Date.now();
    const payload = structuredClone(lenderData);

    // BASIC (unique)
    payload.basic.name = `${payload.basic.name} ${unique}`;
    createdName = payload.basic.name;

    if (payload.basic.email) {
      payload.basic.email = withUniqueEmail(payload.basic.email, unique);
      createdEmail = payload.basic.email;
    }

    // API (unique en secretos)
    if (payload.api?.enabled) {
      if (payload.api.apiKey) payload.api.apiKey = `${payload.api.apiKey}-${unique}`;
      if (payload.api.apiSecret) payload.api.apiSecret = `${payload.api.apiSecret}-${unique}`;
      if (payload.api.webhookSecret) payload.api.webhookSecret = `${payload.api.webhookSecret}-${unique}`;
      if (payload.api.webhookUrl) payload.api.webhookUrl = `${payload.api.webhookUrl}/${unique}`;
    }

    // EMAIL (unique)
    if (payload.email?.enabled && payload.email.ccEmail) {
      payload.email.ccEmail = withUniqueEmail(payload.email.ccEmail, unique);
    }

    await lendersPage.openNew();
    await lendersPage.fillBasicInformation(payload.basic);
    await lendersPage.enableApiAndFill(payload.api);
    await lendersPage.enableEmailAndFill(payload.email);
    await lendersPage.saveLenderAndVerify();

    // ✅ Como redirige a /lenders, obtenemos el ID buscando por nombre
    await lendersPage.openIndex(); // opcional si ya estás en /lenders, pero lo hace estable
    lenderId = await lendersPage.findLenderIdByName(createdName);
    expect(lenderId, 'No lenderId found in lenders table').toBeTruthy();

  });

  test('View Lender Details', async ({ page }) => {
    const lendersPage = new LendersPage(page);
    expect(lenderId, 'Missing lenderId (setup failed)').toBeTruthy();
    await lendersPage.openIndex();
    await lendersPage.searchLender(createdName);
    await lendersPage.viewDetailsById(lenderId);
    await expect(page).toHaveURL(new RegExp(`/lenders/${lenderId}$`));
  });

  test('Sort table', async ({ page }) => {
    const lendersPage = new LendersPage(page);
    await lendersPage.openIndex();

    const sortableColumns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'api_status', label: 'API Status' },
      { key: 'email_status', label: 'Email Status' },
      { key: 'renewal', label: 'Renewal %' },
      { key: 'created', label: 'Created' },
    ];

    for (const column of sortableColumns) {
      await test.step(`Sort by ${column.label}`, async () => {
        // capturar primer valor antes del sort
        const firstRowBefore = lendersPage.lenderRows.first();
        await expect(firstRowBefore).toBeVisible();

        const cellBefore = firstRowBefore.locator(
          `td[data-column="${column.key}"]`
        );
        const valueBefore = (await cellBefore.innerText()).trim();

        // ordenar
        await lendersPage.sortBy(column.key);

        // esperar a que la tabla se estabilice
        await expect(lendersPage.lenderRows.first()).toBeVisible();

        const firstRowAfter = lendersPage.lenderRows.first();
        const cellAfter = firstRowAfter.locator(
          `td[data-column="${column.key}"]`
        );
        const valueAfter = (await cellAfter.innerText()).trim();

        // verificación NO frágil:
        // - hay filas
        // - el valor existe
        expect(valueAfter).toBeTruthy();

        // logging útil si falla en CI
        console.log(
          `[SORT ${column.key}] before="${valueBefore}" after="${valueAfter}"`
        );
      });
    }
  });

  test('Edit Lender', async ({ page }) => {
    const lendersPage = new LendersPage(page);

    // Asegurar que sí se creó
    expect(lenderId, 'No lenderId (Create test may have failed)').toBeTruthy();

    const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/lender-data.json');
    const lenderData = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

    const uniqueEdit = Date.now();
    const editPayload = structuredClone(lenderData.edit); // <-- en tu fixture agrega "edit"

    // Aplica unique a los campos necesarios (ejemplo)
    if (editPayload.basic?.name) editPayload.basic.name = `${editPayload.basic.name} ${uniqueEdit}`;
    if (editPayload.basic?.email) editPayload.basic.email = withUniqueEmail(editPayload.basic.email, uniqueEdit);
    if (editPayload.api?.apiKey) editPayload.api.apiKey = `${editPayload.api.apiKey}-${uniqueEdit}`;
    if (editPayload.api?.apiSecret) editPayload.api.apiSecret = `${editPayload.api.apiSecret}-${uniqueEdit}`;
    if (editPayload.api?.webhookSecret) editPayload.api.webhookSecret = `${editPayload.api.webhookSecret}-${uniqueEdit}`;
    if (editPayload.email?.ccEmail) editPayload.email.ccEmail = withUniqueEmail(editPayload.email.ccEmail, uniqueEdit);

    // 1) Ir al index
    await lendersPage.openIndex(); // /lenders

    // 2) Buscar el lender creado (más confiable por nombre)
    await lendersPage.searchLender(createdName);

    // 3) Abrir el lender (click en su nombre)
    await lendersPage.openFirstResultByClickingName(createdName);

    // (Opcional) asegurar que estamos en el lender correcto
    await expect(page).toHaveURL(new RegExp(`/lenders/${lenderId}$`));

    // 4) Editar inline todos los campos requeridos
    await lendersPage.editLenderAndVerify(editPayload);

    if (editPayload.basic?.name) {
      currentName = editPayload.basic.name;
    }

  });

  test('Delete lender', async ({ page }) => {
    const lendersPage = new LendersPage(page);
    expect(lenderId, 'Missing lenderId (setup failed)').toBeTruthy();

    await lendersPage.openIndex();

    // (opcional) filtra por nombre antes de borrar para asegurar que está en pantalla
    await lendersPage.searchLender(currentName);

    await lendersPage.deleteById(lenderId);

    // validar que ya no aparezca si vuelvo a buscar por nombre
    await lendersPage.searchLender(currentName).catch(() => {});
    await expect(lendersPage.lenderRows).toHaveCount(0, { timeout: 15000 });
  });

});

