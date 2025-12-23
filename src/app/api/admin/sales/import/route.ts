import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseClient'

// Helper to parse CSV line respecting quotes
function parseCSVLine(text: string) {
    const result = []
    let start = 0
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
            inQuotes = !inQuotes
        } else if (text[i] === ',' && !inQuotes) {
            result.push(text.substring(start, i).replace(/^"|"$/g, '').trim())
            start = i + 1
        }
    }
    result.push(text.substring(start).replace(/^"|"$/g, '').trim())
    return result
}

export async function POST(request: Request) {
    const { csv } = await request.json()

    if (!csv) {
        return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 })
    }

    const client = createSupabaseServerClient()

    // Fetch all products for fuzzy matching and pricing
    const { data: products } = await client.from('products').select('id, name, price')

    const lines = csv.split('\n').filter((l: string) => l.trim().length > 0)
    const records = []

    let lastOrder: any = {}

    // Skip header if present
    const startIndex = lines[0].toLowerCase().startsWith('pedido') ? 1 : 0

    for (let i = startIndex; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i])

        // Columns: Pedido, Fecha, Cliente, Modelo y Talla, Detalles, Entrega
        // Index:   0       1      2        3               4         5

        let orderId = cols[0]
        let dateStr = cols[1]
        let clientName = cols[2]

        // Handle "ditto" fields
        if (!orderId && lastOrder.orderId) {
            orderId = lastOrder.orderId
            dateStr = lastOrder.dateStr
            clientName = lastOrder.clientName
        } else {
            // New order, update lastOrder reference
            lastOrder = { orderId, dateStr, clientName }
        }

        if (!orderId) continue // Skip if we still don't have an order ID

        // Parse Model and Size
        const modelAndSize = cols[3] || ''
        // Typical format: "Benimeli T/39" or "Els Millars T/39"
        // We want to extract "Benimeli" and "39"
        const sizeMatch = modelAndSize.match(/T\/(\d+(?:[.,]\d+)?)/i)
        const size = sizeMatch ? sizeMatch[1] : ''
        const productName = modelAndSize.replace(/T\/\d+(?:[.,]\d+)?/i, '').trim()

        // Fuzzy match product ID & Price
        let productId = null
        let basePrice = 0

        if (productName && products) {
            // Simple case-insensitive match first
            const exact = products.find((p: any) => p.name.toLowerCase() === productName.toLowerCase())
            if (exact) {
                productId = exact.id
                basePrice = exact.price || 0
            } else {
                // Try partial match
                const partial = products.find((p: any) =>
                    p.name.toLowerCase().includes(productName.toLowerCase()) ||
                    productName.toLowerCase().includes(p.name.toLowerCase())
                )
                if (partial) {
                    productId = partial.id
                    basePrice = partial.price || 0
                }
            }
        }

        // Auto-detect Wholesale
        const details = cols[4] || ''
        const isWholesale = (clientName.toLowerCase().includes('mayor') || details.toLowerCase().includes('mayor'))

        // Calculate Final Price
        let finalPrice = basePrice
        if (isWholesale) {
            finalPrice = basePrice * 0.5
        }

        // Parse Date
        let date = null
        const year = new Date().getFullYear()

        if (dateStr) {
            const lowerDate = dateStr.toLowerCase().trim()

            // Special handling for "Reyes" -> Jan 6th of next year (or current if early in year)
            if (lowerDate.includes('reyes')) {
                const now = new Date()
                // If we are in late year (e.g. Nov/Dec), Reyes is next year.
                // If we are in early year (Jan), Reyes is this year.
                const targetYear = now.getMonth() > 6 ? now.getFullYear() + 1 : now.getFullYear()
                // Month is 0-indexed in JS Date, so 0 is January
                date = new Date(targetYear, 0, 6).toISOString().split('T')[0]
            } else if (lowerDate.includes('enero')) {
                date = `${year + 1}-01-15` // Default mid-January
            } else if (lowerDate.includes('diciembre') || lowerDate.includes('navidad')) {
                date = `${year}-12-25`
            } else {
                // Standard DD/MM
                const [day, month] = dateStr.split(/[/-]/)
                if (day && month) {
                    // If month is 01 or 02 and we are in late year, it's likely next year
                    const monthNum = parseInt(month)
                    const currentMonth = new Date().getMonth() + 1
                    const finalYear = (currentMonth > 9 && monthNum < 3) ? year + 1 : year

                    date = `${finalYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                }
            }
        }

        // Helper to parse delivery date text
        const parseDeliveryDate = (text: string) => {
            if (!text) return text
            const lower = text.toLowerCase()
            if (lower.includes('reyes')) return '06/01'
            if (lower.includes('navidad')) return '25/12'
            if (lower.includes('enero')) return '15/01' // Approximate
            if (lower.includes('febrero')) return '15/02'
            return text
        }

        records.push({
            order_id: orderId,
            date: date,
            client: clientName,
            product_name: productName,
            size: size,
            details: details,
            delivery_date: parseDeliveryDate(cols[5] || ''),
            product_id: productId,
            product_price: finalPrice,
            is_wholesale: isWholesale,
            status: 'pending'
        })
    }

    const { error } = await client.from('sales').insert(records)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: `Imported ${records.length} records successfully` })
}
