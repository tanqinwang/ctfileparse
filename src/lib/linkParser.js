export function parseLinkInput(raw) {
  let link = raw.trim()
  if (!link) return { fileId: '', password: null, message: null, error: null }

  if (link.startsWith('asaki+')) {
    const parts = decodeURI(atob(link.slice(6))).split('|||')
    return {
      fileId: parts[0] || '',
      password: parts[1] || '',
      message: '已识别 Asaki 口令',
    }
  }

  if (link.startsWith('xtc')) {
    const lastDash = link.lastIndexOf('-')
    return {
      fileId: link.slice(3, lastDash),
      password: link.slice(lastDash + 1),
      message: '已识别小通口令',
    }
  }

  if (link.includes('http')) {
    const url = new URL(link.slice(link.indexOf('http')))
    if (url.pathname.startsWith('/d')) {
      return { fileId: '', password: null, error: '文件夹解析正在开发中' }
    }
    const fileId = url.pathname.slice(url.pathname.slice(1).indexOf('/') + 2)
    let password = null
    let message = null
    const p = url.searchParams.get('p') ?? url.searchParams.get('pwd')
    if (p) {
      message = '已识别密码'
      password = p.includes('(') ? p.slice(0, p.indexOf('(')).trim() : p
    }
    const shareRef = `${url.origin}${url.pathname}`
    link = fileId
    if (link.split('-').length < 2) {
      return { fileId: link, password, message, shareRef, error: '无效的地址或 ID' }
    }
    return { fileId: link, password, message, shareRef }
  }

  if (link.split('-').length < 2) {
    return { fileId: link, password: null, error: '无效的地址或 ID' }
  }

  return { fileId: link, password: null, message: null }
}
