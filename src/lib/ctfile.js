import { sleep } from './util.js'

export const WEBAPI_ORIGIN = 'https://webapi.ctfile.com'

const API_BASE = import.meta.env.DEV ? '/webapi' : WEBAPI_ORIGIN

function origin() {
  if (typeof document !== 'undefined' && document.location.origin !== 'file://') {
    return document.location.origin
  }
  return 'https://ctfile.qinlili.workers.dev'
}

function pathForId(fileid) {
  return fileid.split('-').length === 2 ? 'file' : 'f'
}

async function fetchJson(url, init = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      origin: origin(),
      referer: origin(),
      ...init.headers,
    },
  })
  const text = await res.text()
  if (!text.trim()) {
    return { code: 0, message: '接口返回空内容' }
  }
  try {
    return JSON.parse(text)
  } catch {
    return { code: 0, message: '接口返回非 JSON' }
  }
}

function buildGetFileQuery(fileid, password, token, altchaToken, refUrl) {
  const params = new URLSearchParams({
    path: pathForId(fileid),
    f: fileid,
    passcode: password || '',
    token: token || '',
    r: String(Math.random()),
    ref: refUrl || origin(),
  })
  if (altchaToken) params.set('altcha_token', altchaToken)
  return params
}

function parseGetFileFailure(jsonText) {
  const file = jsonText.file || {}
  if (jsonText.code === 423) {
    const captchaType = file.captcha_type || 'altcha'
    if (file.error_type === 'captcha_required' || file.error_type === 'captcha_invalid') {
      return {
        success: false,
        needsCaptcha: true,
        captchaType,
        errormsg:
          file.error_type === 'captcha_invalid'
            ? '人机验证已失效，请重新验证'
            : '请先完成人机验证（城通 Altcha）',
      }
    }
  }
  return {
    success: false,
    errormsg: file.message || jsonText.message || `解析失败（code ${jsonText.code}）`,
  }
}

async function fetchDownloadUrl(fileRow, sessionToken) {
  const params = new URLSearchParams({
    uid: String(fileRow.userid),
    fid: String(fileRow.file_id),
    folder_id: '0',
    share_id: fileRow.share_id != null ? String(fileRow.share_id) : '',
    file_chk: fileRow.file_chk,
    start_time: String(fileRow.start_time ?? 0),
    wait_seconds: String(fileRow.wait_seconds ?? 0),
    mb: '0',
    app: '0',
    acheck: '0',
    verifycode: String(fileRow.verifycode ?? Math.floor(1000 + Math.random() * 9000)),
    rd: String(Math.random()),
  })
  if (fileRow.access_pass) params.set('access_pass', fileRow.access_pass)
  if (sessionToken) params.set('token', sessionToken)

  for (let attempt = 0; attempt < 40; attempt++) {
    const json = await fetchJson(`${API_BASE}/get_file_url.php?${params}`)
    if (json.code === 200 && json.downurl) {
      return { success: true, link: json.downurl }
    }
    if (json.code === 218) {
      const sec = Math.max(1, Number(json.remaining_seconds) || Number(fileRow.wait_seconds) || 1)
      await sleep(sec * 1000)
      continue
    }
    if (json.code === 302) {
      return { success: false, errormsg: '需要登录！' }
    }
    return {
      success: false,
      errormsg: json.message || json.msg || `获取下载链接失败（code ${json.code}）`,
    }
  }
  return { success: false, errormsg: '等待下载授权超时，请稍后重试' }
}

export async function getByID(
  fileid,
  password,
  token,
  firstCallback,
  preferNode = 'dx',
  altchaToken = '',
  refUrl = '',
) {
  const params = buildGetFileQuery(fileid, password, token, altchaToken, refUrl)
  const jsonText = await fetchJson(`${API_BASE}/getfile.php?${params}`)

  if (jsonText.code !== 200) {
    return parseGetFileFailure(jsonText)
  }

  const row = jsonText.file
  const meta = {
    name: row.file_name,
    size: row.file_size,
    time: row.file_time,
  }

  if (firstCallback) firstCallback(meta)

  if (row.is_vip === 1) {
    let url = null
    switch (preferNode) {
      case 'dx':
        if (row.vip_dx_url) {
          url = row.vip_dx_url
          break
        }
      case 'yd':
        if (row.vip_yd_url) {
          url = row.vip_yd_url
          break
        }
      case 'lt':
        if (row.vip_lt_url) {
          url = row.vip_lt_url
          break
        }
      default:
      case 'us':
        if (row.us_downurl_a) url = row.us_downurl_a
    }
    if (!url) {
      return { success: false, ...meta, errormsg: '解析结果没有可用的 VIP 链接！' }
    }
    return { success: true, ...meta, link: url }
  }

  const dl = await fetchDownloadUrl(row, token)
  if (!dl.success) {
    return { success: false, ...meta, errormsg: dl.errormsg }
  }
  return { success: true, ...meta, link: dl.link }
}

export async function exchangeAuthCode(authCode) {
  const res = await fetch(`${API_BASE}/api.php?item=account&action=auth_code_exchange`, {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    referrerPolicy: 'unsafe-url',
    headers: {
      accept: 'application/json, text/javascript, */*; q=0.01',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: `auth_code=${encodeURIComponent(authCode)}`,
  })
  return res.json()
}
