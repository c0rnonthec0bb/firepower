
import { isFirebaseAdminSDK, getLogger, optionalOptionsArg } from '@/util'
import { getFirestoreBase } from '@/firestore/util'
import FirepowerDocSnap from '@/firestore/FirepowerDocSnap'
import FirepowerColSnap from '@/firestore/FirepowerColSnap'

const ONE_SECOND = 1000

/**
 * A special sentinel FieldPath to refer to the ID of a document. It
 * can be used in queries to sort or filter by the document ID.
 */
export function docIdKey() {
  return getFirestoreBase().FieldPath.documentId()
}

/**
 * Used to increment (or set if it does not exist) a field's value.
 *
 * @param {Number} n The value to increment by
 * @returns {FieldValue} A Firestore `increment` FieldValue
 */
export function serverIncrement(n) {
  return getFirestoreBase().FieldValue.increment(n)
}

/**
 * Used to increment (or set if it does not exist) a field's value.
 *
 * @param {Number} n The value to increment by
 * @returns {FieldValue} A Firestore `increment` FieldValue
 */
export function serverTimestamp() {
  return getFirestoreBase().FieldValue.serverTimestamp()
}

/**
 * Used to merge (union) an existing field's array elements with these new elements.
 *
 * @param  {...any} elements The list of elements to merge in
 * @returns {FieldValue} A Firestore `arrayUnion` FieldValue
 */
export function serverArrayUnion(...elements) {
  return firestoreBase().FieldValue.arrayUnion(...elements)
}

/**
 * Used to remove some elements from an existing field's array.
 *
 * @param  {...any} elements The list of elements to remove
 * @returns {FieldValue} A Firestore `arrayRemove` FieldValue
 */
export function serverArrayRemove(...elements) {
  return firestoreBase().FieldValue.arrayRemove(...elements)
}

/**
 * Used to remove a field from a document.
 *
 * @returns {FieldValue} A Firestore `delete` FieldValue
 */
export function cloudDelete() {
  return firestoreBase().FieldValue.delete()
}


export function docPath(pathOrRefOrDocOrChange) {
  if (typeof pathOrRefOrDocOrChange === 'string') return pathOrRefOrDocOrChange

  if (pathOrRefOrDocOrChange.path) return docPath(pathOrRefOrDocOrChange.path)

  if (pathOrRefOrDocOrChange.ref) return docPath(pathOrRefOrDocOrChange.ref)

  if (pathOrRefOrDocOrChange.after) return docPath(pathOrRefOrDocOrChange.after)

  if (pathOrRefOrDocOrChange.doc) return docPath(pathOrRefOrDocOrChange.doc)

  return undefined
}

/**
 * Does it's best to return a reference to a Firestore document.
 *
 * @param {any} pathOrRefOrDocOrChange Could be a path, or a Ref, or a Doc, etc
 * @returns {Ref} A Firestore reference object
 */
export function docRef(pathOrRefOrDocOrChange) {
  const path = docPath(pathOrRefOrDocOrChange)
  if (!path) return undefined
  return getFirestoreBase()().doc(path)
}


/**
 * Sets a document's data in Firestore.
 *
 * @param {any} pathOrRefOrDocOrChange The path to the document
 * @param {Object} ephemeralOptions Options to pass to `set`
 * @param {Object} additions The document's data
 * @returns A Reference to the set document
 */
export const setDoc = optionalOptionsArg(async (ephemeralOptions = {}, pathOrRefOrDocOrChange, additions) => {
  const options = { merge: true, ...ephemeralOptions }

  const startTime = new Date()
  const logger = getLogger()

  const ref = docRef(pathOrRefOrDocOrChange)
  if (!ref) throw new Error('Invalid setDoc path argument.')

  const { transaction, skipInfoLog = false } = options

  const fsLog = { path: ref.path, operation: 'setDoc', isWrite: true, inTransaction: Boolean(transaction), additions }

  const durationWarningTimeout = setTimeout(() => {
    if (!requestResolved) logger.warn(fsLog, `Firestore setDoc WARN ${fsLog.path} taking over 30s`)
  }, 30 * ONE_SECOND)

  const encodedAdditions = encodeFirestoreData(additions)

  try {
    if (transaction) await transaction.set(ref, encodedAdditions, options)
    else await ref.set(encodedAdditions, options)
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    if (!skipInfoLog) logger.info({ firestore: { ...fsLog } }, `Firestore setDoc ${fsLog.path}`)
    return ref
  } catch (error) {
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    logger.error({ firestore: { ...fsLog, error } }, `Firestore setDoc ERROR ${fsLog.path}`)
    throw error
  }
})

