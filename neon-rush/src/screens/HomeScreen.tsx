import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, StyleSheet, Animated, TouchableOpacity, Text,
  StatusBar, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { NeonButton } from '../components/NeonButton';
import { NeonText } from '../components/NeonText';
import { storage, PlayerData } from '../services/StorageService';
import { COLORS, CHARACTERS, LEVEL_BASE_GOAL, LEVEL_GOAL_SCALING } from '../constants';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Home'>;
interface Props { navigation: HomeNavProp; }

const { width: SW, height: SH } = Dimensions.get('window');

// Stars positioned purely via transform (no top/left on Animated.View)
const STARS = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  x: Math.random() * SW,
  y: Math.random() * SH,
  size: Math.random() * 2.5 + 0.5,
  opacity: Math.random() * 0.7 + 0.3,
  yEnd: Math.random() * SH + (Math.random() * 0.12 + 0.05) * SH,
  duration: Math.random() * 12000 + 8000,
  delay: Math.random() * 4000,
}));

function getLevelGoal(level: number) {
  return LEVEL_BASE_GOAL + (level - 1) * LEVEL_GOAL_SCALING;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const titleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const starAnims = useRef(STARS.map(s => new Animated.Value(s.y))).current;

  useFocusEffect(
    useCallback(() => {
      storage.invalidateCache();
      storage.load().then(setPlayerData);
    }, [])
  );

  useEffect(() => {
    Animated.spring(titleAnim, {
      toValue: 1, tension: 40, friction: 8, useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Stars: animate translateY only — no layout props on Animated.View
    starAnims.forEach((anim, i) => {
      const loop = () => {
        anim.setValue(STARS[i].y);
        Animated.timing(anim, {
          toValue: STARS[i].yEnd,
          duration: STARS[i].duration,
          useNativeDriver: true,
        }).start(() => loop());
      };
      setTimeout(() => loop(), STARS[i].delay);
    });
  }, []);

  const character = CHARACTERS.find(c => c.id === playerData?.selectedCharacter) ?? CHARACTERS[0];
  const currentLevel = playerData?.currentLevel ?? 1;
  const levelGoal = getLevelGoal(currentLevel);

  const handlePlay = () => {
    navigation.navigate('Game', { characterId: character.id });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <LinearGradient colors={['#08081a', '#0d0d26', '#12122f']} style={StyleSheet.absoluteFill} />

      {/* Neon grid lines */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <View key={i} style={[styles.gridLine, { left: (i / 6) * SW }]} />
        ))}
      </View>

      {/* Stars — Animated.View has ONLY transform+opacity, zero layout props */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STARS.map((star, i) => (
          <Animated.View
            key={star.id}
            style={{
              position: 'absolute',
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              backgroundColor: '#ffffff',
              opacity: star.opacity,
              transform: [
                { translateX: star.x },
                { translateY: starAnims[i] },
              ],
            }}
          />
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
        <Animated.View style={{
          opacity: titleAnim,
          transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
        }}>
          <NeonText size={52} color={COLORS.neonCyan} style={styles.titleMain}>NEON</NeonText>
          <NeonText size={52} color={COLORS.neonPink} style={styles.titleSub}>RUSH</NeonText>
        </Animated.View>

        {/* Level card */}
        <View style={styles.levelCard}>
          <View style={styles.levelCardLeft}>
            <NeonText size={11} color={COLORS.textDim}>CURRENT LEVEL</NeonText>
            <NeonText size={42} color={COLORS.neonYellow} style={styles.levelNum}>{currentLevel}</NeonText>
          </View>
          <View style={styles.levelCardRight}>
            {/* Character shape */}
            <View style={[styles.characterShape, {
              backgroundColor: character.color,
              shadowColor: character.glowColor,
            }]} />
            <NeonText size={11} color={character.color}>{character.name}</NeonText>
          </View>
        </View>

        {/* Level goal */}
        <View style={styles.goalBox}>
          <NeonText size={11} color={COLORS.textDim}>LEVEL GOAL: RUN {levelGoal}m</NeonText>
          <NeonText size={11} color={COLORS.textDim}>COLLECT COINS · SURVIVE · ADVANCE</NeonText>
        </View>

        {/* Play button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <NeonButton
            label={`▶  PLAY LEVEL ${currentLevel}`}
            onPress={handlePlay}
            color={COLORS.neonCyan}
            size="lg"
            style={styles.playBtn}
          />
        </Animated.View>

        {/* Menu buttons */}
        <View style={styles.menuRow}>
          <NeonButton
            label="🏪 SHOP"
            onPress={() => navigation.navigate('Shop')}
            color={COLORS.neonPink}
            size="sm"
            style={styles.menuBtn}
          />
          <NeonButton
            label="⚙ SETTINGS"
            onPress={() => navigation.navigate('Settings')}
            color={COLORS.neonPurple}
            size="sm"
            style={styles.menuBtn}
          />
        </View>

        {(playerData?.highScore ?? 0) > 0 && (
          <View style={styles.hsBanner}>
            <NeonText size={11} color={COLORS.textDim}>PERSONAL BEST</NeonText>
            <NeonText size={26} color={COLORS.neonYellow}>{playerData!.highScore.toLocaleString()}</NeonText>
          </View>
        )}

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
  gridLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#1a1a3a' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24, alignSelf: 'flex-end' },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1a1a3a', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#2a2a4a',
  },
  statIcon: { fontSize: 14 },
  titleMain: { textAlign: 'center', fontWeight: '900', lineHeight: 56, letterSpacing: 8 },
  titleSub: { textAlign: 'center', fontWeight: '900', lineHeight: 56, letterSpacing: 8, marginBottom: 20 },
  levelCard: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.neonYellow + '44',
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelCardLeft: { gap: 2 },
  levelNum: { fontWeight: '900', letterSpacing: 2 },
  levelCardRight: { alignItems: 'center', gap: 6 },
  characterShape: {
    width: 40, height: 52, borderRadius: 8,
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 14, shadowOpacity: 1, elevation: 8,
  },
  goalBox: {
    alignItems: 'center', gap: 4,
    marginBottom: 20,
  },
  playBtn: { width: 240, marginBottom: 20 },
  menuRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  menuBtn: { flex: 1 },
  hsBanner: {
    alignItems: 'center', backgroundColor: '#1a1a3a', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 32,
    borderWidth: 1, borderColor: COLORS.neonYellow + '44',
    marginBottom: 16, width: '100%',
  },
  runsText: { letterSpacing: 2 },
});
