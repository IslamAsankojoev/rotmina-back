export default {
  routes: [
    {
      method: 'GET',
      path: '/gift-cards/code/:uuid',
      handler: 'gift-card.findByCode',
    },
  ],
};