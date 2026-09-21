import type { Metadata, Viewport } from "next";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import Header from "@/components/layout/Header";
import MobileCartBar from "@/components/layout/MobileCartBar";
import AccountProvider from "@/store/AccountProvider";
import AddressProvider from "@/store/AddressProvider";
import CartProvider from "@/store/CartProvider";
import LocationProvider from "@/store/LocationProvider";
import WishlistProvider from "@/store/WishlistProvider";
import RecentlyViewedProvider from "@/store/RecentlyViewedProvider";
import CouponProvider from "@/store/CouponProvider";
import NotificationProvider from "@/store/NotificationProvider";
import WalletProvider from "@/store/WalletProvider";
import SettingsProvider from "@/store/SettingsProvider";
import ReviewProvider from "@/store/ReviewProvider";

import AppBootstrapGate from "@/components/auth/AppBootstrapGate";
import DeliveryPartnerProvider from "@/store/DeliveryPartnerProvider";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "BootKiT | Fast Grocery Delivery App",
  description:
    "BootKiT delivers groceries, fruits, vegetables and daily essentials in 10–20 minutes from trusted local stores.",
  keywords: [
    "BootKiT",
    "Grocery Delivery",
    "Quick Commerce",
    "Groceries",
    "Fresh Vegetables",
    "Online Grocery",
  ],
  authors: [{ name: "BootKiT" }],
  creator: "BootKiT",
  metadataBase: new URL("https://bootkit.in"),
  openGraph: {
    title: "BootKiT",
    description: "Fast grocery delivery in minutes.",
    url: "https://bootkit.in",
    siteName: "BootKiT",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BootKiT",
    description: "Fast Grocery Delivery App",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#165c3a",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AccountProvider>
            <DeliveryPartnerProvider>
              <WalletProvider>
                <SettingsProvider>
                  <LocationProvider>
                    <AppBootstrapGate>
                      <AddressProvider>
                        <CartProvider>
                          <WishlistProvider>
                            <RecentlyViewedProvider>
                              <CouponProvider>
                                <NotificationProvider>
                                  <ReviewProvider>
                                    <div className="flex min-h-screen flex-col bg-[#f5f8f5] text-[#1a2e1a] antialiased">
                                      <Header />
                                      <main className="flex-1 pb-24 lg:pb-0">{children}</main>
                                      <MobileCartBar />
                                      <MobileBottomNav />
                                      <Footer />
                                    </div>
                                  </ReviewProvider>
                                </NotificationProvider>
                              </CouponProvider>
                            </RecentlyViewedProvider>
                          </WishlistProvider>
                        </CartProvider>
                      </AddressProvider>
                    </AppBootstrapGate>
                  </LocationProvider>
                </SettingsProvider>
              </WalletProvider>
            </DeliveryPartnerProvider>
          </AccountProvider>

        </ThemeProvider>
      </body>
    </html>
  );
}
