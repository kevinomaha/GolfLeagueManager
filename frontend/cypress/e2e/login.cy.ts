describe('Login Functionality', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should open login modal when clicking login button', () => {
    cy.getByTestId('login-button').click()
    cy.getByTestId('login-modal').should('be.visible')
  })

  it('should show error message with invalid credentials', () => {
    cy.getByTestId('login-button').click()
    cy.getByTestId('email-input').type('invalid@example.com')
    cy.getByTestId('password-input').type('wrongpassword')
    cy.getByTestId('login-submit').click()
    cy.getByTestId('error-message').should('be.visible')
  })

  it('should successfully login with valid credentials', () => {
    cy.login('bbarstow68@gmail.com', 'Welcome123!')
    cy.getByTestId('logout-button').should('be.visible')
    cy.getByTestId('login-button').should('not.exist')
  })

  it('should close login modal when clicking outside', () => {
    cy.getByTestId('login-button').click()
    cy.getByTestId('login-modal').should('be.visible')
    cy.get('body').click(0, 0)
    cy.getByTestId('login-modal').should('not.exist')
  })

  it('should close login modal when clicking close button', () => {
    cy.getByTestId('login-button').click()
    cy.getByTestId('login-modal').should('be.visible')
    cy.getByTestId('close-modal').click()
    cy.getByTestId('login-modal').should('not.exist')
  })
}) 