'use client'

import { FormEvent, useState } from 'react'

export function ContactQuickForm() {
  const [status, setStatus] = useState<'idle' | 'sent'>('idle')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('sent')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
        Nombre
        <input
          type="text"
          name="name"
          className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
        />
      </label>
      <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
        Correo electrónico
        <input
          type="email"
          name="email"
          className="mt-2 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
        />
      </label>
      <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">
        Mensaje
        <textarea
          name="message"
          rows={3}
          className="mt-2 w-full rounded-3xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-0"
        />
      </label>
      <button type="submit" className="btn-primary w-full px-4 py-3 text-sm uppercase tracking-[0.3em]">
        {status === 'sent' ? 'Mensaje enviado' : 'Enviar mensaje'}
      </button>
      {status === 'sent' && (
        <p className="text-xs text-neutral-500">
          Gracias por tu mensaje. Te responderemos en 24-48h. Puedes escribirnos directamente a hola@latortugueta.com.
        </p>
      )}
    </form>
  )
}
