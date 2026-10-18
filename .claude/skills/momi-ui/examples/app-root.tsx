/**
 * App root: the providers momi-ui expects, once, near the top.
 * - ThemeProvider: light / dark / system, stored in localStorage (`forcedTheme="dark"` for dark-only apps).
 * - LocaleProvider: built-in text (`messages`) and date/number formatting (`locale`).
 * - TooltipProvider: neighbouring tooltips open instantly (optional).
 * - Toaster: needed once if anything calls `toast()`.
 */
import { useState } from 'react'
import {
  LocaleProvider,
  ThemeProvider,
  ToggleGroup,
  ToggleGroupItem,
  Toaster,
  TooltipProvider,
  vi,
} from 'momi-ui'

type Language = 'en' | 'vi'

export function AppRoot({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('vi')
  return (
    <ThemeProvider defaultTheme="system">
      {/* Switching language = switching both props; undefined messages means English. */}
      <LocaleProvider
        locale={language === 'vi' ? 'vi-VN' : 'en-US'}
        messages={language === 'vi' ? vi : undefined}
      >
        <TooltipProvider>
          <header className="flex justify-end border-b p-2">
            <ToggleGroup
              type="single"
              variant="segmented"
              size="sm"
              aria-label="Language"
              value={language}
              onValueChange={(value) => setLanguage(value as Language)}
            >
              <ToggleGroupItem value="en">EN</ToggleGroupItem>
              <ToggleGroupItem value="vi">VI</ToggleGroupItem>
            </ToggleGroup>
          </header>
          {children}
          <Toaster />
        </TooltipProvider>
      </LocaleProvider>
    </ThemeProvider>
  )
}
