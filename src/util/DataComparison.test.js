
import DataComparison from './DataComparison'

describe('DataComparison', () => {
  const dataSet1 = { a: 1, b: { b1: 'hello', b2: 'aloha' }, c: [1, 2, 3, { c1: 'same' }, { c2: 'different-1' }] }
  const dataSet2 = { a: 2, b: { b1: 'goodbye', b2: 'aloha' }, c: [3, 4, 5, { c1: 'same' }, { c2: 'different-2' }] }

  it ('should properly report equality', () => {
    expect(new DataComparison({ ...dataSet1 }, { ...dataSet1 }).isEqual).toEqual(true)
    expect(new DataComparison({ ...dataSet1 }, { ...dataSet1 }).isUnequal).toEqual(false)
    expect(new DataComparison({ ...dataSet1 }, { ...dataSet2 }).isEqual).toEqual(false)
    expect(new DataComparison({ ...dataSet1 }, { ...dataSet2 }).isUnequal).toEqual(true)
  })

  it ('should properly transform', () => {
    const comparison = new DataComparison({ ...dataSet1 }, { ...dataSet2 })
    expect(comparison.transform(({ a }) => a).oldValue).toEqual(1)
    expect(comparison.transform(({ a }) => a).newValue).toEqual(2)
    expect(comparison.transform(({ b }) => b.b1).isEqual).toEqual(false)
    expect(comparison.transform(({ b }) => b.b2).isEqual).toEqual(true)
  })

  it ('should properly describe array changes', () => {
    const comparison = new DataComparison({ ...dataSet1 }, { ...dataSet2 })
    expect(comparison.transform(({ c }) => c).addedArrayValues).toEqual([4, 5, { c2: 'different-2' }])
    expect(comparison.transform(({ c }) => c).removedArrayValues).toEqual([1, 2, { c2: 'different-1' }])
  })

  it ('should properly describe diffs', () => {
    expect(new DataComparison(1, 3).numericalDiff).toEqual(2)
    expect(new DataComparison(undefined, 3).numericalDiff).toEqual(3)
    expect(new DataComparison({ a: 1, b: 10, d: 1000, e: 'hello' }, { a: 3, c: 100, d: 1000, e: 'world' }).objectNumericalDiff).toEqual({ a: 2, b: -10, c: 100 })
  })
})
