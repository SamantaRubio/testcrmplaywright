import { expect } from '@playwright/test';
import path from 'path';

export class GravityFormPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} url
   */
  constructor(page, url) {
    this.page = page;
    this.url = url;
  }

  async open() {
    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: /stg tests/i })).toBeVisible();
  }

  async fillBusinessInfo({ company, entity, taxId, inception, street, city, state, zip, products }) {
    await this.page.getByLabel(/Legal Company Name/i).fill(company);
    await this.page.getByLabel(/Entity Type/i).selectOption({ label: entity });
    await this.page.getByLabel(/Tax ID/i).fill(taxId);
    await this.page.getByLabel(/Business inception Date/i).fill(inception);

    const businessSection = this.page.locator('#field_3_8');

    await businessSection.getByLabel(/^Street Address/i).fill(street);
    await businessSection.getByLabel(/^City$/i).fill(city);
    await businessSection.getByLabel(/^State$/i).selectOption({ label: state });
    await businessSection.getByLabel(/^ZIP Code$/i).fill(zip);

    await this.page.getByLabel(/Products or Services Sold/i).fill(products);
  }

  async fillOwnerInfo(_index, { first, last, email, phone, ssn, dob, homeStreet, homeCity, homeState, homeZip, ownership}) {

  // ✅ Scope semántico al bloque de nombre del Owner
  const nameGroup = this.page.getByRole('group', { name: /Name \(Required\)/i });
  await nameGroup.getByLabel(/^First$/i).fill(first);
  await nameGroup.getByLabel(/^Last$/i).fill(last);

  const emailInput = this.page.getByRole('textbox', { name: /^Email \(Required\)$/i });
  await emailInput.fill(email);

  const phoneInput = this.page.getByRole('textbox', { name: /^Cell Phone \(Required\)$/i });
  await phoneInput.fill(phone);

  const ssnInput = this.page.getByRole('textbox', { name: /^SS Number \(Required\)$/i });
  await ssnInput.fill(ssn);

  const dobInput = this.page.getByRole('textbox', { name: /^Date of Birth \(Required\)$/i });
  await dobInput.fill(dob);

  const homeAddressSection = this.page.locator('#field_3_16');
  await homeAddressSection.getByLabel(/^Street Address/i).fill(homeStreet);
  await homeAddressSection.getByLabel(/^City$/i).fill(homeCity);
  await homeAddressSection.getByLabel(/^State$/i).selectOption({ label: homeState });
  await homeAddressSection.getByLabel(/^ZIP Code$/i).fill(homeZip);

  const ownershipSpin = this.page.getByRole('spinbutton', { name: /Business Ownership Percentage \(Required\)/i });
  await ownershipSpin.fill(String(ownership));
  }

  async fillFundingAmounts({ capital = '10000' }) {
    const capitalInput = this.page.getByRole('textbox', { name: /^How much capital is being requested \(Required\)$/i });
    await capitalInput.fill(capital);
  }

  async uploadBankStatements(pdfPathsOrSingle) {
    const pdfs = Array.isArray(pdfPathsOrSingle) ? pdfPathsOrSingle : [pdfPathsOrSingle];
    const abs = pdfs.map(p => path.resolve(p));

    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(abs);

    const names = abs.map(a => path.basename(a));
    await this.waitForUploadsComplete(names);
  }

  // async waitForUploadsComplete(fileNames, timeout = 50_000) {
  //   for (const name of fileNames) {
  //     // Contenedor del archivo (div.ginput_preview que contiene el filename)
  //     const item = this.page.locator('.ginput_preview', {
  //       has: this.page.locator('.gfield_fileupload_filename', { hasText: name })
  //     });
  
  //     await expect(item, `No se encontró el contenedor para ${name}`).toBeVisible({ timeout });
  
  //     // 1) 100% visible
  //     const percent = item.locator('.gfield_fileupload_percent');
  //     await expect(percent, `${name}: el porcentaje no llegó a 100%`).toHaveText(/100%/i, { timeout });
  
  //     // 2) Barra con width: 100%
  //     const bar = item.locator('.gfield_fileupload_progressbar_progress');
  //     await expect(bar, `${name}: la barra no está al 100%`)
  //       .toHaveAttribute('style', /width:\s*100%/i, { timeout });
  
  //     // 3) Estado FINAL: hay botón de borrar y NO hay "Cancel"
  //     const deleteBtn = item.locator('button.gform_delete_file'); // icono de basura
  //     await expect(deleteBtn, `${name}: aún no aparece el botón de borrar`).toBeVisible({ timeout });
  
  //     // “Cancel” desaparece al completar
  //     const cancelBtn = item.getByRole('button', { name: /cancel/i });
  //     await expect(cancelBtn, `${name}: sigue mostrando 'Cancel' (upload no finalizó)`).toHaveCount(0, { timeout });
  //   }
  
  //   // (Opcional) Validación global: cantidad de ítems completos = cantidad de archivos
  //   const completedItems = this.page.locator('.ginput_preview button.gform_delete_file');
  //   await expect(completedItems).toHaveCount(fileNames.length, { timeout });
  // }

  async waitForUploadsComplete(fileNames, timeout = 50_000) {
    for (const name of fileNames) {
      // Contenedor del archivo
      const item = this.page.locator('.ginput_preview', {
        has: this.page.locator('.gfield_fileupload_filename', { hasText: name })
      });
  
      await expect(item, `❌ No se encontró el contenedor para ${name}`).toBeVisible({ timeout });
  
      // 1️⃣ Porcentaje 100%
      const percent = item.locator('.gfield_fileupload_percent');
      await expect(percent, `❌ ${name}: porcentaje distinto de 100%`).toHaveText(/100%/i, { timeout });
  
      // 2️⃣ Barra completada
      const bar = item.locator('.gfield_fileupload_progressbar_progress');
      await expect(bar, `❌ ${name}: barra no está al 100%`).toHaveAttribute('style', /width:\s*100%/i, { timeout });
  
      // 3️⃣ Estado final: botón de borrar visible
      const deleteBtn = item.locator('button.gform_delete_file');
      await expect(deleteBtn, `❌ ${name}: no aparece el botón de borrar`).toBeVisible({ timeout });
  
      // 4️⃣ “Cancel” desaparecido
      const cancelBtn = item.getByRole('button', { name: /cancel/i });
      await expect(cancelBtn, `❌ ${name}: sigue mostrando 'Cancel' (upload no finalizó)`).toHaveCount(0, { timeout });
  
      // ✅ Confirmación visual (aparece en el reporte de expect)
      await expect
        .poll(async () => {
          const isComplete =
            (await percent.textContent())?.includes('100%') &&
            (await bar.getAttribute('style'))?.includes('width: 100%') &&
            (await deleteBtn.isVisible());
          return isComplete;
        }, { timeout, message: `✅ ${name} cargado correctamente.` })
        .toBeTruthy();
    }
  
    // Validación global: todos completados
    const completedItems = this.page.locator('.ginput_preview button.gform_delete_file');
    await expect(completedItems).toHaveCount(fileNames.length, { timeout });
  
    // Mensaje final en el reporte Playwright
    await expect.soft(true, `✅ Todos los archivos (${fileNames.length}) fueron cargados correctamente.`).toBeTruthy();
  }

  async agreeAndSign() {
    // Firma en canvas (si existe):
    const canvas = this.page.locator('#input_3_18'); // tu <canvas id="input_3_18">
    await canvas.scrollIntoViewIfNeeded();
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas boundingBox not available');

    const { x, y, width, height } = box;

    // Empieza dentro del canvas (no en el borde)
    const startX = x + width * 0.15;
    const startY = y + height * 0.5;

    // Trazo con varias curvas (evita línea totalmente recta)
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + width * 0.30, startY - height * 0.15, { steps: 8 });
    await this.page.mouse.move(startX + width * 0.55, startY + height * 0.10, { steps: 8 });
    await this.page.mouse.move(startX + width * 0.75, startY - height * 0.20, { steps: 8 });
    await this.page.mouse.up();

    // 🔎 Condición de éxito: el hidden debe tener algo
    const dataInput = this.page.locator('#input_3_18_data');
    await expect(dataInput).toHaveAttribute('value', /.+/, { timeout: 5000 });
    // Checkbox "I Agree"
    await this.page.getByLabel(/I Agree/i).check();
  }

  async submit() {
    const submitBtn = this.page.getByRole('button', { name: /submit|send|apply/i });
    if (await submitBtn.count()) {
      await submitBtn.click();
    } else {
      // Algunas plantillas usan input[type=submit]
      await this.page.locator('input[type="submit"]').first().click();
    }
    // await this.page.waitForTimeout(30000);
  }

  async expectConfirmation() {
    // Ajusta al texto de confirmación real si aparece; si no, al menos espera navigation/response 2xx
    const confirmation = this.page.locator('#gform_confirmation_message_3 h3');
    await expect(confirmation).toHaveText(
      /Thanks for contacting us! We will get in touch with you shortly\./i,
      { timeout: 30_000 }
    );
  }
}
