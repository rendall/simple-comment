/// <reference types="cypress" />

import topicBody from "../../fixtures/mockDiscussion.json";

describe("Loading performance", () => {
  it("check page load time", () => {
    cy.intercept("GET", ".netlify/functions/topic/*", req => {
      req.reply({
        statusCode: 200,
        ok: true,
        body: topicBody,
      })
    }).as("GET topic")
    cy.visit("/", {
      onBeforeLoad: contentWindow => {
        contentWindow.performance.mark("start-loading")
      },
      onLoad: contentWindow => {
        contentWindow.performance.mark("end-loading")
      },
    })
      .its("performance")
      .then(p => {
        p.measure("pageLoad", "start-loading", "end-loading")
        const measure = p.getEntriesByName("pageLoad")[0]
        assert.isAtMost(measure.duration, 2500)
      })

    cy.get("li#last-comment").then(() => {
      cy.window()
        .then(contentWindow => {
          contentWindow.performance.mark("comment-render")
          return contentWindow
        })
        .its("performance")
        .then(p => {
          p.measure("commentRender", "end-loading", "comment-render")
          const measure = p.getEntriesByName("commentRender")[0]
          assert.isAtMost(measure.duration, 2000)
        })
    })
  })
})
