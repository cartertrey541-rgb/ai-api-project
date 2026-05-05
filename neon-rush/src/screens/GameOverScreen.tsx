import React, { useEffect, useRef, useState } from 'react';
import {
  View, StyleSheet, Animated, ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { NeonButton } from '../components/NeonButton';
import { NeonText } from '../components/NeonText';
import { storage, PlayerData } from '../services/StorageService';
import { ACHIEVEMENTS, COLORS } from '../constants';

type NavProp = StackNavigationProp<RootStackParamList, 'GameOver'>;
type RouteP = RouteProp<RootStackParamList, 'GameOver'>;
interface Props { navigation: NavProp; route: RouteP; }

export const GameOverScreen: React.FC<Props> = ({ navigation, route }) => {
  const { score, coinsEarned, isNewHighScore } = route.params;
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Load data and check achievements
    storage.load().then(data => {
      setPlayerData(data);
      checkAchievements(data);
    });

    // Entrance animation
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Count-up score animation
    const duration = Math.min(1800, score * 2);
    scoreAnim.addListener(({ value }) => setDisplayScore(Math.floor(value)));
    Animated.timing(scoreAnim, {
      toValue: score,
      duration,
      useNativeDriver: false,
    }).start();

    // Glow pulse for new high score
    if (isNewHighScore) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
        ])
      ).start();
    }

    return () => scoreAnim.removeAllListeners();
  }, []);

  const checkAchievements = async (data: PlayerData) => {
    const unlocked: string[] = [];
    for (const ach of ACHIEVEMENTS) {
      if (data.completedAchievements.includes(ach.id)) continue;
      let met = false;
      switch (ach.type) {
        case 'score': met = score >= ach.goal; break;
        case 'runs': met = data.totalRuns >= ach.goal; break;
        case 'totalCoins': met = data.totalCoins >= ach.goal; break;
      }
      if (met) {
        await storage.completeAchievement(ach.id);
        unlocked.push(ach.title);
      }
    }
    if (unlocked.length > 0) setNewAchievements(unlocked);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#08081a', '#0d0d26', '#12122f']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Title */}
          {isNewHighScore ? (
            <>
              <NeonText size={14} color={COLORS.neonYellow} style={styles.centered}>
                ★ NEW PERSONAL BEST ★
              </NeonText>
              <Animated.Text
                style={[
                  styles.gameOverTitle,
                  {
                    color: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [COLORS.neonYellow, '#fff700'],
                    }),
                  },
                ]}
              >
                RECORD!
              </Animated.Text>
            </>
          ) : (
            <NeonText size={36} color={COLORS.neonPink} style={[styles.centered, styles.bigTitle]}>
              GAME OVER
            </NeonText>
          )}

          {/* Score */}
          <View style={styles.scoreBox}>
            <NeonText size={12} color={COLORS.textDim} style={styles.centered}>SCORE</NeonText>
            <NeonText size={56} color={COLORS.neonCyan} style={[styles.centered, styles.scoreNum]}>
              {displayScore.toLocaleString()}
            </NeonText>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <NeonText size={24} color={COLORS.neonYellow}>{coinsEarned}</NeonText>
              <NeonText size={11} color={COLORS.textDim}>COINS</NeonText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <NeonText size={24} color={COLORS.neonCyan}>
                {playerData?.highScore?.toLocaleString() ?? '-'}
              </NeonText>
              <NeonText size={11} color={COLORS.textDim}>BEST</NeonText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <NeonText size={24} color={COLORS.neonPurple}>
                {playerData?.totalRuns ?? 1}
              </NeonText>
              <NeonText size={11} color={COLORS.textDim}>RUNS</NeonText>
            </View>
          </View>

          {/* New achievements */}
          {newAchievements.length > 0 && (
            <View style={styles.achievementsBox}>
              <NeonText size={12} color={COLORS.neonYellow} style={styles.centered}>
                🏅 ACHIEVEMENTS UNLOCKED
              </NeonText>
              {newAchievements.map(title => (
                <NeonText key={title} size={14} color={COLORS.neonGreen} style={styles.achTitle}>
                  ✓ {title}
                </NeonText>
              ))}
            </View>
          )}

          {/* Action buttons */}
          <NeonButton
            label="▶  PLAY AGAIN"
            onPress={() => navigation.replace('Game', {
              characterId: playerData?.selectedCharacter ?? 'nova',
            })}
            color={COLORS.neonCyan}
            size="lg"
            style={styles.btn}
          />
          <NeonButton
            label="🏪  SHOP"
            onPress={() => navigation.replace('Shop')}
            color={COLORS.neonPink}
            size="md"
            style={styles.btn}
          />
          <NeonButton
            label="🏠  HOME"
            onPress={() => navigation.replace('Home')}
            color={COLORS.neonPurple}
            size="sm"
            style={styles.btn}
          />

          {/* Total coins display */}
          <View style={styles.totalCoins}>
            <NeonText size={13} color={COLORS.textDim}>TOTAL COINS:  </NeonText>
            <NeonText size={13} color={COLORS.neonYellow}>
              🪙 {playerData?.totalCoins?.toLocaleString() ?? 0}
            </NeonText>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24 },
  centered: { textAlign: 'center' },
  bigTitle: { fontWeight: '900', letterSpacing: 6, marginBottom: 16 },
  gameOverTitle: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: '#ffd700',
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
  },
  scoreBox: { marginVertical: 16, alignItems: 'center' },
  scoreNum: { fontWeight: '900', letterSpacing: 4 },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    padding: 16,
    marginBottom: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 40, backgroundColor: '#2a2a4a' },
  achievementsBox: {
    width: '100%',
    backgroundColor: '#1a3a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.neonGreen + '44',
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    gap: 6,
  },
  achTitle: { textAlign: 'center' },
  btn: { width: '100%', marginBottom: 12 },
  totalCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
});
