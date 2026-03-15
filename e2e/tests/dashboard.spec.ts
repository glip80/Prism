import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
  });

  test('user can create a new dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    
    await dashboard.createNewDashboard('Sales Q1 2024');
    
    await expect(page.getByText('Sales Q1 2024')).toBeVisible();
    await expect(page.getByText('Dashboard created successfully')).toBeVisible();
  });

  test('user can add widgets dynamically', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.openDashboard('Test Dashboard');

    // Add chart widget
    await dashboard.addWidget('chart', {
      title: 'Revenue Trend',
      dataSource: {
        connector: 'PostgreSQL Production',
        query: 'SELECT date, revenue FROM sales',
      },
    });

    await expect(page.getByText('Revenue Trend')).toBeVisible();
    await expect(page.locator('[data-testid="chart-widget"]')).toBeVisible();
  });

  test('widgets auto-refresh data', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.openDashboard('Real-time Dashboard');

    // Set refresh interval to 5 seconds for testing
    await dashboard.configureWidgetRefresh('widget-1', 5000);

    const initialData = await dashboard.getWidgetData('widget-1');
    
    // Wait for refresh
    await page.waitForTimeout(5500);
    
    const updatedData = await dashboard.getWidgetData('widget-1');
    expect(updatedData).not.toEqual(initialData);
  });

  test('theme switching works across session', async ({ page, context }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.openDashboard('Test Dashboard');

    // Switch to dark theme
    await dashboard.switchTheme('dark');
    
    const bgColor = await page.evaluate(() => 
      getComputedStyle(document.body).backgroundColor
    );
    expect(bgColor).toBe('rgb(20, 20, 20)'); // Dark theme background

    // Open new tab, theme should persist
    const newPage = await context.newPage();
    await newPage.goto('/dashboards');
    
    const newBgColor = await newPage.evaluate(() => 
      getComputedStyle(document.body).backgroundColor
    );
    expect(newBgColor).toBe('rgb(20, 20, 20)');
  });

  test('layout versioning and restore', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.openDashboard('Version Test');

    // Make changes
    await dashboard.moveWidget('widget-1', { x: 100, y: 100 });
    await dashboard.saveLayout('Moved widget position');

    // Check version created
    await dashboard.openVersionHistory();
    await expect(page.getByText('Moved widget position')).toBeVisible();

    // Restore previous version
    await dashboard.restoreVersion(1);
    await expect(page.getByText('Layout restored to version 1')).toBeVisible();
  });

  test('RBAC - viewer cannot edit', async ({ browser }) => {
    // Login as viewer
    const viewerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    
    const loginPage = new LoginPage(viewerPage);
    await loginPage.goto();
    await loginPage.login('viewer@example.com', 'password123');

    const dashboard = new DashboardPage(viewerPage);
    await dashboard.openDashboard('Shared Dashboard');

    // Verify edit controls are hidden
    await expect(viewerPage.getByText('Add Widget')).not.toBeVisible();
    await expect(viewerPage.getByLabel('Edit layout')).not.toBeVisible();
  });
});
