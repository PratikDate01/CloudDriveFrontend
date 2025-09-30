# CloudDrive Frontend

A modern React-based frontend for the CloudDrive application, built with TypeScript and Vite.

## Features

- Modern React with TypeScript
- File upload and management
- File sharing with permissions
- Google OAuth authentication
- Responsive design with Tailwind CSS
- Real-time updates with Socket.IO
- Drag & drop file uploads

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router
- **State Management**: React Hooks
- **Real-time**: Socket.IO Client

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your backend URL:
   ```
   VITE_API_BASE_URL=http://localhost:4000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:4000/api` |

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Set environment variable: `VITE_API_BASE_URL=https://your-render-app.onrender.com/api`
4. Deploy

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API service functions
│   └── utils/          # Utility functions
├── public/             # Static assets
├── .env                # Environment variables
└── package.json
```

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test your changes locally
4. Submit a pull request

## License

ISC