/**
 * Updates a document's data in Firestore.
 *
 * Important notes:
 *  - If the document does not already exist, this function will throw an exception.
 *  - Use dot notation to update nested fields rather than replacing them.
 *    e.g. `updateDoc(postDoc, {'postUser.lastName': 'Bittner'})`
 *
 * @param {any} pathOrRefOrDocOrChange The path of the existing document to update
 * @param {Object} additions New data to merge with the existing document, in dot notation.
 * @param {Object} options Options to pass to `update`
 * @returns A Reference to the updated document
 */
export const updateDoc = optionalOptionsArg(async (ephemeralOptions = {}, pathOrRefOrDocOrChange, additions) => {
  const options = { ...ephemeralOptions }

  const startTime = new Date()
  const logger = getLogger()

  const ref = docRef(pathOrRefOrDocOrChange)
  if (!ref) throw new Error('Invalid updateDoc path argument.')

  const { transaction, skipInfoLog = false } = options
  const fsLog = { path: ref.path, operation: 'updateDoc', isWrite: true, inTransaction: Boolean(transaction), additions }

  const durationWarningTimeout = setTimeout(() => {
    if (!requestResolved) logger.warn(fsLog, `Firestore updateDoc WARN ${fsLog.path} taking over 30s`)
  }, 30 * ONE_SECOND)

  const encodedAdditions = encodeFirestoreData(additions)

  try {
    if (transaction) await transaction.update(ref, encodedAdditions)
    else await ref.update(encodedAdditions)
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    if (!skipInfoLog) logger.info({ firestore: { ...fsLog } }, `Firestore updateDoc ${fsLog.path}`)
    return ref
  } catch (error) {
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    logger.error({ firestore: { ...fsLog, error } }, `Firestore updateDoc ERROR ${fsLog.path}`)
    throw error
  }
})


/**
 * Adds a new document to a collection.
 *
 * @param {String} colPath The path of the collection to add the document to
 * @param {*} additions The data the document should contain
 * @returns A Firestore reference to the added document
 */
export const addDoc = optionalOptionsArg(async (ephemeralOptions = {}, colPath, additions) => {
  const options = { ...ephemeralOptions }

  const startTime = new Date()
  const logger = getLogger()

  const { transaction, skipInfoLog = false } = options
  const fsLog = { path: colPath, operation: 'addDoc', isWrite: true, inTransaction: Boolean(transaction), additions }

  const durationWarningTimeout = setTimeout(() => {
    if (!requestResolved) logger.warn(fsLog, `Firestore addDoc WARN ${fsLog.path} taking over 30s`)
  }, 30 * ONE_SECOND)

  const encodedAdditions = encodeFirestoreData(additions)

  try {
    let ref
    if (transaction) {
      const randomRef = getFirestoreBase()().collection(colPath).doc() // creates a new doc ref with a random ID (same that "add" does under-the-hood)
      await transaction.set(randomRef, encodedAdditions, options)
      ref = randomRef
    } else {
      ref = await getFirestoreBase()().collection(colPath).add(encodedAdditions)
    }
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    if (!skipInfoLog) logger.info({ firestore: { ...fsLog, docId: ref.id } }, `Firestore addDoc ${fsLog.path}`)
    return ref
  } catch (error) {
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    logger.error({ firestore: { ...fsLog, error } }, `Firestore addDoc ERROR ${fsLog.path}`)
    throw error
  }
})

/**
 * Deletes a document from Firestore
 *
 * Important notes:
 *  - If the document already doesn't exist, no error is thrown.
 *
 * @param {any} pathOrRefOrDocOrChange The path of the existing document to delete
 * @param {Object} options Only useful inside a transaction
 * @returns A Reference to the deleted document
 */
export const deleteDoc = optionalOptionsArg(async (ephemeralOptions = {}, pathOrRefOrDocOrChange) => {
  const options = { ...ephemeralOptions }

  const startTime = new Date()
  const logger = getLogger()

  const ref = docRef(pathOrRefOrDocOrChange)
  if (!ref) throw new Error('Invalid deleteDoc path argument.')

  const { transaction, skipInfoLog = false } = options
  const fsLog = { path: ref.path, operation: 'deleteDoc', isWrite: true, inTransaction: Boolean(transaction) }

  const durationWarningTimeout = setTimeout(() => {
    if (!requestResolved) logger.warn(fsLog, `Firestore deleteDoc WARN ${fsLog.path} taking over 30s`)
  }, 30 * ONE_SECOND)

  try {
    if (transaction) await transaction.delete(ref)
    else await ref.delete()
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    if (!skipInfoLog) logger.info({ firestore: { ...fsLog } }, `Firestore deleteDoc ${fsLog.path}`)
    return ref
  } catch (error) {
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    logger.error({ firestore: { ...fsLog, error } }, `Firestore deleteDoc ERROR ${fsLog.path}`)
    throw error
  }
})

