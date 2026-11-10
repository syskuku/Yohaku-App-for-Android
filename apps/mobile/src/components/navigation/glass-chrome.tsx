import { LiquidGlassView } from 'react-native-liquid-glassmorphism'
import type { ReactNode } from 'react'
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { usePalette } from '@/theme/palette'

/**
 * Liquid-glass chrome for Android.
 *
 * The paper design relies on frosted surfaces for the header band and the
 * floating tab bar; a flat fill reads as a hard rectangle on Android because
 * the native header is transparent. `react-native-liquid-glassmorphism` gives
 * a real backdrop refraction on API 33+ and degrades to a frost below that, so
 * the same code keeps a sane fallback on older devices. iOS keeps its native
 * materials and never renders these.
 */

function rgba(hex: string, alpha: number) {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value
  const number = Number.parseInt(full.slice(0, 6), 16)
  const r = (number >> 16) & 255
  const g = (number >> 8) & 255
  const b = number & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function TopGlassBar({
  height,
  top = 0,
}: {
  height: number
  top?: number
}) {
  const palette = usePalette()
  if (Platform.OS !== 'android') return null
  return (
    <View pointerEvents="none" style={[styles.top, { height, top }]}>
      <LiquidGlassView
        accessibilityMode="forceGlass"
        blurRadius={12}
        borderRadius={0}
        intensity={40}
        preset="navigationBar"
        rim={false}
        style={StyleSheet.absoluteFill}
        tintColor={rgba(palette.surface.desk, 0.95)}
        variant="regular"
      />
    </View>
  )
}

export function GlassSurface({
  accessibilityRole,
  children,
  style,
  radius,
}: {
  accessibilityRole?: 'tablist' | 'none'
  children?: ReactNode
  radius: number
  style?: StyleProp<ViewStyle>
}) {
  const palette = usePalette()
  if (Platform.OS !== 'android') {
    return (
      <View
        accessibilityRole={accessibilityRole}
        style={[
          style,
          {
            backgroundColor: palette.surface.paper,
            borderRadius: radius,
            overflow: 'hidden',
          },
        ]}
      >
        {children}
      </View>
    )
  }
  return (
    <LiquidGlassView
      accessibilityMode="forceGlass"
      accessibilityRole={accessibilityRole}
      blurRadius={16}
      borderRadius={radius}
      intensity={45}
      preset="floatingTabBar"
      style={[style, { borderRadius: radius, overflow: 'hidden' }]}
      tintColor={rgba(palette.surface.paper, 0.92)}
      variant="regular"
    >
      {children}
    </LiquidGlassView>
  )
}

const styles = StyleSheet.create({
  top: {
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 40,
  },
})
