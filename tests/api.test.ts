import * as fs from "fs"
import { Service } from "./../src/lib/Service"

type Method = "get" | "post" | "delete" | "put"

/**
 * Make sure that the OpenAPI 3 spec is represented in the code
 **/
describe("Ensures API specs match controller service", () => {
  // Does the OpenAPI 3 spec file exist?
  test("simple-comment-api.json exists", () => {
    const doesApiSpecExist = fs.existsSync(
      `${process.cwd()}/src/schema/simple-comment-api.json`
    )
    expect(doesApiSpecExist).toBe(true)
  })

  // Read the spec file
  const apiSpecText = fs.readFileSync(
    `${process.cwd()}/src/schema/simple-comment-api.json`,
    "utf8"
  )

  // Parse the spec file
  const apiSpecJSON: {
    paths: {
      [route: string]: {
        [key in Method]: {}
      }
    }
  } = JSON.parse(apiSpecText)

  // Get the `dir` part of `/dir/{id}`
  const normalizeRoute = (route: string) => route.split("/")[1]

  // serviceMethods is an array of strings like `userGET` or `topicPOST`
  // all of these methods should exist on testService
  const serviceMethods = Object.keys(apiSpecJSON.paths)
    .map(route => [route, apiSpecJSON.paths[route]])
    .reduce(
      (methods: string[], [route, mObj]: [string, { [key in Method]: {} }]) => [
        ...methods,
        ...Object.keys(mObj).map(
          method => `${normalizeRoute(route)}${method.toUpperCase()}`
        )
      ],
      []
    )

  // `Service` is an Abstract Class
  // Normally we would not instantiate it, but for testing, we want to
  //@ts-expect-error
  const testService = new Service()

  // Make sure that each entry in serviceMethods has a corresponding
  // value in the Service instance, `testService`
  serviceMethods.forEach(method => {
    test(`${method} should be defined in Service`, () => {
      expect(testService[method]).toBeDefined()
    })
  })

  test(`non existent method on Service should fail`, () => {
    expect(testService["nonexistent"]).toBeUndefined()
  })
})
