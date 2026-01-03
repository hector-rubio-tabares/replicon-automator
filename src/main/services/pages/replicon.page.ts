/**
 * Page Object Model para Replicon
 * Centraliza todos los selectores para facilitar mantenimiento y testing.
 */
import type { Page, Locator } from 'playwright';

export interface PageObjectSelectors {
  selector: string;
  description: string;
  fallback?: string[];
}

/**
 * Selectores centralizados para la página de login de Okta
 */
export class OktaLoginPage {
  private page: Page;

  // Selectores con fallbacks para mayor robustez
  private selectors = {
    emailInput: {
      primary: 'input[name="identifier"]',
      fallbacks: ['input[type="email"]', 'input[autocomplete="username"]'],
      description: 'Campo de email/usuario',
    },
    passwordInput: {
      primary: 'input[type="password"]',
      fallbacks: ['input[name="password"]', 'input[autocomplete="current-password"]'],
      description: 'Campo de contraseña',
    },
    submitButton: {
      primary: 'input[type="submit"]',
      fallbacks: ['button[type="submit"]', '[data-type="save"]'],
      description: 'Botón de enviar',
    },
    mfaButton: {
      primary: '[data-se="okta_verify-push"]',
      fallbacks: ['.authenticator-verify-list button', '[data-se="push"]'],
      description: 'Botón de verificación MFA',
    },
    repliconLink: {
      primary: 'a[aria-label*="Replicon"]',
      fallbacks: ['a[href*="replicon"]', '[data-app-name*="replicon" i]'],
      description: 'Enlace a Replicon',
    },
  };

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Intenta encontrar un elemento usando el selector primario y fallbacks
   */
  private async findWithFallback(selectorConfig: typeof this.selectors.emailInput): Promise<Locator> {
    // Intentar selector primario
    const primary = this.page.locator(selectorConfig.primary);
    if (await primary.count() > 0) {
      return primary.first();
    }

    // Intentar fallbacks
    for (const fallback of selectorConfig.fallbacks) {
      const locator = this.page.locator(fallback);
      if (await locator.count() > 0) {
        return locator.first();
      }
    }

    // Si nada funciona, retornar el primario para que falle con mensaje claro
    return primary;
  }

  async fillEmail(email: string): Promise<void> {
    const input = await this.findWithFallback(this.selectors.emailInput);
    await input.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    const input = await this.findWithFallback(this.selectors.passwordInput);
    await input.fill(password);
  }

  async clickSubmit(): Promise<void> {
    const button = await this.findWithFallback(this.selectors.submitButton);
    await button.click();
  }

  async waitForPassword(): Promise<void> {
    await this.page.waitForSelector(this.selectors.passwordInput.primary, { state: 'visible' });
  }

