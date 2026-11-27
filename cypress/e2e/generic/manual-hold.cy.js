/// <reference types="cypress" />

const functions = "/.netlify/functions"
const discussionId = "http-localhost-5000"
const publishedId = "manual-hold-published"
const automaticallyHeldId = "manual-hold-automatic"
const replyId = "manual-hold-reply"
const publishedText = "A published comment to review"
const replyText = "A reply that stays public"
const automaticText = "A different comment awaiting review"
const reason = "Please clarify the claim"

const author = {
  id: "hold-author",
  name: "Comment Author",
  email: "author@example.test",
  privilege: 0,
  isModerator: false,
  isAdmin: false,
}
const moderator = {
  id: "hold-moderator",
  name: "Comment Moderator",
  email: "moderator@example.test",
  privilege: 1,
  isModerator: true,
  isAdmin: false,
}
const reader = { ...author, id: "hold-reader", name: "Unrelated Reader" }

const commentBody = id => cy.get(`#${id} > article.comment-body`)
const openCommentMenu = id =>
  commentBody(id).find(".overflow-menu-button").click()
const openHoldForm = () => {
  openCommentMenu(publishedId)
  commentBody(publishedId)
    .contains("button", /^Hide$/)
    .click()
}
const reasonField = () =>
  cy
    .get(`#${publishedId}`)
    .contains("label", "Reason for hiding")
    .find("textarea")
const submitHold = () =>
  commentBody(publishedId).contains("button", /^Hide comment$/)
const cancelHold = () => commentBody(publishedId).contains("button", /^Cancel$/)
const holdForm = () => commentBody(publishedId).find(".comment-hold-form")

const buttonBounds = buttons =>
  [...buttons].map(button => {
    const { x, y, width, height } = button.getBoundingClientRect()
    return { x, y, width, height }
  })

const movePointerTo = element => {
  // DevTools mouse coordinates are relative to the runner viewport.
  const frame = Cypress.$autIframe[0]
  const frameBounds = frame.getBoundingClientRect()
  const { x, y, width, height } = element.getBoundingClientRect()
  return Cypress.automation("remote:debugger:protocol", {
    command: "Input.dispatchMouseEvent",
    params: {
      type: "mouseMoved",
      x:
        frameBounds.left +
        (x + width / 2) * (frameBounds.width / frame.offsetWidth),
      y:
        frameBounds.top +
        (y + height / 2) * (frameBounds.height / frame.offsetHeight),
    },
  })
}

const expectFocusOutline = $button => {
  const button = $button[0]
  const style = button.ownerDocument.defaultView.getComputedStyle(button)
  expect(button.matches(":focus-visible"), "keyboard focus").to.equal(true)
  expect(style.outlineStyle, "focus outline style").to.equal("solid")
  expect(
    parseFloat(style.outlineWidth),
    "focus outline width"
  ).to.be.greaterThan(0)
  expect(style.outlineColor, "focus outline color").not.to.equal(
    "rgba(0, 0, 0, 0)"
  )
}

