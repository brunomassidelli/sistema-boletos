import { google } from 'googleapis'
import path from 'path'

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'credentials/google.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const spreadsheetId = '12TM6HNpJ4YKBBwpA_9eOIewFvD9NznzwY6wPC9hBLYA'

export async function GET() {
  const client = await auth.getClient()
  const sheets = google.sheets({ version: 'v4', auth: client })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Fornecedor!A:C',
  })

  return Response.json(response.data.values || [])
}

export async function POST(req) {
  const body = await req.json()
  const client = await auth.getClient()
  const sheets = google.sheets({ version: 'v4', auth: client })

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Fornecedor!A:C',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[body.nome, body.telefone, body.documento]],
    },
  })

  return Response.json({ success: true })
}