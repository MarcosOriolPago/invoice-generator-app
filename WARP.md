# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Project Setup
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Build for development (preserves debugging)
npm run build:dev

# Preview production build locally
npm run preview

# Run linting
npm run lint
```

### Development Server
- Development server runs on default Vite port (usually `http://localhost:5173`)
- Hot reload is enabled for immediate feedback during development
- Uses Supabase for authentication and data persistence

## Architecture Overview

### Project Structure
This is a React + TypeScript invoice generator application built with Vite that allows users to create, edit, and manage professional invoices with PDF generation capabilities.

### Key Components Architecture

#### Core Data Flow
1. **Authentication**: Supabase Auth for user management and secure access
2. **Invoice Creation**: Form-based invoice creation with real-time preview
3. **PDF Generation**: High-quality PDF generation using html2canvas and jsPDF
4. **Data Persistence**: Invoice data and PDF files stored in Supabase
5. **Edit Workflow**: Full edit capability that restores all invoice data from database

#### Main Components
- **InvoiceGenerator**: Main page component managing invoice creation/editing workflow
- **InvoiceForm**: Comprehensive form component with validation and PDF generation
- **InvoicePreview**: Real-time preview component for invoice visualization
- **InvoicesDashboard**: Dashboard for managing saved invoices
- **InvoiceDetailPage**: View component for saved invoices with edit/download actions

### Data Processing Pipeline
```
Form Input → Validation → Invoice Data → PDF Generation → Supabase Storage → Database Persistence
```

The system handles:
- Form validation using React Hook Form and Zod
- High-quality PDF generation with 4x scale rendering
- File uploads to Supabase Storage
- Database operations for CRUD functionality
- User authentication and authorization

## Technology Stack

### Core Technologies
- **React 18** - UI framework with hooks and concurrent features
- **TypeScript** - Type safety and enhanced developer experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework with custom design tokens

### Authentication & Database
- **Supabase** - Backend-as-a-Service for auth, database, and file storage
- **@supabase/supabase-js** - JavaScript client for Supabase
- **Row Level Security (RLS)** - Database security at the row level

### Form Management
- **React Hook Form** - Form state management and validation
- **@hookform/resolvers** - Form validation resolvers
- **Zod** - Schema validation and type inference

### PDF Generation
- **html2canvas** - HTML to canvas conversion with high-quality rendering
- **jsPDF** - PDF generation from canvas with compression control

### UI Components
- **shadcn/ui** - Modern, accessible React components
- **Radix UI** - Primitive components for complex UI patterns
- **Lucide React** - Icon library
- **Framer Motion** - Animation library

## Development Guidelines

### Invoice Generation Workflow
1. **Create Mode**: New invoices start with default/sample data
2. **Edit Mode**: Existing invoices are loaded via URL parameter (`?edit=invoiceId`)
3. **PDF Quality**: High-resolution rendering with 4x scale for crisp output
4. **Data Restoration**: Complete form data restoration from database when editing
5. **Sequential Numbering**: Invoice numbers auto-increment (INV-001, INV-002, etc.)

### Key Implementation Patterns

#### High-Quality PDF Generation
- Use `scale: 4` in html2canvas for crisp resolution
- JPEG format with 0.98 quality for optimal file size/quality balance
- Disable PDF compression for better text rendering
- Use `letterRendering: true` for better text quality

#### Edit Mode Implementation
- URL parameter `?edit=invoiceId` triggers edit mode
- Form data is loaded from database and populated using `form.reset()`
- Update operations use `UPDATE` SQL instead of `INSERT`
- Toast notifications distinguish between create and update operations

#### Database Operations
- Invoice data stored as JSON in `invoices` table
- PDF files uploaded to `invoices_pdfs` Supabase Storage bucket
- Public URLs stored in database for easy access
- User-specific data isolation through RLS
- Sequential invoice numbering based on highest existing number + 1

### Form Data Structure
```typescript
interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  services: ServiceItem[];
  notes?: string;
}

interface ServiceItem {
  title: string;
  description?: string;
  rate: number;
  subtasks?: Subtask[];
}
```

### Authentication Context
- Uses custom `useAuth` hook for user state management
- Protected routes require authentication
- User configuration stored in `user_invoice_configs` table
- Session management handled by Supabase Auth

### Currency Support
- Dynamic currency symbols based on user configuration
- Supports major currencies: USD ($), EUR (€), GBP (£), JPY (¥), CAD (C$), AUD (A$), CHF, CNY (¥), SEK (kr), NOK (kr), MXN ($), INR (₹), BRL (R$)
- Defaults to USD if no currency is configured
- Currency setting stored in `user_invoice_configs.default_currency`

## Important Implementation Details

### PDF Quality Improvements
- **Scale**: Increased from 2x to 4x for much higher resolution
- **Format**: Using JPEG with 0.98 quality instead of PNG
- **Settings**: Disabled compression, increased precision to 16
- **Rendering**: Added `letterRendering: true` for better text

### Edit Functionality
- **Data Loading**: Invoices loaded from database using invoice ID
- **Form Population**: All fields including services and subtasks are restored
- **Update Logic**: Separate code paths for create vs update operations
- **Navigation**: Seamless transition from view mode to edit mode

### Sequential Invoice Numbering
- **Auto-Generation**: New invoices automatically get next sequential number
- **Format**: INV-001, INV-002, INV-003, etc. with 3-digit padding
- **User-Scoped**: Each user has their own sequence starting from 001
- **Edit Protection**: Editing existing invoices preserves original numbers
- **Performance**: Queries recent 100 invoices to find highest number

### Error Handling
- Comprehensive error handling for database operations
- User-friendly error messages with toast notifications
- Fallback handling for missing data or failed operations
- Validation errors displayed inline with form fields

### Security Considerations
- Row Level Security (RLS) enforced on all tables
- User can only access their own invoices
- File uploads scoped to user directories
- Authentication required for all operations

## Common Issues and Solutions

### PDF Generation Issues
- **Poor Quality**: Ensure `scale: 4` is used in html2canvas
- **Large Files**: Use JPEG format instead of PNG for better compression
- **Text Rendering**: Enable `letterRendering: true` for crisp text

### Edit Mode Issues
- **Data Not Loading**: Check URL parameter parsing and database query
- **Form Not Populating**: Ensure `useEffect` with `form.reset()` is properly triggered
- **Update Failing**: Verify RLS policies allow updates for the user

### Database Issues
- **Storage Bucket**: Ensure `invoices_pdfs` bucket exists and is public
- **RLS Policies**: Verify policies allow user access to their own data
- **Schema**: Check that all required columns exist in tables