import { test, expect } from '@playwright/test';
import { TaskPage } from '../pages/TaskPage.js';
test.setTimeout(500_000);
import taskData from '../fixtures/task-data.json' assert { type: 'json' };

  const unique = Date.now().toString().slice(-6);
  const name = `QA Task ${unique}`;
  const updatedName = `${name} - Updated`;

test('Create Task', async ({ page }) => {
  const taskPage = new TaskPage(page);
  await taskPage.open();
  await taskPage.openCreateModal();
  await taskPage.fillCreateForm({
    name,
    ...taskData.create, 
  });
  await taskPage.submitCreate();

  await taskPage.expectTaskInList(name);
});

test('Search Bar', async({page}) => {
  const taskPage = new TaskPage(page);
  await taskPage.open();
  await taskPage.expectTaskInList(name);
});

test('Edit Task', async ({ page }) => {
  const taskPage = new TaskPage(page);
  await taskPage.open();

  await taskPage.searchByName(name);
  await taskPage.openRowByName(name);
  await taskPage.waitForEditModal();

  await taskPage.fillEditForm({
    name: updatedName,
    ...taskData.edit, 
  });

  await taskPage.submitEdit();
  await taskPage.expectTaskInList(updatedName);
  await taskPage.openRowByName(updatedName);
  await taskPage.waitForEditModal();
  await taskPage.verifyTaskFields(updatedName);
});

test('Click Related Object', async ({ page }) => {
  const taskPage = new TaskPage(page);
  await taskPage.open();
  await taskPage.searchByName(updatedName);
  await taskPage.clickRelatedObjectByTaskName(updatedName);
  await expect(page.locator('h1')).toContainText(taskData.edit.relatedQuery);
});

test('Edit inline Priority', async ({ page }) => {
  const taskPage = new TaskPage(page);
  await taskPage.open();
  await taskPage.expectTaskInList(updatedName);
  await taskPage.editPriorityInlineByTaskName(updatedName, 'Medium');
  await taskPage.expectPriorityInlineByTaskName(updatedName, 'Medium');
});

test('Edit inline due date', async ({ page }) => {
  const taskPage = new TaskPage(page);
  await taskPage.open();
  await taskPage.searchByName(updatedName);
  await taskPage.pickDateFromCalendarByTaskName(updatedName, '2026-01-01');
});

test('Mark Task as Completed', async ({ page }) => {
  const taskPage = new TaskPage(page);
  await taskPage.open();
  await taskPage.searchByName(updatedName);
  await taskPage.clickInlineActionByTaskName(updatedName, 'Mark Complete');
  await taskPage.searchByName(updatedName);
  await taskPage.expectStatusByTaskName(updatedName, 'Completed');
});

test('Reopen Task', async ({ page }) => {
  const taskPage = new TaskPage(page);
  await taskPage.open();
  await taskPage.searchByName(updatedName);
  await taskPage.clickInlineActionByTaskName(updatedName, 'Reopen');
  await taskPage.searchByName(updatedName);
  await taskPage.expectStatusByTaskName(updatedName, 'Open');
});

test('Change date to Overdue date', async ({ page }) => {
  const taskPage = new TaskPage(page);
  await taskPage.open();
  await taskPage.searchByName(updatedName);
  await taskPage.pickDateFromCalendarByTaskName(updatedName, '2025-02-01');
  await taskPage.expectStatusByTaskName(updatedName, 'Overdue');
});

test('Delete Task', async ({ page }) => {
  const taskPage = new TaskPage(page);
  await taskPage.open();
  await taskPage.searchByName(updatedName);
  await taskPage.deleteTaskByName(updatedName);
  await taskPage.expectTaskNotInList(updatedName);
});

test('Validate Tasks Pagination', async ({ page }) => {
  const tasks = new TaskPage(page);
  await tasks.open();
  await tasks.expectPreviousDisabledOnFirstPage();
  await tasks.gotoPage(2);
  await tasks.nextPage();
  await tasks.prevPage();
  await tasks.gotoPage(1);
});

