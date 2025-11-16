export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/make-order',
      handler: 'order.makeOrder',
    },
    {
      method: 'GET',
      path: '/orders/my-orders',
      handler: 'order.findMyOrders',
    },
    {
      method: 'PUT',
      path: '/orders/:orderId/change-status',
      handler: 'order.changeOrderStatus',
    },
  ],
};