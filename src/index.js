
export { setFirebaseBase, DataComparison, setLogger } from '#util/index.js'

// where firebaseBase is from 'firebase-admin' or 'firebase/compat/app'
export function initFirepower(firebaseBase) {
  setFirebaseBase(firebaseBase)
}

export * as firestore from '#firestore.js'
