/**
 * custom make order router
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/make-order',
      handler: 'order.makeOrder',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/orders/my-orders',
      handler: 'order.findMyOrders',
      config: {
        auth: {
          scope: ['authenticated'],
        },
        policies: [],
        middlewares: [],
      },
    }
  ],
};
