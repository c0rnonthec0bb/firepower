import FirepowerDocSnap from './FirepowerDocSnap.js'

export default class FirepowerColSnap {
  constructor(firebaseColSnap, options = {}) {
    this.colSnap = firebaseColSnap
    this.docs = firebaseColSnap.docs.map(docSnap => new FirepowerDocSnap(docSnap, options))
  }
}
