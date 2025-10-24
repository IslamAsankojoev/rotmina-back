import { factories } from '@strapi/strapi'
import { SUCCESS_CODES, getPaymentErrorMessage } from '../../../constants/payment-error-codes'

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async makeOrder(ctx) {
    try {
      const { items, totalPrice, addressId, payment_method, payment_status, notes, currency_code } =
        ctx.request.body

      if (!items || !Array.isArray(items) || items.length === 0) {
        return ctx.badRequest('Cart is empty')
      }

      if (!addressId) {
        return ctx.badRequest('Shipping address is required')
      }

      const address = await strapi.documents('api::address.address').findOne({
        documentId: addressId,
      })

      if (!address) {
        return ctx.badRequest('Shipping address not found')
      }

      const user = ctx.state.user
      if (!user) {
        return ctx.unauthorized('Authentication required')
      }

      const orderData = {
        users_permissions_user: user.documentId,
        total_amount: parseInt(totalPrice.toString()),
        order_status: 'pending' as const,
        shipping_address: address.documentId,
        billing_address: address.documentId,
        payment_method: payment_method as 'cash' | 'card',
        payment_status: payment_status as 'unpaid' | 'paid' | 'refunded' | 'partially_refunded',
        notes: notes as string,
        order_id: crypto.randomUUID(),
        currency_code,
      }

      const order = await strapi.documents('api::order.order').create({
        data: orderData,
        status: 'published',
      })

      const orderItems = []

      for (const item of items) {
        let orderItemData: any = {
          order: { connect: [order.documentId] },
          quantity: item.quantity,
          subtotal: parseFloat(item.price.toString()) * item.quantity,
        }

        switch (item.type) {
          case 'giftcard':
            // Create gift-card
            const giftCardData = {
              recipientsName: item.recipientName,
              recipientsEmail: item.recipientEmail,
              personalMessage: item.message,
              amount: parseInt(item.amount),
            }

            const giftCard = await strapi.documents('api::gift-card.gift-card').create({
              data: giftCardData,
              status: 'published',
            })

            orderItemData.gift_card = { connect: [giftCard.documentId] }
            orderItemData.title_snapshot = `Gift card for ${item.amount} rub.`
            orderItemData.sku_snapshot = `GIFT-${giftCard.code}`
            orderItemData.price_snapshot = item.amount.toString()
            orderItemData.type = 'giftcard'
            break

          case 'personalStylist':
            // Create personal-stylist
            const sessionType = item.sessionType === 'in-person' ? 'at-your-home' : 'online'
            const personalStylistData = {
              minutes: item.duration,
              price: item.price,
              sessionType: sessionType as 'online' | 'at-your-home',
            }

            const personalStylist = await strapi
              .documents('api::personal-stylist.personal-stylist')
              .create({
                data: personalStylistData,
                status: 'published',
              })

            orderItemData.personal_stylist = { connect: [personalStylist.documentId] }
            orderItemData.title_snapshot = `Personal stylist (${item.sessionType})`
            orderItemData.sku_snapshot = `STYLIST-${personalStylist.id}`
            orderItemData.price_snapshot = item.price.toString()
            orderItemData.type = 'personalStylist'
            break

          case 'product':
            // For products use existing variant
            orderItemData.variant = { connect: [item.variant.documentId] }
            orderItemData.title_snapshot = item.productTitle
            orderItemData.sku_snapshot = item.variant.sku
            orderItemData.price_snapshot = item.price.toString()
            orderItemData.type = 'product'
            break

          default:
            throw new Error(`Unknown item type: ${item.type}`)
        }

        // Create order-item
        const orderItem = await strapi.documents('api::order-item.order-item').create({
          data: orderItemData,
          status: 'published',
        })

        orderItems.push(orderItem)
      }

      // Return created order with items
      const createdOrder = await strapi.documents('api::order.order').findOne({
        documentId: order.documentId,
        populate: {
          order_items: {
            populate: {
              gift_card: true,
              personal_stylist: true,
              variant: {
                populate: {
                  product: true,
                  size: true,
                  color: true,
                },
              },
            },
          },
          shipping_address: true,
          billing_address: true,
          users_permissions_user: true,
        },
      })

      return ctx.send({
        success: true,
        data: createdOrder,
        message: 'Order successfully created',
      })
    } catch (error) {
      console.error('Error creating order:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        body: ctx.request.body,
      })
      return ctx.internalServerError(`Error creating order: ${error.message}`)
    }
  },
  async findMyOrders(ctx) {
    try {
      const user = ctx.state.user
      if (!user) {
        return ctx.unauthorized('Authentication required')
      }

      const orders = await strapi.documents('api::order.order').findMany({
        filters: {
          users_permissions_user: {
            id: user.id,
          },
        },
        populate: {
          order_items: {
            populate: {
              variant: {
                populate: {
                  images: true,
                },
              },
            },
          },
        },
        status: 'published',
      })

      return ctx.send({
        success: true,
        data: orders,
        message: 'Orders successfully retrieved',
      })
    } catch (error) {
      console.error('Error fetching orders:', error)
      return ctx.internalServerError(`Error fetching orders: ${error.message}`)
    }
  },
}))