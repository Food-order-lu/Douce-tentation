# 🍰 Douce Tentation - Production Calendar

A production calendar application for Douce Tentation bakery with GloriaFood order integration.

## 📁 Project Structure

```
douce-tentation/
├── public/                    # Frontend files (served by Express)
│   ├── index.html            # Landing page
│   ├── login.html            # Staff login
│   ├── dashboard.html        # Production calendar
│   ├── css/
│   │   └── style.css         # Global styles
│   ├── js/
│   │   ├── utils.js          # Utility functions
│   │   ├── api.js            # API client
│   │   ├── calendar.js       # Calendar rendering
│   │   ├── modals.js         # Modal dialogs
│   │   └── app.js            # Main application
│   └── assets/
│       └── logo.jpg          # Brand assets
│
├── src/                       # Backend files
│   ├── server.js             # Express server entry point
│   ├── config/
│   │   └── index.js          # Configuration (env vars)
│   ├── routes/
│   │   └── orders.js         # Orders API endpoints
│   └── services/
│       └── gloriafood.js     # GloriaFood integration
│
├── .env                       # Environment variables (do not commit!)
├── .gitignore                # Git ignore rules
├── package.json              # Node.js dependencies
└── orders.json               # Order data (temporary storage)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and edit with your values:

```bash
# Create .env file with your settings
cp .env.example .env
```

Required environment variables:
- `PORT` - Server port (default: 3000)
- `GLORIAFOOD_API_KEY` - Your GloriaFood restaurant key
- `NODE_ENV` - Environment (development/production)

### 3. Start the Server

```bash
# Production
npm start

# Development (same for now)
npm run dev

# Legacy server (old structure)
npm run start:legacy
```

### 4. Access the Application

- **Landing Page**: http://localhost:3000/
- **Staff Login**: http://localhost:3000/login.html
- **Dashboard**: http://localhost:3000/dashboard.html

**Default Login**: `admin` or `1234`

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| POST | `/api/orders` | Create new order |
| PUT | `/api/orders/:id` | Update order |
| DELETE | `/api/orders/:id` | Delete order |
| POST | `/webhook/gloriafood` | GloriaFood webhook |

## 🎨 Features

- **Weekly Calendar View** - Visual production planning
- **GloriaFood Integration** - Automatic order import
- **Manual Order Creation** - Multi-step wizard form
- **Order Management** - View, edit, and delete orders
- **Visual Distinction** - Color-coded by order source
  - 🟡 Gold: Cake orders (GloriaFood)
  - 🟠 Orange: Snack orders (GloriaFood)
  - ⚪ Default: Manual orders

## 🛠️ Development

### Code Style

- Use JSDoc comments for functions
- Follow ES6+ conventions
- Keep modules focused and single-purpose

### File Naming

- Lowercase with hyphens for HTML/CSS
- camelCase for JavaScript files
- UPPERCASE for documentation (README, LICENSE)

## 📝 License

Private - All rights reserved

---

Made with ❤️ for Douce Tentation
