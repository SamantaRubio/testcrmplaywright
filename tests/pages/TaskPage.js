import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class TaskPage extends BasePage {
  constructor(page) {
    super(page);
    this.createTaskButton = this.getByTestId('create-task-button');
    this.taskTable = this.getByTestId('tasks-table');
    this.searchInput = this.getByTestId('search-tasks');
    this.filterButton = this.getByTestId('filter-tasks-button');
    this.actionsButton = this.getByTestId('tasks-table').locator('tbody [data-controller="task-actions"] [data-task-actions-target="button"]');
    this.taskContainer = this.page.locator('.tasks-container');
    this.rowsTable = this.getByTestId('tasks-table').locator('tbody tr[id^="task-row-"]');
    this.pagination = this.getByTestId('tasks-pagination');
    this.paginationRoot = this.page.locator('[data-tasks-pagination-target="pagination"], #tasks-pagination');
    this.paginationContainer = this.paginationRoot;
    this.previousBtn = this.paginationRoot.locator(':is(a,button):has-text("Previous")');
    this.nextBtn = this.paginationRoot.locator(':is(a,button):has-text("Next")'); 
    this.pageNumber = (n) => this.paginationRoot.locator(`:is(a,button):has-text("${n}")`);

    this.sortHeader = (column) =>
    this.taskTable.locator(`thead th[data-table-sort-target="header"][data-column="${column}"]`);

    this.clearAllBtn = this.page.getByText('Clear All Filters', { exact: true });

  }

  async open() {
    await this.goto('/tasks');
    await expect(this.page.getByRole('heading', { level: 1 })).toHaveText(/Tasks/i);
  }

  get createModal() {
    const title = this.page.locator('#create-task-modal-title');
    const content = title.locator('xpath=ancestor::*[@data-modal-target="content"]');
    return content.first();
  }

  get editModal() {
    const title = this.page.locator('#task-details-modal-title');
    const content = title.locator('xpath=ancestor::*[@data-modal-target="content"]');
    return content.first();
  }

  modalField(modal, testId) {
    return modal.getByTestId(testId);
  }

  async openCreateModal() {
    await expect(this.createTaskButton).toBeVisible();
    await this.createTaskButton.click();
    await expect(this.createModal).toBeVisible();
    await expect(this.modalField(this.createModal, 'task_name')).toBeVisible();
  }

  async fillCreateForm({ name, relatedQuery, assignedToLabel, dueDate, priorityLabel, bucketLabel, description }) {
    const m = this.createModal;
    if (name) await this.modalField(m, 'task_name').fill(name);

    if (relatedQuery) await this.#typeAndPickAutocomplete(
      m.getByTestId('task-related-object-input'),
      relatedQuery
    );

    if (assignedToLabel) await this.#selectLike(this.modalField(m, 'task_assigned_to'), assignedToLabel);
    if (priorityLabel) await this.#selectLike(this.modalField(m, 'task_priority'), priorityLabel);
    if (bucketLabel) await this.#selectLike(this.modalField(m, 'task_bucket'), bucketLabel);

    if (dueDate) {
      const due = this.modalField(m, 'task_due_at');
      await due.fill('');               
      await due.type(dueDate);        
    }

    if (description) await this.modalField(m, 'task_background_info').fill(description);
  }

  async submitCreate() {
    const m = this.createModal;
    const submit = this.modalField(m, 'task-form-submit-button');
    await expect(submit).toBeEnabled();
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      submit.click(),
    ]);
    await expect(this.taskTable).toBeVisible();
  }

  // ---------- Editar ----------
  async openRowByName(name) {
    const pattern = new RegExp(esc(name), 'i');
    const nameButton = this.taskTable
      .locator('tbody td[data-column="name"] >> button')
      .filter({ hasText: pattern })
      .first();

    await expect(nameButton).toBeVisible();
    await nameButton.scrollIntoViewIfNeeded();
    await nameButton.click();
  }

  async waitForEditModal() {
    await expect(this.editModal).toBeVisible();
    await expect(this.modalField(this.editModal, 'task_name')).toBeVisible();
  }

  #parseToIso(dmy) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(dmy));
    return m ? `${m[3]}-${m[2]}-${m[1]}` : String(dmy);
  }
  
  async #setDateIn(modal, testId, dmyOrIso) {
    const iso = this.#parseToIso(dmyOrIso);
    const dateInput = modal.getByTestId(testId);
    // Asignar de forma robusta para <input type="date">
    await dateInput.evaluate((el, v) => {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, iso);
  }

  async fillEditForm(payload) {
    const m = this.editModal;
  
    if (payload.name) await m.getByTestId('task_name').fill(payload.name);
  
    if (payload.relatedQuery) {
      await this.#typeAndPickAutocomplete(m.getByTestId('task-related-object-input'), payload.relatedQuery);
    }
  
    if (payload.assignedToLabel) {
      await this.#selectLike(m.getByTestId('task_assigned_to'), payload.assignedToLabel);
    }
  
    // --- ORDEN CLAVE ENTRE BUCKET Y FECHA ---
    // Si hay dueDate => usar bucket 'On Specific Date...' ANTES de setear la fecha.
    if (payload.dueDate) {
      await this.#selectLike(m.getByTestId('task_bucket'), 'On Specific Date...');
      await this.#setDateIn(m, 'task_due_at', payload.dueDate); // convierte a ISO y dispara eventos
    } else if (payload.bucketLabel) {
      // Si no hay fecha específica, puedes establecer el bucket relativo
      await this.#selectLike(m.getByTestId('task_bucket'), payload.bucketLabel);
    }
  
    if (payload.priorityLabel) {
      await this.#selectLike(m.getByTestId('task_priority'), payload.priorityLabel);
    }
  
    if (payload.description) {
      await m.getByTestId('task_background_info').fill(payload.description);
    }
  }

  async submitEdit() {
    const m = this.editModal;
    const submit = this.modalField(m, 'task-form-submit-button'); 
    await expect(submit).toBeEnabled();
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      submit.click(),
    ]);
    await expect(this.taskTable).toBeVisible();
  }

  async searchByName(name) {
    await this.searchInput.fill('');
    await this.searchInput.type(name, { delay: 120 });
    await this.page.waitForTimeout(600);
    await this.page.waitForLoadState('networkidle');
  }

  async expectTaskInList(name) {
    await this.searchByName(name);
    const pattern = new RegExp(esc(name), 'i');
    const btn = this.taskTable
      .locator('tbody td[data-column="name"] >> button')
      .filter({ hasText: pattern })
      .first();
    await expect(btn).toBeVisible();
  }

  async #selectLike(selectOrTrigger, labelText) {
    const el = selectOrTrigger;
    const tag = await el.evaluate(n => n.tagName?.toLowerCase());
    const exact = new RegExp(`^${esc(labelText)}$`, 'i');
    if (tag === 'select') {
      await el.selectOption({ label: labelText });
      return;
    }
    await el.click();
    const option = this.page.getByRole('option', { name: exact }).first()
      .or(this.page.getByRole('menuitem', { name: exact }).first())
      .or(this.page.getByText(exact).first());
    await option.click();
  }

  async #typeAndPickAutocomplete(input, query) {
    await input.fill('');
    await input.type(query, { delay: 30 });
  
    // Scope al widget correcto (el ancestro del input)
    const root = input.locator('xpath=ancestor::*[@data-controller="related-object-search"]').first();
  
    // Contenedor de resultados SOLO dentro de ese widget
    const results = root.locator('[data-related-object-search-target="results"]');
  
    // Un ítem válido (los divs con data-*-id-param)
    const firstItem = results.locator('[data-related-object-search-id-param]').first();
  
    await expect(results).toBeVisible();   
    await expect(firstItem).toBeVisible();    
  
    await firstItem.click({ trial: true }).catch(() => {});
    await firstItem.click();
  
    await expect(results).toBeHidden();
  }

  async verifyTaskFields(expected) {
    const m = this.editModal;
    await expect(m).toBeVisible();
  
    if (expected.name)
      await expect(m.getByTestId('task_name')).toHaveValue(expected.name);
  
    if (expected.relatedQuery) {
      const root = m.locator('[data-controller="related-object-search"]').first();
      const selected = root.locator('[data-related-object-search-target="selected"]');
      await expect(selected).toBeVisible();
      await expect(selected).toContainText(new RegExp(expected.relatedQuery, 'i'));
    }
  
    if (expected.assignedToLabel) {
      await expect(m.getByTestId('task_assigned_to').locator('option:checked'))
        .toHaveText(new RegExp(`^${expected.assignedToLabel}$`, 'i'));
    }
  
    if (expected.priorityLabel) {
      await expect(m.getByTestId('task_priority').locator('option:checked'))
        .toHaveText(new RegExp(`^${expected.priorityLabel}$`, 'i'));
    }
  
    if (expected.bucketLabel) {
      await expect(m.getByTestId('task_bucket').locator('option:checked'))
        .toHaveText(new RegExp(`^${expected.bucketLabel}$`, 'i'));
    }
  
    if (expected.dueDate) {
      await expect(m.getByTestId('task_due_at'))
        .toHaveValue(this.#parseToIso(expected.dueDate));
    } else if (expected.bucketLabel && !/On Specific Date/i.test(expected.bucketLabel)) {
      await expect(m.getByTestId('task_due_at')).toHaveValue('');
    }
  
    if (expected.description) {
      await expect(m.getByTestId('task_background_info')).toHaveValue(expected.description);
    }
  }

  async clickRelatedObjectByTaskName(name, { timeout = 10_000 } = {}) {
    const table = this.getByTestId('tasks-table');
    const nameBtn = table.locator('tbody td[data-column="name"] >> button')
      .filter({ hasText: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .first();
  
    await expect(nameBtn).toBeVisible({ timeout });
  
    const row = nameBtn.locator('xpath=ancestor::tr').first();
    const cell = row.locator('td[data-column="asset"]');
    const target = cell.getByRole('link').first().or(cell.getByRole('button').first());
  
    await expect(target).toBeVisible();
    await target.click();
  }

  async pickDateFromCalendarByTaskName(name, targetDate) {
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(esc(name), 'i');

    const table = this.getByTestId('tasks-table');
    const nameBtn = table.locator('tbody td[data-column="name"] >> button')
      .filter({ hasText: pattern }).first();

    await expect(nameBtn).toBeVisible();
    const row = nameBtn.locator('xpath=ancestor::tr').first();
    const dueCell = row.locator('td[data-column="due_at"]');
    const display = dueCell.locator('[data-inline-edit-field-name-value="due_at"]');

    // Abre el datepicker
    await display.click();

    const input = dueCell.locator('input[type="date"]').first();
    await input.waitFor({ state: 'visible' });

    // Abre el calendario (browser built-in o custom)
    await input.click({ force: true });
    await this.page.waitForTimeout(500); // deja que se muestre el calendario

    // Si tu app usa un calendario custom (por ejemplo divs con días)
    const parts = targetDate.split('-'); // [YYYY, MM, DD]
    const year = parts[0], month = +parts[1], day = +parts[2];

    const calendar = this.page.locator('.flatpickr-calendar, .datepicker, [role="dialog"]');
    if (await calendar.isVisible().catch(() => false)) {
      // Caso: Flatpickr o similar
      const dayBtn = calendar.locator(`.flatpickr-day[aria-label*="${day}"]`).first()
        .or(calendar.getByRole('button', { name: new RegExp(`\\b${day}\\b`) }));
      await expect(dayBtn).toBeVisible();
      await dayBtn.click();
    } else {
      // Fallback: campo nativo <input type="date">
      await input.evaluate((el, v) => {
        el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, targetDate);
    }

    // Espera a que se cierre el editor y actualice
    await input.waitFor({ state: 'detached' });
    await this.page.waitForLoadState('networkidle');

    // Valida el texto formateado
    const [y, m, d] = targetDate.split('-');
    const shortMonth = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m - 1];
    await expect(dueCell).toContainText(new RegExp(`${+d}\\s+${shortMonth},\\s+${y}`, 'i'));
  }

  #priorityLabelToValue(label) {
    const m = String(label).trim().toLowerCase();
    if (m === 'low') return 'low';
    if (m === 'medium') return 'medium';
    if (m === 'high') return 'high';
    // fallback por si tus labels cambian (p.ej. "Normal Priority")
    return m;
  }

  async editPriorityInlineByTaskName(name, newPriorityLabel) {
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(esc(name), 'i');

    const table = this.getByTestId('tasks-table');
    const rowBtn = table.locator('tbody td[data-column="name"] >> button')
      .filter({ hasText: pattern }).first();
    await rowBtn.scrollIntoViewIfNeeded();
    await rowBtn.waitFor({ state: 'visible' });

    const row = rowBtn.locator('xpath=ancestor::tr').first();

    // 1) Abre el inline editor del campo Priority
    const priSpan = row.locator(
      'td[data-column="priority"] [data-controller="inline-edit"]' +
      '[data-inline-edit-field-name-value="priority"][data-inline-edit-target="field"]'
    );
    await priSpan.click();

    // 2) Aparece un <select>. Selecciona por label (case-insensitive)
    const select = row.locator('td[data-column="priority"] select').first();
    await select.waitFor({ state: 'visible' });

    const label = String(newPriorityLabel).trim();
    // Intento directo por label exacto
    try {
      await select.selectOption({ label });
    } catch {
      // Fallback: buscar opción por texto case-insensitive y setear manual
      await select.evaluate((el, wanted) => {
        const opts = Array.from(el.options);
        const found = opts.find(o => o.text.trim().toLowerCase() === wanted.toLowerCase());
        if (found) el.value = found.value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, label);
    }

    // 3) Confirma (Enter) y espera cierre del editor
    await select.press('Enter');
    await expect(select).toBeHidden({ timeout: 5000 });

    // (Opcional) espera a que el span vuelva visible
    await expect(priSpan).toBeVisible();
  }

  async expectPriorityInlineByTaskName(name, expectedLabel) {
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(esc(name), 'i');
    const expectedValue = this.#priorityLabelToValue(expectedLabel);

    const table = this.getByTestId('tasks-table');
    const rowBtn = table.locator('tbody td[data-column="name"] >> button')
      .filter({ hasText: pattern }).first();
    const row = rowBtn.locator('xpath=ancestor::tr').first();

    const span = row.locator(
      'td[data-column="priority"] [data-controller="inline-edit"]' +
      '[data-inline-edit-field-name-value="priority"]'
    );

    // Verifica el valor "canónico" (atributo) y el texto mostrado al usuario
    await expect(span).toHaveAttribute('data-inline-edit-current-value-value', expectedValue);
    await expect(span).toHaveText(new RegExp(`^${expectedLabel}\\s*$`, 'i'));
  }

  async markCompleteInlineByTaskName(name) {
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(esc(name), 'i');

    const table = this.getByTestId('tasks-table');
    const rowBtn = table.locator('tbody td[data-column="name"] >> button')
      .filter({ hasText: pattern }).first();
    await rowBtn.scrollIntoViewIfNeeded();
    await rowBtn.waitFor({ state: 'visible' });

    const row = rowBtn.locator('xpath=ancestor::tr').first();

    // Localiza el botón "Mark Complete" dentro del row
    const completeBtn = row.getByRole('button', { name: /mark complete/i }).first();

    // Dispara la acción y espera el update (Turbo/XHR)
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      completeBtn.click(),
    ]);
  }

  async clickInlineActionByTaskName(name, action) {
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(esc(name), 'i');

    const table = this.getByTestId('tasks-table');
    const rowBtn = table.locator('tbody td[data-column="name"] >> button')
      .filter({ hasText: pattern })
      .first();

    await rowBtn.scrollIntoViewIfNeeded();
    await rowBtn.waitFor({ state: 'visible' });

    const row = rowBtn.locator('xpath=ancestor::tr').first();

    // Busca el botón por el texto que se pase en `action` (case-insensitive)
    const button = row.getByRole('button', { name: new RegExp(action, 'i') }).first();

    // Verifica que exista y sea visible
    await expect(button).toBeVisible();

    // Dispara la acción y espera el update (Turbo/XHR)
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      button.click(),
    ]);

    // Espera a que la celda cambie de estado (por ejemplo, el texto del botón cambie)
    await this.page.waitForTimeout(500); // pequeño delay opcional
  }

  async expectStatusByTaskName(name, expected) {
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(esc(name), 'i');

    const table = this.getByTestId('tasks-table');
    const rowBtn = table.locator('tbody td[data-column="name"] >> button')
      .filter({ hasText: pattern }).first();
    const row = rowBtn.locator('xpath=ancestor::tr').first();

    const statusCell = row.locator('td[data-column="status"]');
    // Espera a que el texto visible cambie a "Completed"
    await expect(statusCell).toContainText(new RegExp(`^\\s*${expected}\\s*$`, 'i'));
  }

  async deleteTaskByName(name) {
    await this.actionsButton.click();
    // preparar confirm() ANTES del click
    this.page.once('dialog', d => d.accept());
  
    const row = this.actionsButton.locator('xpath=ancestor::tr').first();
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      row.getByRole('button', { name: /delete task/i }).click(),
    ]);
  
    await expect(row).toBeHidden();
  }

  async expectTaskNotInList(name) {
    await this.searchByName(name);
    const pattern = new RegExp(esc(name), 'i');
    const match = this.taskTable
      .locator('tbody td[data-column="name"] >> button')
      .filter({ hasText: pattern });
    await expect(match).toHaveCount(0);
  }

  // PAGINATION

  async getFirstRowId() {
    const first = this.rowsTable.first();
    await expect(first).toBeVisible();
    return (await first.getAttribute('id')) ?? '';
  }

  async getTableFingerprint() {
    const count = await this.rowsTable.count();
    const take = Math.min(count, 3);
    const ids = [];
    for (let i = 0; i < take; i++) {
      ids.push((await this.rowsTable.nth(i).getAttribute('id')) ?? `row-${i}`);
    }
    return `${ids.join('|')}#${count}`;
  }

  async waitForTableSwap(prevFingerprint, { timeout = 10_000 } = {}) {
    await expect
      .poll(async () => this.getTableFingerprint(), { timeout })
      .not.toBe(prevFingerprint);
  }

  async expectPreviousDisabledOnFirstPage() {
    // Si en la página 1 el markup usa <button disabled>, primero intenta ese caso:
    const disabledBtn = this.paginationRoot.locator('button:has-text("Previous")');
    if (await disabledBtn.count()) {
      await expect(disabledBtn).toBeVisible();
      await expect(disabledBtn).toBeDisabled();
      return;
    }
  
    // Si aparece como <a>, no estás en la primera página
    const linkPrev = this.paginationRoot.locator('a:has-text("Previous")');
    if (await linkPrev.count()) {
      throw new Error('Se encontró <a> "Previous": probablemente no estás en la página 1. Navega a la 1 antes de validar.');
    }
  
    // Nada encontrado
    throw new Error('No se encontró ningún elemento "Previous" dentro del contenedor de paginación.');
  }

  async expectActivePage(n) {
    // En tu UI la activa suele ser <button> (clases naranjas). Validamos botón visible con el número.
    const active = this.paginationRoot.locator('button', { hasText: String(n) });
    await expect(active).toBeVisible();
  }

  async gotoPage(n) {
    const prevFp = await this.getTableFingerprint();
    const target = this.pageNumber(n).first();
    await expect(target).toBeVisible();
    await target.click();
    await this.waitForTableSwap(prevFp);
    await this.expectActivePage(n);
  }

  async nextPage() {
    // Puede no existir si es última página
    if (!(await this.nextBtn.isVisible())) {
      throw new Error('Next no está disponible (posible última página).');
    }
    const prevFp = await this.getTableFingerprint();
    await this.nextBtn.click();
    await this.waitForTableSwap(prevFp);
  }

  async prevPage() {
    // "Previous" puede ser <a> (habilitado) o <button disabled> en la 1
    const prev = this.previousBtn.first();
    if (!(await prev.isVisible())) {
      throw new Error('Previous no está visible.');
    }
    // Sólo aplica si es <button>; en <a> no existe isDisabled
    if (typeof prev.isDisabled === 'function' && (await prev.isDisabled())) {
      throw new Error('Previous está deshabilitado (probablemente estás en la primera página).');
    }
    const prevFp = await this.getTableFingerprint();
    await prev.click();
    await this.waitForTableSwap(prevFp);
  }

  async expectTableContentChanged() {
    const prevFp = await this.getTableFingerprint();
    await this.page.waitForTimeout(50);
    await this.waitForTableSwap(prevFp);
  }


  // SORTING

  _normalizeText(s) {
    return (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  _parseDate(cellText) {
    const cleaned = cellText.replace(',', '').trim(); // "05 Sep 2025"
    const ts = Date.parse(cleaned);
    return Number.isNaN(ts) ? Number.POSITIVE_INFINITY : ts;
  }

  async getColumnValues(column) {
    const cells = this.rowsTable.locator(`td[data-column="${column}"]`);
    const n = await cells.count();
    const values = [];
    for (let i = 0; i < n; i++) values.push((await cells.nth(i).innerText()).trim());
    return values;
  }

  _transformForSort(values, column) {
    switch (column) {
      case 'due_at':
        return values.map(v => this._parseDate(v));
      case 'priority':
        return values.map(v => this._normalizeText(v));
      default:
        return values.map(v => this._normalizeText(v));
    }
  }

  _isSortedAsc(arr) {
    for (let i = 1; i < arr.length; i++) if (arr[i - 1] > arr[i]) return false;
    return true;
  }

  _isSortedDesc(arr) {
    for (let i = 1; i < arr.length; i++) if (arr[i - 1] < arr[i]) return false;
    return true;
  }

  async sortBy(column, direction) {
    const header = this.sortHeader(column);
    await expect(header, `No existe header sortable para '${column}'`).toBeVisible();
  
    // 0) If it is already in the desired order, return
    const baseValues = await this.getColumnValues(column);
    const baseTrans = this._transformForSort(baseValues, column);
    const alreadyOk = direction === 'asc'
      ? this._isSortedAsc(baseTrans)
      : this._isSortedDesc(baseTrans);
    if (alreadyOk) return;
  
    // 1) 1rst Attempt
    await header.click();
    const ok1 = await this._waitUntilSorted(column, direction);
    if (ok1) return;
  
    // 2) 2nd Attempt
    await header.click();
    const ok2 = await this._waitUntilSorted(column, direction);
    if (ok2) return;
  
    throw new Error(`No se logró ordenar '${column}' en '${direction}' tras 2 clics`);
  }

  async _waitUntilSorted(column, direction, { timeout = 10_000, interval = 150 } = {}) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const vals = await this.getColumnValues(column);
      const trans = this._transformForSort(vals, column);
  
      const ok = direction === 'asc'
        ? this._isSortedAsc(trans)
        : this._isSortedDesc(trans);
  
      if (ok) return true;
      await this.page.waitForTimeout(interval);
    }
    return false;
  }

  async expectSorted(column, direction) {
    const values = await this.getColumnValues(column);
    const transformed = this._transformForSort(values, column);
    const isOk = direction === 'asc'
      ? this._isSortedAsc(transformed)
      : this._isSortedDesc(transformed);
  
    if (!isOk) {
      throw new Error(`[${column}] esperado ${direction} pero se obtuvo: ${values.join(' | ')}`);
    }
  }

    // FILTERING

  isFiltersOpen = async () => {
    return await this.page.locator('button.filter-category[data-category="related_object"]').isVisible();
  };

  async openFilters() {
    if (!(await this.isFiltersOpen())) {
      await this.filterButton.click();
      await expect(this.page.locator('button.filter-category[data-category="related_object"]')).toBeVisible();
    }
  }

  async closeFilters() {
    if (await this.isFiltersOpen()) {
      await this.filterButton.click(); // solo cierra
      await expect(this.page.locator('button.filter-category[data-category="related_object"]')).not.toBeVisible();
    }
  }

  categoryBtn = (key) =>
    this.page.locator(`button.filter-category[data-category="${key}"]`);

  optionsBox = (key) =>
    this.page.locator(`.filter-options[data-category="${key}"]`);

  optionCheckbox = (key, value) =>
    this.optionsBox(key).locator(
      `input[type="checkbox"][data-filter-type="${key}"][data-filter-value="${value}"]`
    );


  
  async selectCategory(key) {
    // key: 'related_object' | 'due_date' | 'priority' | 'status'
    await this.categoryBtn(key).click();
    await expect(this.optionsBox(key)).toBeVisible();
  }
  
  async clearAllFilters() {
    await this.openFilters() 
    await this.clearAllBtn.click();
    await this.closeFilters() 
  }

  /**
 * Aplica un filtro marcando los valores indicados (y deja sin tocar el resto).
 * @param { 'related_object' | 'due_date' | 'priority' | 'status' } key
 * @param { string[] } values  // ej: ['Lead'] o ['high','low']
 */

  async applyFilter(key, values, { close = true } = {}) {
    await this.openFilters();
    await this.selectCategory(key);
  
    const prev = await this.getTableFingerprint();
  
    let changedSomething = false;
    for (const value of values) {
      const cb = this.optionCheckbox(key, value);
      await expect(cb, `No existe checkbox ${key}:${value}`).toBeVisible();
      if (!(await cb.isChecked())) {
        await cb.check();
        changedSomething = true;
      }
    }

    // Si marcaste algo, intenta detectar cambio; si no cambia la huella,
    // al menos espera al ciclo de red.
    if (changedSomething) {
      try {
        await this.waitForTableSwap(prev, { timeout: 10_000 });
      } catch {
        // puede que el set realmente no cambie la huella
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(300);
      }
    }
  
    if (close) await this.closeFilters();
  }
  
  async unapplyFilter(key, values, { close = true } = {}) {
    await this.openFilters();
    await this.selectCategory(key);
  
    const prev = await this.getTableFingerprint();
  
    let changedSomething = false;
    for (const value of values) {
      const cb = this.optionCheckbox(key, value);
      if (await cb.isChecked()) {
        await cb.uncheck();
        changedSomething = true;
      }
    }
   
    if (changedSomething) {
      try {
        await this.waitForTableSwap(prev, { timeout: 10_000 });
      } catch {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(300);
      }
    }
  
    if (close) await this.closeFilters();
  }

  async expectAllRowsInSet(column, allowedValues) {
    const values = await this.getColumnValues(column);
    const set = new Set(allowedValues.map(v => this._normalizeText(v)));
    const bad = values.filter(v => !set.has(this._normalizeText(v)));
    if (bad.length) {
      throw new Error(
        `Se encontraron valores fuera del filtro en columna "${column}": ${bad.join(' | ')}`
      );
    }
  }

  async expectFilteredByPriority(allowed) {
    // priority → columna 'priority'
    await this.expectAllRowsInSet('priority', allowed);
  }

  async expectFilteredByStatus(allowed) {
    // status → columna 'status'
    // Nota: tu celda trae un <span> con Overdue/… pero innerText ya lo captura
    await this.expectAllRowsInSet('status', allowed);
  }

  async expectDueDateChangedFrom(prevFingerprint) {
    await this.waitForTableSwap(prevFingerprint);
  }

  async waitForPossibleFilterEffect() {
    // Útil cuando no hay una señal clara de cambio; sólo sincroniza
    await this.page.waitForLoadState('networkidle');
  }

  _typeFromHref(href) {
    try {
      const a = document.createElement('a');
      a.href = href;
      const parts = a.pathname.split('/').filter(Boolean); // ['leads','123']
      const seg = (parts[0] || '').toLowerCase();
      switch (seg) {
        case 'leads':         return 'Lead';
        case 'contacts':      return 'Contact';
        case 'accounts':      return 'Account';
        case 'opportunities': return 'Opportunity';
        case 'funded_deals':
        case 'deals':
        case 'campaigns':     return 'Funded Deal'; // por si tu backend usa otro recurso
        default:              return 'Unknown';
      }
    } catch {
      return 'Unknown';
    }
  }

  _labelFromFilterValue(v) {
    const t = this._normalizeText(v);
    switch (t) {
      case 'lead':          return 'Lead';
      case 'contact':       return 'Contact';
      case 'account':       return 'Account';
      case 'opportunity':   return 'Opportunity';
      case 'campaign':      return 'Funded Deal'; // ¡clave!
      default:              return v;
    }
  }

  async getRelatedObjectTypesPerRow() {
    const cells = this.rowsTable.locator('td[data-column="asset"]');
    const n = await cells.count();
    const types = [];

    for (let i = 0; i < n; i++) {
      const cell = cells.nth(i);
      // ¿hay un link?
      const link = cell.locator('a[href]').first();
      if (await link.count()) {
        const href = await link.getAttribute('href');
        // Ejecuta en el browser para usar URL parsing sin importar base
        const type = await this.page.evaluate((h) => {
          const a = document.createElement('a');
          a.href = h;
          const seg = a.pathname.split('/').filter(Boolean)[0]?.toLowerCase() || '';
          switch (seg) {
            case 'leads':         return 'Lead';
            case 'contacts':      return 'Contact';
            case 'accounts':      return 'Account';
            case 'opportunities': return 'Opportunity';
            case 'funded_deals':
            case 'deals':
            case 'campaigns':     return 'Funded Deal';
            default:              return 'Unknown';
          }
        }, href);
        types.push(type);
        continue;
      }

      // Sin link: mira el texto
      const txt = (await cell.innerText()).trim();
      if (this._normalizeText(txt) === 'none') {
        types.push('None');
      } else {
        // Hay nombre/empresa pero sin tipo visible → lo marcamos como Unknown
        types.push('Unknown');
      }
    }

    return types;
  }

  async expectFilteredByRelatedObject(allowedFilterValues) {
    // Normaliza a labels visibles (maneja 'Campaign' → 'Funded Deal')
    const allowedLabels = allowedFilterValues.map(v => this._labelFromFilterValue(v));
    const set = new Set(allowedLabels.map(v => this._normalizeText(v)));

    const types = await this.getRelatedObjectTypesPerRow();
    const bad = types.filter(t => !set.has(this._normalizeText(t)));

    if (bad.length) {
      throw new Error(
        `Filtrado Related Object inválido. Permitidos: [${allowedLabels.join(', ')}]; ` +
        `encontrados fuera de set: ${bad.join(' | ')}`
      );
    }
  }


