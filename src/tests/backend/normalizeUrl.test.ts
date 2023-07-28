import { normalizeUrl } from "../../lib/backend-utilities"

describe("normalizeUrl", () => {
  it("should handle URLs without any of the stripped elements", () => {
    expect(normalizeUrl("example.com")).toBe("example.com")
  })

  it("should strip protocol https://", () => {
    expect(normalizeUrl("https://example.com")).toBe("example.com")
  })

  it("should strip protocol http://", () => {
    expect(normalizeUrl("http://example.com")).toBe("example.com")
  })

  it("should strip authentication part of the URL", () => {
    expect(normalizeUrl("http://user:password@example.com")).toBe("example.com")
  })

  it("should strip hash part of the URL", () => {
    expect(normalizeUrl("example.com/about.html#contact")).toBe(
      "example.com/about.html"
    )
  })

  it("should remove www. from the URL", () => {
    expect(normalizeUrl("http://www.example.com")).toBe("example.com")
  })

  it("should remove all query parameters", () => {
    expect(normalizeUrl("www.example.com?foo=bar")).toBe("example.com")
  })

  it("should remove trailing slash", () => {
    expect(normalizeUrl("http://example.com/redirect/")).toBe(
      "example.com/redirect"
    )
  })

  it("should remove a sole / pathname in the output", () => {
    expect(normalizeUrl("https://example.com/")).toBe("example.com")
  })
  it("should remove multiple ///", () => {
    expect(normalizeUrl("https://example.com///")).toBe("example.com")
  })

  it("should remove default directory index file from path that matches provided regex", () => {
    expect(normalizeUrl("www.example.com/foo/index.php")).toBe(
      "example.com/foo"
    )
  })

  it("should remove default port number from the URL", () => {
    expect(normalizeUrl("https://example.com:443")).toBe("example.com")
  })
  it("should not remove explicit port number from the URL", () => {
    expect(normalizeUrl("http://example.com:123")).toBe("example.com:123")
  })

  it("should handle URLs with all of the stripped elements", () => {
    const url = "https://www.example.com:443/index.html?param=value#hash"
    expect(normalizeUrl(url)).toBe("example.com")
  })
})
