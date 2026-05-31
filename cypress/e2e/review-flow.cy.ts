describe('Review Flow — generate → approve', () => {
  const mockResponses = {
    responses: {
      professional: 'Thank you for your wonderful review! We truly appreciate your kind words and look forward to serving you again. — The Team',
      friendly: 'Wow, thanks so much! 😊 We\'re thrilled you had a great experience and can\'t wait to see you again soon! 💛',
      brief: 'Thanks so much! We appreciate your feedback.',
    },
  }

  beforeEach(() => {
    cy.setCookie('e2e_bypass', '1')
    cy.intercept('POST', '/api/ai/respond', {
      statusCode: 200,
      body: mockResponses,
    }).as('generateResponse')
    cy.visit('/dashboard/reviews')
  })

  it('displays the reviews page with review cards', () => {
    cy.contains('h2', 'Reviews').should('be.visible')
    cy.get('[class*="rounded-lg"][class*="border"]').should('have.length.at.least', 1)
  })

  it('renders the review page with filter controls', () => {
    cy.contains('Reviews').should('be.visible')
    cy.get('input[placeholder="Search reviews..."]').should('be.visible')
    // filter selects should be present
    cy.get('[data-slot="select-trigger"]').should('have.length', 3)
  })

  it('generates response on click, shows 3 tones, selects one, and approves', () => {
    cy.get('button').contains('Generate Response').click()
    cy.wait('@generateResponse')

    cy.contains('professional', { matchCase: false }).should('be.visible')
    cy.contains('friendly', { matchCase: false }).should('be.visible')
    cy.contains('brief', { matchCase: false }).should('be.visible')

    cy.get('button').contains('Use this').click()

    cy.contains('Selected:').should('be.visible')
    cy.contains('Approve').should('be.visible')

    cy.get('button').contains('Approve').click()

    cy.contains('Response approved').should('be.visible')
  })

  it('can search reviews by keyword', () => {
    cy.get('input[placeholder="Search reviews..."]').type('croissants')
    cy.contains('Maria G.').should('be.visible')
    cy.contains('Robert K.').should('not.exist')
  })
})
