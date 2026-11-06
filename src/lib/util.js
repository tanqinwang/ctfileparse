export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function secToTime(s) {
  if (s <= -1) return ''
  const hour = Math.floor(s / 3600)
  const min = Math.floor(s / 60) % 60
  const sec = s % 60
  let t = hour < 10 ? `0${hour}:` : `${hour}:`
  t += min < 10 ? `0${min}:` : `${min}:`
  t += sec < 10 ? `0${sec.toFixed(0)}` : sec.toFixed(0)
  return t
}

export function sizeToBytes(size) {
  if (size.endsWith('KB')) return parseFloat(size.replace('KB', '')) * 1024
  if (size.endsWith('MB')) return parseFloat(size.replace('MB', '')) * 1024 * 1024
  if (size.endsWith('GB')) return parseFloat(size.replace('GB', '')) * 1024 * 1024 * 1024
  if (size.endsWith('B')) return parseFloat(size.replace('B', ''))
  return 0
}

export function bytesToSize(bytes) {
  if (bytes === '0' || bytes === 0) return '0B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat(bytes / k ** i).toFixed(2)}${sizes[i]}`
}
