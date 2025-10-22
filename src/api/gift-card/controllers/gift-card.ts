/**
 * gift-card controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::gift-card.gift-card', ({ strapi }) => ({
  async findByCode(ctx) {
    const { uuid } = ctx.params;
    const giftCard = await strapi.documents('api::gift-card.gift-card').findFirst({
      filters: {
        code: { $eq: uuid },
      },
      status: 'published',
    });
    return giftCard;
  },
}));