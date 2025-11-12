#!/usr/bin/env node
/**
 * Ensures `public/images/products` points to the shared `../assets/product-images`.
 * - Prefers a symlink/junction so we don't duplicate the ~2k images.
 * - Falls back to copying the directory if the environment forbids symlinks (network shares, etc).
 */
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const assetsRoot = path.resolve(projectRoot, '..', 'assets', 'product-images')
const publicImagesDir = path.join(projectRoot, 'public', 'images')
const linkTarget = path.join(publicImagesDir, 'products')
const healthCheckPath = path.join(linkTarget, '_variants')

fs.mkdirSync(assetsRoot, { recursive: true })
fs.mkdirSync(publicImagesDir, { recursive: true })

const normalizeForComparison = value =>
  value
    .replace(/^\\\\\?\\/, '')
    .replace(/\\/g, '/')
    .toLowerCase()

const normalizedAssetsRoot = normalizeForComparison(fs.realpathSync.native(assetsRoot))

const removeExistingTarget = () => {
  try {
    fs.rmSync(linkTarget, { recursive: true, force: true })
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}

const hasFilesystemEntry = () => {
  try {
    fs.lstatSync(linkTarget)
    return true
  } catch {
    return false
  }
}

const assetsAvailable = () => {
  try {
    fs.accessSync(healthCheckPath, fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}

const describeExistingStore = (mode = 'existing') => {
  const prefix = mode === 'new' ? 'Asset directory ready' : 'Existing asset directory detected'
  try {
    const resolved = fs.realpathSync.native(linkTarget)
    const sameTarget = normalizeForComparison(resolved) === normalizedAssetsRoot
    if (sameTarget) {
      const message = mode === 'new' ? 'Symlink ready' : 'Existing link detected'
      console.log(`[link-product-assets] ${message}: ${linkTarget} -> ${resolved}`)
    } else {
      console.log(`[link-product-assets] ${prefix}: ${linkTarget}`)
    }
  } catch {
    console.log(`[link-product-assets] ${prefix}: ${linkTarget}`)
  }
}

const ensureSymlink = () => {
  if (hasFilesystemEntry()) {
    if (assetsAvailable()) {
      describeExistingStore('existing')
      return true
    }
    removeExistingTarget()
  }

  try {
    fs.symlinkSync(assetsRoot, linkTarget, process.platform === 'win32' ? 'junction' : 'dir')
    if (assetsAvailable()) {
      describeExistingStore('new')
      return true
    }
    removeExistingTarget()
  } catch (error) {
    if (!['EEXIST', 'EPERM', 'EINVAL'].includes(error.code)) {
      throw error
    }
  }

  return false
}

const copyAssets = () => {
  removeExistingTarget()
  fs.mkdirSync(linkTarget, { recursive: true })
  fs.cpSync(assetsRoot, linkTarget, { recursive: true })
  console.log('[link-product-assets] Copied assets into public/images/products (fallback mode)')
  describeExistingStore('new')
}

if (!ensureSymlink()) {
  console.warn(
    '[link-product-assets] Symlinks are not available on this environment. Falling back to a directory copy.'
  )
  copyAssets()
}
