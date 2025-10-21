/**
 * collection controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::collection.collection', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx)

    const dataWithCount = await Promise.all(
      data.map(async (collection) => {
        const collectionWithProducts = await strapi.documents('api::collection.collection').findOne({
          documentId: collection.documentId,
          populate: ['products'],
          status: 'published'
        })
        
        const count = collectionWithProducts?.products?.length || 0
        
        return {
          ...collection,
          count,
        }
      }),
    )

    return { data: dataWithCount, meta }
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx)
    const collection = response.data

    const collectionWithProducts = await strapi.documents('api::collection.collection').findOne({
      documentId: collection.documentId,
      populate: ['products']
    })
    
    const count = collectionWithProducts?.products?.length || 0

    return {
      ...response,
      data: {
        ...collection,
        count,
      },
    }
  },
}))