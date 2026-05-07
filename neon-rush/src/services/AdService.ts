/**
 * AdService — Google Mobile Ads integration (react-native-google-mobile-ads).
 *
 * Setup (one-time, on your Windows machine):
 *   1. cd neon-rush && npm install react-native-google-mobile-ads
 *   2. Fill in YOUR AdMob App ID in app.json → plugins → react-native-google-mobile-ads → androidAppId
 *      (AdMob Console → Apps → Neon Rush → App settings → App ID)
 *   3. npx expo prebuild --clean
 *   4. eas build --platform android --profile production
 */

import {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  MobileAds,
} from 'react-native-google-mobile-ads';

// ─── Ad Unit IDs ──────────────────────────────────────────────────────────────
const LIVE_INTERSTITIAL_ID = 'ca-app-pub-1994019770206439/4253918857';
const LIVE_REWARDED_ID     = 'ca-app-pub-1994019770206439/5567000527';

const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const TEST_REWARDED_ID     = 'ca-app-pub-3940256099942544/5224354917';

// Automatically uses live IDs in production builds, test IDs in Expo Go / dev
const IS_PRODUCTION = !__DEV__;

const AD_IDS = {
  interstitial: IS_PRODUCTION ? LIVE_INTERSTITIAL_ID : TEST_INTERSTITIAL_ID,
  rewarded:     IS_PRODUCTION ? LIVE_REWARDED_ID     : TEST_REWARDED_ID,
};

// Created at module load so ads can begin preloading immediately
const interstitial = InterstitialAd.createForAdRequest(AD_IDS.interstitial, {
  requestNonPersonalizedAdsOnly: true,
});
const rewarded = RewardedAd.createForAdRequest(AD_IDS.rewarded, {
  requestNonPersonalizedAdsOnly: true,
});

let interstitialCount = 0;
const INTERSTITIAL_FREQUENCY = 3;

class AdService {
  private adsEnabled = true;

  /** Call once from App.tsx after checking removeAds preference. */
  async initialize(): Promise<void> {
    await MobileAds().initialize();
    if (this.adsEnabled) {
      interstitial.load();
      rewarded.load();
    }
  }

  setAdsEnabled(enabled: boolean): void {
    this.adsEnabled = enabled;
    if (enabled) {
      interstitial.load();
      rewarded.load();
    }
  }

  /** Shows interstitial at the end of EVERY level. */
  async showLevelEndAd(): Promise<void> {
    if (!this.adsEnabled) return;
    console.log('[AdService] Level-end interstitial triggered');
    return new Promise<void>(resolve => {
      const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        interstitial.show();
        unsubLoaded();
        interstitial.load(); // preload next
        resolve();
      });
      const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        console.warn('[AdService] Interstitial error:', error);
        unsubError();
        resolve();
      });
      if (interstitial.loaded) {
        interstitial.show();
      } else {
        interstitial.load();
      }
    });
  }

  /** Shows interstitial every INTERSTITIAL_FREQUENCY deaths. */
  async showInterstitialIfReady(): Promise<void> {
    if (!this.adsEnabled) return;
    interstitialCount++;
    if (interstitialCount % INTERSTITIAL_FREQUENCY !== 0) return;
    console.log(`[AdService] Death interstitial triggered (count ${interstitialCount})`);
    return this.showLevelEndAd();
  }

  /** Shows a rewarded ad. Returns true when the reward is granted. */
  async showRewardedAd(): Promise<boolean> {
    if (!this.adsEnabled) return false;
    console.log('[AdService] Rewarded ad triggered');
    return new Promise<boolean>(resolve => {
      const unsubEarned = rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          unsubEarned();
          rewarded.load(); // preload next
          resolve(true);
        },
      );
      const unsubLoaded = rewarded.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          unsubLoaded();
          rewarded.show();
        },
      );
      const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
        console.warn('[AdService] Rewarded ad error:', error);
        unsubError();
        resolve(false);
      });
      if (rewarded.loaded) {
        rewarded.show();
      } else {
        rewarded.load();
      }
    });
  }
}

export const adService = new AdService();
