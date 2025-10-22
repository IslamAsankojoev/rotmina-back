import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async makeOrder(ctx) {
    ctx.body = { yourBody: ctx.request.body };
  },
}));