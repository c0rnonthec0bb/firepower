import { setFirebaseBase } from './util/index.js'
import { setFunctionsBase } from './functions/util.js'

export { DataComparison, setLogger } from './util/index.js'

// where firebaseBase is from 'firebase-admin' or 'firebase/compat/app'
export function initFirepower(firebaseBase, functionsBase) {
  setFirebaseBase(firebaseBase)
  if (functionsBase) setFunctionsBase(functionsBase)
}

export * as firestore from './firestore/index.js'
export * as functions from './functions/index.js'