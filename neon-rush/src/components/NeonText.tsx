import React from 'react';
import { Text, StyleSheet, TextStyle, Animated } from 'react-native';
import { COLORS } from '../constants';

interface NeonTextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  color?: string;
  size?: number;
  glow?: boolean;
  animated?: boolean;
  pulseAnim?: Animated.Value;
}

export const NeonText: React.FC<NeonTextProps> = ({
  children,
  style,
  color = COLORS.neonCyan,
  size = 16,
  glow = true,
}) => {
  const glowStyle: TextStyle = glow
    ? {
        textShadowColor: color,
        textShadowRadius: 12,
        textShadowOffset: { width: 0, height: 0 },
      }
    : {};

  return (
    <Text
      style={[
        styles.base,
        { color, fontSize: size },
        glowStyle,
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
