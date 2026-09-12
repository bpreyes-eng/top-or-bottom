import './globals.css';

export const metadata = {
  title: 'Top or Bottom',
  description: 'Pick Your Position — 2026 NFL Season',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
