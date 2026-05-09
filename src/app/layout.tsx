import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Habbit Garden — геймификация привычек",
  description: "Выполняй привычки, получай опыт и выращивай свой сад",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
