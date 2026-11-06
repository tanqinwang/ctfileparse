const KEY = 'pref'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getPref(key) {
  const data = load()
  return data[key] ?? null
}

export function setPref(key, value) {
  const data = load()
  data[key] = value
  save(data)
  return value
}
