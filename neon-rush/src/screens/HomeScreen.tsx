import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, StyleSheet, Animated, TouchableOpacity, Text,
  StatusBar, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { NeonButton } from '../components/NeonButton';
import { NeonText } from '../components/NeonText';
import { storage, PlayerData } from '../services/StorageService';
import { COLORS, CHARACTERS } from '../constants';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Home'>;
interface Props { navigation: HomeNavProp; }

const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5,
  opacity: Math.random() * 0.7 + 0.3,
  speed: Math.random() * 0.3 + 0.1,
}));

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const titleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const starAnims = useRef(STARS.map(() => new Animated.Value(0))).current;

  useFocusEffect(
    useCallback(() => {
      storage.load().then(setPlayerData);
    }, [])
  );

  useEffect(() => {
    // Title entrance
    Animated.spring(titleAnim, {
      toValue: 1,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Pulse play button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Glow cycle
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start();

    // Animate stars drifting down
    starAnims.forEach((anim, i) => {
      const loop = () => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: (STARS[i].speed * 20000) + 8000,
          useNativeDriver: true,
        }).start(() => loop());
      };
      setTimeout(() => loop(), i * 150);
    });
  }, []);

  const character = CHARACTERS.find(c => c.id === playerData?.selectedCharacter) ?? CHARACTERS[0];

  const handlePlay = () => {
    navigation.navigate('Game', { characterId: character.id });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Animated star field */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STARS.map((star, i) => (
          <Animated.View
            key={star.id}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: starAnims[i].interpolate({
                inputRange: [0, 1],
                outputRange: [`${star.y}%`, `${star.y + 20}%`],
              }),
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              backgroundColor: '#ffffff',
              opacity: star.opacity,
            }}
          />
        ))}
      </View>

      {/* Background gradient */}
      <LinearGradient
        colors={['#08081a', '#0d0d26', '#12122f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Neon grid lines */}
      <View style={styles.gridContainer} pointerEvents="none">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <View key={i} style={[styles.gridLine, { left: `${(i / 6) * 100}%` }]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header stats */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statIcon}>🏆</Text>
            <NeonText size={14} color={COLORS.neonYellow}>{playerData?.highScore ?? 0}</NeonText>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statIcon}>💎</Text>
            <NeonText size={14} color={COLORS.neonCyan}>{playerData?.gems ?? 0}</NeonText>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statIcon}>🪙</Text>
            <NeonText size={14} color={COLORS.neonYellow}>{playerData?.totalCoins ?? 0}</NeonText>
          </View>
        </View>

        {/* Title */}
        <Animated.View
          style={{
            opacity: titleAnim,
            transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
          }}
        >
          <NeonText size={52} color={COLORS.neonCyan} style={styles.titleMain}>NEON</NeonText>
          <NeonText size={52} color={COLORS.neonPink} style={styles.titleSub}>RUSH</NeonText>
        </Animated.View>

        {/* Selected character preview */}
        <View style={styles.characterPreview}>
          <Animated.View
            style={[
              styles.characterShape,
              {
                backgroundColor: character.color,
                shadowColor: character.glowColor,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <NeonText size={13} color={character.color} style={styles.characterName}>
            {character.name}
          </NeonText>
        </View>

        {/* Play button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <NeonButton
            label="▶  PLAY"
            onPress={handlePlay}
            color={COLORS.neonCyan}
            size="lg"
            style={styles.playBtn}
          />
        </Animated.View>

        {/* Menu buttons */}
        <View style={styles.menuRow}>
          <NeonButton
            label="SHOP"
            onPress={() => navigation.navigate('Shop')}
            color={COLORS.neonPink}
            size="sm"
            style={styles.menuBtn}
          />
          <NeonButton
            label="SETTINGS"
            onPress={() => navigation.navigate('Settings')}
            color={COLORS.neonPurple}
            size="sm"
            style={styles.menuBtn}
          />
        </View>

        {/* Best score banner */}
        {(playerData?.highScore ?? 0) > 0 && (
          <View style={styles.hsBanner}>
            <NeonText size={12} color={COLORS.textDim}>PERSONAL BEST</NeonText>
            <NeonText size={26} color={COLORS.neonYellow}>{playerData!.highScore.toLocaleString()}</NeonText>
          </View>
        )}

        {/* Run count */}
        <NeonText size={11} color={COLORS.textDim} style={styles.runsText}>
          {(playerData?.totalRuns ?? 0)} RUNS COMPLETED
        </NeonText>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { alignItems: 'center', paddingTop: 50, paddingBottom: 40, paddingHorizontal: 24 },
  gridContainer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  gridLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#1a1a3a' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 30, alignSelf: 'flex-end' },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1a1a3a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  statIcon: { fontSize: 14 },
  titleMain: {
    textAlign: 'center',
    fontWeight: '900',
    lineHeight: 56,
    letterSpacing: 8,
  },
  titleSub: {
    textAlign: 'center',
    fontWeight: '900',
    lineHeight: 56,
    letterSpacing: 8,
    marginBottom: 20,
  },
  characterPreview: { alignItems: 'center', marginVertical: 24 },
  characterShape: {
    width: 56,
    height: 72,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 1,
    elevation: 12,
    marginBottom: 8,
  },
  characterName: { letterSpacing: 2 },
  playBtn: { width: 220, marginBottom: 20 },
  menuRow: { flexDirection: 'row', gap: 16, marginBottom: 30 },
  menuBtn: { flex: 1 },
  hsBanner: {
    alignItems: 'center',
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: COLORS.neonYellow + '44',
    marginBottom: 16,
    width: '100%',
  },
  runsText: { letterSpacing: 2 },
});
