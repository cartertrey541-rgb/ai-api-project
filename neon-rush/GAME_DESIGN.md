# NEON RUSH — Game Design Document

## Concept
A cyberpunk-themed endless lane-dodger for Android. Players navigate a neon runner through 3 lanes of
increasingly fast obstacles, collecting coins, grabbing power-ups, and competing for high scores.

---

## Controls
| Gesture | Action |
|---------|--------|
| Tap screen | Jump (or double jump if airborne) |
| Swipe LEFT | Move to left lane |
| Swipe RIGHT | Move to right lane |
| Swipe UP | Jump |
| ⏸ button | Pause |

---

## Characters
| Name | Unlock | Bonus |
|------|--------|-------|
| Cyber Nova | Free | — |
| Neon Ghost | 800 🪙 | +10% jump height |
| Pixel Punk | 1500 🪙 | +10% coins earned |
| Thunder Storm | 49 💎 | +5% speed, +5% coins |
| Void Walker | 99 💎 | +10% all stats |

---

## Obstacles
- **Barrier** (pink) — blocks full lane
- **Drone** (purple) — mid-air hazard, jump over or dodge
- **Laser** (green) — thin fast line
- **Spike** (orange) — floor hazard, must jump

---

## Power-Ups
| Icon | Name | Effect | Duration |
|------|------|--------|----------|
| 🛡 | Shield | Absorbs 1 obstacle hit + destroys on contact | 4s |
| 🧲 | Magnet | Attracts nearby coins automatically | 8s |
| ✨ | Multiplier | 2× coin value | 6s |
| ⏱ | Slow Time | Reduces game speed 55% | 5s |

---

## Scoring
- **Score** = distance run (metres) + coins × 2
- Speed increases continuously up to MAX_SPEED
- Score multiplier available via power-up (✨)

---

## Monetization

### Ad Integration (AdMob)
| Placement | Type | Trigger |
|-----------|------|---------|
| Game Over screen | Rewarded | Watch to revive once per run |
| Between runs | Interstitial | Every 3 deaths |
| Main menu / Shop | Banner | Always visible (non-VIP) |

### In-App Purchases
| Product | Price | Contents |
|---------|-------|----------|
| Starter Pack | $0.99 | 30 Gems |
| Value Pack | $1.99 | 80 Gems |
| Power Pack | $4.99 | 200 Gems |
| Mega Pack | $9.99 | 500 Gems |
| Remove Ads | $2.99 | Permanent ad removal |
| VIP Pass | $3.99/mo | No ads + 30 gems/month |

---

## Technical Stack
- **Framework:** React Native (Expo SDK 52)
- **Language:** TypeScript
- **Game loop:** `requestAnimationFrame` at 60fps
- **Physics:** Custom AABB collision, parabolic jump arc
- **Persistence:** AsyncStorage
- **Ads:** Google AdMob (expo-ads-admob / Google Mobile Ads plugin)
- **IAP:** react-native-iap
- **Navigation:** React Navigation v6
- **Animations:** React Native Animated API + Expo LinearGradient

---

## Build & Deploy

### Development
```bash
cd neon-rush
npm install
npx expo start          # scan QR with Expo Go
npx expo run:android    # build dev APK (needs Android Studio)
```

### Production (Google Play)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production   # builds AAB
eas submit --platform android                        # upload to Play Store
```

**Requirements:**
1. Create app in [Google Play Console](https://play.google.com/console)
2. Set up [AdMob account](https://admob.google.com) and replace test IDs in `app.json`
3. Set up [react-native-iap](https://github.com/dooboolab-community/react-native-iap) with real product IDs
4. Add `google-services.json` from Firebase Console
5. Add signing keystore for production builds

---

## Revenue Projections (rough estimates)
- 10,000 DAU × $0.002 CPM (banner) = ~$20/day
- 10,000 DAU × 30% rewarded view rate × $0.05 = ~$150/day
- 1% conversion IAP × $3 avg = ~$300/day per 10k DAU
- VIP subscription LTV very high if retained

---

## Future Roadmap
- v1.1: Daily login spin wheel, global leaderboard
- v1.2: Weekly events, seasonal themes (Christmas Neon Rush, etc.)
- v1.3: Guilds / friends challenge mode
- v1.4: New game modes (timed challenge, endless boss rush)
- v2.0: Multiplayer real-time racing
