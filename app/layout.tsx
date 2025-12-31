import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://star-thoughts.space'),
  title: {
    default: "Galaxy of Thoughts - مجرة الأفكار",
    template: "%s | Galaxy of Thoughts"
  },
  description: "كون ثلاثي الأبعاد حيث كل نجمة تمثل فكرة. استكشف مجرة الخيال الإنساني ودع بصمتك في الفضاء.",
  keywords: ["galaxy", "thoughts", "3D universe", "مجرة الأفكار", "أفكار", "فضاء", "نجوم", "interactive", "cosmos"],
  authors: [{ name: "Galaxy of Thoughts" }],
  creator: "Galaxy of Thoughts",
  publisher: "Galaxy of Thoughts",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: ["en_US"],
    url: "https://star-thoughts.space",
    title: "Galaxy of Thoughts - مجرة الأفكار",
    description: "كون ثلاثي الأبعاد حيث كل نجمة تمثل فكرة. استكشف مجرة الخيال الإنساني.",
    siteName: "Galaxy of Thoughts",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Galaxy of Thoughts Universe",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Galaxy of Thoughts - مجرة الأفكار",
    description: "كون ثلاثي الأبعاد حيث كل نجمة تمثل فكرة",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="canonical" href="https://star-thoughts.space" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Galaxy of Thoughts',
              alternateName: 'مجرة الأفكار',
              description: 'A 3D universe where every star represents a thought',
              url: 'https://star-thoughts.space',
              applicationCategory: 'EntertainmentApplication',
              browserRequirements: 'Requires JavaScript. Requires HTML5.',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              screenshot: 'https://star-thoughts.space/og-image.png',
            }),
          }}
        />
      </head>
      <body className="overflow-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