  async handleMFA(timeout: number = 5000): Promise<boolean> {
    try {
      const mfaButton = await this.findWithFallback(this.selectors.mfaButton);
      await mfaButton.click({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  async clickRepliconLink(): Promise<void> {
    const link = await this.findWithFallback(this.selectors.repliconLink);
    await link.click();
  }

  async waitForRepliconLink(timeout: number = 60000): Promise<void> {
    await this.page.waitForSelector(
      `${this.selectors.repliconLink.primary}, ${this.selectors.repliconLink.fallbacks.join(', ')}`,
      { timeout }
    );
  }
}

/**
 * Selectores centralizados para Replicon Timesheet
 */
export class RepliconTimesheetPage {
  private page: Page;

  private selectors = {
    welcomeText: {
      primary: '.userWelcomeText',
      fallbacks: ['[class*="welcome"]', '[class*="Welcome"]'],
      description: 'Texto de bienvenida',
    },
    timesheetCard: {
      primary: 'timesheet-card li',
      fallbacks: ['[class*="timesheet"] li', '[class*="timesheetCard"]'],
      description: 'Tarjeta de timesheet',
    },
    dayCell: {
      primary: '[class*="timeEntryCell"]',
      fallbacks: ['[class*="dayCell"]', '[class*="day-cell"]'],
      description: 'Celda de día',
    },
    timeInput: {
      primary: 'input.time',
      fallbacks: ['input[type="time"]', '[class*="timeInput"]'],
      description: 'Input de hora',
    },
    projectDropdown: {
      primary: 'a.divDropdown',
      fallbacks: ['[class*="projectSelector"]', '[class*="project-dropdown"]'],
      description: 'Dropdown de proyecto',
    },
    okButton: {
      primary: 'input[value="OK"]',
      fallbacks: ['button:has-text("OK")', '[class*="confirmButton"]'],
      description: 'Botón OK',
    },
    contextPopup: {
      primary: '[class*="contextPopup"]',
      fallbacks: ['[class*="popup"]', '[class*="modal"]:visible'],
      description: 'Popup de contexto',
    },
    punchOut: {
      primary: '[class*="punchOut"]',
      fallbacks: ['[class*="combinedInput"] a:nth-child(2)', '[class*="punch-out"]'],
      description: 'Botón de punch out',
    },
  };

  constructor(page: Page) {
    this.page = page;
  }

  private async findWithFallback(selectorConfig: { primary: string; fallbacks: string[] }): Promise<Locator> {
    const primary = this.page.locator(selectorConfig.primary);
    if (await primary.count() > 0) {
      return primary.first();
    }

    for (const fallback of selectorConfig.fallbacks) {
      const locator = this.page.locator(fallback);
      if (await locator.count() > 0) {
        return locator.first();
      }
    }

    return primary;
  }

  async waitForWelcome(timeout: number = 30000): Promise<void> {
    await this.page.waitForSelector(
      `${this.selectors.welcomeText.primary}, ${this.selectors.welcomeText.fallbacks.join(', ')}`,
      { timeout }
    );
  }

  async clickTimesheetCard(): Promise<void> {
    const card = await this.findWithFallback(this.selectors.timesheetCard);
    await card.click();
  }

  async waitForDayCells(timeout: number = 30000): Promise<void> {
    await this.page.waitForSelector(
      `${this.selectors.dayCell.primary}, ${this.selectors.dayCell.fallbacks.join(', ')}`,
      { timeout }
    );
  }

  async clickDay(dayNumber: number): Promise<void> {
    const daySelector = `li:nth-child(${dayNumber}) a, li:nth-child(${dayNumber}) [class*="clickable"]`;
    await this.page.click(daySelector);
  }

  async fillStartTime(time: string): Promise<void> {
    const input = await this.findWithFallback(this.selectors.timeInput);
    await input.fill(time);
  }

  async fillEndTime(time: string): Promise<void> {
    const punchOut = await this.findWithFallback(this.selectors.punchOut);
    await punchOut.click();
    const input = await this.findWithFallback(this.selectors.timeInput);
    await input.fill(time);
  }

  async selectProject(projectName: string): Promise<void> {
    const dropdown = await this.findWithFallback(this.selectors.projectDropdown);
    await dropdown.click();
    await this.page.click(`a:has-text("${projectName}")`);
  }

  async selectAccount(accountName: string): Promise<void> {
    await this.page.click(`a:has-text("${accountName}")`);
  }

  async clickOK(): Promise<void> {
    const button = await this.findWithFallback(this.selectors.okButton);
    await button.click();
  }

  async waitForPopupClose(): Promise<void> {
    await this.page.waitForSelector(this.selectors.contextPopup.primary, { state: 'hidden' });
  }

  async isVacationDay(dayNumber: number): Promise<boolean> {
    try {
      const vacation = await this.page.$(`li:nth-child(${dayNumber}) span:has-text("Vacations")`);
      return vacation !== null;
    } catch {
      return false;
    }
  }

  async isHolidayDay(dayNumber: number): Promise<boolean> {
    try {
      const holiday = await this.page.$(`li:nth-child(${dayNumber}) [class*="holidayIndicator"]`);
      return holiday !== null;
    } catch {
      return false;
    }
  }

  /**
   * Agregar una entrada de tiempo completa
   */
  async addTimeEntry(
    startTime: string,
    endTime: string,
    projectName: string,
    accountName: string
  ): Promise<void> {
    await this.fillStartTime(startTime);
    await this.selectProject(projectName);
    await this.selectAccount(accountName);
    await this.clickOK();
    await this.waitForPopupClose();

    await this.fillEndTime(endTime);
    await this.clickOK();
    await this.waitForPopupClose();
  }
}

/**
 * Factory para crear instancias de Page Objects
 */
export function createPageObjects(page: Page) {
  return {
    okta: new OktaLoginPage(page),
    replicon: new RepliconTimesheetPage(page),
  };
}
