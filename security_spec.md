# ShebaFinder Firestore Security Specification

## 1. Core Data Invariants
1. **No Self-Assigned Admin Roles**: A user cannot write `role: "admin"` into `/users/{uid}` or create/modify `/admins/{uid}` unless already an authorized admin.
2. **Approval Gate for Public Listings**: Newly submitted `/providers/{providerId}` and `/providers/{providerId}/services/{serviceId}` must be created with `status: "pending"` (unless created by an admin) and cannot be transitioned to `"approved"` by the provider owner.
3. **Verification Badge Integrity**: `verificationStatus` can only be set to `"verified"` by an administrator; providers may only set it to `"none"` or `"pending"`.
4. **PII Isolation**: `/users/{uid}` documents containing private email/phone data are readable only by the document owner or an administrator.
5. **Private Conversation Confidentiality**: `/conversations/{conversationId}` and `/conversations/{conversationId}/messages/{messageId}` are strictly readable and writable only by `customerId`, `providerOwnerId`, or an administrator.
6. **Temporal & Ownership Integrity**: `createdAt` and `ownerId`/`authorId`/`senderId` are immutable once written; `createdAt`/`updatedAt` must equal `request.time`.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Admin Privilege Escalation on Signup**: `POST /users/{uid}` with `{ role: "admin" }`.
2. **Self-Creation in `/admins/{uid}`**: Non-admin user attempts `setDoc(/admins/{uid}, { uid, email })`.
3. **Provider Self-Approval**: Provider creates `/providers/{id}` with `{ status: "approved" }`.
4. **Provider Verification Spoof**: Provider updates `/providers/{id}` setting `{ verificationStatus: "verified" }`.
5. **Shadow Ghost Field Injection**: Updating `/providers/{id}` with an undeclared field `{ featuredPaid: true }`.
6. **Cross-User PII Read**: Authenticated user A calls `getDoc(/users/{userB})`.
7. **Unscoped List Scraping on Users**: Authenticated user calls `getDocs(collection(db, "users"))`.
8. **Chat Eavesdropping**: User C (neither `customerId` nor `providerOwnerId`) reads `/conversations/{convId}/messages/{msgId}`.
9. **Sender Impersonation in Chat**: Participant A creates a message with `senderId: userB`.
10. **Self-Review Abuse**: Provider owner writes a 5-star review in `/reviews/{id}` targeting their own `providerId`.
11. **Backdated Timestamp Spoofing**: User creates a message or review with `createdAt` set to a past client timestamp instead of `request.time`.
12. **ID Poisoning**: Creating a document with an invalid 500-character ID or slashes in path variables.
