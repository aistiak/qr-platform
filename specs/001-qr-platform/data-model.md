# Data Model: QR Platform

**Date**: 2026-01-24  
**Feature**: QR Platform

## Database: MongoDB

### Collections

#### User Collection

**Purpose**: Store user accounts and authentication data.

**Schema**:
```typescript
{
  _id: ObjectId,
  name: string (required, min 1, max 100),
  email: string (required, unique, lowercase, email format),
  passwordHash: string (required, bcrypt hashed),
  role: "user" | "admin" (default: "user"),
  qrCodeLimit: number (default: 20, min: 1),
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
```

**Indexes**:
- `email`: unique index
- `role`: index for admin queries

**Validation Rules**:
- Email must be valid format
- Password hash must be present (validated by NextAuth.js)
- QR code limit must be positive integer

**Relationships**:
- One-to-many with QRCode (user owns multiple QR codes)
- One-to-many with HostedImage (user uploads multiple images)

---

#### QRCode Collection

**Purpose**: Store QR code definitions and metadata.

**Schema**:
```typescript
{
  _id: ObjectId,
  userId: ObjectId (required, ref: "User"),
  customName: string (optional, max 100, default: "Untitled QR Code"),
  targetType: "url" | "image" (required),
  targetUrl: string (required if targetType === "url", URL format),
  hostedImageId: ObjectId (required if targetType === "image", ref: "HostedImage"),
  status: "active" | "paused" | "archived" | "deleted" (default: "active"),
  accessCount: number (default: 0, computed from QRCodeAccess),
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
```

**Indexes**:
- `userId`: index for user's QR code list queries
- `status`: index for filtering by status
- `userId + status`: compound index for user's active QR codes
- `_id`: for scan redirect lookups

**Validation Rules**:
- targetUrl must be valid URL format if targetType is "url"
- hostedImageId must reference existing HostedImage if targetType is "image"
- Status transitions: active ↔ paused, active → archived, any → deleted

**Relationships**:
- Many-to-one with User (belongs to user)
- Many-to-one with HostedImage (optional, if image target)
- One-to-many with QRCodeAccess (has many access events)

**State Transitions**:
- `active` → `paused`: User pauses QR code
- `paused` → `active`: User resumes QR code
- `active` → `archived`: User archives QR code
- `archived` → `active`: User restores archived QR code
- Any status → `deleted`: User deletes QR code (soft delete or hard delete based on implementation)

---

#### QRCodeAccess Collection

**Purpose**: Track each scan/access of a QR code for analytics.

**Schema**:
```typescript
{
  _id: ObjectId,
  qrCodeId: ObjectId (required, ref: "QRCode"),
  timestamp: Date (required, default: now),
  userAgent: string (optional),
  ipAddress: string (optional, for analytics, consider privacy),
  referer: string (optional)
}
```

**Indexes**:
- `qrCodeId`: index for QR code analytics queries
- `timestamp`: index for time-based analytics
- `qrCodeId + timestamp`: compound index for analytics aggregation queries

**Validation Rules**:
- qrCodeId must reference existing QRCode
- Timestamp must be valid date

**Relationships**:
- Many-to-one with QRCode (belongs to QR code)

**Analytics Aggregation**:
- Total count: Count documents by qrCodeId
- Daily breakdown: Group by date(timestamp) for qrCodeId
- Weekly/Monthly: Aggregate from daily data

---

#### HostedImage Collection

**Purpose**: Store metadata for user-uploaded images.

**Schema**:
```typescript
{
  _id: ObjectId,
  userId: ObjectId (required, ref: "User"),
  filename: string (required),
  originalFilename: string (required),
  filePath: string (required, path to stored file),
  mimeType: "image/jpeg" | "image/png" (required),
  fileSize: number (required, max: 2097152 bytes = 2MB),
  width: number (optional, pixels),
  height: number (optional, pixels),
  createdAt: Date (default: now)
}
```

**Indexes**:
- `userId`: index for user's uploaded images
- `_id`: for image serving lookups

**Validation Rules**:
- fileSize must be ≤ 2MB (2097152 bytes)
- mimeType must be "image/jpeg" or "image/png"
- filePath must be valid path

**Relationships**:
- Many-to-one with User (belongs to user)
- One-to-many with QRCode (can be target of multiple QR codes)

**File Storage**:
- Files stored in `public/images/[userId]/[filename]` (local) or cloud storage
- File path stored in database for retrieval

---

## Data Validation

### Application Layer (Zod Schemas)

**User Sign Up**:
```typescript
{
  name: z.string().min(1).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6)
}
```

**QR Code Creation**:
```typescript
{
  customName: z.string().max(100).optional(),
  targetType: z.enum(["url", "image"]),
  targetUrl: z.string().url().optional(), // required if targetType === "url"
  hostedImageId: z.string().optional() // required if targetType === "image"
}
```

**QR Code Update**:
```typescript
{
  customName: z.string().max(100).optional(),
  status: z.enum(["active", "paused", "archived"]).optional()
}
```

### Database Layer (Mongoose)

- Mongoose schema validation enforces types and required fields
- Custom validators for email format, URL format
- Pre-save hooks for timestamps (createdAt, updatedAt)

---

## Data Relationships Diagram

```
User (1) ──< (many) QRCode
User (1) ──< (many) HostedImage
QRCode (1) ──< (many) QRCodeAccess
QRCode (many) ──> (1) HostedImage [optional]
```

---

## Query Patterns

### User's QR Codes List
```javascript
QRCode.find({ userId, status: { $ne: "deleted" } })
  .sort({ createdAt: -1 })
  .populate("hostedImageId", "filename")
```

### QR Code Analytics
```javascript
QRCodeAccess.aggregate([
  { $match: { qrCodeId } },
  { $group: {
    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
    count: { $sum: 1 }
  }},
  { $sort: { _id: 1 } }
])
```

### Admin: All Users
```javascript
User.find({})
  .select("name email role qrCodeLimit createdAt")
  .sort({ createdAt: -1 })
```

### Admin: All QR Codes
```javascript
QRCode.find({ status: { $ne: "deleted" } })
  .populate("userId", "name email")
  .sort({ createdAt: -1 })
```

---

## Data Migration Considerations

### Initial Setup
- Create indexes on all collections
- Set default QR code limit to 20 for existing users (if any)

### Future Migrations
- Add new fields with default values
- No destructive migrations needed (document model flexibility)

---

## Privacy & Data Retention

### User Data
- Passwords: Hashed, never stored in plain text
- Email: Used for authentication, can be used for password reset (future feature)

### Analytics Data
- IP addresses: Optional, consider privacy implications
- User agents: For analytics insights
- Retention: Keep indefinitely for analytics, or implement retention policy

### Hosted Images
- Stored until user deletes account or image
- Consider cleanup job for orphaned images
