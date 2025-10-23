/**
 * address controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::address.address', ({ strapi }) => ({
  async findMyAddresses(ctx) {
    const user = ctx.state.user
    if (!user) {
      return ctx.unauthorized('Необходима авторизация')
    }

    const addresses = await strapi.documents('api::address.address').findMany({
      filters: {
        user: {
          documentId: user.documentId || user.id,
        },
      },
      status: 'published',
    })

    return ctx.send({
      success: true,
      data: addresses,
      message: 'Адреса успешно получены',
    })
  },

  async addAddress(ctx) {
    const user = ctx.state.user
    if (!user) {
      return ctx.unauthorized('Необходима авторизация')
    }

    const { label } = ctx.request.body

    const address = await strapi.documents('api::address.address').create({
      data: {
        user: user.id,
        label,
      },
      status: 'published',
    })

    return ctx.send({
      success: true,
      data: address,
      message: 'Адрес успешно добавлен',
    })
  }
}))
