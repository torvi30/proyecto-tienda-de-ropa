// =============================================================
// WHATSAPP — Generador de enlaces de checkout
// =============================================================

/**
 * Formatea un precio segun la moneda de la tienda
 */
export const formatPrice = (price, currencySymbol = '$', currencyCode = 'COP') => {
  return `${currencySymbol}${Number(price).toLocaleString('es-CO')}`
}

/**
 * Genera el mensaje de WhatsApp con el resumen del carrito
 * @param {Array} items - Items del carrito [{product, size, quantity}]
 * @param {Object} settings - Configuracion de la tienda
 * @returns {string} Mensaje formateado
 */
export const buildWhatsAppMessage = (items, settings) => {
  const { store_name, currency_symbol, currency_code, welcome_message } = settings

  const lines = items.map((item) => {
    const price = formatPrice(item.product.price, currency_symbol, currency_code)
    return `• ${item.product.name} — Talla: ${item.size} — ${price}`
  })

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const totalFormatted = formatPrice(total, currency_symbol, currency_code)

  const message = [
    welcome_message || `Hola ${store_name}!`,
    '',
    'Mi pedido:',
    ...lines,
    '',
    `*TOTAL: ${totalFormatted}*`,
    '',
    '¿Tienen todo disponible? 😊',
  ].join('\n')

  return message
}

/**
 * Abre WhatsApp con el mensaje del pedido
 * @param {Array} items - Items del carrito
 * @param {Object} settings - Configuracion de la tienda
 */
export const openWhatsAppCheckout = (items, settings) => {
  const { whatsapp_number } = settings
  const message = buildWhatsAppMessage(items, settings)
  const encoded = encodeURIComponent(message)
  const url = `https://wa.me/${whatsapp_number}?text=${encoded}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
