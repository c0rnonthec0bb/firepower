import { getFirebaseBase, isFirebaseAdminSDK, getLogger, optionalOptionsArg, filterObjectKeys } from '../util/index.js'
import { getFunctionsBase } from './util.js'
import { updateDoc } from '../firestore/index.js'
import FirepowerDocSnap from '../firestore/FirepowerDocSnap.js'
import DataComparison from '../util/DataComparison.js'

// import { logger } from 'firebase-functions'


export const onDocCreated = optionalOptionsArg((ephemeralOptions = {}, wildcardDocPath, callback) => {
  const options = { timeoutSeconds: 60, memory: '256MB', ...ephemeralOptions }

  return getFunctionsBase().runWith(options).firestore.document(wildcardDocPath).onCreate(async (newDoc, context) => {
    const { eventId, params } = context

    const docChange = new DataComparison(undefined, newDoc)
      .transform(docSnap => docSnap ? new FirepowerDocSnap(docSnap) : undefined)

    const { id, ref, path } = docChange.newValue

    const dataChange = docChange
      .transform(({ data }) => data)

    const logPrefix = `onDocCreated ${path}`

    getLogger().info({ context, docChange, dataChange, eventId, params}, logPrefix)

    const result = await callback({ context, params, docChange, dataChange, id, ref, path })
    if (result) {
      const { updates, promiseFunctions } = result

      if (updates) {
        await updateDoc(path, updates)
      }

      if (promiseFunctions) {
        await Promise.all(promiseFunctions.map(f => f()))
      }
    }
  })
})

export const onDocUpdated = optionalOptionsArg((ephemeralOptions = {}, wildcardDocPath, callback) => {
  const options = { timeoutSeconds: 60, memory: '256MB', ...ephemeralOptions }

  return getFunctionsBase().runWith(options).firestore.document(wildcardDocPath).onWrite(async (docSnap, context) => {
    const { eventId, params } = context

    const oldDoc = docSnap.before
    const newDoc = docSnap.after

    const docChange = new DataComparison(oldDoc, newDoc)
      .transform(docSnap => docSnap ? new FirepowerDocSnap(docSnap) : undefined)

    const { id, ref, path } = docChange.newValue

    const dataChange = docChange
      .transform(({ data }) => data)

    const logPrefix = `onDocUpdated ${path}`

    getLogger().info({ context, docChange, dataChange, eventId, params }, logPrefix)

    const result = await callback({ context, params, docChange, dataChange, id, ref, path })
    if (result) {
      const { updates = {}, promiseFunctions = [] } = result

      if (Object.keys(updates).length) {
        await updateDoc(path, updates)
      }

      await Promise.all(promiseFunctions.map(f => f()))
    }
  })
})


// callback : (data, context) => ()
export const onFunctionCall = optionalOptionsArg((ephemeralOptions = {}, callback) => {
  const options = { timeoutSeconds: 60, memory: '256MB', ...ephemeralOptions }

  return getFunctionsBase().runWith(options).https.onCall(async (data, context) => {
    const rawRequest = context.rawRequest || {}

    const { auth = {} } = rawRequest
    const signedInUserId = auth.uid

    const filteredContext = {
      auth,
      signedInUserId,
      ...filterObjectKeys(rawRequest, [
        'aborted',
        'complete',
        'headers',
        'httpVersion',
        'method',
        'params',
        'upgrade',
        'url',
      ]),
    }
    const safeData = data || {}
    getLogger().info({ context: filteredContext, data: safeData, options }, 'onFunctionCall start')
    const result = await callback(safeData, context)
    getLogger().info({ context: filteredContext, data: safeData, options, result }, 'onFunctionCall end')
    return result
  })
})