/**
 * Gets a single document from Firestore.
 *
 * @param {any} pathOrRefOrDocOrChange The path of the document to fetch.
 * @param {Object} options Only useful inside a transaction
 * @returns A Reference to the document
 */
export const getDoc = optionalOptionsArg(async (ephemeralOptions = {}, pathOrRefOrDocOrChange) => {
  const options = { ...ephemeralOptions }

  const startTime = new Date()
  const logger = getLogger()

  const ref = docRef(pathOrRefOrDocOrChange)
  if (!ref) throw new Error('Invalid getDoc path argument.')

  const { transaction, skipInfoLog = true } = options
  const fsLog = { path: ref.path, operation: 'getDoc', isWrite: false, inTransaction: Boolean(transaction) }

  const durationWarningTimeout = setTimeout(() => {
    if (!requestResolved) logger.warn(fsLog, `Firestore getDoc WARN ${fsLog.path} taking over 30s`)
  }, 30 * ONE_SECOND)

  try {
    const docSnap = await (transaction ? transaction.get(ref) : ref.get())
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    const result = new FirepowerDocSnap(docSnap, options)
    if (result.data) fsLog.data = result.data
    if (!skipInfoLog) logger.info({ firestore: { ...fsLog } }, `Firestore getDoc ${fsLog.path}`)
    return result
  } catch (error) {
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    logger.error({ firestore: { ...fsLog, error } }, `Firestore getDoc ERROR ${fsLog.path}`)
    throw error
  }
})

/**
 * Gets a collection of documents from Firestore
 *
 * @param {String} colPath The path of the collection to fetch
 * @param {*} queryAdditions Filters for the query
 * @param {Object} options Only useful inside a transaction
 * @returns A snapshot of documents
 */
export const getCol = optionalOptionsArg(async (ephemeralOptions = {}, colPath, queryAdditions = (q => q)) => {
  const options = { ...ephemeralOptions }

  const startTime = new Date()
  const logger = getLogger()

  const { transaction, skipInfoLog = true } = options
  const fsLog = { path: colPath, operation: 'getCol', isWrite: false, inTransaction: Boolean(transaction) }

  const durationWarningTimeout = setTimeout(() => {
    if (!requestResolved) logger.warn(fsLog, `Firestore getCol WARN ${fsLog.path} taking over 30s`)
  }, 30 * ONE_SECOND)

  try {
    const query = queryAdditions(getFirestoreBase()().collection(colPath))
    const colSnap = await (transaction ? transaction.get(query) : query.get())
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    const result = new FirepowerColSnap(colSnap, options)
    if (!skipInfoLog) logger.info({ firestore: { ...fsLog } }, `Firestore getCol ${fsLog.path}`)
    return res
  } catch (error) {
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    logger.error({ firestore: { ...fsLog, error } }, `Firestore getCol ERROR ${fsLog.path}`)
    throw error
  }
})

/**
 * Gets documents from a collection in batches, calling the `batchCallback` after each batch.
 *
 * @param {String} colPath The path of the collection to get documents from
 * @param {Function} orderByAddition Additional orderBy
 * @param {Function} queryAdditions Additional query filters
 * @param {Integer} limitPerBatch The number of documents to fetch per batch
 * @param {Function} batchCallback The function to call after each batch has been fetched
 */
export const getColInBatches = optionalOptionsArg(async (ephemeralOptions = {}, colPath, orderByAddition = q => q.orderBy(docIdKey(), 'asc'), queryAdditions, limitPerBatch, batchCallback) => {
  const options = { ...ephemeralOptions }

  let startAfterDoc
  const startAfterAddition = q => (startAfterDoc ? q.startAfter(startAfterDoc) : q)

  const queryAddition = q => startAfterAddition(queryAdditions(orderByAddition(q).limit(limitPerBatch)))

  let batchResult
  let stopFlag = false
  const stop = () => { stopFlag = true }
  // eslint-disable-next-line no-constant-condition
  while (!stopFlag) {
    // eslint-disable-next-line no-await-in-loop
    batchResult = await getCol(colPath, queryAddition, options)
    startAfterDoc = batchResult.snap.docs[batchResult.snap.docs.length - 1]
    // eslint-disable-next-line no-await-in-loop
    await batchCallback(batchResult, stop)
    if (batchResult.docs.length !== limitPerBatch) stop()
  }
})

