
import DeliveryAreaAdminProvider from "@/store/DeliveryAreaAdminProvider";
import CategoryAdminProvider from "@/store/CategoryAdminProvider";
import ProductAdminProvider from "@/store/ProductAdminProvider";
import ReviewProvider from "@/store/ReviewProvider";
import SettingsProvider from "@/store/SettingsProvider";
import type { Metadata, Viewport } from "next";
import AppInstallBanner from "@/components/app/AppInstallBanner";
import ServiceWorkerRegister from "@/components/app/ServiceWorkerRegister";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import AccountProvider from "@/store/AccountProvider";
import AddressProvider from "@/store/AddressProvider";
import CartProvider from "@/store/CartProvider";
import LocationProvider from "@/store/LocationProvider";
import WishlistProvider from "@/store/WishlistProvider";
import "./globals.css";
import RecentlyViewedProvider from "@/store/RecentlyViewedProvider";
import CouponProvider from "@/store/CouponProvider";
import NotificationProvider from "@/store/NotificationProvider";
import BrandAdminProvider from "@/store/BrandAdminProvider";
import WalletProvider from "@/store/WalletProvider";
import SellerProvider from "@/store/SellerProvider";
import DeliveryPartnerProvider from "@/store/DeliveryPartnerProvider";
import MobileCartBar from "@/components/layout/MobileCartBar";

export const metadata: Metadata = {
  title: {
    default: "BootKiT — Fast Local Delivery",
    template: "%s | BootKiT",
  },
  description:
    "BootKiT is a premium local quick-commerce app for groceries and daily essentials.",
  applicationName: "BootKiT",
  appleWebApp: {
    capable: true,
    title: "BootKiT",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#165c3a",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body> 
            <AccountProvider>
              <DeliveryPartnerProvider>
              <SellerProvider>
              <WalletProvider>
              <SettingsProvider>
                <DeliveryAreaAdminProvider>
                 <LocationProvider>
                   <AddressProvider>
                    <CategoryAdminProvider>
                    <BrandAdminProvider>
                    <ProductAdminProvider>
                     <CartProvider>
                      <CouponProvider>
                       <NotificationProvider>
                         <WishlistProvider>
                         <RecentlyViewedProvider>
                           <ReviewProvider>
                           <div
                             id="bootkit-app"
                             className="flex min-h-screen flex-col"
                             >
                             <div className="flex-1">
                             {children}
                           </div>

                         <Footer />
                           <MobileBottomNav />
                           <MobileCartBar />
                     <AppInstallBanner />
                    <ServiceWorkerRegister />
                  </div>
                  </ReviewProvider>
                </RecentlyViewedProvider>
              </WishlistProvider>
            </NotificationProvider>
          </CouponProvider>
         </CartProvider>
        </ProductAdminProvider>
        </BrandAdminProvider>
        </CategoryAdminProvider>
      </AddressProvider>
    </LocationProvider>
    </DeliveryAreaAdminProvider>
  </SettingsProvider>
  </WalletProvider>
  </SellerProvider>
  </DeliveryPartnerProvider>
</AccountProvider>
       
      
      </body>
    </html>
  );
}