_dueCells() {
  // celdas visibles de la columna due_at
  return this.rowsTable.locator('td[data-column="due_at"]');
}

async _browserTodayISO() {
  // Fecha de HOY en el timezone del navegador (YYYY-MM-DD)
  return await this.page.evaluate(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
}

_parseDdMonYyyyToISO(txt) {
  // Fallback por si faltara el atributo y sólo tuviéramos "04 Sep, 2025"
  const m = /^\s*(\d{1,2})\s+([A-Za-z]{3})\,?\s+(\d{4})\s*$/.exec(String(txt));
  if (!m) return null;
  const [ , dStr, monStr, yStr ] = m;
  const map = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
  const mm = map[monStr.toLowerCase()];
  if (!mm) return null;
  const d = String(+dStr).padStart(2, '0');
  const m2 = String(mm).padStart(2, '0');
  return `${yStr}-${m2}-${d}`;
}

async _getDueValues() {
  // Devuelve { iso: 'YYYY-MM-DD' | null, text: '...' } por cada fila visible
  const cells = this._dueCells();
  const n = await cells.count();
  const out = [];
  for (let i = 0; i < n; i++) {
    const cell = cells.nth(i);
    const span = cell.locator('[data-inline-edit-field-name-value="due_at"]').first();
    const text = (await span.innerText()).trim();
    const attr = await span.getAttribute('data-inline-edit-current-value-value');
    let iso = (attr && attr.trim()) ? attr.trim() : null;

    // Fallback si no hay atributo
    if (!iso) {
      if (/no due date/i.test(text)) {
        iso = null;
      } else {
        iso = this._parseDdMonYyyyToISO(text);
      }
    }
    out.push({ iso: iso || null, text });
  }
  return out;
}

async expectFilteredByDueDate(selection) {
  const sel = String(selection).trim().toLowerCase();
  const todayISO = await this._browserTodayISO();
  const values = await this._getDueValues();

  if (values.length === 0) {
    console.warn(`[DueDate] El filtro "${selection}" devolvió 0 filas visibles. `);
    return;
  }

  const bad = []; // recolecta textos que no cumplen
  for (const v of values) {
    const iso = v.iso; // null o 'YYYY-MM-DD'
    switch (sel) {
      case 'today': {
        // Debe existir fecha y ser exactamente hoy
        if (!iso || iso !== todayISO) bad.push(v.text || '—');
        break;
      }
      case 'upcoming': {
        // Debe existir fecha y ser > hoy
        if (!iso || iso <= todayISO) bad.push(v.text || '—');
        break;
      }
      case 'overdue': {
        // Debe existir fecha y ser < hoy
        if (!iso || iso >= todayISO) bad.push(v.text || '—');
        break;
      }
      case 'none':
      case 'no due date': {
        // Debe NO tener fecha (iso == null) o texto "No Due Date"
        if (iso !== null && !/no due date/i.test(v.text)) bad.push(v.text || '—');
        break;
      }
      default:
        throw new Error(`Valor de filtro Due Date no soportado: "${selection}"`);
    }
  }

  if (bad.length) {
    throw new Error(
      `Filtrado de Due Date inválido para "${selection}". ` +
      `Los siguientes valores NO cumplen: ${bad.join(' | ')}`
    );
  }
}

// --- Helpers de checkboxes ---
_allFilterCheckboxes() {
  return this.page.locator('input[type="checkbox"][data-tasks-filter-target="checkbox"]');
}

_checkedFilterCheckboxes() {
  return this.page.locator(
    'input[type="checkbox"][data-tasks-filter-target="checkbox"]:checked'
  );
}

/**
 * Marca múltiples filtros por categoría.
 * Ejemplo de `selections`:
 *  { related_object: ['Lead','Account'], due_date:['today'], priority:['high'], status:['open'] }
 */
async applyMultipleFilters(selections, { close = false, settleMs = 400 } = {}) {
  await this.openFilters();

  for (const [key, values] of Object.entries(selections)) {
    await this.selectCategory(key);
    for (const value of values) {
      const cb = this.optionCheckbox(key, value);
      await expect(cb, `No existe checkbox ${key}:${value}`).toBeVisible();
      if (!(await cb.isChecked())) {
        await cb.check();
      }
    }
  }

  // Pequeña sincronización de red/DOM
  await this.page.waitForLoadState('networkidle');
  await this.page.waitForTimeout(settleMs);

  if (close) await this.closeFilters();
}

/**
 * Click en "Clear All Filters" y verificación de que no quede NINGÚN checkbox activo.
 * Si `expectTableChange` es true, intenta además verificar cambio de contenido en la tabla.
 */
async clearAllFiltersAndVerify(
  { expectTableChange = false, settleMs = 500 } = {}
) {
  await this.openFilters();

  // (Opcional) fingerprint antes de limpiar
  let prevFp = null;
  if (expectTableChange) {
    try { prevFp = await this.getTableFingerprint(); } catch {}
  }

  // Click en el botón del footer
  await expect(this.clearAllBtn).toBeVisible();
  await this.clearAllBtn.click();

  // Espera de red y pequeño settle
  await this.page.waitForLoadState('networkidle');
  await this.page.waitForTimeout(settleMs);

  // Asegura que no haya NINGÚN checkbox seleccionado
  await expect(this._checkedFilterCheckboxes()).toHaveCount(0);

  // (Opcional) intenta validar cambio de tabla si se pidió
  if (expectTableChange && prevFp) {
    try {
      await this.waitForTableSwap(prevFp, { timeout: 5_000 });
    } catch {
      // Si no cambió la huella, no lo tratamos como error; algunas combinaciones
      // pueden producir el mismo set de resultados. Sólo dejamos un log.
      console.warn('[ClearAll] La huella de tabla no cambió tras limpiar filtros (puede ser normal).');
    }
  }

  // (Opcional) deja el dropdown abierto para inspección o ciérralo:
  // await this.closeFilters();
}

/**
 * Útil si quieres re-comprobar en otro momento que verdaderamente no haya filtros activos
 */
async expectNoFiltersActive() {
  await this.openFilters();
  await expect(this._checkedFilterCheckboxes()).toHaveCount(0);
}


}