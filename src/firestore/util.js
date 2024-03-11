
import { getFirebaseBase } from '@/util'

export function getFirestoreBase() {
  return getFirebaseBase().firestore
}

export function decodeFirestoreData(data) {
  const firestore = getFirestoreBase()

  if (data instanceof firestore.Timestamp) {
    return data.toDate()
  }

  if ([firestore.GeoPoint, firestore.FieldValue].some(allowedClass => allowedClass && data instanceof allowedClass)) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(decodeFirestoreData)
  }

  if (typeof data === 'object') {
    return Object.keys(data).reduce((prevResult, key) => ({ ...prevResult, [key]: decodeFirestoreData(data[key]) }), {})
  }

  return data
}

export function encodeFirestoreData(data) {
  const firestore = getFirestoreBase()

  if (data instanceof Date) {
    return firestore.Timestamp.fromDate(data)
  }

  if ([firestore.GeoPoint, firestore.FieldValue].some(allowedClass => data instanceof allowedClass)) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(encodeFirestoreData)
  }

  if (typeof data === 'object') {
    return Object.keys(data).reduce((prevResult, key) => ({ ...prevResult, [key]: encodeFirestoreData(data[key]) }), {})
  }

  return data
}

export function encodeFirestoreDataForUpload(data) {

}

