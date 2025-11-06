import { test, expect } from '@playwright/test';
import { TaskPage } from '../pages/TaskPage.js';
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

test('Edit inline Priority on row', async ({ page }) => {
  const taskPage = new TaskPage(page);
  await taskPage.open();
  await taskPage.expectTaskInList(updatedName);
  await taskPage.editPriorityInlineByTaskName(updatedName, 'Medium');
  await taskPage.expectPriorityInlineByTaskName(updatedName, 'Medium');
});

// test('Edit due date via calendar', async ({ page }) => {
//   const taskPage = new TaskPage(page);
//   await taskPage.open();
//   await taskPage.searchByName(updatedName);
//   await taskPage.pickDateFromCalendarByTaskName(updatedName, '2026-01-01');
// });

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

// test('Edit date to Overdue date', async ({ page }) => {
//   const taskPage = new TaskPage(page);
//   await taskPage.open();
//   await taskPage.searchByName(updatedName);
//   await taskPage.pickDateFromCalendarByTaskName(updatedName, '2025-02-01');
//   await taskPage.expectStatusByTaskName(updatedName, 'Overdue');
// });

test('Delete Task from actions menu', async ({ page }) => {
  const taskPage = new TaskPage(page);
  await taskPage.open();
  await taskPage.searchByName(updatedName);
  await taskPage.deleteTaskByName(updatedName);
  await taskPage.expectTaskNotInList(updatedName);
});

test('Tasks pagination', async ({ page }) => {
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

  await tasks.sortBy('name', 'asc');
  await tasks.expectSorted('name', 'asc');

  await tasks.sortBy('name', 'desc');
  await tasks.expectSorted('name', 'desc');

  await tasks.sortBy('due_at', 'asc');
  await tasks.expectSorted('due_at', 'asc');

  await tasks.sortBy('due_at', 'desc');
  await tasks.expectSorted('due_at', 'desc');

  await tasks.sortBy('priority', 'asc'); 
  await tasks.expectSorted('priority', 'asc');

  await tasks.sortBy('priority', 'desc'); 
  await tasks.expectSorted('priority', 'desc');
});