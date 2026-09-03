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

  async clear() {
    // SecureStore does not provide a way to enumerate all keys.
    // Remove the keys currently used by Nayak explicitly.
    await Promise.all([
      SecureStore.deleteItemAsync('auth_token'),
      SecureStore.deleteItemAsync('nayak_session_id'),
      SecureStore.deleteItemAsync('nayak_user'),
    ])
  },
}

export default storage
export { storage }