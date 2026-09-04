import * as SecureStore from 'expo-secure-store'

const storage = {
  async setItem(key, value) {
    if (value === null || value === undefined) {
      await SecureStore.deleteItemAsync(key)
      return
    }

    await SecureStore.setItemAsync(key, String(value))
  },

  async getItem(key) {
    return SecureStore.getItemAsync(key)
  },

  async removeItem(key) {
    await SecureStore.deleteItemAsync(key)
  },

  async setJSON(key, value) {
    await SecureStore.setItemAsync(key, JSON.stringify(value))
  },

  async getJSON(key) {
    const value = await SecureStore.getItemAsync(key)

    if (!value) {
      return null
    }

    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  },

  async removeJSON(key) {
    await SecureStore.deleteItemAsync(key)
  },

  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync('auth_token'),
      SecureStore.deleteItemAsync('nayak_session_id'),
      SecureStore.deleteItemAsync('nayak_user'),
    ])
  },
}

export default storage
export { storage }
