/**
 * category controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::category.category', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx)

    const dataWithCount = await Promise.all(
      data.map(async (category) => {
        const categoryWithProducts = await strapi.documents('api::category.category').findOne({
          documentId: category.documentId,
          populate: ['products'],
          status: 'published'
        })
        
        const count = categoryWithProducts?.products?.length || 0
        
        return {
          ...category,
          count,
        }
      }),
    )

    return { data: dataWithCount, meta }
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx)
    const category = response.data

    const categoryWithProducts = await strapi.documents('api::category.category').findOne({
      documentId: category.documentId,
      populate: ['products'],
      status: 'published'
    })
    
    const count = categoryWithProducts?.products?.length || 0

    return {
      ...response,
      data: {
        ...category,
        count,
      },
    }
  },
}))
