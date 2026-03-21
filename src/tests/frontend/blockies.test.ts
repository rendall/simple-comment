import { getGenerator, createColor, createImageData } from "../../lib/blockies"

describe("rand", () => {
  it("should return a different number for different seeds", () => {
    const generator1 = getGenerator("seed1")
    const rand1 = () => generator1.next() as number
    const number1 = rand1()

    const generator2 = getGenerator("seed2")
    const rand2 = () => generator2.next() as number
    const number2 = rand2()

    expect(number1).not.toBe(number2)
  })
})

describe("getGenerator", () => {
  describe("2 generators, same seed", () => {
    const seed = "testSeed"
    const generator1 = getGenerator(seed)
    const generator2 = getGenerator(seed)
    test("should return identical results for a fixed sequence length", () => {
      const results1 = Array.from({ length: 6 }, () => generator1.next())
      const results2 = Array.from({ length: 6 }, () => generator2.next())
      expect(results1).toEqual(results2)
    })
  })

  describe("2 generators, different seeds", () => {
    const generator1 = getGenerator("seed1")
    const generator2 = getGenerator("seed2")
    test("should return different results across a fixed sequence length", () => {
      const results1 = Array.from({ length: 3 }, () => generator1.next())
      const results2 = Array.from({ length: 3 }, () => generator2.next())
      results1.forEach((result, index) => {
        expect(result).not.toEqual(results2[index])
      })
    })
  })
})

describe("createColor", () => {
  test("should return deterministic results", () => {
    const seed = "testSeed"
    const generator1 = getGenerator(seed)
    const generator2 = getGenerator(seed)
    const rand1 = () => generator1.next() as number
    const rand2 = () => generator2.next() as number
    const result1 = createColor(rand1)
    const result2 = createColor(rand2)
    expect(result1).toEqual(result2)
  })
  it("should return a string", () => {
    const generator = getGenerator("seed")
    const rand = () => generator.next() as number
    const color = createColor(rand)
    expect(typeof color).toBe("string")
  })

  it("should return a different color for different seeds", () => {
    const generator1 = getGenerator("seed1")
    const rand1 = () => generator1.next() as number
    const color1 = createColor(rand1)

    const generator2 = getGenerator("seed2")
    const rand2 = () => generator2.next() as number
    const color2 = createColor(rand2)

    expect(color1).not.toBe(color2)
  })
})

describe("createImageData", () => {
  test("should return deterministic results", () => {
    const seed = "testSeed"
    const generator1 = getGenerator(seed)
    const generator2 = getGenerator(seed)
    const rand1 = () => generator1.next() as number
    const rand2 = () => generator2.next() as number
    const size = 8
    const result1 = createImageData(size, rand1)
    const result2 = createImageData(size, rand2)
    expect(result1).toEqual(result2)
  })
  it("should return an array", () => {
    const generator = getGenerator("seed")
    const rand = () => generator.next() as number
    const imageData = createImageData(8, rand)
    expect(Array.isArray(imageData)).toBe(true)
  })

  it("should return a different array for different seeds", () => {
    const generator1 = getGenerator("seed1")
    const rand1 = () => generator1.next() as number
    const imageData1 = createImageData(8, rand1)

    const generator2 = getGenerator("seed2")
    const rand2 = () => generator2.next() as number
    const imageData2 = createImageData(8, rand2)

    expect(imageData1).not.toEqual(imageData2)
  })
})