/**
 * Gets a collection of documents from a nested collection
 *
 * @param {String} colGroupName The name of the collection group to fetch from
 * @param {*} queryAdditions Filters for the query
 * @param {Object} options Only useful inside a transaction
 * @returns A snapshot of documents
 */
export const getColGroup = optionalOptionsArg(async (ephemeralOptions = {}, colGroupName, queryAdditions = (q => q)) => {
  const options = { ...ephemeralOptions }

  const startTime = new Date()
  const logger = getLogger()

  const { transaction, skipInfoLog = true } = options
  const fsLog = { path: colGroupName, operation: 'getColGroup', isWrite: false, inTransaction: Boolean(transaction) }

  const durationWarningTimeout = setTimeout(() => {
    if (!requestResolved) logger.warn(fsLog, `Firestore getColGroup WARN ${fsLog.path} taking over 30s`)
  }, 30 * ONE_SECOND)

  try {
    const query = queryAdditions(getFirestoreBase()().collectionGroup(colGroupName))
    const colSnap = await (transaction ? transaction.get(query) : query.get())
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    const result = new FirepowerColSnap(colSnap, options)
    if (!skipInfoLog) logger.info({ firestore: { ...fsLog } }, `Firestore getColGroup ${fsLog.path}`)
    return result
  } catch (error) {
    clearTimeout(durationWarningTimeout)
    fsLog.duration = new Date() - startTime
    logger.error({ firestore: { ...fsLog, error } }, `Firestore getColGroup ERROR ${fsLog.path}`)
    throw error
  }
})

/**
 * Gets documents from a collection group in batches, calling the `batchCallback` after each batch.
 *
 * @param {String} colGroupName The path of the collection group to get documents from
 * @param {Function} orderByAddition Additional orderBy
 * @param {Function} queryAdditions Additional query filters
 * @param {Integer} limitPerBatch The number of documents to fetch per batch
 * @param {Function} batchCallback The function to call after each batch has been fetched
 */
export const getColGroupInBatches = optionalOptionsArg(async (ephemeralOptions = {}, colGroupName, orderByAddition = q => q.orderBy(docIdKey(), 'asc'), queryAdditions, limitPerBatch, batchCallback) => {
  const options = { ...ephemeralOptions }

  let startAfterDoc
  const startAfterAddition = q => (startAfterDoc ? q.startAfter(startAfterDoc) : q)

  const queryAddition = q => startAfterAddition(queryAdditions(orderByAddition(q).limit(limitPerBatch)))

  let batchResult
  let stopFlag = false
  const stop = () => { stopFlag = true }
  // eslint-disable-next-line no-constant-condition
  while (!stopFlag) {
    // eslint-disable-next-line no-await-in-loop
    batchResult = await getColGroup(colGroupName, queryAddition, options)
    startAfterDoc = batchResult.snap.docs[batchResult.snap.docs.length - 1]
    // eslint-disable-next-line no-await-in-loop
    await batchCallback(batchResult, stop)
    if (batchResult.docs.length !== limitPerBatch) stop()
  }
})

// BEWARE: the onSnapshot function is DIFFERENT in the admin SDK vs the web SDK:
// admin SDK (no options param): https://googleapis.dev/nodejs/firestore/latest/DocumentReference.html#onSnapshot
// web SDK (options param): https://firebase.google.com/docs/reference/node/firestore.DocumentReference#onsnapshot
export const watchDoc = optionalOptionsArg((ephemeralOptions = {}, pathOrRefOrDocOrChange, callback) => {
  const options = { ...ephemeralOptions }

  const ref = docRef(pathOrRefOrDocOrChange)
  if (!ref) throw new Error('Invalid watchDoc path argument.')

  const {
    updateInterval,
    includeMetadataChanges = false,
    onError = () => {},
  } = options

  if (updateInterval) {
    const update = async () => {
      const result = await getDoc(ephemeralOptions, ref)
      // eslint-disable-next-line callback-return
      callback(result)
    }

    update()

    const interval = setInterval(update, updateInterval)
    return () => clearInterval(interval)
  }

  const logger = getLogger()
  const fsLog = { path: ref.path, operation: 'watchDoc', isWrite: false, inTransaction: false }

  const onSnapshotArgs = []
  // differentiate between admin SDK and client SDK
  if (!isFirebaseAdminSDK()) onSnapshotArgs.push({ includeMetadataChanges })
  onSnapshotArgs.push(docSnap => callback(new FirepowerDocSnap(docSnap, options)), (error) => {
    logger.error({ firestore: { ...fsLog, error } }, `Firestore watchDoc ERROR ${fsLog.path}`)
    onError(error)
  })

  return ref.onSnapshot(...onSnapshotArgs)
})

