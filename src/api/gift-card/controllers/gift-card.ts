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
  async useGiftCard(ctx) {
    try {
      const { code } = ctx.request.body;
      
      if (!code) {
        return ctx.send({
          data: null,
          error: {
            status: 400,
            name: 'ValidationError',
            message: 'Gift card code is required',
            details: {
              field: 'code',
              value: code
            }
          }
        }, 400);
      }
      
      const giftCard = await strapi.documents('api::gift-card.gift-card').findFirst({
        filters: {
          code: { $eq: code },
        },
        status: 'published',
      });
      
      if (!giftCard) {
        return ctx.send({
          data: null,
          error: {
            status: 404,
            name: 'NotFoundError',
            message: 'Gift card not found',
            details: {
              code
            }
          }
        }, 404);
      }
      
      if (giftCard.is_used) {
        return ctx.send({
          data: null,
          error: {
            status: 400,
            name: 'ValidationError',
            message: 'Gift card already used',
            details: {
              code,
              is_used: true
            }
          }
        }, 400);
      }
      
      // Update gift card with explicit code to prevent it from being regenerated
      await strapi.documents('api::gift-card.gift-card').update({
        documentId: giftCard.documentId,
        data: {
          is_used: true,
          code: giftCard.code, // Explicitly preserve the code field
        },
      });
      
      // Publish changes to make them visible immediately
      await strapi.documents('api::gift-card.gift-card').publish({
        documentId: giftCard.documentId,
      });
      
      // Return updated gift card
      const updatedGiftCard = await strapi.documents('api::gift-card.gift-card').findOne({
        documentId: giftCard.documentId,
        status: 'published',
      });
      
      return ctx.send({
        success: true,
        data: updatedGiftCard,
        message: 'Gift card successfully used'
      });
    } catch (error) {
      console.error('Error using gift card:', error);
      return ctx.send({
        data: null,
        error: {
          status: 500,
          name: 'InternalServerError',
          message: `Error using gift card: ${error.message}`,
          details: {
            error: error.message
          }
        }
      }, 500);
    }
  },
}));