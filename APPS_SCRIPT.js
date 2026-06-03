// =========================================================
// GOOGLE APPS SCRIPT - Dán vào Extensions > Apps Script
// =========================================================

const WEBHOOK_URL = 'https://affiliate.khoithe.com/api/sync'  // Đổi thành URL thật sau deploy
const WEBHOOK_SECRET = 'your-webhook-secret-key'               // Phải khớp với .env

function syncToWebapp() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet()
  const rows = sheet.getDataRange().getValues()

  // Bỏ qua hàng đầu (header)
  const customers = []
  for (let i = 1; i < rows.length; i++) {
    const [stt, name, phone, email, affiliateCode, registeredAt] = rows[i]
    if (!name || !phone) continue
    customers.push({
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email || '').trim(),
      affiliateCode: String(affiliateCode || '').trim(),
      registeredAt: registeredAt ? new Date(registeredAt).toISOString() : new Date().toISOString()
    })
  }

  const payload = JSON.stringify({ customers })
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: payload,
    headers: { 'x-webhook-secret': WEBHOOK_SECRET },
    muteHttpExceptions: true
  }

  const response = UrlFetchApp.fetch(WEBHOOK_URL, options)
  const result = JSON.parse(response.getContentText())
  Logger.log('Kết quả: ' + JSON.stringify(result))
  return result
}

// Tự động chạy mỗi 5 phút - Setup bằng cách:
// Apps Script > Triggers > Add Trigger > syncToWebapp > Time-driven > Minutes timer > Every 5 minutes
function setupTrigger() {
  ScriptApp.newTrigger('syncToWebapp')
    .timeBased()
    .everyMinutes(5)
    .create()
  Logger.log('Trigger đã được tạo - sync mỗi 5 phút')
}
