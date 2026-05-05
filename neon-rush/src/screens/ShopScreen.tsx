import React, { useEffect, useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { NeonButton } from '../components/NeonButton';
import { NeonText } from '../components/NeonText';
import { storage, PlayerData } from '../services/StorageService';
import { iapService } from '../services/IAPService';
import { COLORS, CHARACTERS, IAP_PRODUCTS } from '../constants';

type NavProp = StackNavigationProp<RootStackParamList, 'Shop'>;
interface Props { navigation: NavProp; }

type Tab = 'characters' | 'gems' | 'powerups';

export const ShopScreen: React.FC<Props> = ({ navigation }) => {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('characters');
  const [loading, setLoading] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      storage.load().then(setPlayerData);
    }, [])
  );

  const reload = async () => {
    storage.invalidateCache();
    const data = await storage.load();
    setPlayerData(data);
  };

  const handleSelectCharacter = async (characterId: string) => {
    await storage.selectCharacter(characterId);
    await reload();
  };

  const handleBuyCharacter = async (characterId: string, currency: 'coins' | 'gems', cost: number) => {
    const success = await storage.unlockCharacter(characterId, currency, cost);
    if (!success) {
      Alert.alert(
        'Not enough ' + (currency === 'coins' ? '🪙 Coins' : '💎 Gems'),
        currency === 'coins'
          ? 'Keep running to earn more coins!'
          : 'Visit the Gems tab to purchase more gems.',
      );
      return;
    }
    await reload();
    Alert.alert('🎉 Unlocked!', `Character unlocked and equipped!`);
    await storage.selectCharacter(characterId);
    await reload();
  };

  const handleBuyGems = async (productId: string) => {
    setLoading(productId);
    const result = await iapService.purchase(productId);
    setLoading(null);
    await reload();
    if (result === 'success') {
      Alert.alert('💎 Purchase Complete!', 'Gems have been added to your account.');
    } else if (result === 'error') {
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    }
  };

  if (!playerData) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.neonCyan} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#08081a', '#0d0d26']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <NeonText size={20} color={COLORS.neonCyan}>←</NeonText>
        </TouchableOpacity>
        <NeonText size={22} color={COLORS.neonCyan} style={styles.headerTitle}>SHOP</NeonText>
        <View style={styles.headerRight}>
          <View style={styles.currencyChip}>
            <NeonText size={13} color={COLORS.neonYellow}>🪙 {playerData.totalCoins}</NeonText>
          </View>
          <View style={styles.currencyChip}>
            <NeonText size={13} color={COLORS.neonCyan}>💎 {playerData.gems}</NeonText>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['characters', 'gems', 'powerups'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <NeonText
              size={12}
              color={activeTab === tab ? COLORS.neonCyan : COLORS.textDim}
            >
              {tab === 'characters' ? '👤 RUNNERS' : tab === 'gems' ? '💎 GEMS' : '⚡ BOOSTS'}
            </NeonText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Characters tab */}
        {activeTab === 'characters' && (
          <View style={styles.grid}>
            {CHARACTERS.map(char => {
              const owned = playerData.unlockedCharacters.includes(char.id);
              const selected = playerData.selectedCharacter === char.id;
              return (
                <View
                  key={char.id}
                  style={[
                    styles.charCard,
                    selected && { borderColor: char.color, borderWidth: 2 },
                  ]}
                >
                  {/* Character preview shape */}
                  <View
                    style={[
                      styles.charShape,
                      {
                        backgroundColor: char.color,
                        shadowColor: char.glowColor,
                        opacity: owned ? 1 : 0.4,
                      },
                    ]}
                  />

                  <NeonText size={13} color={char.color} style={styles.charName}>
                    {char.name}
                  </NeonText>
                  <NeonText size={10} color={COLORS.textDim} style={styles.charDesc}>
                    {char.description}
                  </NeonText>

                  {/* Stat bars */}
                  <View style={styles.statsArea}>
                    {char.jumpBonus > 0 && (
                      <NeonText size={9} color={COLORS.neonGreen}>↑ Jump +{Math.round(char.jumpBonus * 100)}%</NeonText>
                    )}
                    {char.coinBonus > 0 && (
                      <NeonText size={9} color={COLORS.neonYellow}>🪙 Coins +{Math.round(char.coinBonus * 100)}%</NeonText>
                    )}
                    {char.speedBonus > 0 && (
                      <NeonText size={9} color={COLORS.neonCyan}>⚡ Speed +{Math.round(char.speedBonus * 100)}%</NeonText>
                    )}
                  </View>

                  {selected ? (
                    <View style={[styles.selectedBadge, { backgroundColor: char.color + '33', borderColor: char.color }]}>
                      <NeonText size={11} color={char.color}>✓ SELECTED</NeonText>
                    </View>
                  ) : owned ? (
                    <NeonButton
                      label="SELECT"
                      onPress={() => handleSelectCharacter(char.id)}
                      color={char.color}
                      size="sm"
                      style={styles.charBtn}
                    />
                  ) : (
                    <NeonButton
                      label={
                        char.currency === 'free'
                          ? 'FREE'
                          : char.currency === 'coins'
                          ? `🪙 ${char.price}`
                          : `💎 ${char.price}`
                      }
                      onPress={() =>
                        char.currency !== 'free' &&
                        handleBuyCharacter(char.id, char.currency as 'coins' | 'gems', char.price as number)
                      }
                      color={char.currency === 'gems' ? COLORS.neonCyan : COLORS.neonYellow}
                      size="sm"
                      style={styles.charBtn}
                      disabled={char.currency === 'free'}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Gems tab */}
        {activeTab === 'gems' && (
          <View style={styles.gemsList}>
            <NeonText size={12} color={COLORS.textDim} style={styles.gemIntro}>
              Gems unlock premium characters and let you revive without ads.
            </NeonText>

            {IAP_PRODUCTS.map(product => (
              <TouchableOpacity
                key={product.id}
                style={styles.gemCard}
                onPress={() => handleBuyGems(product.id)}
                disabled={loading === product.id}
              >
                <LinearGradient
                  colors={['#1a1a3a', '#12122f']}
                  style={styles.gemCardInner}
                >
                  <View style={styles.gemCardLeft}>
                    <NeonText size={16} color={COLORS.neonCyan}>{product.label}</NeonText>
                    {product.gems > 0 && (
                      <NeonText size={12} color={COLORS.textDim}>
                        💎 +{product.gems} Gems
                      </NeonText>
                    )}
                    {product.id === 'remove_ads' && (
                      <NeonText size={11} color={COLORS.textDim}>Remove all ads forever</NeonText>
                    )}
                    {product.id === 'vip_monthly' && (
                      <NeonText size={11} color={COLORS.textDim}>
                        No ads · Daily gems · Exclusive runner
                      </NeonText>
                    )}
                  </View>
                  <View style={styles.gemCardRight}>
                    {loading === product.id ? (
                      <ActivityIndicator color={COLORS.neonCyan} />
                    ) : (
                      <View style={styles.priceBadge}>
                        <NeonText size={15} color={COLORS.neonYellow}>{product.price}</NeonText>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={() => iapService.restorePurchases()} style={styles.restoreBtn}>
              <NeonText size={12} color={COLORS.textDim}>Restore Purchases</NeonText>
            </TouchableOpacity>
          </View>
        )}

        {/* Boosts tab */}
        {activeTab === 'powerups' && (
          <View style={styles.boostsList}>
            <NeonText size={12} color={COLORS.textDim} style={styles.gemIntro}>
              Power-ups appear during runs. Earn coins and gems to unlock starting boosts.
            </NeonText>

            {[
              { icon: '🛡', name: 'Shield', desc: 'Start every run with a shield active', cost: 20, color: COLORS.shield },
              { icon: '🧲', name: 'Coin Magnet', desc: 'Start with the magnet power-up', cost: 20, color: COLORS.magnet },
              { icon: '✨', name: 'Score Rush', desc: 'Start with 2× score multiplier', cost: 25, color: COLORS.multiplier },
              { icon: '⏱', name: 'Slow Start', desc: 'Game starts at reduced speed', cost: 15, color: COLORS.slow },
            ].map(boost => (
              <View key={boost.name} style={[styles.boostCard, { borderColor: boost.color + '44' }]}>
                <View style={styles.boostLeft}>
                  <NeonText size={28} color={boost.color}>{boost.icon}</NeonText>
                </View>
                <View style={styles.boostMid}>
                  <NeonText size={14} color={boost.color}>{boost.name}</NeonText>
                  <NeonText size={11} color={COLORS.textDim}>{boost.desc}</NeonText>
                </View>
                <NeonButton
                  label={`💎 ${boost.cost}`}
                  onPress={() => Alert.alert('Coming Soon!', 'Starting boosts will be available in v1.1!')}
                  color={boost.color}
                  size="sm"
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a3a',
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, fontWeight: '900', letterSpacing: 4 },
  headerRight: { flexDirection: 'row', gap: 8 },
  currencyChip: {
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a3a',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.neonCyan },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  charCard: {
    width: '47%',
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    alignItems: 'center',
    gap: 8,
  },
  charShape: {
    width: 48,
    height: 60,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 1,
    elevation: 8,
  },
  charName: { textAlign: 'center', letterSpacing: 1 },
  charDesc: { textAlign: 'center', lineHeight: 14 },
  statsArea: { alignItems: 'center', gap: 2 },
  charBtn: { width: '100%', marginTop: 4 },
  selectedBadge: {
    width: '100%',
    alignItems: 'center',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  gemsList: { gap: 12 },
  gemIntro: { textAlign: 'center', marginBottom: 8, lineHeight: 18 },
  gemCard: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#2a2a4a' },
  gemCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  gemCardLeft: { flex: 1, gap: 4 },
  gemCardRight: { alignItems: 'center' },
  priceBadge: {
    backgroundColor: '#2a2a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.neonYellow + '44',
  },
  restoreBtn: { alignItems: 'center', marginTop: 12, padding: 12 },
  boostsList: { gap: 12 },
  boostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  boostLeft: { width: 44, alignItems: 'center' },
  boostMid: { flex: 1, gap: 4 },
});
