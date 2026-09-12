export const metadata = {
  title: "Top or Bottom",
  description: "Pick Your Position",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}