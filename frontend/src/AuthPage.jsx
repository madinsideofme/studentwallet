import { useState } from 'react'
import { api, setToken } from './api.js'

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (
      isRegister &&
      (
        password.length < 8 ||
        !/\p{L}/u.test(password) ||
        !/[0-9]/.test(password)
      )
    ) {
      setError('Use at least 8 characters, including a letter and a number.')
      return
    }

    setBusy(true)

    try {
      const credentials = {
        email: email.trim(),
        password,
      }

      if (isRegister) {
        await api.register({
          ...credentials,
          full_name: fullName.trim(),
        })
      }

      const { access_token } = await api.login(credentials)
      setToken(access_token)
      onAuth(await api.me())
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setError('')
    setPassword('')
  }

  return (
    <main className="auth">
      <div className="auth-intro">
        <h1 className="wordmark">StudentWallet</h1>
        <p>
          Track your expenses and see how much you can spend each day.
        </p>
      </div>

      <form className="auth-form" onSubmit={submit}>
        <h2>{isRegister ? 'Create an account' : 'Log in'}</h2>

        {isRegister && (
          <label>
            Name
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              placeholder="Your name"
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="name@example.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            required
            minLength={isRegister ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              isRegister ? 'new-password' : 'current-password'
            }
            placeholder={
              isRegister
                ? 'At least 8 characters, a letter and a number'
                : 'Enter your password'
            }
          />
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button className="primary" type="submit" disabled={busy}>
          {busy
            ? 'Please wait…'
            : isRegister
              ? 'Create account'
              : 'Log in'}
        </button>

        <button
          className="link"
          type="button"
          disabled={busy}
          onClick={switchMode}
        >
          {isRegister
            ? 'Already have an account? Log in'
            : 'No account yet? Sign up'}
        </button>
      </form>
    </main>
  )
}