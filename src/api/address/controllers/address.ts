/**
 * address controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::address.address', ({ strapi }) => ({
  async findMyAddresses(ctx) {
    const user = ctx.state.user
    if (!user) {
      return ctx.unauthorized('Authentication required')
    }

    try {
      const addresses = await strapi.documents('api::address.address').findMany({
        filters: {
          user: {
            documentId: user.documentId,
          },
        },
        status: 'published',
      })

      return ctx.send({
        success: true,
        data: addresses,
        message: 'Addresses successfully retrieved',
      })
    } catch (error) {
      console.error('Error fetching addresses:', error)
      return ctx.send({
        data: null,
        error: {
          status: 500,
          name: 'InternalServerError',
          message: `Error fetching addresses: ${error.message}`,
          details: {
            error: error.message
          }
        }
      }, 500)
    }
  },

  async addAddress(ctx) {
    const user = ctx.state.user
    if (!user) {
      return ctx.unauthorized('Authentication required')
    }

    const { address, city, zip_code } = ctx.request.body

    // Validate required fields
    if (!address) {
      return ctx.send({
        data: null,
        error: {
          status: 400,
          name: 'ValidationError',
          message: 'Address is required',
          details: {
            field: 'address',
            value: address
          }
        }
      }, 400)
    }
    if (!city) {
      return ctx.send({
        data: null,
        error: {
          status: 400,
          name: 'ValidationError',
          message: 'City is required',
          details: {
            field: 'city',
            value: city
          }
        }
      }, 400)
    }
    if (!zip_code) {
      return ctx.send({
        data: null,
        error: {
          status: 400,
          name: 'ValidationError',
          message: 'Zip code is required',
          details: {
            field: 'zip_code',
            value: zip_code
          }
        }
      }, 400)
    }

    // Check existing addresses count
    const existingAddresses = await strapi.documents('api::address.address').findMany({
      filters: {
        user: {
          documentId: user.documentId,
        },
      },
      status: 'published',
    })

    if (existingAddresses.length >= 2) {
      return ctx.send({
        data: null,
        error: {
          status: 400,
          name: 'ValidationError',
          message: 'You can only have 2 addresses maximum',
          details: {
            current_count: existingAddresses.length,
            max_allowed: 2
          }
        }
      }, 400)
    }

    try {
      const addressData = await strapi.documents('api::address.address').create({
        data: {
          user: user.documentId,
          address,
          city,
          zip_code,
        },
        status: 'published',
      })

      return ctx.send({
        success: true,
        data: addressData,
        message: 'Address successfully added',
      })
    } catch (error) {
      console.error('Error creating address:', error)
      return ctx.send({
        data: null,
        error: {
          status: 500,
          name: 'InternalServerError',
          message: `Error creating address: ${error.message}`,
          details: {
            error: error.message
          }
        }
      }, 500)
    }
  }
}))
