# Kharcho Phase 1 — Verification Checklist

## 1. Product Vision & Technology Alignment

- [x] Initialized with Expo SDK 58 and React Native 0.88
- [x] TypeScript configured with `strict: true` and zero compiler warnings
- [x] Expo Router file-based routing structured under `src/app/`
- [x] Consistent iconography using `lucide-react-native`
- [x] 100% Native mobile charts using `react-native-svg` (no web/DOM elements)
- [x] Haptic feedback integrated with `expo-haptics`
- [x] Local storage with `AsyncStorage` and `expo-secure-store`
- [x] ESLint configured with flat config and passes with 0 errors
- [x] Prettier configuration in place

---

## 2. Design System & Theming

- [x] Light Premium theme (Warm off-white background `#F8F9F8`, Forest Green `#0F382C`, Emerald `#10B981`)
- [x] Dark Premium theme (Charcoal `#0B1311`, `#12201C`, Emerald `#34D399`)
- [x] Centralized design tokens for colors, typography, spacing, radius, and shadows
- [x] Dynamic Theme switching (Light / Dark / System) with persistence
- [x] No arbitrary scattered color codes

---

## 3. Mobile UX & Ergonomics

- [x] Safe area insets handled across all screens with `react-native-safe-area-context`
- [x] Status bar styling reacts to dark/light theme dynamically
- [x] Interactive touch targets meet or exceed 48pt with proper hit slops
- [x] Accessible roles (`accessibilityRole="button"`, `accessibilityLabel`, `accessibilityHint`)
- [x] Keyboard avoiding view in transaction form

---

## 4. Navigation Architecture

- [x] Root layout with Theme and App context providers
- [x] Entry gatekeeper redirecting first-time users to Onboarding
- [x] 5 Bottom Tabs:
  * [x] **Home** (`/(tabs)/index.tsx`)
  * [x] **Activity** (`/(tabs)/activity.tsx`)
  * [x] **Budgets** (`/(tabs)/budgets.tsx`)
  * [x] **Insights** (`/(tabs)/insights.tsx`)
  * [x] **Profile** (`/(tabs)/profile.tsx`)
- [x] Active and inactive tab styling with distinct states and Lucide icons

---

## 5. Screen Implementation

- [x] **Screen A: Onboarding**:
  * [x] 3 pages ("Understand Your Money", "Build Better Habits", "Stay in Control")
  * [x] Custom vector SVG artwork
  * [x] Pagination dots
  * [x] Skip, Continue, and Get Started actions
  * [x] Local persistence of onboarding status
- [x] **Screen B: Home Dashboard**:
  * [x] Dynamic time-based greeting and avatar initials
  * [x] Current month pill and demo toggle badge
  * [x] Hero Net Cashflow / Balance card in Forest Green
  * [x] Inflow & Outflow summary cards with trend percentages
  * [x] Net Savings Rate card with formula definition
  * [x] Daily spending momentum SVG trend chart
  * [x] Top category spending distribution list
  * [x] Recent transactions list with "See All" action
  * [x] Quick actions: "Add Expense" and "Add Income"
  * [x] Toggleable empty state
- [x] **Screen C: Activity / Transactions**:
  * [x] Real-time search query filtering
  * [x] All / Expense / Income segmented control
  * [x] Horizontal category picker
  * [x] Date-grouped transaction cards ("Today", "Yesterday", etc.)
  * [x] Indian currency formatting (+₹ in green, -₹ in dark/white)
  * [x] Empty state when no records match
  * [x] Loading state & Error state with retry
  * [x] Tap to view detail receipt
- [x] **Screen D: Budgets**:
  * [x] Monthly budget limit, spent so far, and remaining summary
  * [x] Category budget cards with spend progress bars
  * [x] Color shifts (Emerald -> Amber at 85% -> Rose at 100%)
  * [x] Quick button to create budget
  * [x] Empty state when no budgets exist
- [x] **Screen E: Insights**:
  * [x] Period filter (This Month, Last 3 Months, Year 2026)
  * [x] Monthly Income vs Expense comparison SVG bar chart
  * [x] Category portfolio percentage allocation bar & table
  * [x] Actionable observation cards (Positive, Warning, Tip)
  * [x] Empty state handling
- [x] **Screen F: Profile & Settings**:
  * [x] User profile summary card with Pro badge
  * [x] Theme mode switcher (Light, Dark, System)
  * [x] Currency standard display (INR Lakhs/Crores)
  * [x] Notification reminder toggles
  * [x] Biometric lock notice (labeled for Phase 2)
  * [x] Reviewer demo controls (Replay onboarding, Restore demo data, Clear to empty)
  * [x] Sign Out dialog
- [x] **Modal & Auxiliary Screens**:
  * [x] `transaction/new.tsx`: Expense/Income entry with amount, category, method, note
  * [x] `transaction/[id].tsx`: Digital receipt layout with reference ID and delete action

---

## 6. Currency & Formatting

- [x] Centralized Indian numbering formatting (`formatINR`: e.g. `₹1,45,000` / `₹1.5 L`)
- [x] Sanitization of currency inputs (`sanitizeCurrencyInput`)
- [x] Paise integer conversion utilities to protect against floating point errors

---

## 7. Architecture & Phase 2 Readiness

- [x] Strong TypeScript contracts in `src/types/api.ts`
- [x] Isolated mock layer in `src/services/mock/`
- [x] Unified service exports in `src/services/api/index.ts`
- [x] Zero mock coupling in UI screens

---

## 8. Definition of Done Checks

- [x] `npx tsc --noEmit` exits with code 0 (Zero errors)
- [x] `npx eslint .` exits with code 0 (Zero errors, Zero warnings)
- [x] `npx expo-doctor` passes all 20 checks
- [x] `npx expo export --platform android` bundles 3241 modules with zero errors
