# Appointment Booking API

A small backend API for managing fixed appointment slots and bookings.

Built with:

- TypeScript
- NestJS
- PostgreSQL
- Prisma ORM
- Socket.IO
- OpenAPI / Swagger
- Jest + Supertest

## Features

- List available appointment slots
- Create a booking
- Prevent double booking under concurrent requests
- Cancel a booking and release the slot
- Rebook a previously cancelled slot
- Realtime `slot.booked` and `slot.released` events
- OpenAPI documentation
- PostgreSQL-backed end-to-end tests

---

## Requirements

- Node.js
- npm
- PostgreSQL

This project was developed using PostgreSQL on:

```text
localhost:5433
```

Any PostgreSQL instance can be used by changing `DATABASE_URL`.

---

## Installation

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npx prisma generate
```

---

## Environment variables

Copy `.env.example` to `.env` and update the values:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5433/appointment_booking"
PORT=3002
```

Do not commit real credentials or `.env` files.

---

## Database setup

Create a PostgreSQL database, for example:

```text
appointment_booking
```

Apply migrations:

```bash
npx prisma migrate deploy
```

For local development, `migrate dev` may also be used:

```bash
npx prisma migrate dev
```

Seed the predefined appointment slots:

```bash
npx prisma db seed
```

The seed uses fixed UUIDs so the API examples and tests remain predictable.

---

## Running the application

Development mode:

```bash
npm run start:dev
```

The API is available at:

```text
http://localhost:3002
```

---

## API

### GET /slots

Returns available slots only.

Example response:

```json
{
  "slots": [
    {
      "id": "11111111-1111-4111-8111-111111111111",
      "startsAt": "2030-01-15T09:00:00.000Z",
      "endsAt": "2030-01-15T09:30:00.000Z"
    }
  ]
}
```

Available slots are ordered by:

1. `startsAt` ascending
2. `id` ascending

A slot is available when it has no active booking.

---

### POST /bookings

Creates an active booking.

Request:

```json
{
  "slotId": "11111111-1111-4111-8111-111111111111",
  "customerName": "Alex Morgan",
  "customerEmail": "alex@example.com"
}
```

Leading and trailing whitespace is removed from the customer name and email before validation and persistence.

Example response:

```json
{
  "booking": {
    "id": "22222222-2222-4222-8222-222222222222",
    "slotId": "11111111-1111-4111-8111-111111111111",
    "customerName": "Alex Morgan",
    "customerEmail": "alex@example.com",
    "status": "active"
  }
}
```

Possible responses:

```text
201 Booking created
400 VALIDATION_ERROR
404 SLOT_NOT_FOUND
409 SLOT_UNAVAILABLE
500 INTERNAL_ERROR
```

---

### DELETE /bookings/{bookingId}

Cancels a booking.

Example response:

```json
{
  "booking": {
    "id": "22222222-2222-4222-8222-222222222222",
    "slotId": "11111111-1111-4111-8111-111111111111",
    "customerName": "Alex Morgan",
    "customerEmail": "alex@example.com",
    "status": "cancelled"
  }
}
```

Cancellation is idempotent.

Cancelling an already cancelled booking:

- returns `200`
- returns the same cancelled booking
- does not emit another realtime event

Cancelling an old cancelled booking does not affect a newer active booking for the same slot.

Possible responses:

```text
200 Booking cancelled or already cancelled
400 VALIDATION_ERROR
404 BOOKING_NOT_FOUND
500 INTERNAL_ERROR
```

---

## Error format

All API errors use this structure:

```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "This slot already has an active booking."
  }
}
```

Database details and stack traces are not exposed to clients.

---

## OpenAPI documentation

Swagger UI:

```text
GET /docs
```

OpenAPI JSON:

```text
GET /openapi.json
```

The documentation includes:

- request fields
- required fields
- UUID and email formats
- success responses
- error responses
- HTTP status codes
- examples
- cancellation idempotency
- no authentication requirement

Socket.IO events are documented separately below because they are not HTTP operations.

---

## Socket.IO

The Socket.IO server uses:

```text
namespace: /
path: /socket.io
```

No authentication, rooms, or client application events are required.

### slot.booked

Emitted once after a booking is successfully persisted:

```json
{
  "slotId": "11111111-1111-4111-8111-111111111111",
  "bookingId": "22222222-2222-4222-8222-222222222222",
  "available": false
}
```

### slot.released

Emitted once after an active booking is successfully cancelled:

