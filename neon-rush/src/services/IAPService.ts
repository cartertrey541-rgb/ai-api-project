/**
 * IAPService - manages in-app purchases via react-native-iap v12.
 *
 * Setup (one-time, on your Windows machine):
 *   1. cd neon-rush && npm install react-native-iap
 *   2. npx expo prebuild --clean
 *   3. Register these product IDs in Google Play Console → Monetize → Products:
 *        gems_30, gems_80, gems_200, gems_500  (one-time, consumable)
 *        remove_ads                            (one-time, non-consumable)
 *        vip_monthly                           (subscription)
 *   4. Set up a Google Merchant account and link it in Play Console
 *   5. Publish app to at least Internal Testing track before testing IAP
 */

import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  type ProductPurchase,
} from 'react-native-iap';
import { IAP_PRODUCTS } from '../constants';
import { storage } from './StorageService';

export type PurchaseResult = 'success' | 'cancelled' | 'error';

const PRODUCT_SKUS = IAP_PRODUCTS.map(p => p.id);

class IAPService {
  private initialized = false;

  async init(): Promise<void> {
    try {
      await initConnection();
      // Warm up product list so prices display instantly in Shop
      await getProducts({ skus: PRODUCT_SKUS });
      this.initialized = true;
      console.log('[IAPService] Initialized');
    } catch (e) {
      console.warn('[IAPService] Init failed (expected outside Play Store):', e);
      this.initialized = true; // mark init'd so purchase attempts still run
    }
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    if (!this.initialized) await this.init();

    const product = IAP_PRODUCTS.find(p => p.id === productId);
    if (!product) return 'error';

    try {
      console.log(`[IAPService] Requesting purchase: ${productId}`);
      await requestPurchase({ skus: [productId] });
      await this.handleSuccessfulPurchase(productId);
      return 'success';
    } catch (e: any) {
      if (e.code === 'E_USER_CANCELLED') return 'cancelled';
      console.warn('[IAPService] Purchase error:', e);
      return 'error';
    }
  }

  private async handleSuccessfulPurchase(productId: string): Promise<void> {
    const product = IAP_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    if (product.gems > 0) {
      await storage.addGems(product.gems);
    }
    if (productId === 'remove_ads') {
      await storage.save({ removeAds: true });
    }
    if (productId === 'vip_monthly') {
      await storage.save({ isVip: true, removeAds: true });
    }
    storage.invalidateCache();
  }

  /** Acknowledges a purchase (required by Play Store within 3 days). */
  async acknowledgePurchase(purchase: ProductPurchase): Promise<void> {
    try {
      await finishTransaction({ purchase, isConsumable: true });
    } catch (e) {
      console.warn('[IAPService] finishTransaction error:', e);
    }
  }

  async restorePurchases(): Promise<void> {
    try {
      const purchases = await getAvailablePurchases();
      for (const p of purchases) {
        await this.handleSuccessfulPurchase(p.productId);
      }
      console.log(`[IAPService] Restored ${purchases.length} purchase(s)`);
    } catch (e) {
      console.warn('[IAPService] Restore error:', e);
    }
  }

  async destroy(): Promise<void> {
    try {
      await endConnection();
    } catch (_) {}
  }
}

export const iapService = new IAPService();
