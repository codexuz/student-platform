# Password Reset Flow — Frontend Guide

## Overview

Password reset uses a 3-step SMS verification flow. No authentication token is required for any of these endpoints.

**Base URL:** `/auth/password-reset`

---

## Flow Diagram

```
User enters phone → Request Code → SMS sent
                                      ↓
User enters code  → Verify Code  → Code valid?
                                      ↓ Yes
User enters new   → Confirm      → Password updated,
  password            Reset         all sessions terminated
```

---

## Step 1: Request Reset Code

Send the user's phone number to receive a 6-digit verification code via SMS.

**`POST /auth/password-reset/request`**

### Request Body

```json
{
  "phone": "+998901234567"
}
```

### Success Response (200)

```json
{
  "message": "Verification code sent to your phone"
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| `404`  | User with this phone number not found |
| `400`  | Failed to send SMS |

### Notes
- Code expires in **5 minutes**
- Previous unused codes for the same phone are automatically invalidated
- SMS message format: `Kodni hech kimga bermang! Impulse App ilovasida parolni qayta tiklash kodingiz: 123456`

---

## Step 2: Verify Code (Optional)

Verify the SMS code before asking for a new password. This step is **optional** — you can skip directly to Step 3. However, it's recommended to verify first so the user knows the code is correct before typing a new password.

**`POST /auth/password-reset/verify`**

### Request Body

```json
{
  "phone": "+998901234567",
  "code": "123456"
}
```

### Success Response (200)

```json
{
  "message": "Code verified successfully",
  "verified": true
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| `400`  | Invalid verification code |
| `400`  | No active verification code found. Please request a new one. |
| `400`  | Too many attempts. Please request a new code. |

### Notes
- Maximum **5 attempts** per code, then a new code must be requested
- The code is **not consumed** by this step — it can still be used in Step 3

---

## Step 3: Confirm Password Reset

Submit the verified code along with the new password.

**`POST /auth/password-reset/confirm`**

### Request Body

```json
{
  "phone": "+998901234567",
  "code": "123456",
  "new_password": "newpassword123"
}
```

### Success Response (200)

```json
{
  "message": "Password reset successfully"
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| `400`  | Invalid or expired verification code |
| `404`  | User not found |

### Notes
- `new_password` must be at least **6 characters**
- After successful reset, **all existing sessions are terminated** — the user must log in again
- The verification code is consumed after this step

---

## Frontend Implementation Guide

### Recommended UI Flow

1. **Screen 1 — Enter Phone**
   - Input: phone number
   - Button: "Send Code"
   - Call `POST /auth/password-reset/request`
   - On success → navigate to Screen 2
   - On 404 → show "Phone number not found"

2. **Screen 2 — Enter Code**
   - Input: 6-digit code (OTP input)
   - Optional: countdown timer (5 min)
   - Optional: "Resend Code" button (calls Step 1 again)
   - Button: "Verify"
   - Call `POST /auth/password-reset/verify`
   - On success → navigate to Screen 3
   - On error → show error message, allow retry

3. **Screen 3 — New Password**
   - Input: new password (min 6 chars)
   - Input: confirm password (frontend validation)
   - Button: "Reset Password"
   - Call `POST /auth/password-reset/confirm` (send phone + code + new_password)
   - On success → navigate to Login screen with success message
   - On error → navigate back to Screen 1

### Error Handling Tips

- If the code expires (user takes >5 min), the verify/confirm calls will return 400 — prompt the user to request a new code
- After 5 failed verification attempts, the code is invalidated — prompt the user to request a new code
- Store `phone` and `code` in component state to pass between screens

### Example (TypeScript/Axios)

```typescript
// Step 1: Request code
const requestReset = async (phone: string) => {
  const { data } = await axios.post('/auth/password-reset/request', { phone });
  return data; // { message: "Verification code sent to your phone" }
};

// Step 2: Verify code
const verifyCode = async (phone: string, code: string) => {
  const { data } = await axios.post('/auth/password-reset/verify', { phone, code });
  return data; // { message: "Code verified successfully", verified: true }
};

// Step 3: Reset password
const resetPassword = async (phone: string, code: string, new_password: string) => {
  const { data } = await axios.post('/auth/password-reset/confirm', { phone, code, new_password });
  return data; // { message: "Password reset successfully" }
};
```
