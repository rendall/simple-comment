import * as fs from "fs"
import { Service } from "./../src/lib/Service";

describe("Ensures API specs match controller service", () => {

  test("simple-comment-api.json exists", () => {
    const doesApiSpecExist = fs.existsSync(`${process.cwd()}/src/schema/simple-comment-api.json`)
    expect(doesApiSpecExist).toBe(true)
  })

  const apiSpecText = fs.readFileSync(`${process.cwd()}/src/schema/simple-comment-api.json`, 'utf8')

  type Method = "get" | "post" | "delete" | "put"
  const apiSpecJSON: {
    paths: {
      [route: string]: {
        [key in Method]: {}
      }
    }
  } = JSON.parse(apiSpecText)

  const normalizeRoute = (route: string) => route.split("/")[1]

  // all of these methods should exist on testService
  const serviceMethods = Object.keys(apiSpecJSON.paths)
    .map(route => [route, apiSpecJSON.paths[route]])
    .reduce((methods: string[], [route, mObj]: [string, { [key in Method]: {} }]) =>
      [...methods, ...Object.keys(mObj).map(method => `${normalizeRoute(route)}${method.toUpperCase()}`)], [])

  //@ts-expect-error - we want to test the methods of the abstract service
  const testService = new Service()

  serviceMethods.forEach(method => {
    test(`${method} should be defined in Service`, () => { expect(testService[method]).toBeDefined() })
  })

  test(`non existent method on Service should fail`, () => {
    expect(testService["nonexistent"]).toBeUndefined()
  })
})
