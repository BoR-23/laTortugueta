const fs = require('fs')
const path = require('path')

const DEFAULT_ENV_VARS = ['FOTOS_FINALES_PATH', 'FOTOS_ORGANIZADAS_PATH']

const defaultSuffixes = [
  ['fotosFinales', 'fotos_Finales'],
  ['fotosFinales', 'fotosFinales', 'fotos_Finales'],
  ['fotos_Finales'],
  ['fotos', 'fotos_Finales'],
  ['fotos_finales']
]

const defaultBaseDirs = projectRoot => {
  const bases = [
    path.resolve(projectRoot, '..'),
    path.resolve(projectRoot, '..', '..'),
    path.resolve(projectRoot, '..', 'laTortugueta'),
    path.resolve(projectRoot, '..', '..', 'laTortugueta'),
    path.resolve(projectRoot, '..', 'fotosFinales'),
    path.resolve(projectRoot, '..', '..', 'fotosFinales')
  ]

  const unique = new Set()
  return bases.filter(base => {
    const normalised = path.normalize(base)
    if (unique.has(normalised)) {
      return false
    }
    unique.add(normalised)
    return true
  })
}

const normaliseInputPath = (projectRoot, candidate) => {
  if (!candidate) {
    return null
  }
  return path.isAbsolute(candidate)
    ? path.normalize(candidate)
    : path.resolve(projectRoot, candidate)
}

const listPhotoLibraryCandidates = (projectRoot, options = {}) => {
  const {
    envVars = DEFAULT_ENV_VARS,
    extraCandidates = [],
    includeDefaultSuffixes = true
  } = options

  const candidates = []

  envVars.forEach(envVar => {
    const envValue = process.env[envVar]
    if (envValue) {
      const resolved = normaliseInputPath(projectRoot, envValue)
      if (resolved) {
        candidates.push(resolved)
      }
    }
  })

  extraCandidates.forEach(candidate => {
    const resolved = normaliseInputPath(projectRoot, candidate)
    if (resolved) {
      candidates.push(resolved)
    }
  })

  if (includeDefaultSuffixes) {
    const bases = defaultBaseDirs(projectRoot)
    for (const base of bases) {
      for (const suffix of defaultSuffixes) {
        candidates.push(path.join(base, ...suffix))
      }
    }
  }

  const seen = new Set()
  return candidates.filter(candidate => {
    const normalised = path.normalize(candidate)
    if (seen.has(normalised)) {
      return false
    }
    seen.add(normalised)
    return true
  })
}

const isValidPhotoLibrary = candidate => {
  try {
    const stats = fs.statSync(candidate)
    if (!stats.isDirectory()) {
      return false
    }

    const subdirectories = fs
      .readdirSync(candidate, { withFileTypes: true })
      .filter(entry => entry.isDirectory())

    if (subdirectories.length < 3) {
      return false
    }

    // Ensure at least one directory contains images
    return subdirectories.some(entry => {
      const dirPath = path.join(candidate, entry.name)
      try {
        return fs
          .readdirSync(dirPath)
          .some(file => /\.(jpe?g|png|webp)$/i.test(file))
      } catch {
        return false
      }
    })
  } catch (error) {
    return false
  }
}

const findPhotoLibraryRoot = (projectRoot, options = {}) => {
  const candidates = listPhotoLibraryCandidates(projectRoot, options)
  for (const candidate of candidates) {
    if (isValidPhotoLibrary(candidate)) {
      return candidate
    }
  }
  return null
}

module.exports = {
  findPhotoLibraryRoot,
  listPhotoLibraryCandidates
}
