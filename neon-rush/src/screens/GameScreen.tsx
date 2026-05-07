import React, {
  useRef, useState, useEffect, useCallback, useMemo,
} from 'react';
import {
  View, StyleSheet, PanResponder, TouchableWithoutFeedback,
  StatusBar, Animated, Text, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { NeonText } from '../components/NeonText';
import { NeonButton } from '../components/NeonButton';
import { storage } from '../services/StorageService';
import { adService } from '../services/AdService';
import {
  SCREEN_H, LANE_COUNT, LANE_X,
  PLAYER_W, PLAYER_H, GROUND_Y, PLAYER_START_LANE,
  GRAVITY, JUMP_VELOCITY, DOUBLE_JUMP_VELOCITY,
  OBSTACLE_W, OBSTACLE_MIN_H, OBSTACLE_MAX_H,
  COIN_SIZE, POWERUP_SIZE,
  INITIAL_SPEED, MAX_SPEED,
  LEVEL_BASE_SPEED_INCREMENT, LEVEL_PROGRESS_BONUS,
  LEVEL_BASE_GOAL, LEVEL_GOAL_SCALING,
  SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX, SPAWN_INTERVAL_REDUCTION,
  COIN_SPAWN_INTERVAL, POWERUP_SPAWN_CHANCE,
  SHIELD_DURATION, MAGNET_DURATION, MULTIPLIER_DURATION, SLOW_DURATION,
  MAGNET_RADIUS, INITIAL_LIVES, COIN_VALUE,
  SLOW_COIN_CHANCE, SLOW_COIN_DURATION, SLOW_COIN_COLOR, SLOW_COIN_GLOW,
  LANE_SWITCH_DURATION,
  COLORS, CHARACTERS,
  type ObstacleType, type PowerUpType,
} from '../constants';

type GameNavProp = StackNavigationProp<RootStackParamList, 'Game'>;
type GameRouteProp = RouteProp<RootStackParamList, 'Game'>;
interface Props { navigation: GameNavProp; route: GameRouteProp; }

interface Obstacle {
  id: number; lane: number; y: number; height: number; type: ObstacleType; color: string;
}
interface Coin {
  id: number; lane: number; y: number; collected: boolean; slow: boolean;
}
interface PowerUpEntity {
  id: number; lane: number; y: number; type: PowerUpType; collected: boolean;
}
interface Player {
  lane: number; targetLane: number; x: number; y: number;
  velocityY: number; isOnGround: boolean; canDoubleJump: boolean;
  isInvincible: boolean; invincibleTimer: number;
}
interface ActivePowerUps { shield: number; magnet: number; multiplier: number; slow: number; }

interface GameState {
  player: Player;
  obstacles: Obstacle[];
  coins: Coin[];
  powerUps: PowerUpEntity[];
  score: number;
  coinsEarned: number;
  lives: number;
  speed: number;
  distance: number;
  playerLevel: number;
  levelGoal: number;
  levelComplete: boolean;
  activePowerUps: ActivePowerUps;
  isRunning: boolean;
  isPaused: boolean;
  gameOver: boolean;
  canRevive: boolean;
  hasRevived: boolean;
  obstacleTimer: number;
  nextObstacleIn: number;
  coinTimer: number;
  bgOffset: number;
  entityId: number;
}

const OBSTACLE_COLORS: Record<ObstacleType, string> = {
  barrier: COLORS.barrier, drone: COLORS.drone, laser: COLORS.laser, spike: COLORS.neonOrange,
};
const POWERUP_COLORS: Record<PowerUpType, string> = {
  shield: COLORS.shield, magnet: COLORS.magnet, multiplier: COLORS.multiplier, slow: COLORS.slow,
};
const POWERUP_ICONS: Record<PowerUpType, string> = {
  shield: '🛡', magnet: '🧲', multiplier: '✨', slow: '⏱',
};

function randomLane(): number { return Math.floor(Math.random() * LANE_COUNT); }
function randomObstacleHeight(): number {
  return Math.floor(Math.random() * (OBSTACLE_MAX_H - OBSTACLE_MIN_H) + OBSTACLE_MIN_H);
}
function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
  margin = 8,
): boolean {
  return ax < bx + bw - margin && ax + aw - margin > bx &&
    ay < by + bh - margin && ay + ah - margin > by;
}

