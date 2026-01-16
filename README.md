# Home Bar 🍹

A Single Page Application (SPA) for ordering cocktails with Telegram bot integration.

## Features

### For Users
- Browse cocktail cards with photos
- View detailed cocktail information (description, ingredients, recipe)
- Strength indicator (green/yellow/red)
- Order cocktails with Telegram bot notifications
- Track order statuses
- Cancel orders in "In Queue" status
- Username persistence in localStorage

### For Administrators
- CRUD operations for cocktails via `/admin` panel
- Manage ingredients, recipes, and strength levels
- Upload images (file or URL) with cropping functionality

### Telegram Integration
- Automatic order notifications with inline buttons
- Each order sent as a separate message
- Order management buttons:
  - **In Queue**: "Cancel" and "Take in Progress"
  - **In Progress**: "Cancel" and "Ready"
- When order is completed (Ready/Cancelled), old message is deleted and a short notification is sent
- Status updates via bot polling (no webhook required)

## Tech Stack

- **Next.js 16** (App Router) - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **TypeORM** - ORM for database
- **PostgreSQL** - Database
- **Telegram Bot API** - Bot integration
- **Sharp** - Image processing
- **React Image Crop** - Image cropping

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Telegram Bot Token

### Docker Compose (Recommended)

1. Create `.env` file:

```env
POSTGRES_USER=homebar
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=homebar
APP_PORT=3000
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

2. Start services:

```bash
docker-compose up -d
```

3. Access the application:

- Main app: http://localhost:3000
- Admin panel: http://localhost:3000/admin

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Setup environment:

```env
DATABASE_URL="postgresql://homebar:homebar_password@localhost:5432/homebar?schema=public"
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"
```

3. Run development server:

```bash
npm run dev
```

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── cocktails/    # Cocktail CRUD
│   │   ├── orders/       # Order management
│   │   ├── upload/       # Image upload
│   │   └── uploads/      # Image serving
│   ├── admin/            # Admin panel
│   └── page.tsx          # Main page
├── components/           # React components
├── lib/                  # Utilities
│   └── telegram.ts       # Telegram bot
├── src/
│   ├── entities/        # TypeORM entities
│   └── data-source.ts    # Database connection
└── types/                # TypeScript types
```

## API Endpoints

### Cocktails
- `GET /api/cocktails` - Get all cocktails
- `POST /api/cocktails` - Create cocktail
- `GET /api/cocktails/[id]` - Get cocktail
- `PUT /api/cocktails/[id]` - Update cocktail
- `DELETE /api/cocktails/[id]` - Delete cocktail

### Orders
- `GET /api/orders?userId=...` - Get user orders
- `POST /api/orders` - Create order
- `PATCH /api/orders/[id]` - Update order status
- `DELETE /api/orders/[id]` - Cancel order

### Upload
- `POST /api/upload` - Upload and process image

## Order Statuses

- **В очереди** (In Queue) - Order just created (can be cancelled)
- **В процессе** (In Progress) - Order being prepared
- **Готов** (Ready) - Order ready
- **Отменен** (Cancelled) - Order cancelled

## Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Get your Chat ID from [@userinfobot](https://t.me/userinfobot)
3. Add credentials to `.env`
4. Bot uses polling mode (no webhook needed)

## Docker Commands

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose build --no-cache
```

## License

MIT
