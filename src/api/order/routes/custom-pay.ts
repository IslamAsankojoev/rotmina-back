export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/make-order',
      handler: 'order.makeOrder',
    },
  ],
};