test('Tasks Sort', async ({ page }) => {
  const tasks = new TaskPage(page);
  await tasks.open();

  const sortableColumns = [
    { key: 'name', label: 'Name' },
    { key: 'asset', label: 'Related Object' },
    { key: 'due_at', label: 'Due Date' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' }
  ];

  for (const column of sortableColumns) {
    await test.step(`Sort by ${column.label}`, async () => {
      const firstRowBefore = tasks.rowsTable.first();
      await expect(firstRowBefore).toBeVisible({ timeout: 20000 });

      const cellBefore = firstRowBefore.locator(`td[data-column="${column.key}"]`);
      const valueBefore = (await cellBefore.innerText()).trim();

      await tasks.sortBy(column.key);

      await expect(tasks.rowsTable.first()).toBeVisible({ timeout: 20000 });

      const firstRowAfter = tasks.rowsTable.first();
      const cellAfter = firstRowAfter.locator(`td[data-column="${column.key}"]`);
      const valueAfter = (await cellAfter.innerText()).trim();

      expect(valueAfter).toBeTruthy();

      console.log(
        `[TASK SORT ${column.key}] before="${valueBefore}" after="${valueAfter}"`
      );
    });
  }
});

// test('Validate Tasks Filter', async ({ page }) => {
//   const tasks = new TaskPage(page);
//   await tasks.open();

//  // RELATED OBJECT: 
//   await tasks.applyFilter('related_object', ['Lead', 'Account']);
//   await tasks.expectFilteredByRelatedObject(['Lead', 'Account']);
//   await tasks.unapplyFilter('related_object', ['Lead', 'Account']);
  
//   await tasks.applyFilter('related_object', ['Contact', 'Opportunity']);
//   await tasks.expectFilteredByRelatedObject(['Contact', 'Opportunity']);
//   await tasks.unapplyFilter('related_object', ['Contact', 'Opportunity']);
//   //add funded deal in the future
  
//   // PRIORITY: 
//   await tasks.applyFilter('priority', ['high']); 
//   await tasks.expectFilteredByPriority(['High']); 
//   await tasks.unapplyFilter('priority', ['high']); 

//   await tasks.applyFilter('priority', ['medium']); 
//   await tasks.expectFilteredByPriority(['Medium']); 
//   await tasks.unapplyFilter('priority', ['medium']); 

//   await tasks.applyFilter('priority', ['low']); 
//   await tasks.expectFilteredByPriority(['Low']); 
//   await tasks.unapplyFilter('priority', ['low']); 
  
//   // STATUS:
//   await tasks.applyFilter('status', ['open']);
//   await tasks.expectFilteredByStatus(['Open']);
//   await tasks.unapplyFilter('status', ['open']); 

//   await tasks.applyFilter('status', ['in_progress']);
//   await tasks.expectFilteredByStatus(['In Progress']);
//   await tasks.unapplyFilter('status', ['in_progress']); 

//   await tasks.applyFilter('status', ['due_today']);
//   await tasks.expectFilteredByStatus(['Due Today']);
//   await tasks.unapplyFilter('status', ['due_today']); 

//   await tasks.applyFilter('status', ['completed']);
//   await tasks.expectFilteredByStatus(['Completed']);
//   await tasks.unapplyFilter('status', ['completed']); 

//   await tasks.applyFilter('status', ['overdue']);
//   await tasks.expectFilteredByStatus(['Overdue']);
//   await tasks.unapplyFilter('status', ['overdue']); 


  
//   // DUE DATE
//   await tasks.applyFilter('due_date', ['today']);
//   await tasks.expectFilteredByDueDate('today');
//   await tasks.unapplyFilter('due_date', ['today']);

//   await tasks.applyFilter('due_date', ['upcoming']);
//   await tasks.expectFilteredByDueDate('upcoming');
//   await tasks.unapplyFilter('due_date', ['upcoming']);

//   await tasks.applyFilter('due_date', ['overdue']);
//   await tasks.expectFilteredByDueDate('overdue');
//   await tasks.unapplyFilter('due_date', ['overdue']);

//   await tasks.applyFilter('due_date', ['none']);
//   await tasks.expectFilteredByDueDate('none');
//   await tasks.unapplyFilter('due_date', ['none']);
  
//   // Limpiar todo
//   // await tasks.clearAllFilters();
// });

// test('Clear All Filters', async ({ page }) => {
//   const tasks = new TaskPage(page);
//   await tasks.open();

//   await tasks.applyMultipleFilters({
//     related_object: ['Lead'],
//     due_date: ['today'],
//     priority: ['high'],
//     status: ['open']
//   });

//   await tasks.clearAllFiltersAndVerify({ expectTableChange: false });

//   await tasks.expectNoFiltersActive();
// });
