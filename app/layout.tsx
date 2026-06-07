import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Universidad de la Imaginación",
  description:
    "Explora las enseñanzas de Neville Goddard con el Profesor y el Cuentacuentos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
