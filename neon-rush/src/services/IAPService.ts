/**
 * IAPService - manages in-app purchases via react-native-iap.
 *
 * Integration notes:
 *   1. Install: expo install react-native-iap
 *   2. Run: npx expo prebuild
 *   3. Add BILLING permission in app.json android.permissions
 *   4. Register product IDs in Google Play Console
 *   5. Call IAPService.init() in App.tsx
 *
 * Product IDs must match exactly what is registered in Google Play.
 */

import { IAP_PRODUCTS } from '../constants';
import { storage } from './StorageService';

export type PurchaseResult = 'success' | 'cancelled' | 'error';

class IAPService {
  private initialized = false;

  async init(): Promise<void> {
    // With react-native-iap:
    // await RNIap.initConnection();
    // const products = await RNIap.getProducts({ skus: IAP_PRODUCTS.map(p => p.id) });
    this.initialized = true;
    console.log('[IAPService] Initialized (stub mode)');
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    if (!this.initialized) await this.init();

    const product = IAP_PRODUCTS.find(p => p.id === productId);
    if (!product) return 'error';

    console.log(`[IAPService] Would purchase: ${productId}`);
    // With react-native-iap:
    // try {
    //   await RNIap.requestPurchase({ sku: productId });
    //   await this.handleSuccessfulPurchase(productId);
    //   return 'success';
    // } catch (e: any) {
    //   if (e.code === 'E_USER_CANCELLED') return 'cancelled';
    //   return 'error';
    // }

    // Simulated for development — grant the items:
    await this.handleSuccessfulPurchase(productId);
    return 'success';
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

  async restorePurchases(): Promise<void> {
    console.log('[IAPService] Would restore purchases here');
    // With react-native-iap:
    // const purchases = await RNIap.getAvailablePurchases();
    // for (const p of purchases) {
    //   await this.handleSuccessfulPurchase(p.productId);
    // }
  }

  async destroy(): Promise<void> {
    // With react-native-iap:
    // await RNIap.endConnection();
  }
}

export const iapService = new IAPService();
