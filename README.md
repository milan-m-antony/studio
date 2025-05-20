
# Personal Portfolio - Milan

This is a dynamic personal portfolio website built with Next.js, React, TypeScript, and Supabase. It features a comprehensive admin dashboard for managing all content dynamically.

## ✨ Core Features

*   **Dynamic Content Sections:**
    *   **Hero Section:** Customizable name, typewriter subtitles, and social media links.
    *   **About Me:** Editable headline, paragraphs, image, and image tagline.
    *   **Projects Gallery:** Manage project details, descriptions, images, live demo/repo links, tags, status, and progress.
    *   **Skills Overview:** Organize skills into categories, with options for custom icons (via image URLs) and descriptions.
    *   **Career Journey/Timeline:** Add and manage education, work experience, certifications, and milestones with dates, descriptions, and icons.
    *   **Certifications & Badges:** Showcase certifications with images, issuer details, dates, and verification links.
    *   **Resume/CV:** Manage an overall resume description, upload a PDF resume, and detail experience, education, key skills, and languages.
    *   **Contact Section:** Dynamic contact information, social links, and a contact form that saves submissions to the database.
*   **Admin Dashboard (`/admin/dashboard`):**
    *   Secure login (credentials via environment variables).
    *   Comprehensive UI to create, read, update, and delete content for all portfolio sections.
    *   Image uploads to Supabase Storage for various sections.
    *   Recent activity log.
    *   Site settings management (e.g., Maintenance Mode).
    *   Admin profile photo management.
*   **Styling & UI:**
    *   ShadCN UI components.
    *   Tailwind CSS for styling.
    *   Light/Dark mode toggle.
    *   Responsive design.
    *   Preloader screen.
*   **Legal Pages:** Dynamically managed Terms & Conditions and Privacy Policy displayed in modals via the footer.
*   **Maintenance Mode:** Site-wide maintenance mode toggleable from the admin dashboard, displaying a custom message.

## 🛠️ Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** ShadCN UI, Tailwind CSS
*   **Backend & Database:** Supabase (PostgreSQL for database, Supabase Storage for file uploads)
*   **Icons:** Lucide React (for UI elements), Image URLs for dynamic content icons
*   **Form Management:** React Hook Form, Zod for validation
*   **Date Formatting:** date-fns

## 🚀 Getting Started

### Prerequisites

*   Node.js (version 18.x or higher recommended)
*   npm, yarn, or pnpm
*   A Supabase project

### Environment Variables

Create a `.env.local` file in the root of your project and add the following variables:

```env
# Supabase Credentials (get from your Supabase project settings -> API)
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Admin Dashboard Credentials (choose your own)
NEXT_PUBLIC_ADMIN_USERNAME=your_admin_username
NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password
```

Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual Supabase project credentials. Set your desired admin username and password.

### Supabase Setup

1.  **Create a Supabase Project:** If you haven't already, create one at [supabase.com](https://supabase.com).
2.  **Run SQL Schema:** Execute the comprehensive SQL query provided (usually in `SQL_SETUP.md` or as per instructions from the AI assistant) in the Supabase SQL Editor to create all necessary tables and Row Level Security (RLS) policies.
3.  **Create Storage Buckets:** Manually create the following storage buckets in your Supabase project (Storage section) and ensure their RLS policies allow public reads and (for development with current admin setup) anonymous uploads/deletes:
    *   `project-images`
    *   `category-icons` (for skill categories)
    *   `skill-icons`
    *   `about-images`
    *   `certification-images`
    *   `resume-pdfs`
    *   `admin-profile-photos`
    *   `resume-experience-icons` (if using image uploads for these)
    *   `resume-education-icons` (if using image uploads for these)
    *   `resume-language-icons` (if using image uploads for these)

### Installation

1.  Clone the repository:
    ```bash
    git clone <your-repo-url>
    cd <project-directory>
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

### Running the Development Server

1.  Ensure your `.env.local` file is set up.
2.  Start the Next.js development server:
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```
3.  Open [http://localhost:9002](http://localhost:9002) (or your configured port) in your browser to see the portfolio.
4.  Access the admin dashboard at [http://localhost:9002/admin/dashboard](http://localhost:9002/admin/dashboard).

### Building for Production

```bash
npm run build
npm run start
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details (if one exists).
