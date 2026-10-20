import { useEffect, useState } from 'react'
import { api } from './api.js'
import { todayISO } from './format.js'
import { categoryName } from './categories.js'

export default function ExpenseForm({ categories, onAdded }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Select the first category when categories load.
  useEffect(() => {
    if (!categoryId && categories.length) {
      setCategoryId(String(categories[0].id))
    }
  }, [categories, categoryId])

  async function submit(e) {
    e.preventDefault()
    setError('')

    const value = Number(amount)

    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero')
      return
    }

    // Check the date before sending the transaction.
    if (!date || date > todayISO()) {
      setError('Choose today or an earlier date')
      return
    }

    if (!categories.some((category) => String(category.id) === categoryId)) {
      setError('Choose a valid category')
      return
    }

    setBusy(true)

    try {
      await api.addExpense({
        amount: value,
        category_id: Number(categoryId),
        type,
        note: note.trim(),
        spent_at: date,
        source: 'web',
      })

      setAmount('')
      setNote('')
      onAdded()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="block">
      <h2>New transaction</h2>

      <form className="expense-form" onSubmit={submit}>
        <div
          className="segmented"
          role="group"
          aria-label="Transaction type"
        >
          <button
            type="button"
            className={type === 'expense' ? 'on' : ''}
            aria-pressed={type === 'expense'}
            onClick={() => setType('expense')}
          >
            Expense
          </button>

          <button
            type="button"
            className={type === 'income' ? 'on' : ''}
            aria-pressed={type === 'income'}
            onClick={() => setType('income')}
          >
            Income
          </button>
        </div>

        <div className="grid-2">
          <label>
            Amount, ₸
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1500"
            />
          </label>

          <label>
            Category
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="" disabled>
                Choose a category
              </option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                 {category.icon} {categoryName(category.name)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid-2">
          <label>
            Note
            <input
              value={note}
              maxLength={255}
              onChange={(e) => setNote(e.target.value)}
              placeholder="For example, lunch"
            />
          </label>

          <label>
            Date
            <input
              type="date"
              required
              max={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button
          className="primary"
          type="submit"
          disabled={busy || !categoryId}
        >
          {busy ? 'Saving…' : 'Add transaction'}
        </button>
      </form>
    </section>
  )
}