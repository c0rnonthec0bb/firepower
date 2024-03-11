
import { decodeFirestoreData } from '@/firestore/util'

export default class FirepowerDocSnap {
  constructor(firestoreDocumentSnapshot, options = {}) {
    this.docSnap = firestoreDocumentSnapshot
    
    if (!options.skipDataDecoding) {
      this.data = decodeFirestoreData(firestoreDocumentSnapshot.data({ serverTimestamps: 'estimate' }) || {})
    }
  }

  get exists() {
    return this.docSnap.exists
  }
  get id() {
    return this.docSnap.id
  }
  get metadata() {
    return this.docSnap.metadata
  }
  get ref() {
    return this.docSnap.ref
  }
  get path() {
    return this.ref.path
  }
}

