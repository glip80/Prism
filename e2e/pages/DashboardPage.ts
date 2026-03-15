import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly addWidgetButton: Locator;
  readonly themeSwitcher: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addWidgetButton = page.getByText('Add Widget');
    this.themeSwitcher = page.getByLabel('Switch theme');
  }

  async goto() {
    await this.page.goto('/dashboards');
  }

  async createNewDashboard(title: string) {
    await this.page.getByText('New Dashboard').click();
    await this.page.fill('[name="title"]', title);
    await this.page.getByText('Create').click();
  }

  async openDashboard(title: string) {
    await this.page.getByText(title).click();
    await this.page.waitForSelector('[data-testid="grid-layout"]');
  }

  async addWidget(type: string, config: any) {
    await this.addWidgetButton.click();
    await this.page.getByText(type, { exact: false }).click();
    
    await this.page.fill('[name="title"]', config.title);
    
    if (config.dataSource) {
      await this.page.getByText('Select Data Source').click();
      await this.page.getByText(config.dataSource.connector).click();
      await this.page.fill('[name="query"]', config.dataSource.query);
    }
    
    await this.page.getByText('Save Widget').click();
  }

  async moveWidget(widgetId: string, position: { x: number; y: number }) {
    const widget = this.page.locator(`[data-widget-id="${widgetId}"]`);
    await widget.dragTo(this.page.locator('.grid-drop-zone'), {
      targetPosition: position,
    });
  }

  async switchTheme(theme: 'light' | 'dark') {
    await this.themeSwitcher.click();
    await this.page.getByText(theme === 'dark' ? 'Dark Mode' : 'Light Mode').click();
  }

  async configureWidgetRefresh(widgetId: string, intervalMs: number) {
    await this.page.click(`[data-widget-id="${widgetId}"] [aria-label="Settings"]`);
    await this.page.fill('[name="refreshInterval"]', (intervalMs / 1000).toString());
    await this.page.getByText('Save').click();
  }

  async getWidgetData(widgetId: string) {
    return this.page.evaluate((id) => {
      const widget = document.querySelector(`[data-widget-id="${id}"]`);
      return widget?.getAttribute('data-value');
    }, widgetId);
  }

  async saveLayout(changeSummary: string) {
    await this.page.getByText('Save Layout').click();
    await this.page.fill('[name="changeSummary"]', changeSummary);
    await this.page.getByText('Confirm').click();
  }

  async openVersionHistory() {
    await this.page.getByText('History').click();
    await this.page.waitForSelector('[data-testid="version-list"]');
  }

  async restoreVersion(versionNumber: number) {
    await this.page.click(`[data-version="${versionNumber}"] [aria-label="Restore"]`);
    await this.page.getByText('Restore').click();
  }
}
