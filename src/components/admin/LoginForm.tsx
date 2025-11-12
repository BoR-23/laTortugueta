'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password
    })

    setLoading(false)
    if (result?.error) {
      setError('Credenciales incorrectas')
    } else {
      window.location.reload()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md space-y-4 rounded-3xl border border-neutral-200 bg-white px-6 py-8"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Panel privado</p>
        <h1 className="mt-3 text-2xl font-semibold text-neutral-900">Accede a la administración</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Introduce tus credenciales para gestionar el catálogo.
        </p>
      </div>

      <label className="block text-xs uppercase tracking-[0.3em] text-neutral-500">
        Email
        <input
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          required
          className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
        />
      </label>

      <label className="block text-xs uppercase tracking-[0.3em] text-neutral-500">
        Contraseña
        <input
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          required
          className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
