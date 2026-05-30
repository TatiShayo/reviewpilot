describe('Review Flow — generate → approve', () => {
  beforeEach(() => {
    cy.visit('/dashboard/reviews')
  })

  it('displays the reviews page with review cards', () => {
    cy.contains('h2', 'Reviews').should('be.visible')
    cy.get('[class*="rounded-lg"][class*="border"]').should('have.length.at.least', 1)
  })

  it('shows sentiment and rating filters', () => {
    cy.contains('All Sentiments').should('be.visible')
    cy.contains('All Ratings').should('be.visible')
  })

  it('generates response on click, shows 3 tones, and approves', () => {
    cy.contains('Generate Response').first().click()

    cy.contains('professional', { matchCase: false }).should('be.visible')
    cy.contains('friendly', { matchCase: false }).should('be.visible')
    cy.contains('brief', { matchCase: false }).should('be.visible')

    cy.contains('Use this').first().click()

    cy.contains('Selected:', { matchCase: false }).should('be.visible')
    cy.contains('Approve').should('be.visible')

    cy.contains('Approve').click()

    cy.contains('Response approved').should('be.visible')
  })
})