describe("Manual comment holds", () => {
  let viewer
  let savedReason
  let holdRequests
  let failNextHold

  const waitForDiscussion = account => {
    cy.wait("@getTopic")
    cy.get("#self-display").should("contain.text", account.name)
    // The widget fetches again when it learns the authenticated viewer.
    cy.wait("@getTopic")
  }

  const visitDiscussion = () => {
    cy.visit("/")
    waitForDiscussion(moderator)
  }

  const openNarrowHoldForm = () => {
    cy.viewport(375, 700)
    visitDiscussion()
    // Simulate a host that constrains the widget to the available width.
    cy.get(".simple-comment").invoke("css", "max-width", "100%")
    openHoldForm()
    reasonField().type(reason)
  }

  beforeEach(() => {
    viewer = moderator
    savedReason = undefined
    holdRequests = 0
    failNextHold = false

    const dateCreated = new Date().toISOString()
    const published = {
      id: publishedId,
      parentId: discussionId,
      dateCreated,
      text: publishedText,
      isApproved: true,
      user: author,
    }
    const automatic = {
      ...published,
      id: automaticallyHeldId,
      text: automaticText,
      isApproved: false,
      heldReason: "Link review required",
    }
    const reply = {
      ...published,
      id: replyId,
      parentId: publishedId,
      text: replyText,
      user: reader,
    }

    cy.intercept("GET", `${functions}/verify`, req => {
      const now = Math.floor(Date.now() / 1000)
      req.reply({
        statusCode: 200,
        body: { user: viewer.id, iat: now, exp: now + 3600 },
      })
    })
    for (const account of [moderator, author, reader]) {
      cy.intercept("GET", `${functions}/user/${account.id}`, {
        statusCode: 200,
        body: account,
      })
    }
    cy.intercept("GET", `${functions}/topic/${discussionId}`, req => {
      const canReview = viewer.isModerator || viewer.id === author.id
      const hidden = {
        id: publishedId,
        parentId: discussionId,
        dateCreated,
        text: null,
        isApproved: false,
        isManuallyHeld: true,
        ...(canReview && {
          text: publishedText,
          user: author,
          heldReason: savedReason,
        }),
      }
      req.reply({
        statusCode: 200,
        body: {
          id: discussionId,
          title: "Manual hold discussion",
          dateCreated,
          isLocked: false,
          replies: [
            savedReason ? hidden : published,
            reply,
            ...(canReview ? [automatic] : []),
          ],
        },
      })
    }).as("getTopic")
    cy.intercept("POST", `${functions}/comment/${publishedId}/hold`, req => {
      holdRequests += 1
      if (failNextHold) {
        failNextHold = false
        req.reply({ statusCode: 500, body: "Update error" })
        return
      }
      savedReason = req.body
      req.reply({ statusCode: 200, body: "Comment hidden" })
    }).as("holdComment")
  })

  it("shows Hide only to moderators on published comments", () => {
    visitDiscussion()
    openCommentMenu(publishedId)
    commentBody(publishedId)
      .contains("button", /^Hide$/)
      .should("be.visible")
    openCommentMenu(automaticallyHeldId)
    commentBody(automaticallyHeldId)
      .contains("button", /^Approve$/)
      .should("be.visible")
    commentBody(automaticallyHeldId)
      .contains("button", /^Hide$/)
      .should("not.exist")

    cy.then(() => {
      viewer = author
    })
    cy.clearLocalStorage()
    cy.reload()
    waitForDiscussion(author)
    openCommentMenu(publishedId)
    commentBody(publishedId).find(".comment-edit-button").should("be.visible")
    commentBody(publishedId)
      .contains("button", /^Hide$/)
      .should("not.exist")
  })

  it("requires a non-blank reason and clears a canceled draft", () => {
    visitDiscussion()
    openHoldForm()
    submitHold().should("be.disabled")
    reasonField().type("   ")
    submitHold().should("be.disabled")
    reasonField().clear().type(reason)
    submitHold().should("be.enabled")
    cancelHold().click()
    submitHold().should("not.exist")
    commentBody(publishedId)
      .contains("button", /^Hide$/)
      .click()
    reasonField().should("have.value", "")
    submitHold().should("be.disabled")
    cy.then(() => expect(holdRequests).to.equal(0))
  })

  it("fits the reason field and action labels in a narrow embed", () => {
    openNarrowHoldForm()

    holdForm().should($form => {
      const form = $form[0]
      const { left, right, top, bottom } = form.getBoundingClientRect()
      expect(right, "form fits viewport").to.be.at.most(
        form.ownerDocument.documentElement.clientWidth
      )
      expect(left, "form left edge").to.be.at.least(0)

      const field = form.querySelector("textarea").getBoundingClientRect()
      expect(field.left, "reason field left edge").to.be.at.least(left)
      expect(field.right, "reason field right edge").to.be.at.most(right)
      expect(field.top, "reason field top edge").to.be.at.least(top)
      expect(field.bottom, "reason field bottom edge").to.be.at.most(bottom)

      const buttons = form.querySelectorAll("button")
      expect(buttons, "hold actions").to.have.length(2)
      for (const button of buttons) {
        const label = form.ownerDocument.createRange()
        label.selectNodeContents(button)
        const bounds = button.getBoundingClientRect()
        const text = label.getBoundingClientRect()
        const name = button.textContent.trim()
        expect(bounds.left, `${name} button left edge`).to.be.at.least(left)
        expect(bounds.right, `${name} button right edge`).to.be.at.most(right)
        expect(text.left, `${name} label left edge`).to.be.at.least(bounds.left)
        expect(text.right, `${name} label right edge`).to.be.at.most(
          bounds.right
        )
        expect(text.top, `${name} label top edge`).to.be.at.least(bounds.top)
        expect(text.bottom, `${name} label bottom edge`).to.be.below(
          bounds.bottom
        )
      }
    })
  })

  it("shows keyboard focus on both hold actions", () => {
    openNarrowHoldForm()

    reasonField().should("be.focused")
    cy.press(Cypress.Keyboard.Keys.TAB)
    submitHold().should(expectFocusOutline)
    cy.press(Cypress.Keyboard.Keys.TAB)
    cancelHold().should(expectFocusOutline)
  })

  it(
    "keeps both hold actions in place when hovered",
    { browser: { family: "chromium" } },
    () => {
      openNarrowHoldForm()
      holdForm().scrollIntoView()
      reasonField().then($field => movePointerTo($field[0]))

      holdForm()
        .find("button")
        .then($buttons => {
          const restingBounds = buttonBounds($buttons)
          cy.wrap($buttons).each($button => {
            cy.then(() => movePointerTo($button[0]))
            cy.wrap($button).should($hovered => {
              const button = $hovered[0]
              expect(
                button.matches(":hover"),
                "pointer is over the button"
              ).to.equal(true)
              expect(
                buttonBounds($buttons),
                `button layout while hovering ${button.textContent.trim()}`
              ).to.deep.equal(restingBounds)
            })
          })
        })
    }
  )

  it("submits the trimmed reason and refreshes public and moderator views", () => {
    visitDiscussion()
    openHoldForm()
    reasonField().type(`  ${reason}  `)
    submitHold().click()

    cy.wait("@holdComment").then(({ request, response }) => {
      expect(request.body).to.equal(reason)
      expect(response.statusCode).to.equal(200)
    })
    cy.wait("@getTopic")
    commentBody(publishedId)
      .find('[role="status"]')
      .should("contain.text", reason)
    cy.get(`#${publishedId}`).should("contain.text", publishedText)
    cy.get(`#${publishedId} #${replyId}`).should("contain.text", replyText)
    submitHold().should("not.exist")

    cy.then(() => {
      viewer = reader
    })
    cy.clearLocalStorage()
    cy.reload()
    waitForDiscussion(reader)
    cy.get(`#${publishedId}`)
      .should("contain.text", "Hidden pending moderation.")
      .and("not.contain.text", publishedText)
      .and("not.contain.text", reason)
    cy.get(`#${publishedId} #${replyId}`).should("contain.text", replyText)
  })

  it("keeps the reason on failure and lets the moderator retry", () => {
    failNextHold = true
    visitDiscussion()
    openHoldForm()
    reasonField().type(reason)
    submitHold().click()

    cy.wait("@holdComment").its("response.statusCode").should("equal", 500)
    commentBody(publishedId)
      .find('[role="alert"]')
      .should("contain.text", "The comment could not be hidden")
    reasonField().should("have.value", reason)
    submitHold().should("be.enabled").click()

    cy.wait("@holdComment").then(({ request, response }) => {
      expect(request.body).to.equal(reason)
      expect(response.statusCode).to.equal(200)
    })
    cy.wait("@getTopic")
    commentBody(publishedId)
      .find('[role="status"]')
      .should("contain.text", reason)
    commentBody(publishedId).find('[role="alert"]').should("not.exist")
    submitHold().should("not.exist")
  })
})