function makeInitialState(): GameState {
  return {
    player: {
      lane: PLAYER_START_LANE, targetLane: PLAYER_START_LANE,
      x: LANE_X[PLAYER_START_LANE] - PLAYER_W / 2, y: GROUND_Y,
      velocityY: 0, isOnGround: true, canDoubleJump: false,
      isInvincible: false, invincibleTimer: 0,
    },
    obstacles: [], coins: [], powerUps: [],
    score: 0, coinsEarned: 0, lives: INITIAL_LIVES,
    speed: INITIAL_SPEED, distance: 0,
    playerLevel: 1, levelGoal: LEVEL_BASE_GOAL, levelComplete: false,
    activePowerUps: { shield: 0, magnet: 0, multiplier: 0, slow: 0 },
    isRunning: false, isPaused: false, gameOver: false,
    canRevive: true, hasRevived: false,
    obstacleTimer: 0, nextObstacleIn: 1200, coinTimer: 0,
    bgOffset: 0, entityId: 0,
  };
}

export const GameScreen: React.FC<Props> = ({ navigation, route }) => {
  const { characterId } = route.params;
  const character = useMemo(
    () => CHARACTERS.find(c => c.id === characterId) ?? CHARACTERS[0],
    [characterId],
  );

  const gsRef = useRef<GameState>(makeInitialState());
  const [renderTick, setRenderTick] = useState(0);
  const [showReviveModal, setShowReviveModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const hapticsEnabled = useRef(true);

  const playerXAnim = useRef(new Animated.Value(LANE_X[PLAYER_START_LANE] - PLAYER_W / 2)).current;
  const playerYAnim = useRef(new Animated.Value(GROUND_Y)).current;
  const invincibleAnim = useRef(new Animated.Value(1)).current;

  const forceRender = useCallback(() => setRenderTick(t => t + 1), []);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy') => {
    if (!hapticsEnabled.current) return;
    const fn = {
      light: Haptics.impactAsync.bind(null, Haptics.ImpactFeedbackStyle.Light),
      medium: Haptics.impactAsync.bind(null, Haptics.ImpactFeedbackStyle.Medium),
      heavy: Haptics.impactAsync.bind(null, Haptics.ImpactFeedbackStyle.Heavy),
    }[type];
    fn?.();
  }, []);

  const doJump = useCallback(() => {
    const gs = gsRef.current;
    if (!gs.isRunning || gs.isPaused || gs.gameOver) return;
    const p = gs.player;
    if (p.isOnGround) {
      p.velocityY = JUMP_VELOCITY * (1 + character.jumpBonus);
      p.isOnGround = false; p.canDoubleJump = true;
      triggerHaptic('light');
    } else if (p.canDoubleJump) {
      p.velocityY = DOUBLE_JUMP_VELOCITY * (1 + character.jumpBonus);
      p.canDoubleJump = false;
      triggerHaptic('light');
    }
  }, [character, triggerHaptic]);

  const changeLane = useCallback((direction: -1 | 1) => {
    const gs = gsRef.current;
    if (!gs.isRunning || gs.isPaused || gs.gameOver) return;
    const p = gs.player;
    const newLane = Math.max(0, Math.min(LANE_COUNT - 1, p.targetLane + direction));
    if (newLane === p.targetLane) return;
    p.targetLane = newLane;
    triggerHaptic('light');
    Animated.timing(playerXAnim, {
      toValue: LANE_X[newLane] - PLAYER_W / 2,
      duration: LANE_SWITCH_DURATION,
      useNativeDriver: true,
    }).start(() => { gsRef.current.player.lane = newLane; });
  }, [playerXAnim, triggerHaptic]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderRelease: (_, { dx, dy }) => {
        const ax = Math.abs(dx), ay = Math.abs(dy);
        if (ax < 10 && ay < 10) { doJump(); return; }
        if (ax > ay) { if (dx > 20) changeLane(1); else if (dx < -20) changeLane(-1); }
        else if (dy < -20) { doJump(); }
      },
    })
  ).current;

  const startInvincibilityFlash = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(invincibleAnim, { toValue: 0.2, duration: 120, useNativeDriver: true }),
        Animated.timing(invincibleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]),
      { iterations: 8 }
    ).start(() => invincibleAnim.setValue(1));
  }, [invincibleAnim]);

  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const rawDelta = Math.min(timestamp - lastTimeRef.current, 50);
    lastTimeRef.current = timestamp;

    const gs = gsRef.current;
    if (!gs.isRunning || gs.isPaused || gs.gameOver) {
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const slowActive = gs.activePowerUps.slow > 0;
    const delta = slowActive ? rawDelta * 0.45 : rawDelta;

    // Speed ramps from baseSpeed → baseSpeed + LEVEL_PROGRESS_BONUS over the level
    const { playerLevel, levelGoal } = gs;
    const progressRatio = Math.min(1, gs.distance / levelGoal);
    const baseSpeed = INITIAL_SPEED + (playerLevel - 1) * LEVEL_BASE_SPEED_INCREMENT;
    gs.speed = Math.min(MAX_SPEED, baseSpeed + progressRatio * LEVEL_PROGRESS_BONUS);
    const speed = gs.speed * (1 + character.speedBonus);

    const spawnMin = Math.max(600, SPAWN_INTERVAL_MIN - (playerLevel - 1) * SPAWN_INTERVAL_REDUCTION);
    const spawnMax = Math.max(900, SPAWN_INTERVAL_MAX - (playerLevel - 1) * SPAWN_INTERVAL_REDUCTION);

    gs.distance += speed * delta * 0.0005;
    gs.score = Math.floor(gs.distance * 100) + gs.coinsEarned * 5;
    gs.bgOffset = (gs.bgOffset + speed * delta * 0.04) % SCREEN_H;

    // Level complete detection — levelGoal > 0 guards against uninitialised state
    if (levelGoal > 0 && gs.distance >= levelGoal && !gs.levelComplete && !gs.gameOver) {
      gs.levelComplete = true;
      gs.isRunning = false;
      triggerHaptic('heavy');
      adService.showLevelEndAd();
      setShowLevelCompleteModal(true);
      forceRender();
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Player physics
    const p = gs.player;
    if (!p.isOnGround) {
      p.velocityY += GRAVITY;
      p.y += p.velocityY;
      if (p.y >= GROUND_Y) {
        p.y = GROUND_Y; p.velocityY = 0; p.isOnGround = true; p.canDoubleJump = false;
      }
      playerYAnim.setValue(p.y);
    }

    if (p.isInvincible) {
      p.invincibleTimer -= rawDelta;
      if (p.invincibleTimer <= 0) { p.isInvincible = false; p.invincibleTimer = 0; }
    }

    const ap = gs.activePowerUps;
    if (ap.shield > 0) ap.shield -= rawDelta;
    if (ap.magnet > 0) ap.magnet -= rawDelta;
    if (ap.multiplier > 0) ap.multiplier -= rawDelta;
    if (ap.slow > 0) ap.slow -= rawDelta;

    // Spawn obstacles
    gs.obstacleTimer += rawDelta;
    if (gs.obstacleTimer >= gs.nextObstacleIn) {
      gs.obstacleTimer = 0;
      gs.nextObstacleIn = Math.random() * (spawnMax - spawnMin) + spawnMin;
      const type = (['barrier', 'drone', 'laser', 'spike'] as ObstacleType[])[Math.floor(Math.random() * 4)];
      const blockTwo = playerLevel >= 5 && Math.random() < 0.25;
      const lane1 = randomLane();
      gs.entityId++;
      gs.obstacles.push({ id: gs.entityId, lane: lane1, y: -100, height: randomObstacleHeight(), type, color: OBSTACLE_COLORS[type] });
      if (blockTwo) {
        const lane2 = (lane1 + 1) % LANE_COUNT;
        gs.entityId++;
        gs.obstacles.push({ id: gs.entityId + 1000, lane: lane2, y: -100, height: randomObstacleHeight(), type, color: OBSTACLE_COLORS[type] });
      }
    }

    // Spawn coins
    gs.coinTimer += rawDelta;
    if (gs.coinTimer >= COIN_SPAWN_INTERVAL) {
      gs.coinTimer = 0;
      gs.entityId++;
      const isSlow = Math.random() < SLOW_COIN_CHANCE;
      gs.coins.push({ id: gs.entityId, lane: randomLane(), y: -COIN_SIZE, collected: false, slow: isSlow });
    }

    // Spawn power-ups
    if (Math.random() < POWERUP_SPAWN_CHANCE * (rawDelta / 1000)) {
      const types: PowerUpType[] = ['shield', 'magnet', 'multiplier', 'slow'];
      gs.entityId++;
      gs.powerUps.push({ id: gs.entityId, lane: randomLane(), y: -POWERUP_SIZE, type: types[Math.floor(Math.random() * types.length)], collected: false });
    }

    const effectiveSpeed = speed * delta * 0.08;
    gs.obstacles.forEach(obs => { obs.y += effectiveSpeed; });
    gs.coins.forEach(coin => { coin.y += effectiveSpeed * 0.9; });
    gs.powerUps.forEach(pu => { pu.y += effectiveSpeed * 0.7; });

    const px = LANE_X[p.lane] - PLAYER_W / 2;
    const py = p.y;

    const coinMultiplier = ap.multiplier > 0 ? 2 : 1;
    const hasMagnet = ap.magnet > 0;
    gs.coins.forEach(coin => {
      if (coin.collected) return;
      const cx = LANE_X[coin.lane] - COIN_SIZE / 2;
      const dist = Math.hypot(cx - px, coin.y - py);
      if (dist < (hasMagnet ? MAGNET_RADIUS : COIN_SIZE + 10)) {
        coin.collected = true;
        if (coin.slow) {
          ap.slow = Math.max(ap.slow, SLOW_COIN_DURATION);
          triggerHaptic('medium');
        } else {
          gs.coinsEarned += Math.round(COIN_VALUE * coinMultiplier * (1 + character.coinBonus));
          triggerHaptic('light');
        }
      }
    });

    gs.powerUps.forEach(pu => {
      if (pu.collected) return;
      const pux = LANE_X[pu.lane] - POWERUP_SIZE / 2;
      if (rectsOverlap(px, py, PLAYER_W, PLAYER_H, pux, pu.y, POWERUP_SIZE, POWERUP_SIZE)) {
        pu.collected = true;
        switch (pu.type) {
          case 'shield': ap.shield = SHIELD_DURATION; break;
          case 'magnet': ap.magnet = MAGNET_DURATION; break;
          case 'multiplier': ap.multiplier = MULTIPLIER_DURATION; break;
          case 'slow': ap.slow = SLOW_DURATION; break;
        }
        triggerHaptic('medium');
      }
    });

    if (!p.isInvincible && ap.shield <= 0) {
      for (const obs of gs.obstacles) {
        if (obs.lane !== p.lane && obs.lane !== p.targetLane) continue;
        const ox = LANE_X[obs.lane] - OBSTACLE_W / 2;
        if (rectsOverlap(px, py, PLAYER_W, PLAYER_H, ox, obs.y, OBSTACLE_W, obs.height)) {
          gs.lives -= 1;
          p.isInvincible = true; p.invincibleTimer = 1500;
          startInvincibilityFlash();
          triggerHaptic('heavy');
          if (gs.lives <= 0) {
            gs.gameOver = true; gs.isRunning = false;
            adService.showInterstitialIfReady();
            setShowReviveModal(true);
          }
          break;
        }
      }
    } else if (ap.shield > 0) {
      gs.obstacles = gs.obstacles.filter(obs => {
        if (obs.lane !== p.lane && obs.lane !== p.targetLane) return true;
        const ox = LANE_X[obs.lane] - OBSTACLE_W / 2;
        if (rectsOverlap(px, py, PLAYER_W, PLAYER_H, ox, obs.y, OBSTACLE_W, obs.height)) {
          triggerHaptic('medium'); return false;
        }
        return true;
      });
    }

    gs.obstacles = gs.obstacles.filter(o => o.y < SCREEN_H + 120);
    gs.coins = gs.coins.filter(c => !c.collected && c.y < SCREEN_H + 60);
    gs.powerUps = gs.powerUps.filter(p => !p.collected && p.y < SCREEN_H + 60);

    forceRender();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [character, playerYAnim, forceRender, triggerHaptic, startInvincibilityFlash]);

  useEffect(() => {
    storage.load().then(data => {
      hapticsEnabled.current = data.hapticsEnabled;
      const lv = Math.max(1, data.currentLevel ?? 1);
      gsRef.current.playerLevel = lv;
      gsRef.current.levelGoal = LEVEL_BASE_GOAL + (lv - 1) * LEVEL_GOAL_SCALING;
      gsRef.current.isRunning = true; // only start physics after level goal is confirmed
    });
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gameLoop]);

  const handleRevive = useCallback(async () => {
    const gs = gsRef.current;
    gs.lives = 1; gs.gameOver = false; gs.isRunning = true;
    gs.hasRevived = true; gs.canRevive = false;
    gs.player.isInvincible = true; gs.player.invincibleTimer = 2500;
    setShowReviveModal(false);
    startInvincibilityFlash();
    gs.obstacles = gs.obstacles.filter(o => o.y < GROUND_Y - 200);
    forceRender();
  }, [forceRender, startInvincibilityFlash]);

  const handleGameOver = useCallback(async () => {
    const gs = gsRef.current;
    setShowReviveModal(false);
    const data = await storage.updateScore(gs.score, gs.coinsEarned);
    navigation.replace('GameOver', {
      score: gs.score, coinsEarned: gs.coinsEarned,
      isNewHighScore: gs.score >= data.highScore,
      levelComplete: false, playerLevel: gs.playerLevel,
    });
  }, [navigation]);

  const handleLevelComplete = useCallback(async () => {
    const gs = gsRef.current;
    setShowLevelCompleteModal(false);
    const data = await storage.updateScore(gs.score, gs.coinsEarned);
    await storage.advanceLevel();
    navigation.replace('GameOver', {
      score: gs.score, coinsEarned: gs.coinsEarned,
      isNewHighScore: gs.score >= data.highScore,
      levelComplete: true, playerLevel: gs.playerLevel,
    });
  }, [navigation]);

  const handlePause = useCallback(() => { gsRef.current.isPaused = true; setShowPauseModal(true); }, []);
  const handleResume = useCallback(() => {
    lastTimeRef.current = 0; gsRef.current.isPaused = false; setShowPauseModal(false);
  }, []);

  const gs = gsRef.current;
  const ap = gs.activePowerUps;
  const progressPct = Math.min(100, (gs.distance / gs.levelGoal) * 100);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar hidden />

      <LinearGradient colors={['#08081a', '#0d0d26']} style={StyleSheet.absoluteFill} />
      {[0, 1].map(i => (
        <Animated.View
          key={i}
          style={[styles.bgLayer, { transform: [{ translateY: (gs.bgOffset + i * SCREEN_H) % (SCREEN_H * 2) - SCREEN_H }] }]}
        >
          {Array.from({ length: 8 }).map((_, j) => (
            <View key={j} style={[styles.bgLine, { top: `${j * 14}%` }]} />
          ))}
        </Animated.View>
      ))}

      <View style={styles.lanes}>
        {Array.from({ length: LANE_COUNT }).map((_, i) => (
          <View key={i} style={styles.lane}>
            {i < LANE_COUNT - 1 && <View style={styles.laneDivider} />}
          </View>
        ))}
      </View>

      <View style={[styles.groundLine, { top: GROUND_Y + PLAYER_H + 4 }]} />

      {gs.coins.map(coin => (
        <View key={coin.id} style={[styles.coin, {
          left: LANE_X[coin.lane] - COIN_SIZE / 2, top: coin.y,
          backgroundColor: coin.slow ? SLOW_COIN_COLOR : COLORS.coin,
          borderColor: coin.slow ? SLOW_COIN_GLOW : COLORS.coinGlow,
          shadowColor: coin.slow ? SLOW_COIN_GLOW : COLORS.coinGlow,
        }]}>
          {coin.slow && <Text style={styles.slowCoinIcon}>❄</Text>}
        </View>
      ))}

      {gs.powerUps.map(pu => (
        <View key={pu.id} style={[styles.powerUp, {
          left: LANE_X[pu.lane] - POWERUP_SIZE / 2, top: pu.y,
          backgroundColor: POWERUP_COLORS[pu.type] + '33', borderColor: POWERUP_COLORS[pu.type],
        }]}>
          <Text style={styles.powerUpIcon}>{POWERUP_ICONS[pu.type]}</Text>
        </View>
      ))}

      {gs.obstacles.map(obs => (
        <View key={obs.id} style={[styles.obstacle, {
          left: LANE_X[obs.lane] - OBSTACLE_W / 2, top: obs.y,
          width: OBSTACLE_W, height: obs.height,
          backgroundColor: obs.color + '33', borderColor: obs.color, shadowColor: obs.color,
        }]} />
      ))}

      <Animated.View style={[styles.player, {
        backgroundColor: character.color, shadowColor: character.glowColor,
        opacity: invincibleAnim,
        transform: [{ translateX: playerXAnim }, { translateY: playerYAnim }],
        ...(ap.shield > 0 ? { shadowRadius: 24, shadowOpacity: 1, borderColor: COLORS.shield, borderWidth: 3 } : {}),
      }]} />

      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hudLeft}>
          <View style={styles.livesRow}>
            {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
              <Text key={i} style={[styles.heart, { opacity: i < gs.lives ? 1 : 0.2 }]}>❤️</Text>
            ))}
          </View>
          <View style={styles.powerUpRow}>
            {ap.shield > 0 && (
              <View style={[styles.powerUpBadge, { borderColor: COLORS.shield }]}>
                <Text style={styles.powerUpBadgeIcon}>🛡</Text>
                <Text style={[styles.powerUpTimer, { color: COLORS.shield }]}>{Math.ceil(ap.shield / 1000)}s</Text>
              </View>
            )}
            {ap.magnet > 0 && (
              <View style={[styles.powerUpBadge, { borderColor: COLORS.magnet }]}>
                <Text style={styles.powerUpBadgeIcon}>🧲</Text>
                <Text style={[styles.powerUpTimer, { color: COLORS.magnet }]}>{Math.ceil(ap.magnet / 1000)}s</Text>
              </View>
            )}
            {ap.multiplier > 0 && (
              <View style={[styles.powerUpBadge, { borderColor: COLORS.multiplier }]}>
                <Text style={styles.powerUpBadgeIcon}>✨</Text>
                <Text style={[styles.powerUpTimer, { color: COLORS.multiplier }]}>2×</Text>
              </View>
            )}
            {ap.slow > 0 && (
              <View style={[styles.powerUpBadge, { borderColor: COLORS.slow }]}>
                <Text style={styles.powerUpBadgeIcon}>⏱</Text>
                <Text style={[styles.powerUpTimer, { color: COLORS.slow }]}>{Math.ceil(ap.slow / 1000)}s</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.hudCenter}>
          <NeonText size={28} color={COLORS.neonCyan} style={styles.scoreText}>
            {gs.score.toLocaleString()}
          </NeonText>
          <NeonText size={10} color={COLORS.textDim}>🪙 {gs.coinsEarned}</NeonText>
          <NeonText size={10} color={COLORS.neonYellow}>
            {Math.floor(gs.distance)}m / {gs.levelGoal}m
          </NeonText>
        </View>

        <View style={styles.hudRight}>
          <View style={styles.levelBadge}>
            <NeonText size={9} color={COLORS.textDim}>LVL</NeonText>
            <NeonText size={22} color={COLORS.neonYellow}>{gs.playerLevel}</NeonText>
          </View>
          <TouchableWithoutFeedback onPress={handlePause}>
            <View style={styles.pauseBtn}><Text style={styles.pauseIcon}>⏸</Text></View>
          </TouchableWithoutFeedback>
        </View>
      </View>

      {/* Level progress bar */}
      <View style={styles.levelBar}>
        <View style={[styles.levelFill, {
          width: `${progressPct}%`,
          backgroundColor: progressPct >= 99 ? COLORS.neonYellow : COLORS.neonCyan,
        }]} />
      </View>

      {/* Pause modal */}
      {showPauseModal && (
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#0d0d26', '#12122f']} style={styles.modal}>
            <NeonText size={28} color={COLORS.neonCyan} style={styles.modalTitle}>PAUSED</NeonText>
            <NeonText size={12} color={COLORS.textDim} style={styles.modalSub}>
              {Math.floor(gs.distance)}m of {gs.levelGoal}m
            </NeonText>
            <NeonButton label="▶  RESUME" onPress={handleResume} color={COLORS.neonCyan} style={styles.modalBtn} />
            <NeonButton label="QUIT" onPress={handleGameOver} color={COLORS.neonPink} style={styles.modalBtn} size="sm" />
          </LinearGradient>
        </View>
      )}

      {/* Revive / Game over modal */}
      {showReviveModal && (
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#0d0d26', '#12122f']} style={styles.modal}>
            <NeonText size={28} color={COLORS.neonPink} style={styles.modalTitle}>GAME OVER</NeonText>
            <NeonText size={22} color={COLORS.neonCyan} style={styles.modalScore}>{gs.score.toLocaleString()}</NeonText>
            <NeonText size={12} color={COLORS.textDim} style={styles.modalSub}>🪙 {gs.coinsEarned} coins earned</NeonText>
            {gs.canRevive && (
              <>
                <NeonText size={13} color={COLORS.textDim} style={styles.reviveText}>Continue where you left off?</NeonText>
                <NeonButton
                  label="📺  WATCH AD TO REVIVE"
                  onPress={async () => { const granted = await adService.showRewardedAd(); if (granted) handleRevive(); }}
                  color={COLORS.neonGreen}
                  style={styles.modalBtn}
                />
              </>
            )}
            <NeonButton label="GO HOME →" onPress={handleGameOver} color={COLORS.neonCyan} style={styles.modalBtn} />
          </LinearGradient>
        </View>
      )}

      {/* Level complete modal */}
      {showLevelCompleteModal && (
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#0d0d26', '#12122f']} style={styles.modal}>
            <NeonText size={14} color={COLORS.neonYellow} style={styles.modalTitle}>
              ★ LEVEL COMPLETE! ★
            </NeonText>
            <NeonText size={52} color={COLORS.neonYellow} style={styles.levelCompleteNum}>
              {gs.playerLevel}
            </NeonText>
            <NeonText size={13} color={COLORS.neonCyan} style={styles.modalSub}>
              Score: {gs.score.toLocaleString()}
            </NeonText>
            <NeonText size={13} color={COLORS.neonYellow} style={styles.modalSub}>
              🪙 {gs.coinsEarned} coins earned!
            </NeonText>
            <NeonButton
              label="COLLECT & GO HOME →"
              onPress={handleLevelComplete}
              color={COLORS.neonYellow}
              style={styles.modalBtn}
            />
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, overflow: 'hidden' },
  bgLayer: { position: 'absolute', left: 0, right: 0, height: SCREEN_H },
  bgLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.neonCyan, opacity: 0.07 },
  lanes: { flexDirection: 'row', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  lane: { flex: 1, position: 'relative' },
  laneDivider: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, backgroundColor: COLORS.laneLine, opacity: 0.5 },
  groundLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: COLORS.neonCyan, opacity: 0.3 },
  player: {
    position: 'absolute', width: PLAYER_W, height: PLAYER_H, borderRadius: 8,
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 16, shadowOpacity: 1, elevation: 10, borderWidth: 0,
  },
  obstacle: {
    position: 'absolute', borderRadius: 6, borderWidth: 2,
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 12, shadowOpacity: 0.9, elevation: 8,
  },
  coin: {
    position: 'absolute', width: COIN_SIZE, height: COIN_SIZE, borderRadius: COIN_SIZE / 2,
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 10, shadowOpacity: 1, elevation: 6,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  slowCoinIcon: { fontSize: 11, lineHeight: 13 },
  powerUp: {
    position: 'absolute', width: POWERUP_SIZE, height: POWERUP_SIZE,
    borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  powerUpIcon: { fontSize: 18 },
  hud: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingHorizontal: 16, paddingBottom: 10,
    backgroundColor: 'rgba(8,8,26,0.7)',
  },
  hudLeft: { flex: 1, gap: 6 },
  hudCenter: { flex: 1, alignItems: 'center', gap: 2 },
  hudRight: { alignItems: 'center', gap: 4 },
  levelBadge: {
    alignItems: 'center', backgroundColor: '#1a1a3a', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.neonYellow + '55',
  },
  livesRow: { flexDirection: 'row', gap: 4 },
  heart: { fontSize: 18 },
  powerUpRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  powerUpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: '#1a1a3a',
  },
  powerUpBadgeIcon: { fontSize: 12 },
  powerUpTimer: { fontSize: 11, fontWeight: '700' },
  scoreText: { fontWeight: '900', letterSpacing: 2 },
  pauseBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pauseIcon: { fontSize: 22 },
  levelBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, backgroundColor: '#1a1a3a' },
  levelFill: { height: '100%', shadowRadius: 4, shadowOpacity: 1 },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    width: '82%', borderRadius: 16, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4a', gap: 12,
  },
  modalTitle: { fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  modalScore: { fontWeight: '900', letterSpacing: 2 },
  modalSub: { letterSpacing: 1 },
  reviveText: { textAlign: 'center', letterSpacing: 0.5 },
  modalBtn: { width: '100%' },
  levelCompleteNum: {
    fontWeight: '900', letterSpacing: 4,
    textShadowColor: COLORS.neonYellow, textShadowRadius: 30, textShadowOffset: { width: 0, height: 0 },
  },
});
