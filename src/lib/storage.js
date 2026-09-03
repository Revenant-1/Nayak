import * as SecureStore from 'expo-secure-store'

export async function setItem(key, value) {
    await SecureStore.setItemAsync(key, String(value))
}

export async function getItem(key) {
    return SecureStore.getItemAsync(key)
}

export async function removeItem(key) {
    await SecureStore.deleteItemAsync(key)
}

export async function setJSON(key, value) {
    await setItem(key, JSON.stringify(value))
}

export async function getJSON(key) {
    const value = await getItem(key)

    if (!value) {
        return null
    }

    try {
        return JSON.parse(value)
    } catch {
        return null
    }
}

export const storage = {
    setItem,
    getItem,
    removeItem,
    setJSON,
    getJSON,
}
