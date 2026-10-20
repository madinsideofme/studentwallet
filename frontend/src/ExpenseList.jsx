import { useState } from 'react'
import { api } from './api.js'
import { money, shortDate, todayISO } from './format.js'
import { categoryName } from './categories.js'

export default function ExpenseList({
  expenses,
  categories,
  filter,
  onFilter,
  onChanged,
}) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(null)

  const byId = Object.fromEntries(
    categories.map((category) => [category.id, category])
  )

  function startEditing(item) {
    setError('')
    setEditingId(item.id)
    setDraft({
      amount: String(item.amount),
      category_id: String(item.category_id),
      type: item.type,
      note: item.note || '',
      spent_at: item.spent_at,
    })
  }

  function cancelEditing() {
    setEditingId(null)
    setDraft(null)
    setError('')
  }

  function changeDraft(field, value) {
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  async function save(e) {
    e.preventDefault()
    setError('')

    const amount = Number(draft.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }

    if (!draft.spent_at || draft.spent_at > todayISO()) {
      setError('Choose today or an earlier date.')
      return
    }

    if (!categories.some(
      (category) => String(category.id) === draft.category_id
    )) {
      setError('Choose a valid category.')
      return
    }

    setBusy(true)

    try {
      await api.updateExpense(editingId, {
        amount,
        category_id: Number(draft.category_id),
        type: draft.type,
        note: draft.note.trim(),
        spent_at: draft.spent_at,
      })

      setEditingId(null)
      setDraft(null)
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(item) {
    const category = byId[item.category_id]
    const name = item.note || categoryName(category?.name)

    if (!window.confirm(
      `Delete "${name}" for ${money(item.amount)}?`
    )) {
      return
    }

    setError('')
    setBusy(true)

    try {
      await api.deleteExpense(item.id)
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="block">
      <div className="block-head">
        <h2>Transaction history</h2>

        <label className="filter">
          <span className="sr-only">Filter by category</span>
          <select
            value={filter}
            disabled={busy || editingId !== null}
            onChange={(e) => onFilter(e.target.value)}
          >
            <option value="">All categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {categoryName(category.name)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {editingId !== null && draft && (
        <form className="expense-form" onSubmit={save}>
          <h3>Edit transaction</h3>

          <div className="grid-2">
            <label>
              Amount, ₸
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                disabled={busy}
                value={draft.amount}
                onChange={(e) =>
                  changeDraft('amount', e.target.value)
                }
              />
            </label>

            <label>
              Category
              <select
                required
                disabled={busy}
                value={draft.category_id}
                onChange={(e) =>
                  changeDraft('category_id', e.target.value)
                }
              >
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
              Date
              <input
                type="date"
                required
                max={todayISO()}
                disabled={busy}
                value={draft.spent_at}
                onChange={(e) =>
                  changeDraft('spent_at', e.target.value)
                }
              />
            </label>

            <label>
              Transaction type
              <select
                disabled={busy}
                value={draft.type}
                onChange={(e) =>
                  changeDraft('type', e.target.value)
                }
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
          </div>

          <label>
            Note
            <input
              maxLength={255}
              disabled={busy}
              value={draft.note}
              onChange={(e) =>
                changeDraft('note', e.target.value)
              }
            />
          </label>

          <div className="row">
            <button
              className="primary"
              type="submit"
              disabled={busy}
            >
              {busy ? 'Saving…' : 'Save changes'}
            </button>

            <button
              className="link"
              type="button"
              disabled={busy}
              onClick={cancelEditing}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {expenses.length === 0 ? (
        <p className="empty">
          {filter
            ? 'No transactions in this category.'
            : 'No transactions yet. Add your first expense above.'}
        </p>
      ) : (
        <ul className="rows">
          {expenses.map((item) => {
            const category = byId[item.category_id]
            const name = categoryName(category?.name)
            const income = item.type === 'income'

            return (
              <li key={item.id} className="row-item">
                <span className="row-icon" aria-hidden="true">
                  {category?.icon || '🧾'}
                </span>

                <span className="row-main">
                  <span className="row-title">
                    {item.note || name}
                  </span>
                  <span className="row-sub">
                    {name}, {shortDate(item.spent_at)}
                    {item.source === 'siri' ? ', via Siri' : ''}
                  </span>
                </span>

                <span className={`row-amount ${income ? 'plus' : ''}`}>
                  {income ? '+' : '−'}
                  {money(item.amount)}
                </span>

                <button
                  className="link"
                  type="button"
                  disabled={busy || editingId !== null}
                  onClick={() => startEditing(item)}
                  aria-label={`Edit ${item.note || name}`}
                >
                  Edit
                </button>

                <button
                  className="icon-btn"
                  type="button"
                  disabled={busy || editingId !== null}
                  onClick={() => remove(item)}
                  aria-label={`Delete ${name} for ${money(item.amount)}`}
                  title="Delete transaction"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}