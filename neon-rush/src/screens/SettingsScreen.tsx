import React, { useEffect, useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { NeonText } from '../components/NeonText';
import { NeonButton } from '../components/NeonButton';
import { storage, PlayerData } from '../services/StorageService';
import { COLORS } from '../constants';

type NavProp = StackNavigationProp<RootStackParamList, 'Settings'>;
interface Props { navigation: NavProp; }

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);

  useFocusEffect(
    useCallback(() => {
      storage.load().then(setPlayerData);
    }, [])
  );

  const toggle = async (field: keyof Pick<PlayerData, 'soundEnabled' | 'musicEnabled' | 'hapticsEnabled'>) => {
    if (!playerData) return;
    const updated = await storage.save({ [field]: !playerData[field] });
    setPlayerData(updated);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      'This will erase ALL your progress, coins, gems, and unlocked characters. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await storage.save({
              highScore: 0,
              totalCoins: 0,
              gems: 10,
              totalRuns: 0,
              selectedCharacter: 'nova',
              unlockedCharacters: ['nova'],
              completedAchievements: [],
              removeAds: false,
              isVip: false,
            });
            storage.invalidateCache();
            const fresh = await storage.load();
            setPlayerData(fresh);
            Alert.alert('Reset Complete', 'Your progress has been reset.');
          },
        },
      ]
    );
  };

  if (!playerData) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#08081a', '#0d0d26']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <NeonText size={20} color={COLORS.neonCyan}>←</NeonText>
        </TouchableOpacity>
        <NeonText size={22} color={COLORS.neonCyan} style={styles.headerTitle}>SETTINGS</NeonText>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Audio */}
        <View style={styles.section}>
          <NeonText size={12} color={COLORS.textDim} style={styles.sectionTitle}>AUDIO</NeonText>

          <View style={styles.row}>
            <NeonText size={16} color={COLORS.text}>Sound Effects</NeonText>
            <Switch
              value={playerData.soundEnabled}
              onValueChange={() => toggle('soundEnabled')}
              thumbColor={playerData.soundEnabled ? COLORS.neonCyan : COLORS.textDim}
              trackColor={{ false: '#2a2a4a', true: COLORS.neonCyan + '44' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <NeonText size={16} color={COLORS.text}>Music</NeonText>
            <Switch
              value={playerData.musicEnabled}
              onValueChange={() => toggle('musicEnabled')}
              thumbColor={playerData.musicEnabled ? COLORS.neonPurple : COLORS.textDim}
              trackColor={{ false: '#2a2a4a', true: COLORS.neonPurple + '44' }}
            />
          </View>
        </View>

        {/* Gameplay */}
        <View style={styles.section}>
          <NeonText size={12} color={COLORS.textDim} style={styles.sectionTitle}>GAMEPLAY</NeonText>

          <View style={styles.row}>
            <View>
              <NeonText size={16} color={COLORS.text}>Haptic Feedback</NeonText>
              <NeonText size={11} color={COLORS.textDim}>Vibration on hits and pickups</NeonText>
            </View>
            <Switch
              value={playerData.hapticsEnabled}
              onValueChange={() => toggle('hapticsEnabled')}
              thumbColor={playerData.hapticsEnabled ? COLORS.neonPink : COLORS.textDim}
              trackColor={{ false: '#2a2a4a', true: COLORS.neonPink + '44' }}
            />
          </View>
        </View>

        {/* Account stats */}
        <View style={styles.section}>
          <NeonText size={12} color={COLORS.textDim} style={styles.sectionTitle}>ACCOUNT</NeonText>

          <View style={styles.statRow}>
            <NeonText size={13} color={COLORS.textDim}>High Score</NeonText>
            <NeonText size={13} color={COLORS.neonCyan}>{playerData.highScore.toLocaleString()}</NeonText>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <NeonText size={13} color={COLORS.textDim}>Total Runs</NeonText>
            <NeonText size={13} color={COLORS.neonCyan}>{playerData.totalRuns}</NeonText>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <NeonText size={13} color={COLORS.textDim}>Total Coins Earned</NeonText>
            <NeonText size={13} color={COLORS.neonYellow}>{playerData.totalCoins.toLocaleString()}</NeonText>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <NeonText size={13} color={COLORS.textDim}>Login Streak</NeonText>
            <NeonText size={13} color={COLORS.neonPink}>{playerData.loginStreak} days 🔥</NeonText>
          </View>
        </View>

        {/* VIP status */}
        {playerData.isVip && (
          <View style={[styles.section, styles.vipBanner]}>
            <NeonText size={16} color={COLORS.neonYellow}>👑 VIP PASS ACTIVE</NeonText>
            <NeonText size={12} color={COLORS.textDim}>Ads removed · Daily gems included</NeonText>
          </View>
        )}

        {/* Legal */}
        <View style={styles.section}>
          <NeonText size={12} color={COLORS.textDim} style={styles.sectionTitle}>LEGAL</NeonText>
          <NeonText size={12} color={COLORS.textDim} style={styles.legalText}>
            Neon Rush is free to play. In-app purchases are available for optional content.
            Subscription purchases (VIP Pass) auto-renew monthly unless cancelled at least
            24 hours before the renewal date. Manage subscriptions in your Google Play account.
          </NeonText>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <NeonText size={12} color={COLORS.neonPink} style={styles.sectionTitle}>DANGER ZONE</NeonText>
          <NeonButton
            label="RESET PROGRESS"
            onPress={handleReset}
            color={COLORS.neonPink}
            size="sm"
            style={styles.resetBtn}
          />
        </View>

        <NeonText size={11} color={COLORS.textDim} style={styles.version}>
          Neon Rush v1.0.0
        </NeonText>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
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
  headerTitle: { fontWeight: '900', letterSpacing: 4 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 60, gap: 16 },
  section: {
    backgroundColor: '#0d0d26',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    padding: 16,
    gap: 12,
  },
  sectionTitle: { letterSpacing: 2, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  divider: { height: 1, backgroundColor: '#1a1a3a' },
  vipBanner: {
    alignItems: 'center',
    borderColor: COLORS.neonYellow + '44',
  },
  legalText: { lineHeight: 18 },
  resetBtn: { alignSelf: 'flex-start' },
  version: { textAlign: 'center', marginTop: 8 },
});
