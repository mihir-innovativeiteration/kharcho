# Kharcho Real-Device Smoke-Test Checklist (Android & iOS)

This checklist is designed for QA testers executing manual verification on physical Android and iOS devices before public release.

---

## 1. Pre-Test Device Environment Setup
- [ ] Connect device to Wi-Fi.
- [ ] Verify test backend server is running and reachable from device network IP.
- [ ] Install the development/release APK or TestFlight build (`com.kharcho.app`).
- [ ] Launch application; verify smooth splash transition into Welcome screen.

---

## 2. Authentication & Account Management
- [ ] **Email Registration**:
  - Enter name, valid email, and secure password (`Password123!`).
  - Verify account is created and automatically navigated to Home tab.
  - Verify display name appears on Profile screen.
- [ ] **Logout**:
  - Open Profile > tap "Log Out".
  - Confirm dialog; verify immediate return to Sign In screen.
- [ ] **Email Login**:
  - Enter registered credentials; verify successful login.
- [ ] **Invalid Credentials**:
  - Enter wrong password; verify user receives generic "Invalid email or password" error.
- [ ] **Password Reset**:
  - Tap "Forgot Password?"; enter email; verify reset link prompt.
- [ ] **Account Deletion (Store Compliance)**:
  - Open Profile > tap "Delete Account & Personal Data".
  - Confirm destructive dialog.
  - Verify account is deleted, session revoked, and navigated back to Sign In.
  - Attempt login with deleted email; verify error ("Invalid email or password").

---

## 3. Transactions & Financial Ledger
- [ ] **Add Expense**:
  - Tap the prominent `+` button in tab bar.
  - Enter `₹450`, select Category "Food & Dining", Payment Method "UPI", add note "Lunch".
  - Save; verify transaction appears immediately in Home recent list and Transactions tab.
- [ ] **Add Income**:
  - Tap `+`, switch segment to "Income".
  - Enter `₹25,000`, Category "Salary", Payment Method "Bank Transfer".
  - Save; verify total balance on Home screen updates from `-₹450` to `+₹24,550`.
- [ ] **Edit Transaction**:
  - Tap transaction in list > change amount to `₹500`.
  - Save; verify updated amount reflects on Home totals and transaction list.
- [ ] **Delete Transaction**:
  - Delete transaction; verify list updates and totals adjust.

---

## 4. Budgets & Spending Alerts
- [ ] **Create Budget**:
  - Open Budgets tab > tap "Add Budget".
  - Set Category "Food & Dining", limit `₹5,000`, period Monthly.
  - Save; verify spent amount reflects current expenses in Food category.
- [ ] **Threshold Progress**:
  - Verify progress bar reflects percentage spent accurately.

---

## 5. Recurring Bills & Scheduled Reminders
- [ ] **Create Recurring Rule**:
  - Open Recurring tab > tap "Add Recurring Bill".
  - Enter "Broadband", `₹999`, Monthly, Next Due 1st of next month.
  - Save; verify rule appears in active recurring list.
- [ ] **Mark Paid**:
  - Tap "Mark Paid" on occurrence; verify financial transaction is logged.

---

## 6. AI Natural Language Expense Entry
- [ ] **English Input**:
  - Open AI Entry > type "Paid 200 for petrol via UPI".
  - Verify candidate draft is generated: `₹200.00`, Category Petrol & Fuel, UPI.
- [ ] **Hindi / Gujarati / Hinglish Input**:
  - Type "Aaje 150 ni coffee lidhi cash thi".
  - Verify candidate draft is generated: `₹150.00`, Category Food & Dining, Cash.
- [ ] **Draft Review & Confirmation**:
  - Verify draft is NOT added to ledger until user taps "Confirm & Add Transaction".
  - Confirm draft; verify transaction is now in history.

---

## 7. Offline Resilience & Sync
- [ ] **Airplane Mode Entry**:
  - Enable Airplane mode (disconnect Wi-Fi and Cellular).
  - Open app; create expense `₹100` for "Tea & Snacks".
  - Verify transaction appears with pending sync indicator.
- [ ] **Reconnection Sync**:
  - Turn off Airplane mode (reconnect internet).
  - Open app; verify pending indicator turns to synced.
  - Refresh backend ledger; verify transaction exists with unique `clientMutationId`.

---

## 8. Localization & Theme Ergonomics
- [ ] **Theme Switching**:
  - Open Profile > Appearance > switch to Dark Mode.
  - Verify high contrast readability across all tabs, cards, inputs, and modals.
  - Switch back to Light Premium.
- [ ] **Language Switching**:
  - Open Profile > Language > select ગુજરાતી (Gujarati).
  - Verify tabs, headers, buttons, and alert messages display Gujarati text.
  - Switch to हिन्दी (Hindi); verify full Hindi UI.
  - Switch back to English.
- [ ] **Keyboard & Safe Area**:
  - Verify inputs don't get covered by keyboard on iPhone (with Home Indicator) and Android (gesture navigation bar).
