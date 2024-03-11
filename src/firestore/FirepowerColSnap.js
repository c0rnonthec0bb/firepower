
import FirepowerDocSnap from '@/firestore/FirepowerDocSnap'

export default class FirepowerColSnap {
  constructor(firebaseColSnap, options = {}) {
    this.colSnap = firebaseColSnap
    this.docs = firebaseColSnap.docs.map(docSnap => new FirepowerDocSnap(docSnap, options))
  }
}