// BEWARE: the onSnapshot function is DIFFERENT in the admin SDK vs the web SDK:
// admin SDK (no options param): https://googleapis.dev/nodejs/firestore/latest/CollectionReference.html#onSnapshot
// web SDK (options param): https://firebase.google.com/docs/reference/node/firestore.CollectionReference#onsnapshot
export const watchCol = optionalOptionsArg((ephemeralOptions = {}, colPath, queryAdditions, callback) => {
  const options = { ...ephemeralOptions }

  const {
    updateInterval,
    includeMetadataChanges = false,
    onError = () => {},
  } = options

  if (updateInterval) {
    const update = async () => {
      const result = await getCol(ephemeralOptions, colPath, queryAdditions)
      // eslint-disable-next-line callback-return
      callback(result)
    }

    update()

    const interval = setInterval(update, updateInterval)
    return () => clearInterval(interval)
  }

  const logger = getLogger()
  const fsLog = { path: colPath, operation: 'watchCol', isWrite: false, inTransaction: false }

  const onSnapshotArgs = []
  // differentiate between admin SDK and client SDK
  if (!isFirebaseAdminSDK()) onSnapshotArgs.push({ includeMetadataChanges })
  onSnapshotArgs.push(colSnap => callback(new FirepowerColSnap(colSnap, options)), (error) => {
    logger.error({ firestore: { ...fsLog, error } }, `Firestore watchCol ERROR ${fsLog.path}`)
    onError(error)
  })

  return queryAdditions(getFirestoreBase()().collection(colPath)).onSnapshot(...onSnapshotArgs)
})

// BEWARE: the onSnapshot function is DIFFERENT in the admin SDK vs the web SDK:
// admin SDK (no options param): https://googleapis.dev/nodejs/firestore/latest/CollectionReference.html#onSnapshot
// web SDK (options param): https://firebase.google.com/docs/reference/node/firestore.CollectionReference#onsnapshot
export const watchColGroup = optionalOptionsArg((ephemeralOptions = {}, colGroupName, queryAdditions, callback) => {
  const options = { ...ephemeralOptions }

  const {
    updateInterval,
    includeMetadataChanges = false,
    onError = () => {},
  } = options

  if (updateInterval) {
    const update = async () => {
      const result = await getColGroup(ephemeralOptions, colGroupName, queryAdditions)
      // eslint-disable-next-line callback-return
      callback(result)
    }

    update()

    const interval = setInterval(update, updateInterval)
    return () => clearInterval(interval)
  }

  const logger = getLogger()
  const fsLog = { path: colGroupName, operation: 'watchColGroup', isWrite: false, inTransaction: false }

  const onSnapshotArgs = []
  // differentiate between admin SDK and client SDK
  if (!isFirebaseAdminSDK()) onSnapshotArgs.push({ includeMetadataChanges })
  onSnapshotArgs.push(colSnap => callback(new FirepowerColSnap(colSnap, options)), (error) => {
    logger.error({ firestore: { ...fsLog, error } }, `Firestore watchColGroup ERROR ${fsLog.path}`)
    onError(error)
  })

  return queryAdditions(getFirestoreBase()().collectionGroup(colGroupName)).onSnapshot(...onSnapshotArgs)
})

export const runTransaction = function(...args) {
  return getFirestoreBase()().runTransaction(...args)
}

// This format allows import-export to work in functions
// eslint-disable-next-line func-names
export const runBatch = optionalOptionsArg(async (ephemeralOptions = {}, batchWrite) => {
  const options = { ...ephemeralOptions }

  const batch = getFirestoreBase()().batch()
  const result = await batchWrite(batch)
  await batch.commit()
  return result
})

export const isFirestoreDataEqual = function(data1, data2) {
  const keys = Object.keys({ ...data1, ...data2 })
  return keys.some((key) => {
    const value1 = data1[key]
    const value2 = data2[key]
    if (value1 === value2) return false
    if (date(value1) && date(value2) && date(value1).getTime() === date(value2).getTime()) return false
    return true
  })
}
