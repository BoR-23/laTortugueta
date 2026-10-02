import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LanguageSwitcher } from '../LanguageSwitcher'

const push = vi.fn()
let pathname = '/'

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push })
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    pathname = '/'
    push.mockReset()
  })

  it('offers Valencian from the main catalog and opens its localized home', async () => {
    render(<LanguageSwitcher />)

    const valencianButton = await screen.findByRole('button', { name: 'VA' })
    fireEvent.click(valencianButton)

    await waitFor(() => expect(push).toHaveBeenCalledWith('/ca/'))
  })
})
