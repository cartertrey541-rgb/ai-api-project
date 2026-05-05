import { Dimensions } from 'react-native';

export const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const LANE_COUNT = 3;
export const LANE_WIDTH = SCREEN_W / LANE_COUNT;
export const LANE_X = [
  LANE_WIDTH * 0.5,
  LANE_WIDTH * 1.5,
  LANE_WIDTH * 2.5,
];

export const PLAYER_W = 40;
export const PLAYER_H = 56;
export const GROUND_Y = SCREEN_H - 140;
export const PLAYER_START_LANE = 1;

export const GRAVITY = 0.55;
export const JUMP_VELOCITY = -14;
export const DOUBLE_JUMP_VELOCITY = -11;

export const OBSTACLE_W = LANE_WIDTH - 12;
export const OBSTACLE_MIN_H = 36;
export const OBSTACLE_MAX_H = 90;

export const COIN_SIZE = 22;
export const POWERUP_SIZE = 34;

export const INITIAL_SPEED = 6;
export const SPEED_INCREMENT = 0.0012;
export const MAX_SPEED = 18;

export const SPAWN_INTERVAL_MIN = 900;
export const SPAWN_INTERVAL_MAX = 1600;
export const COIN_SPAWN_INTERVAL = 600;
export const POWERUP_SPAWN_CHANCE = 0.12;

export const SHIELD_DURATION = 4000;
export const MAGNET_DURATION = 8000;
export const MULTIPLIER_DURATION = 6000;
export const SLOW_DURATION = 5000;
export const MAGNET_RADIUS = 160;

export const INITIAL_LIVES = 3;
export const SCORE_PER_SECOND = 10;
export const COIN_VALUE = 5;
export const COIN_PREMIUM_VALUE = 25;

export const LANE_SWITCH_DURATION = 120;

export const COLORS = {
  bg: '#08081a',
  bgMid: '#0d0d26',
  lane: '#1a1a3a',
  laneLine: '#1e1e4a',
  playerDefault: '#00e5ff',
  neonCyan: '#00e5ff',
  neonPink: '#ff006e',
  neonPurple: '#7c3aed',
  neonGreen: '#39ff14',
  neonYellow: '#ffbe0b',
  neonOrange: '#fb5607',
  coin: '#ffd700',
  coinGlow: '#ff8c00',
  shield: '#00e5ff',
  magnet: '#ff006e',
  multiplier: '#39ff14',
  slow: '#7c3aed',
  text: '#ffffff',
  textDim: '#8888aa',
  barrier: '#ff006e',
  drone: '#7c3aed',
  laser: '#39ff14',
  heart: '#ff006e',
};

export const OBSTACLE_TYPES = ['barrier', 'drone', 'laser', 'spike'] as const;
export type ObstacleType = typeof OBSTACLE_TYPES[number];

export const POWERUP_TYPES = ['shield', 'magnet', 'multiplier', 'slow'] as const;
export type PowerUpType = typeof POWERUP_TYPES[number];

export const CHARACTERS = [
  {
    id: 'nova',
    name: 'Cyber Nova',
    color: '#00e5ff',
    glowColor: '#00e5ff',
    price: 0,
    currency: 'free',
    description: 'The default runner. Fast and reliable.',
    jumpBonus: 0,
    speedBonus: 0,
    coinBonus: 0,
  },
  {
    id: 'ghost',
    name: 'Neon Ghost',
    color: '#7c3aed',
    glowColor: '#a855f7',
    price: 800,
    currency: 'coins',
    description: 'Slightly higher jumps. Haunts the leaderboards.',
    jumpBonus: 0.1,
    speedBonus: 0,
    coinBonus: 0,
  },
  {
    id: 'punk',
    name: 'Pixel Punk',
    color: '#ff006e',
    glowColor: '#ff4499',
    price: 1500,
    currency: 'coins',
    description: 'Born to run. Earns 10% more coins.',
    jumpBonus: 0,
    speedBonus: 0,
    coinBonus: 0.1,
  },
  {
    id: 'storm',
    name: 'Thunder Storm',
    color: '#ffbe0b',
    glowColor: '#ffd700',
    price: 49,
    currency: 'gems',
    description: 'Lightning fast. Power-ups last 20% longer.',
    jumpBonus: 0,
    speedBonus: 0.05,
    coinBonus: 0.05,
  },
  {
    id: 'void',
    name: 'Void Walker',
    color: '#39ff14',
    glowColor: '#00ff88',
    price: 99,
    currency: 'gems',
    description: 'From another dimension. All bonuses +10%.',
    jumpBonus: 0.1,
    speedBonus: 0.1,
    coinBonus: 0.1,
  },
];

export const IAP_PRODUCTS = [
  { id: 'gems_30', gems: 30, price: '$0.99', label: 'Starter Pack' },
  { id: 'gems_80', gems: 80, price: '$1.99', label: 'Value Pack' },
  { id: 'gems_200', gems: 200, price: '$4.99', label: 'Power Pack' },
  { id: 'gems_500', gems: 500, price: '$9.99', label: 'Mega Pack' },
  { id: 'remove_ads', gems: 0, price: '$2.99', label: 'Remove Ads' },
  { id: 'vip_monthly', gems: 30, price: '$3.99/mo', label: 'VIP Pass' },
];

export const ACHIEVEMENTS = [
  { id: 'first_run', title: 'First Steps', desc: 'Complete your first run', goal: 1, type: 'runs' },
  { id: 'score_1k', title: 'Getting Started', desc: 'Score 1,000 in a single run', goal: 1000, type: 'score' },
  { id: 'score_5k', title: 'Speed Demon', desc: 'Score 5,000 in a single run', goal: 5000, type: 'score' },
  { id: 'score_10k', title: 'Neon Legend', desc: 'Score 10,000 in a single run', goal: 10000, type: 'score' },
  { id: 'coins_100', title: 'Coin Collector', desc: 'Collect 100 coins total', goal: 100, type: 'totalCoins' },
  { id: 'coins_1000', title: 'Coin Hoarder', desc: 'Collect 1,000 coins total', goal: 1000, type: 'totalCoins' },
  { id: 'runs_10', title: 'Dedicated Runner', desc: 'Complete 10 runs', goal: 10, type: 'runs' },
  { id: 'runs_50', title: 'Marathon Runner', desc: 'Complete 50 runs', goal: 50, type: 'runs' },
];
