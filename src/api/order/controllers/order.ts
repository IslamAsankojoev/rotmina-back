import { factories } from '@strapi/strapi'

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
            orderItemData.title_snapshot = `Gift card for ${item.gift_card?.recipientsName}.`
            orderItemData.sku_snapshot = `GIFT-${giftCard.code}`
            orderItemData.price_snapshot = item.amount.toString()
            orderItemData.type = 'giftcard'
            break

          case 'personalStylist':
            // Create personal-stylist
            const personalStylist = await strapi.documents('api::personal-stylist.personal-stylist').findOne({
              documentId: item.documentId,
            })

            if (!personalStylist) {
              return ctx.badRequest('Personal stylist not found')
            }

            orderItemData.personal_stylist = { connect: [personalStylist.documentId] }
            orderItemData.title_snapshot = `Personal stylist (${personalStylist.minutes} minutes)`
            orderItemData.sku_snapshot = `STYLIST-${personalStylist.id}`
            orderItemData.price_snapshot = personalStylist.price.toString()
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
  async changeOrderStatus(ctx) {
    try {
      const orderId = ctx.params.orderId || ctx.params.id
      
      if (!orderId) {
        return ctx.badRequest('Order ID is required')
      }

      // Получаем заказ с элементами заказа и вариантами
      const order = await strapi.documents('api::order.order').findOne({
        documentId: orderId,
        populate: {
          order_items: {
            populate: {
              variant: true,
            },
          },
        },
        status: 'published',
      })

      if (!order) {
        return ctx.notFound('Order not found')
      }

      // Обновляем статус оплаты на 'paid'
      await strapi.documents('api::order.order').update({
        documentId: orderId,
        data: {
          payment_status: 'paid',
        },
      })

      // Публикуем заказ, чтобы он не был в статусе "modified"
      await strapi.documents('api::order.order').publish({
        documentId: orderId,
      })

      // Если есть элементы заказа с вариантами, уменьшаем stock
      if (order.order_items && Array.isArray(order.order_items)) {
        for (const orderItem of order.order_items) {
          // Проверяем, что это продукт (есть variant) и variant существует
          if (orderItem.type === 'product' && orderItem.variant) {
            const variant = await strapi.documents('api::variant.variant').findOne({
              documentId: orderItem.variant.documentId,
              status: 'published',
            })

            if (variant && variant.stock !== undefined) {
              const newStock = Math.max(0, variant.stock - orderItem.quantity)
              
              await strapi.documents('api::variant.variant').update({
                documentId: variant.documentId,
                data: {
                  stock: newStock,
                },
              })
            }
          }
        }
      }

      // Возвращаем обновленный заказ
      const updatedOrder = await strapi.documents('api::order.order').findOne({
        documentId: orderId,
        populate: {
          order_items: {
            populate: {
              variant: true,
              gift_card: true,
              personal_stylist: true,
            },
          },
          shipping_address: true,
          billing_address: true,
          users_permissions_user: true,
        },
        status: 'published',
      })

      return ctx.send({
        success: true,
        data: updatedOrder,
        message: 'Order status successfully changed to paid and stock updated',
      })
    } catch (error) {
      console.error('Error changing order status:', error)
      return ctx.internalServerError(`Error changing order status: ${error.message}`)
    }
  },
}))