
import { getFirebaseBase, isFirebaseAdminSDK, getLogger, optionalOptionsArg } from '@/util'
import { getFunctionsBase } from '@/functions/util'
import { decodeFirestoreDocumentSnapshot } from '@/firestore/util'
import DataComparison from '@/util/DataComparison'

import { logger } from 'firebase-functions'


export const onDocCreated = optionalOptionsArg(async (ephemeralOptions = {}, wildcardDocPath, callback) => {
  const options = { timeoutSeconds: 60, memory: '256MB', ...ephemeralOptions }

  return functions.runWith(options).firestore.document(wildcardDocPath).onCreate(async (newDocSnap, context) => {
    const { eventId, params } = context

    const docChange = new DataComparison(undefined, newDocSnap)
      .transform(decodeFirestoreDocumentSnapshot)

    const { id, ref, path } = docChange.newValue

    const logPrefix = `onDocCreated ${path}`

    logger.info({ context, newData, eventId, params}, logPrefix)

    return await callback({ context, params, docChange, id, ref, path })
  })
})

export const onDocUpdated = optionalOptionsArg(async (ephemeralOptions = {}, wildcardDocPath, callback) => {
  const options = { timeoutSeconds: 60, memory: '256MB', ...ephemeralOptions }

  return functions.runWith(options).firestore.document(wildcardDocPath).onWrite(async (docSnap, context) => {
    const { eventId, params } = context

    const oldDoc = docSnap.before
    const newDoc = docSnap.after

    const docChange = new DataComparison(oldDoc, newDoc)
      .transform(decodeFirestoreDocumentSnapshot)

    const { id, ref, path } = docChange.newValue

    const logPrefix = `onDocUpdated ${path}`

    logger.info({ context, docChange, eventId, params }, logPrefix)

    return await callback({ context, params, docChange, id, ref, path })
  })
})


// callback : (data, context) => ()
export const onFunctionCall = optionalOptionsArg(async (ephemeralOptions = {}, data, context) => {
  const options = { timeoutSeconds: 60, memory: '256MB', ...ephemeralOptions }

  return functions.runWith(options).https.onCall(async (data, context) => {
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
    logger.info({ context: filteredContext, data: safeData, options }, 'onFunctionCall start')
    const result = await callback(safeData, context)
    logger.info({ context: filteredContext, data: safeData, options, result }, 'onFunctionCall end')
    return result
  })
})
