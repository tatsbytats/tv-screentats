const PREFIX = 'screentats:'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage full or unavailable, degrade silently */
  }
}

export const storage = {
  set: write,
  get: read,
  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key)
    } catch {
      /* noop */
    }
  },
}

export function mediaKey(id, mediaType) {
  return `${mediaType}:${id}`
}