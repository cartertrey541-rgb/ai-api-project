import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlayerData {
  highScore: number;
  totalCoins: number;
  gems: number;
  totalRuns: number;
  currentLevel: number;
  selectedCharacter: string;
  unlockedCharacters: string[];
  completedAchievements: string[];
  removeAds: boolean;
  isVip: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  lastDailySpinDate: string | null;
  dailySpinStreak: number;
  loginStreak: number;
  lastLoginDate: string | null;
}

const DEFAULT_DATA: PlayerData = {
  highScore: 0,
  totalCoins: 0,
  gems: 10,
  totalRuns: 0,
  currentLevel: 1,
  selectedCharacter: 'nova',
  unlockedCharacters: ['nova'],
  completedAchievements: [],
  removeAds: false,
  isVip: false,
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  lastDailySpinDate: null,
  dailySpinStreak: 0,
  loginStreak: 1,
  lastLoginDate: null,
};

const KEY = 'neon_rush_player_data';

class StorageService {
  private cache: PlayerData | null = null;

  async load(): Promise<PlayerData> {
    if (this.cache) return this.cache;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      let data: PlayerData = raw ? { ...DEFAULT_DATA, ...JSON.parse(raw) } : { ...DEFAULT_DATA };
      data = this.checkLoginStreak(data);
      this.cache = data;
      return data;
    } catch {
      this.cache = { ...DEFAULT_DATA };
      return this.cache;
    }
  }

  private checkLoginStreak(data: PlayerData): PlayerData {
    const today = new Date().toDateString();
    if (data.lastLoginDate === today) return data;

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const streak = data.lastLoginDate === yesterday ? data.loginStreak + 1 : 1;
    return { ...data, loginStreak: streak, lastLoginDate: today };
  }

  async save(data: Partial<PlayerData>): Promise<PlayerData> {
    const current = await this.load();
    const updated = { ...current, ...data };
    this.cache = updated;
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    return updated;
  }

  async updateScore(score: number, coinsEarned: number): Promise<PlayerData> {
    const current = await this.load();
    return this.save({
      highScore: Math.max(current.highScore, score),
      totalCoins: current.totalCoins + coinsEarned,
      totalRuns: current.totalRuns + 1,
    });
  }

  async spendCoins(amount: number): Promise<boolean> {
    const current = await this.load();
    if (current.totalCoins < amount) return false;
    await this.save({ totalCoins: current.totalCoins - amount });
    return true;
  }

  async spendGems(amount: number): Promise<boolean> {
    const current = await this.load();
    if (current.gems < amount) return false;
    await this.save({ gems: current.gems - amount });
    return true;
  }

  async addGems(amount: number): Promise<PlayerData> {
    const current = await this.load();
    return this.save({ gems: current.gems + amount });
  }

  async advanceLevel(): Promise<number> {
    const current = await this.load();
    const nextLevel = current.currentLevel + 1;
    await this.save({ currentLevel: nextLevel });
    return nextLevel;
  }

  async unlockCharacter(characterId: string, currency: 'coins' | 'gems', cost: number): Promise<boolean> {
    const current = await this.load();
    if (current.unlockedCharacters.includes(characterId)) return true;
    const canAfford = currency === 'coins'
      ? current.totalCoins >= cost
      : current.gems >= cost;
    if (!canAfford) return false;
    const updateField = currency === 'coins'
      ? { totalCoins: current.totalCoins - cost }
      : { gems: current.gems - cost };
    await this.save({
      ...updateField,
      unlockedCharacters: [...current.unlockedCharacters, characterId],
    });
    return true;
  }

  async selectCharacter(characterId: string): Promise<void> {
    await this.save({ selectedCharacter: characterId });
  }

  async completeAchievement(id: string): Promise<void> {
    const current = await this.load();
    if (current.completedAchievements.includes(id)) return;
    await this.save({
      completedAchievements: [...current.completedAchievements, id],
    });
  }

  async canSpinToday(): Promise<boolean> {
    const data = await this.load();
    const today = new Date().toDateString();
    return data.lastDailySpinDate !== today;
  }

  async recordSpin(): Promise<void> {
    const today = new Date().toDateString();
    await this.save({ lastDailySpinDate: today });
  }

  invalidateCache(): void {
    this.cache = null;
  }
}

export const storage = new StorageService();
