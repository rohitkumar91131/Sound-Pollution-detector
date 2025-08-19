import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
variable: "--font-geist-sans",
subsets: ["latin"],
});

const geistMono = Geist_Mono({
variable: "--font-geist-mono",
subsets: ["latin"],
});

export const metadata = {
title: "Sound Pollution Meter",
description: "A web app to check how much sound pollution is around yours",
};

export default function RootLayout({ children }) {
return (
<html lang="en">
<body
className={${geistSans.variable} ${geistMono.variable} antialiased}
>
{children}
</body>
</html>
);
}

