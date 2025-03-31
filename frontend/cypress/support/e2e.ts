import '@testing-library/cypress/add-commands'
import './commands'

// Hide XHR requests from command log
const app = window.top;
if (app) {
  const console = app.console;
  if (console) {
    console.log = () => {};
  }
}

// Add custom commands here
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/')
  cy.get('[data-testid="login-button"]').click()
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-submit"]').click()
})

// Add TypeScript types for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
    }
  }
} 