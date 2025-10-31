export default {
  routes: [
    {
      method: 'GET',
      path: '/gift-cards/code/:uuid',
      handler: 'gift-card.findByCode',
    },
    {
      method: 'POST',
      path: '/gift-cards/use',
      handler: 'gift-card.useGiftCard',
    }
  ],
};