// =============================================================
// WHATSAPP — Checkout Link Generator
// =============================================================

/**
 * Formats price according to store currency settings
 */
export const formatPrice = (price, currencySymbol = '$', currencyCode = 'COP') => {
  return `${currencySymbol}${Number(price).toLocaleString('es-CO')}`
}

/**
 * Generates WhatsApp message with cart summary and delivery details
 * @param {Array} items - Cart items [{product, size, quantity}]
 * @param {Object} settings - Store settings
 * @param {Object} [customerInfo] - Customer delivery details {name, phone, city, address, notes}
 * @returns {string} Formatted order message
 */
export const buildWhatsAppMessage = (items, settings, customerInfo = null) => {
  const { store_name, currency_symbol, currency_code, welcome_message } = settings

  const lines = items.map((item) => {
    const currentPrice = formatPrice(item.product.price, currency_symbol, currency_code)
    const hasPromo = item.product?.is_on_sale && item.product?.original_price > item.product?.price
    if (hasPromo) {
      const origPrice = formatPrice(item.product.original_price, currency_symbol, currency_code)
      const discount = Math.round(
        ((item.product.original_price - item.product.price) / item.product.original_price) * 100
      )
      return `• ${item.product.name} — Talla: ${item.size} — *${currentPrice}* ~${origPrice}~ 🔥 (-${discount}% OFF)`
    }
    return `• ${item.product.name} — Talla: ${item.size} — ${currentPrice}`
  })

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const totalFormatted = formatPrice(total, currency_symbol, currency_code)

  const deliveryLines = customerInfo && (customerInfo.name || customerInfo.city || customerInfo.address)
    ? [
        '',
        '📦 *DATOS PARA EL ENVÍO:*',
        customerInfo.name ? `• *Cliente:* ${customerInfo.name}` : null,
        customerInfo.city ? `• *Ciudad:* ${customerInfo.city}` : null,
        customerInfo.address ? `• *Dirección:* ${customerInfo.address}` : null,
        customerInfo.phone ? `• *Teléfono:* ${customerInfo.phone}` : null,
        customerInfo.notes ? `• *Detalle:* ${customerInfo.notes}` : null,
      ].filter(Boolean)
    : []

  const message = [
    welcome_message || `Hola ${store_name}!`,
    ...deliveryLines,
    '',
    '🛍️ *PRENDAS SOLICITADAS:*',
    ...lines,
    '',
    `*TOTAL: ${totalFormatted}*`,
    '',
    '¿Tienen todo disponible para entrega inmediata? 😊',
  ].join('\n')

  return message
}

/**
 * Cleans and normalizes WhatsApp phone numbers.
 * Removes non-digits, and auto-prepends Colombia country code 57 for 10-digit mobile numbers.
 *
 * @param {string|number} phone - Raw input phone number
 * @returns {string} Digits-only international phone string
 */
export const sanitizeWhatsAppNumber = (phone) => {
  if (!phone) return ''
  let clean = String(phone).replace(/\D/g, '')
  // Si tiene 10 dígitos y empieza por 3 (móvil colombiano estándar ej: 3001234567), anteponer 57
  if (clean.length === 10 && clean.startsWith('3')) {
    clean = `57${clean}`
  }
  return clean
}

/**
 * Opens WhatsApp with formatted order message
 * @param {Array} items - Cart items
 * @param {Object} settings - Store settings
 * @param {Object} [customerInfo] - Customer details
 */
export const openWhatsAppCheckout = (items, settings, customerInfo = null) => {
  const rawNumber = settings?.whatsapp_number
  const cleanNumber = sanitizeWhatsAppNumber(rawNumber)

  if (!cleanNumber || cleanNumber.length < 8) {
    throw new Error('El número de WhatsApp no está configurado correctamente')
  }

  const message = buildWhatsAppMessage(items, settings, customerInfo)
  const encoded = encodeURIComponent(message)
  const url = `https://wa.me/${cleanNumber}?text=${encoded}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
