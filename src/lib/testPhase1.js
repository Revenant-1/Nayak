import { api } from './api'
import { storage } from './storage'

export async function runPhase1Test() {
    console.log('--- PHASE 1 TEST START ---')

    // SecureStore test
    await storage.setItem('phase1_test', 'working')

    const storedValue = await storage.getItem('phase1_test')

    console.log('SecureStore set/get:', storedValue)

    if (storedValue !== 'working') {
        throw new Error('SecureStore set/get test failed')
    }

    await storage.removeItem('phase1_test')

    const removedValue = await storage.getItem('phase1_test')

    console.log('SecureStore remove:', removedValue)

    if (removedValue !== null) {
        throw new Error('SecureStore remove test failed')
    }

    // Backend history test
    const history = await api.history('test')

    console.log('Backend history response:', history)

    console.log('--- PHASE 1 TEST PASSED ---')
}

