const STORE_KEY = 'store'

export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    const records = JSON.parse(raw)
    return Array.isArray(records) ? records : []
  } catch {
    return []
  }
}

export function saveHistoryRecord(record) {
  if (record.link.startsWith('tempdir')) return
  let records = loadHistory()
  records = records.filter((r) => r.link !== record.link)
  records.push(record)
  localStorage.setItem(STORE_KEY, JSON.stringify(records))
}

export function clearHistory() {
  localStorage.removeItem(STORE_KEY)
}

export function removeHistoryItem(link) {
  const records = loadHistory().filter((r) => r.link !== link)
  localStorage.setItem(STORE_KEY, JSON.stringify(records))
}
