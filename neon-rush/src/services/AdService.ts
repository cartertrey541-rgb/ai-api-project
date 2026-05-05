/**
 * AdService — Google Mobile Ads integration (react-native-google-mobile-ads).
 *
 * Setup steps:
 *   1. npm install react-native-google-mobile-ads
 *   2. npx expo prebuild  (generates native Android files)
 *   3. Add your AdMob App ID to app.json plugins (see below — marked with TODO)
 *   4. Build: npx expo run:android  OR  eas build --platform android
 *
 * Your AdMob App ID is at:
 *   AdMob Console → Apps → [Neon Rush] → App settings → App ID
 *   It looks like:  ca-app-pub-1994019770206439~XXXXXXXXXX
 */

// ─── Your live Ad Unit IDs ────────────────────────────────────────────────────
const BANNER_ID      = 'ca-app-pub-1994019770206439/REPLACE_WITH_BANNER_UNIT_ID';
const INTERSTITIAL_ID = 'ca-app-pub-1994019770206439/4253918857';
const REWARDED_ID     = 'ca-app-pub-1994019770206439/5567000527';

// Use Google's test IDs during development (swap to live IDs above for production)
const DEV_BANNER_ID      = 'ca-app-pub-3940256099942544/6300978111';
const DEV_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const DEV_REWARDED_ID     = 'ca-app-pub-3940256099942544/5224354917';

const IS_PRODUCTION = false; // ← set true before submitting to Play Store

const AD_IDS = {
  banner:       IS_PRODUCTION ? BANNER_ID       : DEV_BANNER_ID,
  interstitial: IS_PRODUCTION ? INTERSTITIAL_ID  : DEV_INTERSTITIAL_ID,
  rewarded:     IS_PRODUCTION ? REWARDED_ID      : DEV_REWARDED_ID,
};

// ─── react-native-google-mobile-ads integration ───────────────────────────────
// Uncomment the block below once `react-native-google-mobile-ads` is installed
// and `npx expo prebuild` has been run.
//
// import {
//   InterstitialAd,
//   RewardedAd,
//   AdEventType,
//   RewardedAdEventType,
//   MobileAds,
// } from 'react-native-google-mobile-ads';
//
// const interstitial = InterstitialAd.createForAdRequest(AD_IDS.interstitial, {
//   requestNonPersonalizedAdsOnly: true,
// });
// const rewarded = RewardedAd.createForAdRequest(AD_IDS.rewarded, {
//   requestNonPersonalizedAdsOnly: true,
// });
// ─────────────────────────────────────────────────────────────────────────────

let interstitialCount = 0;
const INTERSTITIAL_FREQUENCY = 3;

class AdService {
  private adsEnabled = true;

  setAdsEnabled(enabled: boolean): void {
    this.adsEnabled = enabled;
  }

  getBannerId(): string {
    return AD_IDS.banner;
  }

  getInterstitialId(): string {
    return AD_IDS.interstitial;
  }

  getRewardedId(): string {
    return AD_IDS.rewarded;
  }

  /** Shows interstitial every INTERSTITIAL_FREQUENCY deaths. */
  async showInterstitialIfReady(): Promise<void> {
    if (!this.adsEnabled) return;
    interstitialCount++;
    if (interstitialCount % INTERSTITIAL_FREQUENCY !== 0) return;

    console.log(`[AdService] Interstitial triggered (count ${interstitialCount})`);

    // ── Uncomment after running npx expo prebuild ──────────────────────────
    // return new Promise<void>(resolve => {
    //   const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
    //     interstitial.show();
    //     unsubLoaded();
    //     resolve();
    //   });
    //   const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
    //     unsubError();
    //     resolve();
    //   });
    //   interstitial.load();
    // });
    // ─────────────────────────────────────────────────────────────────────
  }

  /** Shows a rewarded ad. Returns true when the reward is granted. */
  async showRewardedAd(): Promise<boolean> {
    if (!this.adsEnabled) return false;

    console.log('[AdService] Rewarded ad triggered');

    // ── Uncomment after running npx expo prebuild ──────────────────────────
    // return new Promise<boolean>(resolve => {
    //   const unsubEarned = rewarded.addAdEventListener(
    //     RewardedAdEventType.EARNED_REWARD,
    //     () => { unsubEarned(); resolve(true); }
    //   );
    //   const unsubLoaded = rewarded.addAdEventListener(
    //     RewardedAdEventType.LOADED,
    //     () => { unsubLoaded(); rewarded.show(); }
    //   );
    //   const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
    //     unsubError();
    //     resolve(false);
    //   });
    //   rewarded.load();
    // });
    // ─────────────────────────────────────────────────────────────────────

    return true; // ← simulated grant; remove this line when using the real SDK
  }
}

export const adService = new AdService();
