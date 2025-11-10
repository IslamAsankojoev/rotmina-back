export default {
  routes: [
    {
      method: 'GET',
      path: '/products/get-wishlist-products',
      handler: 'product.getWishlistProducts',
    },
    {
      method: 'POST',
      path: '/products/add-to-wishlist/:productId',
      handler: 'product.addToWishlist',
    },
    {
      method: 'DELETE',
      path: '/products/remove-from-wishlist/:productId',
      handler: 'product.removeFromWishlist',
    },
    {
      method: 'GET',
      path: '/products/get-related/:productId',
      handler: 'product.getRelatedProducts',
    },
  ],
}
