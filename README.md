# Garment IMS Frontend

A modern React frontend for the Garment Inventory & Manufacturing System, built with the exact design and styling from the sample frontend.

## Features

- **Modern UI**: Built with React 19, Ant Design, and Tailwind CSS
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Professional Layout**: Collapsible sidebar, header with search and notifications
- **Authentication**: JWT-based login system
- **Dashboard**: Overview with statistics and recent activity
- **CRUD Operations**: Complete management for products, categories, users, etc.
- **API Integration**: Seamlessly integrates with Express.js backend

## Tech Stack

- **React 19** - Frontend framework
- **Ant Design** - UI component library
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Sonner** - Toast notifications

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running on http://localhost:3000

### Installation

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your backend URL:
```
VITE_API_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3001

## Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (Sidebar, Header, MainLayout)
│   ├── ui/              # Reusable UI components
│   └── lib/             # Utility functions
├── context/             # React contexts (Auth, etc.)
├── pages/               # Page components
├── services/            # API services
├── utils/               # Utility functions
└── assets/              # Static assets
```

## Available Pages

- **Dashboard** - Overview with statistics and charts
- **Products** - Product management with categories
- **Categories** - Category management
- **Users** - User management
- **Suppliers** - Supplier management
- **Customers** - Customer management
- **Raw Materials** - Raw material inventory
- **Purchase Orders** - Purchase order management
- **Production Orders** - Production planning
- **Sales Orders** - Sales management
- **Stock** - Inventory management
- **Branches** - Branch management
- **Reports** - Analytics and reporting
- **Settings** - System configuration

## API Integration

The frontend integrates with the Express.js backend through RESTful APIs:

- Authentication: `/api/auth/*`
- Products: `/api/products/*`
- Categories: `/api/categories/*`
- Users: `/api/users/*`
- And more...

## Authentication

The app uses JWT-based authentication:
1. Login with email/password
2. JWT token stored in localStorage
3. Automatic token refresh
4. Protected routes with authentication guards

## Design System

The UI follows the exact design from the sample frontend:
- **Colors**: Blue primary (#3D5EE1), gray neutrals
- **Typography**: DM Sans font family
- **Spacing**: Consistent 8px grid system
- **Components**: Rounded corners, subtle shadows
- **Layout**: Fixed sidebar, sticky header

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use TypeScript-style prop validation
- Consistent naming conventions

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist` folder to your web server

## Environment Variables

- `VITE_API_URL` - Backend API URL
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version

## Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include loading states
4. Test on multiple screen sizes
5. Update documentation as needed