import { useState } from 'react'
import { api } from './api.js'
import { money } from './format.js'

export default function Hero({ summary, month, onSaved }) {
  const [editing, setEditing] = useState(false)

  const monthLabel = new Date(`${month}-01T00:00:00`)
    .toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })

  if (summary === undefined) {
    return (
      <section className="hero" aria-busy="true">
        <p className="hero-label">Loading budget…</p>
      </section>
    )
  }

  if (summary === null || editing) {
    return (
      <section className="hero">
        <p className="hero-label">{monthLabel}</p>

        <h2 className="hero-title">
          {summary === null
            ? 'Set your monthly budget'
            : 'Edit your budget'}
        </h2>

        <p className="hero-text">
          {summary === null
            ? 'See how much you can spend each day.'
            : 'The new amount will replace your current monthly budget.'}
        </p>

        <BudgetForm
          month={month}
          initial={summary ? summary.limit : ''}
          onSaved={() => {
            setEditing(false)
            onSaved()
          }}
          onCancel={summary ? () => setEditing(false) : null}
        />
      </section>
    )
  }

  const {
    limit,
    spent,
    remaining,
    percent_used: percent,
    days_left: daysLeft,
    daily_limit: daily,
  } = summary

  const over = remaining < 0
  const exhausted = remaining <= 0
  const state = exhausted ? 'bad' : percent >= 80 ? 'warn' : 'ok'
  const fill = Math.max(0, Math.min(percent, 100))

  return (
    <section className={`hero hero-${state}`}>
      <p className="hero-label">
        {over
          ? 'Over budget'
          : exhausted
            ? 'Budget used up'
            : 'Available to spend today'}
      </p>

      <p className="hero-number">
        {money(exhausted ? Math.abs(remaining) : daily)}
      </p>

      {exhausted ? (
        <p className="hero-text">
          {over
            ? 'This is the amount spent above your monthly budget.'
            : 'You have used your entire monthly budget.'}
        </p>
      ) : (
        <p className="hero-text">
          {money(remaining)} left out of {money(limit)}.
          {' '}{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
          this month.
        </p>
      )}

      <div
        className="meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(fill)}
        aria-label="Monthly budget used"
      >
        <div
          className="meter-fill"
          style={{ width: `${fill}%` }}
        />
        <span
          className="meter-tick"
          style={{ left: '80%' }}
          aria-hidden="true"
        />
      </div>

      <div className="hero-foot">
        <span>
          Spent {money(spent)} ({percent}%)
        </span>

        <button
          className="link light"
          type="button"
          onClick={() => setEditing(true)}
        >
          Edit budget
        </button>
      </div>

      {state === 'warn' && (
        <p className="hero-alert">
          You have used at least 80% of your monthly budget.
        </p>
      )}

      {state === 'bad' && (
        <p className="hero-alert">
          You have reached your monthly budget limit.
        </p>
      )}
    </section>
  )
}

function BudgetForm({ month, initial, onSaved, onCancel }) {
  const [value, setValue] = useState(
    initial === '' ? '' : String(initial)
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')

    const amount = Number(value)

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter an amount greater than zero')
      return
    }

    setBusy(true)

    try {
      await api.setBudget({
        month,
        limit_amount: amount,
      })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="budget-form" onSubmit={submit}>
      <label>
        Monthly budget, ₸
        <input
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="For example, 150000"
        />
      </label>

      <div className="row">
        <button
          className="primary light"
          type="submit"
          disabled={busy}
        >
          {busy ? 'Saving…' : 'Save budget'}
        </button>

        {onCancel && (
          <button
            className="link light"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <p className="error on-dark" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}