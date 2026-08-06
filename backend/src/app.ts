import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import {
  apiSlowDown,
  authenticationRateLimiter,
  globalRateLimiter,
} from './config/rateLimiter';
import { env } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import {
  hppMiddleware,
  mongoSanitizationMiddleware,
} from './middleware/security.middleware';
import {
  errorRequestLogger,
  requestLogger,
} from './middleware/requestLogger.middleware';
import { adminBrandRoutes, brandRoutes } from './routes/brand.routes';
import { authRoutes } from './routes/auth.routes';
import { adminDashboardRoutes } from './routes/adminDashboard.routes';
import { adminOrderRoutes } from './routes/adminOrder.routes';
import { adminReportRoutes } from './routes/adminReport.routes';
import { addressRoutes } from './routes/address.routes';
import { catalogRoutes } from './routes/catalog.routes';
import { cartRoutes } from './routes/cart.routes';
import { adminCategoryRoutes, categoryRoutes } from './routes/category.routes';
import {
  adminHeroBannerRoutes,
  heroBannerRoutes,
} from './routes/heroBanner.routes';
import { homeRoutes } from './routes/home.routes';
import { orderRoutes } from './routes/order.routes';
import { paymentRoutes } from './routes/payment.routes';
import { paymentVerificationRoutes } from './routes/paymentVerification.routes';
import { profileRoutes } from './routes/profile.routes';
import { adminProductRoutes, productRoutes } from './routes/product.routes';
import { searchRoutes } from './routes/search.routes';
import { adminStoreRoutes, storeRoutes } from './routes/store.routes';
import { docsRoutes } from './routes/docs.routes';
import { wishlistRoutes } from './routes/wishlist.routes';
import { webhookRoutes } from './routes/webhook.routes';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
  }),
);
app.use(requestLogger);
app.use('/api', globalRateLimiter, apiSlowDown);
app.use(
  '/api/webhooks',
  express.raw({ type: 'application/json' }),
  webhookRoutes,
);
app.use(express.json());
app.use(hppMiddleware);
app.use(mongoSanitizationMiddleware);
app.use('/api/auth', authenticationRateLimiter);
app.use('/api/auth', authRoutes);

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'bootkit-api',
  });
});

app.use('/api/categories', categoryRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/admin/brands', adminBrandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/admin/stores', adminStoreRoutes);
app.use('/api/hero-banners', heroBannerRoutes);
app.use('/api/admin/hero-banners', adminHeroBannerRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payments', paymentVerificationRoutes);
app.use('/api/docs', docsRoutes);

app.use(errorRequestLogger);
app.use(errorMiddleware);

export default app;
