import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorMiddleware } from './middleware/error.middleware';
import { adminBrandRoutes, brandRoutes } from './routes/brand.routes';
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
import { profileRoutes } from './routes/profile.routes';
import { adminProductRoutes, productRoutes } from './routes/product.routes';
import { searchRoutes } from './routes/search.routes';
import { adminStoreRoutes, storeRoutes } from './routes/store.routes';
import { wishlistRoutes } from './routes/wishlist.routes';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? true,
  }),
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

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

app.use(errorMiddleware);

export default app;
