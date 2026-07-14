# Admin Manual - Platform Administration Guide

This guide covers administrative capabilities in ApexPay for managing users, transactions, blacklist entries, and real-time fraud rules.

---

## 1. Accessing the Admin Console
1.  Navigate to `https://localhost/admin/login` on your web browser.
2.  Log in using authorized credentials.
3.  Once authenticated, you will be redirected to the secure **Admin Dashboard**.

---

## 2. Fraud Prevention & Risk Controls

The admin dashboard features dedicated tabs under the **Fraud & Risk** section:

### Blacklist Management
*   **Purpose**: Prevents specific users, IP addresses, or destination accounts from performing transactions.
*   **Adding to Blacklist**:
    1.  Navigate to **Blacklist Control**.
    2.  Click **Add Entry**.
    3.  Enter the entity type (e.g. `USER`, `IP_ADDRESS`, `BANK_ACCOUNT`) and the identifier value.
    4.  Submit to block transactions instantly.

### Whitelist Management
*   **Purpose**: Allows trusted accounts to bypass standard risk velocity checks.
*   **Adding to Whitelist**: Add user IDs under the whitelist settings to prevent false positives on high-value transfers.

---

## 3. Investigating Fraud Alerts
1.  Navigate to **Investigations**.
2.  Review flagged alerts marked as `HIGH_RISK` or `MEDIUM_RISK`.
3.  Click **Investigate** on any entry to see the rule trigger details (e.g. "Velocity Limit Exceeded").
4.  **Take Action**: Approve the transaction or Suspend the account.

---

## 4. System Health & Performance
*   Review current REST API response rates, active database pool connections, and memory parameters directly inside the **System Health** panel.
