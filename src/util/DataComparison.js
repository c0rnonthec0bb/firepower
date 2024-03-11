
import {
  isDeepStrictEqualUnordered,
  typeofWithNull,
  getNumericalDiffBetweenObjects,
} from './util'

export default class DataComparison {
  constructor(oldValue, newValue) {
    Object.assign(this, { oldValue, newValue })
  }

  transform(transformer = (v => v)) {
    const { oldValue, newValue } = this
    return new DataComparison(transformer(oldValue), transformer(newValue))
  }

  get isEqual() {
    return isDeepStrictEqualUnordered(this.oldValue, this.newValue)
  }

  get isUnequal() {
    return !this.isEqual
  }

  get addedArrayValues() {
    const { oldValue, newValue } = this
    if(!Array.isArray(oldValue) || !Array.isArray(newValue)) throw Error('Both values must be arrays to use "addedArrayValues"')
    return newValue.filter(newItem => !oldValue.some(oldItem => isDeepStrictEqualUnordered(newItem, oldItem)))
  }

  get removedArrayValues() {
    const { oldValue, newValue } = this
    if(!Array.isArray(oldValue) || !Array.isArray(newValue)) throw Error('Both values must be arrays to use "addedArrayValues"')
    return oldValue.filter(oldItem => !newValue.some(newItem => isDeepStrictEqualUnordered(oldItem, newItem)))
  }

  get numericalDiff() {
    const { oldValue, newValue } = this
    if(!['number', 'undefined'].includes(typeofWithNull(oldValue)) || !['number', 'undefined'].includes(typeofWithNull(newValue))) throw Error('Both values must be numbers to use "numericalDiff"')

    return (newValue || 0) - (oldValue || 0)
  }

  get objectNumericalDiff() {
    const { oldValue, newValue } = this
    if(!['object', 'undefined'].includes(typeofWithNull(oldValue)) || !['object', 'undefined'].includes(typeofWithNull(newValue))) throw Error('Both values must be objects to use "objectNumericalDiff"')

    return getNumericalDiffBetweenObjects(oldValue || {}, newValue || {})
  }
}
