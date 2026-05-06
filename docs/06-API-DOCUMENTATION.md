# API Documentation

## 🎯 Overview

Complete REST API documentation for the Probe platform backend.

## 📋 Base URL

```
Development: http://localhost:3000/api/v1
Production: https://api.probe.dev/api/v1
```

## 🔐 Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## 📚 API Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

Response: 201 Created
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "USER",
  "createdAt": "2026-04-30T10:00:00.000Z"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}

Response: 200 OK
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response: 200 OK
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Programs

#### List Programs
```http
GET /programs
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "uuid",
    "name": "My Program",
    "programId": "11111111111111111111111111111111",
    "network": "DEVNET",
    "description": "Program description",
    "isActive": true,
    "createdAt": "2026-04-30T10:00:00.000Z",
    "_count": {
      "transactions": 150,
      "alerts": 3
    }
  }
]
```

#### Get Program
```http
GET /programs/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "name": "My Program",
  "programId": "11111111111111111111111111111111",
  "network": "DEVNET",
  "description": "Program description",
  "isActive": true,
  "createdAt": "2026-04-30T10:00:00.000Z",
  "transactions": [...],
  "alerts": [...],
  "_count": {
    "transactions": 150
  }
}
```

#### Create Program
```http
POST /programs
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Program",
  "programId": "11111111111111111111111111111111",
  "network": "DEVNET",
  "description": "Program description",
  "repositoryUrl": "https://github.com/user/repo"
}

Response: 201 Created
{
  "id": "uuid",
  "name": "My Program",
  "programId": "11111111111111111111111111111111",
  "network": "DEVNET",
  "description": "Program description",
  "repositoryUrl": "https://github.com/user/repo",
  "isActive": true,
  "createdAt": "2026-04-30T10:00:00.000Z"
}
```

#### Update Program
```http
PATCH /programs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Program Name",
  "description": "Updated description"
}

Response: 200 OK
{
  "id": "uuid",
  "name": "Updated Program Name",
  ...
}
```

#### Delete Program
```http
DELETE /programs/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Program deleted successfully"
}
```

### Transactions

#### List Transactions
```http
GET /transactions?programId=uuid&limit=50&offset=0
Authorization: Bearer <token>

Query Parameters:
- programId (required): Program UUID
- limit (optional): Number of results (default: 50, max: 100)
- offset (optional): Pagination offset (default: 0)
- status (optional): Filter by status (SUCCESS, FAILED, PENDING)
- startDate (optional): ISO date string
- endDate (optional): ISO date string

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "signature": "5j7s...",
      "slot": 123456789,
      "blockTime": "2026-04-30T10:00:00.000Z",
      "status": "SUCCESS",
      "fee": 5000,
      "computeUnits": 200000,
      "createdAt": "2026-04-30T10:00:00.000Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

#### Get Transaction
```http
GET /transactions/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "signature": "5j7s...",
  "slot": 123456789,
  "blockTime": "2026-04-30T10:00:00.000Z",
  "status": "SUCCESS",
  "fee": 5000,
  "computeUnits": 200000,
  "instructions": [...],
  "logs": [...],
  "accounts": [...],
  "createdAt": "2026-04-30T10:00:00.000Z"
}
```

### Analytics

#### Get Program Analytics
```http
GET /analytics/programs/:id?period=24h
Authorization: Bearer <token>

Query Parameters:
- period: 1h, 24h, 7d, 30d (default: 24h)

Response: 200 OK
{
  "period": "24h",
  "metrics": {
    "totalTransactions": 1500,
    "successRate": 98.5,
    "failureRate": 1.5,
    "avgComputeUnits": 185000,
    "avgFee": 5000,
    "avgLatency": 450
  },
  "timeSeries": [
    {
      "timestamp": "2026-04-30T10:00:00.000Z",
      "transactions": 50,
      "success": 49,
      "failed": 1,
      "avgComputeUnits": 180000
    }
  ]
}
```

#### Get Transaction Trends
```http
GET /analytics/transactions/trends?programId=uuid&metric=count&period=7d
Authorization: Bearer <token>

Query Parameters:
- programId (required): Program UUID
- metric: count, success_rate, compute_units, fee (default: count)
- period: 1h, 24h, 7d, 30d (default: 24h)

Response: 200 OK
{
  "metric": "count",
  "period": "7d",
  "data": [
    {
      "timestamp": "2026-04-24T00:00:00.000Z",
      "value": 1200
    },
    {
      "timestamp": "2026-04-25T00:00:00.000Z",
      "value": 1350
    }
  ]
}
```

### Alerts

#### List Alerts
```http
GET /alerts?programId=uuid
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "uuid",
    "name": "High Failure Rate",
    "description": "Alert when failure rate exceeds 10%",
    "condition": "TRANSACTION_FAILURE_RATE",
    "threshold": 10,
    "comparison": "GREATER_THAN",
    "enabled": true,
    "channels": ["EMAIL", "SLACK"],
    "cooldown": 300,
    "createdAt": "2026-04-30T10:00:00.000Z"
  }
]
```

#### Create Alert
```http
POST /alerts
Authorization: Bearer <token>
Content-Type: application/json

{
  "programId": "uuid",
  "name": "High Failure Rate",
  "description": "Alert when failure rate exceeds 10%",
  "condition": "TRANSACTION_FAILURE_RATE",
  "threshold": 10,
  "comparison": "GREATER_THAN",
  "channels": ["EMAIL", "SLACK"],
  "cooldown": 300
}

Response: 201 Created
{
  "id": "uuid",
  "name": "High Failure Rate",
  ...
}
```

#### Update Alert
```http
PATCH /alerts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "threshold": 15,
  "enabled": false
}

Response: 200 OK
{
  "id": "uuid",
  "threshold": 15,
  "enabled": false,
  ...
}
```

#### Delete Alert
```http
DELETE /alerts/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Alert deleted successfully"
}
```

#### Get Alert Triggers
```http
GET /alerts/:id/triggers?limit=50
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "uuid",
    "value": 12.5,
    "message": "Failure rate exceeded threshold",
    "notified": true,
    "notifiedAt": "2026-04-30T10:05:00.000Z",
    "triggeredAt": "2026-04-30T10:00:00.000Z"
  }
]
```

## 🔌 WebSocket Events

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Subscribe to Program

```javascript
socket.emit('subscribe:program', {
  programId: 'program-uuid',
  network: 'devnet'
});
```

### Listen for Transactions

```javascript
socket.on('transaction:new', (transaction) => {
  console.log('New transaction:', transaction);
});
```

### Listen for Alerts

```javascript
socket.on('alert:triggered', (alert) => {
  console.log('Alert triggered:', alert);
});
```

### Unsubscribe from Program

```javascript
socket.emit('unsubscribe:program', {
  programId: 'program-uuid'
});
```

## 📊 Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## 🔒 Rate Limiting

- **Rate Limit**: 100 requests per minute per IP
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

**Next**: [07-DEPLOYMENT.md](./07-DEPLOYMENT.md)
