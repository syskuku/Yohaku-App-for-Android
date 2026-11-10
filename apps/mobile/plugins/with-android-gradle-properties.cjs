/* eslint-disable @typescript-eslint/no-require-imports */
const { withGradleProperties } = require('expo/config-plugins')

const PROPERTIES = {
  // The AGP path check rejects checkouts whose parent directories contain
  // CJK characters (this repo lives in one). The build itself is fine.
  'android.overridePathCheck': 'true',
}

/**
 * Adds Android Gradle properties the Expo config has no field for.
 */
function withAndroidGradleProperties(config) {
  return withGradleProperties(config, (result) => {
    for (const [key, value] of Object.entries(PROPERTIES)) {
      const existing = result.modResults.find(
        (item) => item.type === 'property' && item.key === key,
      )
      if (existing) {
        existing.value = value
      } else {
        result.modResults.push({ type: 'property', key, value })
      }
    }
    return result
  })
}

module.exports = withAndroidGradleProperties
