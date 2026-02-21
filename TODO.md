# UserManagement Account Status Update - TODO ✅ COMPLETED

## Task: Allow admin to activate/deactivate user account status from UserManagement page

### Backend (`backend/tax_app/serializers.py`)
- [x] Add `UserStatusUpdateSerializer` with `account_status` choices: Active, Inactive, Suspended

### Backend (`backend/tax_app/views.py`)
- [x] Add `AdminUserStatusUpdateView` — PATCH endpoint to update user `account_status`

### Backend (`backend/tax_app/urls.py`)
- [x] Import `AdminUserStatusUpdateView`
- [x] Add `path('admin/users/<int:pk>/status/', ...)`

### Frontend (`frontend/src/pages/UserManagement.jsx`)
- [x] Add `togglingId` state
- [x] Add `handleToggleStatus(user)` function
- [x] Add Activate/Deactivate button in Actions column

---

# Payment Admin Verification - TODO ✅ COMPLETED

## Task: User payment must not complete until admin verifies

### Backend (`backend/tax_app/views.py`)
- [x] `pay_with_control_number`: Change status to `Processing`, remove tax account update, update response message
- [x] `approve` action: Accept both `Pending` and `Processing` statuses
- [x] `reject` action: Accept both `Pending` and `Processing` statuses
- [x] `PayNowView`: Change status to `Pending`, remove immediate tax account update, update response message

### Frontend (`frontend/src/pages/AdminDashboard.jsx`)
- [x] Update payment filter to include `Processing` status
- [x] Show Approve/Reject buttons for `Processing` status
- [x] Add `Processing` badge style (bg-primary)

### Frontend (`frontend/src/pages/Payment.jsx`)
- [x] Update success message to "Payment submitted! Awaiting admin verification."
- [x] Add `Processing` to Notes column with "Submitted — awaiting admin verification"

## Payment Flow (After Changes)
1. User generates control number → status: `Pending`
2. User submits payment with amount → status: `Processing` (tax account NOT updated)
3. Admin sees it in "Pending Payments" tab → clicks **Approve** → status: `Approved`
4. Admin clicks **Mark as Paid** → status: `Completed` (tax account updated NOW)
5. OR Admin clicks **Reject** → status: `Rejected` (with reason shown to user)
