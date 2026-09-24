import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isDarkTheme, palette } from '../lib/theme.js'

test('transparent backgrounds use the visible surface or text, not transparent black', () => {
  assert.equal(isDarkTheme({ bodyBackground: 'rgba(0, 0, 0, 0)', rootBackground: 'rgb(255, 255, 255)' }), false)
  assert.equal(isDarkTheme({ bodyBackground: 'rgba(0, 0, 0, 0)', rootBackground: 'rgba(0, 0, 0, 0)', textColor: 'rgb(28, 28, 30)', prefersDark: true }), false)
  assert.equal(isDarkTheme({ bodyBackground: 'rgba(0, 0, 0, 0)', rootBackground: 'rgb(28, 28, 30)' }), true)
})

test('palette follows the Desktop surface theme', () => {
  assert.equal(palette({ bodyBackground: 'rgb(255, 255, 255)' }).text, '#1C1C1E')
  assert.equal(palette({ bodyBackground: 'rgb(28, 28, 30)' }).text, '#F5F5F7')
})
