export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/pay',
      handler: 'order.pay',
    },
  ],
};