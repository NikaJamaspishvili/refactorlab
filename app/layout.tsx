import "./globals.css";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={` h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
