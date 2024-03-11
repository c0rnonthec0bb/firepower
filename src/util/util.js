
import fs from 'fs'

export function getFirebaseBase() {
  try {
    return require('firebase-admin')
  } catch(_) {}

  try {
    return require('firebase/app')
  } catch(_) {}

  throw new Error("Firepower requires a codependency of either 'firebase' or 'firebase-admin'")
}

export function isFirebaseAdminSDK() {
  return !getFirebaseBase().firestore().app
}

let logger = console

export function getLogger() {
  return logger
}

export function setLogger(newLogger) {
  logger = { ...console, ...newLogger }
}

export function optionalOptionsArg(functionDefinition) {
  const normalFunction = (...args) => functionDefinition(undefined, ...args)

  normalFunction.withOptions = functionDefinition

  return normalFunction
}


// because typeof null === 'object' for some reason
export const typeofWithNull = function(value) {
  if (value === null) return 'null'
  return typeof value
}

export function getNumericalDiffBetweenObjects(object1, object2) {
  const keyList = [...Object.keys(object1), ...Object.keys(object2)]
    .filter((key, i, a) => a.indexOf(key) === i)

  const result = {}
  keyList.forEach((key) => {
    const value1 = object1[key]
    const value2 = object2[key]

    const typeList = [typeofWithNull(value1), typeofWithNull(value2)]
      .filter(type => type !== 'undefined')
      .filter((type, i, a) => a.indexOf(type) === i)

    if (typeList.length === 1) {
      switch (typeList[0]) {
        case 'object': {
          const diff = getNumericalDiffBetweenObjects(value1 || {}, value2 || {})
          if (Object.keys(diff).length) result[key] = diff
          break
        }
        case 'number': {
          const diff = (value2 || 0) - (value1 || 0)
          if (diff) result[key] = diff
          break
        }
      }
    }
  })

  return result
}

// The normal isDeepStrictEqual returns false if the keys are out of order.
// For example, isDeepStrictEqual({ a: 1, b: 2 }, { b: 2, a: 1 }) returns false.
// We usually don't care about the key order, so here's this:
export function isDeepStrictEqualUnordered(item1, item2, verbose, deepLocation = []) {
  if (typeof item1 !== typeof item2) {
    // eslint-disable-next-line no-console
    if (verbose) console.log(`Value types are different at: ${deepLocation.join('.')}`)
    return false
  }

  switch (typeof item1) {
    case 'object': {
      const isNull1 = item1 === null
      const isNull2 = item2 === null
      if (isNull1 !== isNull2) {
        // eslint-disable-next-line no-console
        if (verbose) console.log(`Values are different at: ${deepLocation.join('.')}`)
        return false
      }
      if (isNull1) {
        break
      }

      const isArray1 = Array.isArray(item1)
      const isArray2 = Array.isArray(item2)
      if (isArray1 !== isArray2) {
        // eslint-disable-next-line no-console
        if (verbose) console.log(`Values are different at: ${deepLocation.join('.')}`)
        return false
      }
      if (isArray1) {
        if (item1.length !== item2.length) {
          // eslint-disable-next-line no-console
          if (verbose) console.log(`Array lengths are different at: ${deepLocation.join('.')}`)
          return false
        }
        if (item1.some((_, i) => !isDeepStrictEqualUnordered(item1[i], item2[i], verbose, [...deepLocation, i]))) return false
        break
      }

      const keyList1 = Object.keys(item1)
      const keyList2 = Object.keys(item2)

      const keyIn1Only = keyList1.find(key => !keyList2.includes(key))
      if (keyIn1Only) {
        // eslint-disable-next-line no-console
        if (verbose) console.log(`Key not found in object 2: ${deepLocation.join('.')}`)
        return false
      }

      const keyIn2Only = keyList2.find(key => !keyList1.includes(key))
      if (keyIn2Only) {
        // eslint-disable-next-line no-console
        if (verbose) console.log(`Key not found in object 1: ${deepLocation.join('.')}`)
        return false
      }

      if (keyList1.some((key) => {
        return !isDeepStrictEqualUnordered(item1[key], item2[key], verbose, [...deepLocation, key])
      })) return false
      break
    }
    default: {
      if (item1 !== item2) {
        // eslint-disable-next-line no-console
        if (verbose) console.log(`Values are different at: ${deepLocation.join('.')}`)
        return false
      }
      break
    }
  }

  return true
}

