import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';

interface NeonButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  secondaryColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  label,
  onPress,
  color = COLORS.neonCyan,
  secondaryColor,
  style,
  textStyle,
  disabled = false,
  size = 'md',
  icon,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const secondary = secondaryColor ?? color + '44';

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 20, fontSize: 13 },
    md: { paddingVertical: 14, paddingHorizontal: 32, fontSize: 16 },
    lg: { paddingVertical: 18, paddingHorizontal: 40, fontSize: 20 },
  }[size];

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[secondary, color + 'aa', secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              borderColor: color,
              paddingVertical: sizeStyles.paddingVertical,
              paddingHorizontal: sizeStyles.paddingHorizontal,
              opacity: disabled ? 0.4 : 1,
            },
          ]}
        >
          <View style={styles.inner}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text
              style={[
                styles.label,
                {
                  color,
                  fontSize: sizeStyles.fontSize,
                  textShadowColor: color,
                  textShadowRadius: 8,
                  textShadowOffset: { width: 0, height: 0 },
                },
                textStyle,
              ]}
            >
              {label}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  iconWrap: {
    marginRight: 4,
  },
});
