/**
 * product controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::product.product', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx)
    const user = ctx.state.user

    if (user && data && Array.isArray(data)) {
      // Get all wishlist products for this user
      const wishlistProducts = await strapi.documents('api::product.product').findMany({
        filters: {
          users: {
            documentId: user.documentId
          }
        },
        status: 'published'
      })

      const wishlistIds = new Set(wishlistProducts.map(product => product.documentId))

      // Add inWishlist field to each product
      const dataWithWishlist = data.map((product: any) => ({
        ...product,
        inWishlist: wishlistIds.has(product.documentId)
      }))

      return { data: dataWithWishlist, meta }
    }

    // If no user, set inWishlist to false for all
    const dataWithWishlist = Array.isArray(data)
      ? data.map((product: any) => ({ ...product, inWishlist: false }))
      : data

    return { data: dataWithWishlist, meta }
  },

  async findOne(ctx) {
    const { data } = await super.findOne(ctx)
    const user = ctx.state.user

    if (user && data) {
      // Check if this product is in user's wishlist
      const wishlistProduct = await strapi.documents('api::product.product').findOne({
        documentId: data.documentId,
        filters: {
          users: {
            documentId: user.documentId
          }
        },
        status: 'published'
      })

      return {
        data: {
          ...data,
          inWishlist: !!wishlistProduct
        }
      }
    }

    return {
      data: {
        ...data,
        inWishlist: false
      }
    }
  },

  async getWishlistProducts(ctx) {
    try {
      const user = ctx.state.user
      if (!user) {
        return ctx.send({
          data: null,
          error: {
            status: 401,
            name: 'UnauthorizedError',
            message: 'Authentication required',
            details: {}
          }
        }, 401)
      }

      // Get user's wishlist products
      const products = await strapi.documents('api::product.product').findMany({
        filters: {
          users: {
            documentId: user.documentId
          }
        },
        populate: {
          gallery: true,
          category: true,
          collection: true,
          variants: {
            populate: {
              size: true,
              color: true,
              images: true
            }
          }
        },
        status: 'published'
      })

      return ctx.send({
        success: true,
        data: products,
        message: 'Wishlist products successfully retrieved'
      })
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      return ctx.send({
        data: null,
        error: {
          status: 500,
          name: 'InternalServerError',
          message: `Error fetching wishlist: ${error.message}`,
          details: {
            error: error.message
          }
        }
      }, 500)
    }
  },

  async addToWishlist(ctx) {
    try {
      const user = ctx.state.user
      if (!user) {
        return ctx.send({
          data: null,
          error: {
            status: 401,
            name: 'UnauthorizedError',
            message: 'Authentication required',
            details: {}
          }
        }, 401)
      }

      const productId = ctx.params.productId
      console.log('productId from params (add):', productId)

      // Validate productId
      if (!productId) {
        return ctx.send({
          data: null,
          error: {
            status: 400,
            name: 'ValidationError',
            message: 'Product ID is required',
            details: {
              field: 'productId',
              value: productId
            }
          }
        }, 400)
      }

      // Find the product
      const product = await strapi.documents('api::product.product').findOne({
        documentId: productId,
        status: 'published'
      })

      if (!product) {
        return ctx.send({
          data: null,
          error: {
            status: 404,
            name: 'NotFoundError',
            message: 'Product not found',
            details: {
              productId
            }
          }
        }, 404)
      }

      // Check if product is already in wishlist
      const existingProduct = await strapi.documents('api::product.product').findOne({
        documentId: productId,
        filters: {
          users: {
            documentId: user.documentId
          }
        },
        status: 'published'
      })

      if (existingProduct) {
        return ctx.send({
          success: true,
          data: product,
          message: 'Product already in wishlist'
        })
      }

      // Add product to user's wishlist
      await strapi.documents('api::product.product').update({
        documentId: productId,
        data: {
          users: {
            connect: [user.documentId]
          }
        }
      })

      // Publish changes to make them visible immediately
      await strapi.documents('api::product.product').publish({ documentId: productId })

      // Return updated product
      const updatedProduct = await strapi.documents('api::product.product').findOne({
        documentId: productId,
        populate: {
          gallery: true,
          category: true,
          collection: true,
          variants: {
            populate: {
              size: true,
              color: true,
              images: true
            }
          }
        },
        status: 'published'
      })

      return ctx.send({
        success: true,
        data: updatedProduct,
        message: 'Product successfully added to wishlist'
      })
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      return ctx.send({
        data: null,
        error: {
          status: 500,
          name: 'InternalServerError',
          message: `Error adding to wishlist: ${error.message}`,
          details: {
            error: error.message
          }
        }
      }, 500)
    }
  },

  async removeFromWishlist(ctx) {
    try {
      const user = ctx.state.user
      if (!user) {
        return ctx.send({
          data: null,
          error: {
            status: 401,
            name: 'UnauthorizedError',
            message: 'Authentication required',
            details: {}
          }
        }, 401)
      }

      const productId = ctx.params.productId
      console.log('productId from params:', productId)
      
      // Validate productId
      if (!productId) {
        return ctx.send({
          data: null,
          error: {
            status: 400,
            name: 'ValidationError',
            message: 'Product ID is required',
            details: {
              field: 'productId',
              value: productId
            }
          }
        }, 400)
      }

      // Check if product is in wishlist
      const product = await strapi.documents('api::product.product').findOne({
        documentId: productId,
        filters: {
          users: {
            documentId: user.documentId
          }
        },
        status: 'published'
      })

      if (!product) {
        return ctx.send({
          data: null,
          error: {
            status: 404,
            name: 'NotFoundError',
            message: 'Product not found in wishlist',
            details: {
              productId
            }
          }
        }, 404)
      }

      // Remove product from user's wishlist
      await strapi.documents('api::product.product').update({
        documentId: productId,
        data: {
          users: {
            disconnect: [user.documentId]
          }
        }
      })

      // Publish changes to make them visible immediately
      await strapi.documents('api::product.product').publish({ documentId: productId })

      return ctx.send({
        success: true,
        data: null,
        message: 'Product successfully removed from wishlist'
      })
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      return ctx.send({
        data: null,
        error: {
          status: 500,
          name: 'InternalServerError',
          message: `Error removing from wishlist: ${error.message}`,
          details: {
            error: error.message
          }
        }
      }, 500)
    }
  }
}));
