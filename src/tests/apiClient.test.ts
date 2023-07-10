/**
 * @jest-environment jsdom
 */

import { debounceFunc } from "../apiClient"

describe('debounce', () => {
  it('calls as expected', function (done) {
    const callingArgument = 'debounce it!'
    const debounceCallback = (value: string) => {
      expect(value).toBe(callingArgument)
      done()
    }
    const debounce = debounceFunc(debounceCallback)
    debounce(callingArgument)
  })

  it('does not call immediately', function (done) {
    const startTime = new Date()
    const debounceCallback = () => {
      const duration = new Date().valueOf() - startTime.valueOf()
      expect(duration).toBeGreaterThan(200)
      done()
    }

    const debounce = debounceFunc(debounceCallback)

    debounce('')
  })

  it('never calls callback if continuously called', function (done) {
    let numCalls = 0

    const debounceCallback = () => {
      numCalls++
    }
    const debounce = debounceFunc(debounceCallback)
    const testInterval = window.setInterval(() => debounce(''), 50)
    const endTest = (toclear: number) => () => {
      clearInterval(toclear)
      expect(numCalls).toBe(0)
      done()
    }
    setTimeout(endTest(testInterval), 500)
  })

  it('calls once only after debounce ends', function (done) {
    let numCalls = 0

    const debounceCallback = () => {
      numCalls++
    }
    const debounce = debounceFunc(debounceCallback)
    const testInterval = window.setInterval(() => debounce(''), 50)
    const endInterval = (toclear: number) => () => {
      clearInterval(toclear)
    }

    const endTest = () => {
      expect(numCalls).toBe(1)
      done()
    }
    setTimeout(endInterval(testInterval), 200)
    setTimeout(endTest, 500)
  })
})