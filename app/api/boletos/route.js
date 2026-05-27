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
    range: 'Boletos!A:H',
  })

  return Response.json(response.data.values || [])
}

export async function POST(req) {
  const body = await req.json()
  const client = await auth.getClient()
  const sheets = google.sheets({ version: 'v4', auth: client })

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Boletos!A:H',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: body.boletos.map((boleto) => [
        boleto.fornecedor,
        boleto.parcela,
        boleto.vencimento,
        boleto.os,
        boleto.nfs,
        boleto.valor,
        boleto.status,
      ]),
    },
  })

  return Response.json({ success: true })
}

export async function PATCH(req) {
  const body = await req.json()
  const { id } = body

  const client = await auth.getClient()
  const sheets = google.sheets({ version: 'v4', auth: client })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Boletos!A:H',
  })

  const rows = response.data.values || []
  const rowIndex = rows.findIndex((row) => String(row[0]) === String(id))

  if (rowIndex === -1) {
    return Response.json({ success: false, error: 'Boleto não encontrado' })
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Boletos!G${rowIndex + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['Pago']] },
  })

  return Response.json({ success: true })
}