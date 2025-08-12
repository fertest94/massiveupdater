# Overview

This is a fullstack web application for performing mass updates on Bitrix24 contacts and companies. It integrates with the Bitrix24 CRM system through webhooks and provides a user-friendly interface for bulk data operations. The application allows users to upload Excel/CSV files with up to 100,000 records, match them against existing Bitrix24 entries using configurable key columns, and perform batch updates through the Bitrix24 API.

The app features a modern, Apple-inspired dark mode interface built with React and styled using Tailwind CSS with shadcn/ui components. It includes comprehensive preview functionality, batch processing capabilities, and detailed reporting of successful updates, duplicates, and unmatched records.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript running on Vite for fast development and builds
- **Styling**: Tailwind CSS with custom Apple-style design system using CSS variables for theming
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessibility
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Animation**: Framer Motion for smooth transitions and micro-interactions
- **Form Handling**: React Hook Form with Zod for validation and type safety

## Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **File Processing**: XLSX library for Excel files and PapaParse for CSV processing
- **File Uploads**: Multer middleware with memory storage and 50MB file size limits
- **API Design**: RESTful endpoints with proper HTTP status codes and error handling

## Security Implementation
- **Authentication**: Token-based authentication via APP_SECRET_TOKEN environment variable
- **Domain Validation**: ALLOWED_DOMAINS whitelist for restricting access to authorized Bitrix24 instances
- **Request Security**: CORS protection and input validation using Zod schemas
- **File Upload Security**: MIME type validation and file extension checking

## Data Processing Pipeline
- **Upload Phase**: File validation, parsing, and initial data structure analysis
- **Configuration Phase**: User-defined key column mapping and target entity selection
- **Processing Phase**: Bitrix24 API integration for record matching and data retrieval
- **Preview Phase**: Interactive table showing current vs new values with user approval
- **Execution Phase**: Batch API calls to Bitrix24 with progress tracking and error handling
- **Results Phase**: Comprehensive reporting with downloadable CSV exports

## Database Schema
- **Sessions Table**: Tracks file upload sessions with metadata and processing status
- **Record Results Table**: Stores individual record processing outcomes and user selections
- **Execution Batches Table**: Manages batch processing for performance optimization
- **Status Tracking**: Real-time progress monitoring with polling-based updates

## File Processing Strategy
- **Memory-based Processing**: Files stored in memory for fast access during processing
- **Streaming Support**: Large file handling with chunked processing for performance
- **Format Detection**: Automatic detection of Excel (.xlsx, .xls) and CSV file formats
- **Data Validation**: Comprehensive validation of file structure and content integrity

# External Dependencies

## Bitrix24 Integration
- **REST API**: Direct integration with Bitrix24 REST API for CRUD operations
- **Webhook Architecture**: Incoming webhooks for secure communication channel
- **Batch API**: Utilizes Bitrix24's batch endpoint for efficient bulk operations
- **Entity Support**: Handles both Contacts and Companies with field mapping

## Database Services
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Connection Pooling**: @neondatabase/serverless for optimized database connections
- **Migration System**: Drizzle Kit for database schema migrations and version control

## File Processing Libraries
- **Excel Processing**: SheetJS (xlsx) for reading Excel workbooks and worksheets
- **CSV Processing**: PapaParse for robust CSV parsing with error handling
- **File Upload**: Multer for multipart/form-data handling with size limits

## UI and Styling
- **Component Library**: Radix UI primitives for accessible, unstyled components
- **Animation**: Framer Motion for declarative animations and gestures
- **Styling**: Tailwind CSS with custom Apple-style design tokens
- **Icons**: Lucide React for consistent iconography

## Development Tools
- **Build System**: Vite with TypeScript support and hot module replacement
- **Code Quality**: ESBuild for production bundling and TypeScript compilation
- **Development Server**: Express with Vite middleware for unified development experience