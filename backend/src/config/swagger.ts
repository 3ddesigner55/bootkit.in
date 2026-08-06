import swaggerJSDoc from 'swagger-jsdoc';

const bearerSecurity = [{ bearerAuth: [] }];

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'BootKit API',
      version: '1.0.0',
      description: 'BootKit grocery application backend API documentation.',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          responses: { 200: { description: 'Service is healthy' } },
        },
      },
      '/home': {
        get: {
          tags: ['Home'],
          summary: 'Get home page data',
          responses: { 200: { description: 'Home sections' } },
        },
      },
      '/catalog/products': {
        get: {
          tags: ['Catalog'],
          summary: 'Get product catalog',
          parameters: [
            { name: 'page', in: 'query' },
            { name: 'limit', in: 'query' },
            { name: 'search', in: 'query' },
            { name: 'category', in: 'query' },
            { name: 'brand', in: 'query' },
            { name: 'featured', in: 'query' },
            { name: 'showOnHome', in: 'query' },
            { name: 'minPrice', in: 'query' },
            { name: 'maxPrice', in: 'query' },
            { name: 'sort', in: 'query' },
          ],
          responses: { 200: { description: 'Catalog products' } },
        },
      },
      '/products': {
        get: {
          tags: ['Products'],
          summary: 'Get products',
          responses: { 200: { description: 'Products' } },
        },
      },
      '/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Get product by ID',
          parameters: [{ name: 'id', in: 'path', required: true }],
          responses: { 200: { description: 'Product' } },
        },
      },
      '/products/slug/{slug}': {
        get: {
          tags: ['Products'],
          summary: 'Get product details by slug',
          parameters: [{ name: 'slug', in: 'path', required: true }],
          responses: {
            200: {
              description: 'Product, category, brand and related products',
            },
          },
        },
      },
      '/categories': {
        get: {
          tags: ['Categories'],
          summary: 'Get categories',
          responses: { 200: { description: 'Categories' } },
        },
      },
      '/categories/{id}': {
        get: {
          tags: ['Categories'],
          summary: 'Get category by ID',
          parameters: [{ name: 'id', in: 'path', required: true }],
          responses: { 200: { description: 'Category' } },
        },
      },
      '/brands': {
        get: {
          tags: ['Brands'],
          summary: 'Get brands',
          responses: { 200: { description: 'Brands' } },
        },
      },
      '/brands/{id}': {
        get: {
          tags: ['Brands'],
          summary: 'Get brand by ID',
          parameters: [{ name: 'id', in: 'path', required: true }],
          responses: { 200: { description: 'Brand' } },
        },
      },
      '/stores': {
        get: {
          tags: ['Stores'],
          summary: 'Get stores',
          parameters: [
            { name: 'page', in: 'query' },
            { name: 'limit', in: 'query' },
            { name: 'city', in: 'query' },
            { name: 'state', in: 'query' },
            { name: 'featured', in: 'query' },
            { name: 'active', in: 'query' },
            { name: 'sort', in: 'query' },
          ],
          responses: { 200: { description: 'Stores' } },
        },
      },
      '/stores/slug/{slug}': {
        get: {
          tags: ['Stores'],
          summary: 'Get store by slug',
          parameters: [{ name: 'slug', in: 'path', required: true }],
          responses: { 200: { description: 'Store' } },
        },
      },
      '/hero-banners': {
        get: {
          tags: ['Home'],
          summary: 'Get active home banners',
          responses: { 200: { description: 'Hero banners' } },
        },
      },
      '/search': {
        get: {
          tags: ['Search'],
          summary: 'Global search',
          parameters: [
            { name: 'q', in: 'query', required: true },
            { name: 'page', in: 'query' },
            { name: 'limit', in: 'query' },
          ],
          responses: { 200: { description: 'Search results' } },
        },
      },
      '/profile': {
        get: {
          tags: ['Customer'],
          summary: 'Get profile',
          security: bearerSecurity,
          responses: { 200: { description: 'Profile' } },
        },
        patch: {
          tags: ['Customer'],
          summary: 'Update profile',
          security: bearerSecurity,
          responses: { 200: { description: 'Updated profile' } },
        },
      },
      '/profile/change-password': {
        patch: {
          tags: ['Customer'],
          summary: 'Change password',
          security: bearerSecurity,
          responses: { 200: { description: 'Password changed' } },
        },
      },
      '/profile/logout-all': {
        post: {
          tags: ['Customer'],
          summary: 'Log out from all sessions',
          security: bearerSecurity,
          responses: { 200: { description: 'Sessions cleared' } },
        },
      },
      '/cart': {
        get: {
          tags: ['Cart'],
          summary: 'Get cart',
          security: bearerSecurity,
          responses: { 200: { description: 'Cart' } },
        },
        post: {
          tags: ['Cart'],
          summary: 'Add cart item',
          security: bearerSecurity,
          responses: { 200: { description: 'Cart updated' } },
        },
        delete: {
          tags: ['Cart'],
          summary: 'Clear cart',
          security: bearerSecurity,
          responses: { 200: { description: 'Cart cleared' } },
        },
      },
      '/cart/items/{itemId}': {
        patch: {
          tags: ['Cart'],
          summary: 'Update cart item',
          security: bearerSecurity,
          parameters: [{ name: 'itemId', in: 'path', required: true }],
          responses: { 200: { description: 'Cart updated' } },
        },
        delete: {
          tags: ['Cart'],
          summary: 'Remove cart item',
          security: bearerSecurity,
          parameters: [{ name: 'itemId', in: 'path', required: true }],
          responses: { 200: { description: 'Cart updated' } },
        },
      },
      '/wishlist': {
        get: {
          tags: ['Wishlist'],
          summary: 'Get wishlist',
          security: bearerSecurity,
          responses: { 200: { description: 'Wishlist' } },
        },
        post: {
          tags: ['Wishlist'],
          summary: 'Add wishlist item',
          security: bearerSecurity,
          responses: { 200: { description: 'Wishlist updated' } },
        },
        delete: {
          tags: ['Wishlist'],
          summary: 'Clear wishlist',
          security: bearerSecurity,
          responses: { 200: { description: 'Wishlist cleared' } },
        },
      },
      '/wishlist/{productId}': {
        delete: {
          tags: ['Wishlist'],
          summary: 'Remove wishlist item',
          security: bearerSecurity,
          parameters: [{ name: 'productId', in: 'path', required: true }],
          responses: { 200: { description: 'Wishlist updated' } },
        },
      },
      '/wishlist/{productId}/move-to-cart': {
        post: {
          tags: ['Wishlist'],
          summary: 'Move wishlist item to cart',
          security: bearerSecurity,
          parameters: [{ name: 'productId', in: 'path', required: true }],
          responses: { 200: { description: 'Wishlist and cart updated' } },
        },
      },
      '/addresses': {
        get: {
          tags: ['Addresses'],
          summary: 'Get addresses',
          security: bearerSecurity,
          responses: { 200: { description: 'Addresses' } },
        },
        post: {
          tags: ['Addresses'],
          summary: 'Create address',
          security: bearerSecurity,
          responses: { 201: { description: 'Address created' } },
        },
      },
      '/addresses/{id}': {
        get: {
          tags: ['Addresses'],
          summary: 'Get address',
          security: bearerSecurity,
          parameters: [{ name: 'id', in: 'path', required: true }],
          responses: { 200: { description: 'Address' } },
        },
        patch: {
          tags: ['Addresses'],
          summary: 'Update address',
          security: bearerSecurity,
          parameters: [{ name: 'id', in: 'path', required: true }],
          responses: { 200: { description: 'Address updated' } },
        },
        delete: {
          tags: ['Addresses'],
          summary: 'Delete address',
          security: bearerSecurity,
          parameters: [{ name: 'id', in: 'path', required: true }],
          responses: { 200: { description: 'Address deleted' } },
        },
      },
      '/addresses/{id}/default': {
        patch: {
          tags: ['Addresses'],
          summary: 'Set default address',
          security: bearerSecurity,
          parameters: [{ name: 'id', in: 'path', required: true }],
          responses: { 200: { description: 'Default address updated' } },
        },
      },
      '/orders': {
        post: {
          tags: ['Orders'],
          summary: 'Place order',
          security: bearerSecurity,
          responses: { 201: { description: 'Order created' } },
        },
      },
      '/orders/{orderNumber}/cancel': {
        patch: {
          tags: ['Orders'],
          summary: 'Cancel order',
          security: bearerSecurity,
          parameters: [{ name: 'orderNumber', in: 'path', required: true }],
          responses: { 200: { description: 'Order cancelled' } },
        },
      },
      '/orders/{orderNumber}/confirm-cod': {
        patch: {
          tags: ['Orders'],
          summary: 'Confirm cash on delivery order',
          security: bearerSecurity,
          parameters: [{ name: 'orderNumber', in: 'path', required: true }],
          responses: { 200: { description: 'COD order confirmed' } },
        },
      },
      '/payments/razorpay/order': {
        post: {
          tags: ['Payments'],
          summary: 'Create Razorpay order',
          security: bearerSecurity,
          responses: { 200: { description: 'Razorpay order details' } },
        },
      },
      '/payments/razorpay/verify': {
        post: {
          tags: ['Payments'],
          summary: 'Verify Razorpay payment',
          security: bearerSecurity,
          responses: { 200: { description: 'Payment verified' } },
        },
      },
      '/webhooks/razorpay': {
        post: {
          tags: ['Webhooks'],
          summary: 'Process Razorpay webhook',
          responses: { 200: { description: 'Webhook processed' } },
        },
      },
      '/admin/dashboard': {
        get: {
          tags: ['Admin'],
          summary: 'Get dashboard metrics',
          security: bearerSecurity,
          responses: { 200: { description: 'Dashboard metrics' } },
        },
      },
      '/admin/orders': {
        get: {
          tags: ['Admin'],
          summary: 'Get admin orders',
          security: bearerSecurity,
          responses: { 200: { description: 'Orders' } },
        },
      },
      '/admin/orders/{orderNumber}': {
        get: {
          tags: ['Admin'],
          summary: 'Get admin order details',
          security: bearerSecurity,
          parameters: [{ name: 'orderNumber', in: 'path', required: true }],
          responses: { 200: { description: 'Order details' } },
        },
      },
      '/admin/orders/{orderNumber}/status': {
        patch: {
          tags: ['Admin'],
          summary: 'Update order status',
          security: bearerSecurity,
          parameters: [{ name: 'orderNumber', in: 'path', required: true }],
          responses: { 200: { description: 'Order status updated' } },
        },
      },
      '/admin/reports/sales': {
        get: {
          tags: ['Admin Reports'],
          summary: 'Sales report',
          security: bearerSecurity,
          responses: { 200: { description: 'Sales report' } },
        },
      },
      '/admin/reports/top-products': {
        get: {
          tags: ['Admin Reports'],
          summary: 'Top products report',
          security: bearerSecurity,
          responses: { 200: { description: 'Top products report' } },
        },
      },
      '/admin/reports/top-categories': {
        get: {
          tags: ['Admin Reports'],
          summary: 'Top categories report',
          security: bearerSecurity,
          responses: { 200: { description: 'Top categories report' } },
        },
      },
      '/admin/reports/stores': {
        get: {
          tags: ['Admin Reports'],
          summary: 'Stores report',
          security: bearerSecurity,
          responses: { 200: { description: 'Stores report' } },
        },
      },
      '/admin/reports/customers': {
        get: {
          tags: ['Admin Reports'],
          summary: 'Customers report',
          security: bearerSecurity,
          responses: { 200: { description: 'Customers report' } },
        },
      },
    },
  },
  apis: [],
});

export default swaggerSpec;
