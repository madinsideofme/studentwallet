const number = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 2,
})

export const money = (value) => `${number.format(value)} ₸`

export const todayISO = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const monthISO = () => todayISO().slice(0, 7)

export const shortDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })

export const monthTitle = (iso) =>
  new Date(`${iso}-01T00:00:00`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

export const daysWord = (n) => (n === 1 ? 'day' : 'days')