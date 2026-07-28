export function openWhatsApp(phone?: string, message?: string) {
  const clean = (phone ?? '').replace(/[^0-9]/g, '')
  const base = clean
    ? `https://wa.me/${clean}`
    : 'https://wa.me/'
  const url = message ? `${base}?text=${encodeURIComponent(message)}` : base
  if (typeof window !== 'undefined') window.open(url, '_blank')
}

export function callPhone(phone?: string) {
  if (typeof window !== 'undefined' && phone) {
    window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`
  }
}

export function openMap(address?: string) {
  if (typeof window !== 'undefined' && address) {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      '_blank',
    )
  }
}
