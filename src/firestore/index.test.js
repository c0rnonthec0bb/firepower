
import { mockFirebase } from 'firestore-jest-mock'

import FirepowerDocSnap from '@/firestore/FirepowerDocSnap'

import {
  getDoc,
} from './index.js'

mockFirebase({
  database: {
    users: [
      { id: 'abc123', name: 'Homer Simpson' },
      { id: 'abc456', name: 'Lisa Simpson' },
    ],
    posts: [
      { id: '123abc', title: 'Really cool title' },
    ],
  },
})


describe('getDoc', () => {
  it ('should properly get data', async () => {
    const result = await getDoc('users/abc123')
    expect(result).toBeInstanceOf(FirepowerDocSnap)
    expect(result.data).toEqual({ name: 'Homer Simpson' })
  })
})
