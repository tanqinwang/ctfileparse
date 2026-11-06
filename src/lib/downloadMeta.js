import { bytesToSize, secToTime, sizeToBytes } from './util.js'

export function speedAndEtaFromLink(link, sizeLabel) {
  try {
    const u = new URL(link)
    const speed = Number(u.searchParams.get('spd')) * Number(u.searchParams.get('limit'))
    if (!speed) {
      return { speedText: '无上限', timeText: '取决于网速' }
    }
    return {
      speedText: `${bytesToSize(speed)}/s`,
      timeText: secToTime(sizeToBytes(sizeLabel) / speed),
    }
  } catch {
    return { speedText: '—', timeText: '—' }
  }
}
