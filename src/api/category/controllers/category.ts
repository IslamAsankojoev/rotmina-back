/**
 * category controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::category.category', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx)
    const locale = (ctx.query.locale as string) || undefined

    const dataWithCount = await Promise.all(
      data.map(async (category) => {
        const categoryWithProducts = await strapi.documents('api::category.category').findOne({
          documentId: category.documentId,
          populate: ['products'],
          locale,
          status: 'published',
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
    const locale = (ctx.query.locale as string) || undefined

    const categoryWithProducts = await strapi.documents('api::category.category').findOne({
      documentId: category.documentId,
      populate: ['products'],
      locale,
      status: 'published',
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

  async findBySlug(ctx) {
    const { slug } = ctx.params

    const category = await strapi.documents('api::category.category').findFirst({
      filters: {
        slug,
      },
      populate: {
        image: true,
      },
      status: 'published',
    })

    const categoryWithProducts = await strapi.documents('api::category.category').findOne({
      documentId: category.documentId,
      populate: {
        products: true,
      },
      status: 'published',
    })

    const count = categoryWithProducts?.products?.length || 0

    if (!category) {
      return ctx.notFound('Category not found')
    }

    return { data: { ...category, count } }
  },
}))