```json
{
  "slotId": "11111111-1111-4111-8111-111111111111",
  "bookingId": "22222222-2222-4222-8222-222222222222",
  "available": true
}
```

No event is emitted for:

- rejected booking requests
- repeated cancellation of an already cancelled booking

Customer data is not included in realtime events.

---

## Testing Socket.IO without a frontend

Run the application:

```bash
npm run start:dev
```

In another terminal:

```bash
npm run socket:test
```

The client listens for:

```text
slot.booked
slot.released
```

Then create and cancel bookings using the HTTP API.

Example output:

```text
Connected: <socket-id>

slot.booked {
  slotId: '...',
  bookingId: '...',
  available: false
}

slot.released {
  slotId: '...',
  bookingId: '...',
  available: true
}
```

---

## Concurrency and double-booking prevention

The database is the final authority for preventing double booking.

The application uses a PostgreSQL partial unique index:

```sql
CREATE UNIQUE INDEX "Booking_one_active_per_slot"
ON "Booking" ("slotId")
WHERE "status" = 'active';
```

This allows:

```text
Slot A
├── Booking 1 → cancelled
├── Booking 2 → cancelled
└── Booking 3 → active
```

But prevents:

```text
Slot A
├── Booking 1 → active
└── Booking 2 → active
```

A pre-insert application check alone would not be sufficient because two concurrent requests could both observe the slot as available before either insert completes.

The database constraint guarantees that only one active booking is persisted.

When Prisma reports the resulting unique constraint violation, the API maps it to:

```text
409 SLOT_UNAVAILABLE
```

---

## Test database setup

Tests use a separate PostgreSQL database, for example:

```text
appointment_booking_test
```

Apply the existing migrations:

```powershell
$env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5433/appointment_booking_test"

npx prisma migrate deploy
npx prisma db seed
```

Set the test database URL:

```powershell
$env:TEST_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5433/appointment_booking_test"
```

Then run:

```bash
npm run test:e2e
```

The E2E test suite uses the real NestJS application and PostgreSQL.

Before each test, bookings are cleared while seeded slots remain available.

---

## Required automated tests

The test suite verifies:

### 1. Successful booking

- `POST /bookings` returns `201`
- the booking is persisted
- the booked slot disappears from `GET /slots`

### 2. Concurrent booking requests

Two HTTP booking requests are started concurrently using:

```ts
Promise.all([...])
```

Expected result:

```text
one response → 201
one response → 409
```

The database is then checked directly to confirm:

```text
exactly one active booking
```

This is not simulated and the requests are not sent sequentially.

### 3. Cancellation and rebooking

The test verifies:

- booking succeeds
- cancellation returns `200`
- the slot becomes available again
- the same slot can be booked again successfully

---

## Main design decisions

### NestJS

NestJS was chosen because the task includes:

- HTTP APIs
- validation
- OpenAPI
- WebSockets
- multiple domain areas

It provides enough structure without requiring a large custom architecture.

### Prisma

Prisma provides:

- typed database access
- migrations
- schema management
- PostgreSQL integration

The concurrency guarantee itself is enforced by PostgreSQL rather than application logic alone.

### Simple application structure

The project intentionally uses a small structure:

```text
Controller
↓
Service
↓
PrismaService
↓
PostgreSQL
```

No repositories, CQRS, event bus, or additional abstraction layers were introduced because they were unnecessary for the scope of this exercise.

---

## Possible improvements

Given more time, possible improvements would include:

- broader OpenAPI contract tests
- additional validation and error-path tests
- dedicated automated Socket.IO tests
- graceful application shutdown hooks
- structured application logging
- CI workflow for migrations and tests

These were intentionally not added because the exercise states that no additional points are awarded for features outside the requested scope.

---

## AI disclosure

AI tools were used during implementation for:

- discussing architecture and implementation choices
- reviewing code and errors
- assisting with NestJS, Prisma, testing, and OpenAPI configuration
- debugging tooling and module-system issues

All generated or suggested code was reviewed while implementing the project.

The API behavior was manually tested and the required behavior is covered by automated PostgreSQL-backed E2E tests.

I understand the implementation and can explain or modify the code during review.

---

## Implementation time

Actual implementation time:

```text
Approximately 7–8 hours total
```

The requested 2–3 hour duration was treated as a target rather than a strict limit.

Additional time was spent on local environment setup, Prisma/Jest/ESM tooling configuration, learning and integrating newer aspects of the stack, and rigorously validating concurrency handling and automated test suites.

---

## Incomplete requirements

```text
None
```

If any known issue remains before submission, it should be listed here instead of omitted.

