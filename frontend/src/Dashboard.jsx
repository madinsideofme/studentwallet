import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'
import { monthISO } from './format.js'
import Hero from './Hero.jsx'
import ExpenseForm from './ExpenseForm.jsx'
import ExpenseList from './ExpenseList.jsx'
import SpendingChart from './SpendingChart.jsx'
import CategoryForm from './CategoryForm.jsx'
import CategoryBudgets from './CategoryBudgets.jsx'

export default function Dashboard({ user, onLogout }) {
  const month = monthISO()

  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(undefined)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await api.summary(month))
    } catch (err) {
      if (err.status === 404) {
        setSummary(null)
      } else {
        setError(err.message)
      }
    }
  }, [month])

  const loadExpenses = useCallback(async () => {
    try {
      setExpenses(await api.expenses())
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    api.categories()
      .then(setCategories)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  const refresh = () => {
    setError('')
    loadSummary()
    loadExpenses()
  }

  return (
    <div className="page">
      <header className="topbar">
        <span className="wordmark small">StudentWallet</span>

        <span className="who">
          {user.full_name || user.email}

          <button
            className="link"
            type="button"
            onClick={onLogout}
          >
            Log out
          </button>
        </span>
      </header>

      <main>
        {error && (
          <p className="error banner" role="alert">
            {error}
          </p>
        )}

        <Hero
          summary={summary}
          month={month}
          onSaved={loadSummary}
        />

        <ExpenseForm
          categories={categories}
          onAdded={refresh}
        />

        <CategoryForm
          categories={categories}
          onCreated={(created) => {
            setCategories((previous) => [...previous, created])
          }}
        />

        <CategoryBudgets
          categories={categories}
          expenses={expenses}
          month={month}
        />

        <SpendingChart
          expenses={expenses}
          categories={categories}
          month={month}
        />

        <ExpenseList
          expenses={
            filter
              ? expenses.filter(
                  (item) =>
                    String(item.category_id) === String(filter)
                )
              : expenses
          }
          categories={categories}
          filter={filter}
          onFilter={setFilter}
          onChanged={refresh}
        />
      </main>
    </div>
  )
}