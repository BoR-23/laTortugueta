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
        // Detect separator (Tab vs Comma)
        const isTab = lines[i].includes('\t')
        const rawCols = isTab ? lines[i].split('\t') : parseCSVLine(lines[i])

        // Clean whitespace
        const cols = rawCols.map(c => c.trim())

        // Detection of "Extended" format (Index 1 is 'M' or 'N' single char)
        // Standard: [ID, Date, Client, Product, Details, Delivery]
        // Extended: [ID, Type, Date, Client, Product, Delivery, Notes]
        const isExtended = cols[1] && /^[MN]$/i.test(cols[1])

        let orderId, dateStr, clientName, modelAndSize, details, deliveryStr
        let type = 'N'

        if (isExtended) {
            orderId = cols[0]
            type = cols[1].toUpperCase() // M or N
            dateStr = cols[2]
            clientName = cols[3]
            modelAndSize = cols[4]
            deliveryStr = cols[5] // In extended, 5 seems to be delivery ("final febrer")
            details = cols[6] || '' // Notes at the end

            // Sometimes details/delivery are swapped or merged, but let's stick to this mapping based on the paste
        } else {
            orderId = cols[0]
            dateStr = cols[1]
            clientName = cols[2]
            modelAndSize = cols[3]
            details = cols[4]
            deliveryStr = cols[5]
        }

        // Handle "ditto" fields (only for Order ID/Date/Client/Type)
        if (!orderId && lastOrder.orderId) {
            orderId = lastOrder.orderId
            dateStr = lastOrder.dateStr
            clientName = lastOrder.clientName
            type = lastOrder.type || 'N'
        } else {
            // New order, update lastOrder reference
            lastOrder = { orderId, dateStr, clientName, type }
        }

        if (!orderId) continue

        // ... Model Parsing ...
        const sizeMatch = (modelAndSize || '').match(/T\/(\d+(?:[.,]\d+)?)/i)
        const size = sizeMatch ? sizeMatch[1] : ''
        const productName = (modelAndSize || '').replace(/T\/\d+(?:[.,]\d+)?/i, '').trim()

        // ... Fuzzy Match Product ... (Previous logic reusable if we just set variables correctly)
        // (Re-implementing minimal fuzzy match here to keep flow clear or assume existing scope)

        // Fuzzy match product ID & Price
        let productId = null
        let basePrice = 0

        if (productName && products) {
            const exact = products.find((p: any) => p.name.toLowerCase() === productName.toLowerCase())
            if (exact) {
                productId = exact.id
                basePrice = exact.price || 0
            } else {
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
        // Priority: Explicit Type 'M' > Text 'Mayor'
        let isWholesale = false
        if (isExtended) {
            isWholesale = (type === 'M')
        } else {
            isWholesale = (clientName.toLowerCase().includes('mayor') || (details || '').toLowerCase().includes('mayor'))
        }

        // Calculate Final Price
        let finalPrice = basePrice
        if (isWholesale) {
            finalPrice = basePrice * 0.5
        }

        // ... Date Parsing ... (Reuse existing helper or assume consistent)
        let date = null
        const year = new Date().getFullYear()

        if (dateStr) {
            const lowerDate = dateStr.toLowerCase().trim()
            // Special handling for "Reyes" -> Jan 6th of next year (or current if early in year)
            if (lowerDate.includes('reyes')) {
                const now = new Date()
                const targetYear = now.getMonth() > 6 ? now.getFullYear() + 1 : now.getFullYear()
                date = new Date(targetYear, 0, 6).toISOString().split('T')[0]
            } else if (lowerDate.includes('enero')) {
                date = `${year + 1}-01-15`
            } else if (lowerDate.includes('diciembre') || lowerDate.includes('navidad')) {
                date = `${year}-12-25`
            } else {
                // Standard DD/MM
                const parts = dateStr.split(/[/-]/)
                if (parts.length >= 2) {
                    const day = parts[0]
                    const month = parts[1]
                    const yearPart = parts[2]

                    // If explicit year provided (2025), use it
                    let finalYear = year
                    if (yearPart && yearPart.length === 4) {
                        finalYear = parseInt(yearPart)
                    } else {
                        // Heuristic for late/early year
                        const monthNum = parseInt(month)
                        const currentMonth = new Date().getMonth() + 1
                        finalYear = (currentMonth > 9 && monthNum < 3) ? year + 1 : year
                    }
                    date = `${finalYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                }
            }
        }

        const parseDeliveryDate = (text: string) => {
            if (!text) return text
            const lower = text.toLowerCase()
            if (lower.includes('reyes')) return '06/01'
            if (lower.includes('navidad')) return '25/12'
            if (lower.includes('enero')) return '15/01'
            if (lower.includes('febrero')) return '15/02'
            return text
        }

        records.push({
            order_id: orderId,
            date: date,
            client: clientName,
            product_name: productName,
            size: size,
            details: isExtended ? details : (details || ''), // Map notes to details
            delivery_date: parseDeliveryDate(deliveryStr || ''),
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
