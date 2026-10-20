import { useState } from 'react'
import { api } from './api.js'
import { categoryName } from './categories.js'

export default function CategoryForm({ categories, onCreated }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Enter a category name.')
      return
    }

    const normalized = trimmedName.toLowerCase()

    const exists = categories.some((category) =>
      category.name.trim().toLowerCase() === normalized ||
      categoryName(category.name).trim().toLowerCase() === normalized
    )

    if (exists) {
      setError('This category already exists.')
      return
    }

    setBusy(true)

    try {
      const created = await api.createCategory({
        name: trimmedName,
        icon: '🏷️',
      })

      onCreated(created)
      setName('')
      setSuccess(`Category "${created.name}" added.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="block">
      <h2>Add a category</h2>

      <form className="expense-form" onSubmit={submit}>
        <label>
          Category name
          <input
            required
            maxLength={60}
            value={name}
            disabled={busy}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
              setSuccess('')
            }}
            placeholder="For example, Books"
          />
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {success && <p role="status">{success}</p>}

        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Add category'}
        </button>
      </form>
    </section>
  )
}