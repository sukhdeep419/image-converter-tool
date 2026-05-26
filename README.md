# Format Foundry

Format Foundry is a Next.js app for converting batches of images to JPG, PNG, WEBP, or AVIF with quality controls. Upload up to 50 images (max 50 MB total), adjust quality for lossy formats, and download a single zip file.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

## Tool Notes

- JPG/WEBP/AVIF support a quality slider (60-100).
- PNG ignores quality and uses lossless compression.
- The conversion API is implemented in the App Router route handler.

## Contact Form Setup

The contact form posts to an API route that sends email via Gmail SMTP.

Create a `.env.local` file with:

```bash
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_app_password
CONTACT_TO=destination_address@gmail.com
```

Notes:

- Use a Gmail App Password, not your regular account password.
- `CONTACT_TO` is optional and defaults to `SMTP_USER`.
- Basic spam protection is enabled via a honeypot field and a simple rate limit.

## Project Structure

- Home page: `src/app/page.tsx`
- Tool page: `src/app/tool/page.tsx`
- Contact page: `src/app/contact/page.tsx`
- API route: `src/app/api/convert/route.ts`
