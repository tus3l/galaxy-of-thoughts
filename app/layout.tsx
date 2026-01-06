import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://star-thoughts.space'),
  title: {
    default: "Galaxy of Thoughts - Share Your Ideas in a 3D Universe",
    template: "%s | Galaxy of Thoughts"
  },
  description: "Share your thoughts, ideas, and dreams in an interactive 3D galaxy. Each star represents a unique message. Explore infinite creativity, add your star to the universe, and discover thoughts from people worldwide. A beautiful space visualization experience.",
  keywords: [
    "galaxy of thoughts", "3D galaxy", "interactive universe", "share thoughts", 
    "3D visualization", "stars messages", "space thoughts", "cosmic ideas",
    "thought galaxy", "message in space", "interactive 3D", "web3D", "threejs",
    "creative platform", "anonymous messages", "thought sharing", "universe visualization",
    "celestial thoughts", "starry ideas", "digital cosmos", "thought constellation",
    "space art", "interactive art", "3D web experience", "thoughts universe"
  ],
  authors: [{ name: "Galaxy of Thoughts", url: "https://star-thoughts.space" }],
  creator: "Galaxy of Thoughts",
  publisher: "Galaxy of Thoughts",
  category: "Entertainment",
  classification: "Interactive 3D Experience",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://star-thoughts.space",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://star-thoughts.space",
    title: "Galaxy of Thoughts - Share Your Ideas in a 3D Universe",
    description: "Explore an interactive 3D galaxy where each star represents a unique thought. Share your ideas, discover messages from around the world, and experience the beauty of collective human imagination in space.",
    siteName: "Galaxy of Thoughts",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Galaxy of Thoughts - Interactive 3D Universe",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@galaxyofthoughts",
    creator: "@galaxyofthoughts",
    title: "Galaxy of Thoughts - Share Your Ideas in Space",
    description: "Explore an interactive 3D galaxy where each star is a unique thought. Add your star and discover infinite ideas!",
    images: {
      url: "/og-image.png",
      alt: "Galaxy of Thoughts Universe",
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "googleacf63e9f595c3863",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Galaxy" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Galaxy of Thoughts" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#000000" />
        <link rel="canonical" href="https://star-thoughts.space" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        
        {/* Enhanced Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Galaxy of Thoughts',
              alternateName: 'Star Thoughts',
              description: 'Share your thoughts, ideas, and dreams in an interactive 3D galaxy. Each star represents a unique message from people worldwide.',
              url: 'https://star-thoughts.space',
              applicationCategory: 'EntertainmentApplication',
              genre: ['Interactive Art', '3D Visualization', 'Social Platform'],
              browserRequirements: 'Requires JavaScript. Requires HTML5. Requires WebGL.',
              operatingSystem: 'Any',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              screenshot: 'https://star-thoughts.space/og-image.png',
              softwareVersion: '1.0',
              abstract: 'An interactive 3D universe where every star represents a thought, idea, or dream shared by users worldwide.',
              featureList: [
                'Interactive 3D Galaxy Visualization',
                'Share Thoughts as Stars',
                'Explore Messages from Worldwide',
                'Real-time 3D Navigation',
                'Beautiful Space Graphics'
              ],
              author: {
                '@type': 'Organization',
                name: 'Galaxy of Thoughts'
              },
              inLanguage: 'en',
              isFamilyFriendly: true,
            }),
          }}
        />
        
        {/* Breadcrumb structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://star-thoughts.space'
                }
              ]
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
