/**
 * AdService - manages banner, interstitial, and rewarded ad integration.
 *
 * Integration notes:
 *   1. Install: expo install expo-ads-admob  (or use Google Mobile Ads SDK via config plugin)
 *   2. Replace TEST_* constants with your real AdMob unit IDs from app.json extras
 *   3. Call AdService.init() in App.tsx before rendering
 *
 * Ad IDs below are Google's official test IDs — safe for development.
 */

const TEST_BANNER_ID     = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL  = 'ca-app-pub-3940256099942544/1033173712';
const TEST_REWARDED      = 'ca-app-pub-3940256099942544/5224354917';

let interstitialLoadCount = 0;
const INTERSTITIAL_FREQUENCY = 3;

class AdService {
  private adsEnabled = true;

  setAdsEnabled(enabled: boolean) {
    this.adsEnabled = enabled;
  }

  getBannerId(): string {
    return TEST_BANNER_ID;
  }

  getInterstitialId(): string {
    return TEST_INTERSTITIAL;
  }

  getRewardedId(): string {
    return TEST_REWARDED;
  }

  /** Call after each game over. Shows interstitial every N deaths. */
  async showInterstitialIfReady(): Promise<void> {
    if (!this.adsEnabled) return;
    interstitialLoadCount++;
    if (interstitialLoadCount % INTERSTITIAL_FREQUENCY !== 0) return;
    console.log('[AdService] Would show interstitial ad here');
    // With expo-ads-admob:
    // await AdMobInterstitial.setAdUnitID(this.getInterstitialId());
    // await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: false });
    // await AdMobInterstitial.showAdAsync();
  }

  /** Show a rewarded ad. Returns true if the reward was granted. */
  async showRewardedAd(): Promise<boolean> {
    if (!this.adsEnabled) return false;
    console.log('[AdService] Would show rewarded ad here');
    // With expo-ads-admob:
    // await AdMobRewarded.setAdUnitID(this.getRewardedId());
    // await AdMobRewarded.requestAdAsync();
    // return new Promise(resolve => {
    //   AdMobRewarded.addEventListener('rewardedVideoUserDidEarnReward', () => resolve(true));
    //   AdMobRewarded.addEventListener('rewardedVideoDidFailToLoad', () => resolve(false));
    //   AdMobRewarded.showAdAsync();
    // });
    return true; // Simulated grant for dev
  }
}

export const adService = new AdService();
