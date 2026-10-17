
# Event Analytics Platform

A full-stack event analytics platform that collects browser and server-side events, stores them in MongoDB, and presents analytics through an interactive dashboard.

The project includes a restaurant demo application to demonstrate real-world event tracking, user interactions, and order creation.

## Live Demo

**Frontend:** https://event-analytics-platform-v88j.vercel.app/

**GitHub Repository:** https://github.com/SuryaKumarArun2000/event-analytics-platform

Open the restaurant application, browse the menu, add items to the cart, and place an order. Then visit the Analytics Dashboard to explore the recorded activity.

## Tech Stack


| Layer                   | Technology              |
| ------------------------- | ------------------------- |
| Frontend                | React, Vite, JavaScript |
| Backend                 | Node.js, Express.js     |
| Database                | MongoDB Atlas, Mongoose |
| Analytics Visualization | Recharts                |
| Routing                 | React Router            |
| Deployment              | Vercel, Render          |

## Features

### Browser Analytics SDK

A lightweight JavaScript analytics module that supports:

- Automatic page-view tracking through route changes
- Custom event tracking
- Persistent visitor identification using localStorage
- Session identification using sessionStorage
- Event timestamps and unique event IDs
- Event queuing and retry attempts for failed requests
- Basic event validation

### Server-Side Event Tracking

The backend records business events independently of browser activity.

When a restaurant order is created, the server stores the order and generates an `order_created` analytics event.

### Restaurant Demo

A sample restaurant application with:

- Home and menu pages
- Add-to-cart functionality
- Cart and checkout flow
- Order creation through the backend API
- Navigation to the Analytics Dashboard

### Analytics Dashboard

The dashboard provides:

- Total recorded events
- Unique visitors
- Page-view counts
- Orders created
- Popular pages
- Event trends over time
- Date-range filtering

## Architecture

```text
React Restaurant Application
          |
          v
    Browser Analytics SDK
          |
          v
     Express REST API
          |
          v
       MongoDB Atlas
          ^
          |
    Analytics Dashboard

Restaurant Checkout
          |
          v
   Express Order API
          |
          +--> Order Storage
          |
          +--> Server-Side Analytics Event
```

Browser events and business events are stored using a common event model, allowing the dashboard to analyze both sources.

## Project Structure

```text
event-analytics-platform/
├── client/
│   ├── src/
│   │   ├── analytics/
│   │   │   └── analytics.js
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   └── App.jsx
│   └── package.json
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Event.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── analyticsRoutes.js
│   │   ├── events.js
│   │   └── orders.js
│   ├── server.js
│   └── package.json
│
└── README.md
```

## API Endpoints


| Method | Endpoint                 | Description                 |
| -------- | -------------------------- | ----------------------------- |
| GET    | `/api/health`            | Backend health check        |
| POST   | `/api/events`            | Ingest an analytics event   |
| POST   | `/api/orders`            | Create a restaurant order   |
| GET    | `/api/analytics/summary` | Retrieve summary metrics    |
| GET    | `/api/analytics/pages`   | Retrieve popular pages      |
| GET    | `/api/analytics/trends`  | Retrieve daily event trends |

Analytics endpoints support `startDate` and `endDate` query parameters for date filtering.

## Local Setup

### Prerequisites

- Node.js and npm
- MongoDB Atlas connection string

### Backend

```bash
cd server
npm install
```

Create a `.env` file inside `server`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Start the backend:

```bash
npm run dev
```

### Frontend

```bash
cd client
npm install
```

Create a `.env` file inside `client`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed by Vite.

## Event Data Model

Analytics events include:

- `eventId`: Unique identifier for deduplication
- `eventName`: Name of the tracked event
- `source`: Browser or server
- `visitorId`: Visitor identifier, when available
- `sessionId`: Session identifier, when available
- `path`: Application path
- `properties`: Additional event metadata
- `timestamp`: Time the event occurred
- `receivedAt`: Time the backend received the event

## Design Decisions and Trade-offs

- **Shared event collection:** Browser and server events use a common schema for simpler reporting.
- **Server-side order validation:** The backend validates menu items, quantities, and prices instead of trusting client-submitted totals.
- **Unique event IDs:** Duplicate event submissions can be detected.
- **In-memory SDK queue:** Failed browser events can be retried while the page remains active. Queued events do not survive a full page reload.
- **MongoDB aggregation:** Event data can be grouped by date, page, and event type for dashboard reporting.
- **Simple deployment:** The React frontend is hosted on Vercel, the Express API on Render, and the database on MongoDB Atlas.

## Future Improvements

- Automated API and SDK tests
- Persistent event queue for offline recovery
- Authentication and role-based dashboard access
- Rate limiting and stronger ingestion controls
- Additional analytics visualizations

## Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

The application demonstrates end-to-end event collection, storage, reporting, and deployment using a JavaScript-based full-stack architecture.
