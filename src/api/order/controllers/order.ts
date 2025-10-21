import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async pay(ctx) {
    ctx.body = { message: 'Оплата прошла успешно' };
  },
}));