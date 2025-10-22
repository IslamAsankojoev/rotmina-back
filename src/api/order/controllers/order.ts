import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async makeOrder(ctx) {
    try {
      const { items, totalItems, totalPrice, addressId, payment_method, payment_status, notes } =
        ctx.request.body

      if (!items || !Array.isArray(items) || items.length === 0) {
        return ctx.badRequest('Корзина пуста')
      }

      if (!addressId) {
        return ctx.badRequest('Необходимо указать адрес доставки')
      }

      // Проверяем существование адреса
      const address = await strapi.documents('api::address.address').findOne({
        documentId: addressId,
      })

      if (!address) {
        return ctx.badRequest('Адрес доставки не найден')
      }

      const user = ctx.state.user
      if (!user) {
        return ctx.unauthorized('Необходима авторизация')
      }

      const orderData = {
        users_permissions_user: user.documentId,
        total_amount: parseInt(totalPrice.toString()),
        order_status: 'pending' as const,
        shipping_address: address.documentId,
        payment_method: payment_method as 'cash' | 'card',
        payment_status: payment_status as 'unpaid' | 'paid' | 'refunded' | 'partially_refunded',
        notes: notes as string,
      }

      console.log('Создаем заказ с данными:', orderData)

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
            // Создаем gift-card
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
            orderItemData.title_snapshot = `Подарочная карта на ${item.amount} руб.`
            orderItemData.sku_snapshot = `GIFT-${giftCard.code}`
            orderItemData.price_snapshot = item.amount.toString()
            break

          case 'personalStylist':
            // Создаем personal-stylist
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
            orderItemData.title_snapshot = `Персональный стилист (${item.sessionType})`
            orderItemData.sku_snapshot = `STYLIST-${personalStylist.id}`
            orderItemData.price_snapshot = item.price.toString()
            break

          case 'product':
            // Для продуктов используем существующий variant
            orderItemData.variant = { connect: [item.variant.documentId] }
            orderItemData.title_snapshot = item.productTitle
            orderItemData.sku_snapshot = item.variant.sku
            orderItemData.price_snapshot = item.price.toString()
            break

          default:
            throw new Error(`Неизвестный тип товара: ${item.type}`)
        }

        // Создаем order-item
        const orderItem = await strapi.documents('api::order-item.order-item').create({
          data: orderItemData,
          status: 'published',
        })

        orderItems.push(orderItem)
      }

      // Возвращаем созданный заказ с элементами
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
        message: 'Заказ успешно создан',
      })
    } catch (error) {
      console.error('Ошибка при создании заказа:', error)
      console.error('Детали ошибки:', {
        message: error.message,
        stack: error.stack,
        body: ctx.request.body,
      })
      return ctx.internalServerError(`Ошибка при создании заказа: ${error.message}`)
    }
  },
  async findMyOrders(ctx) {
    try {
      const user = ctx.state.user
      if (!user) {
        return ctx.unauthorized('Необходима авторизация')
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
                  product: true,
                },
              },
            },
          },
        },
      })

      return ctx.send({
        success: true,
        data: orders,
        message: 'Заказы успешно получены',
      })
    } catch (error) {
      console.error('Ошибка при получении заказов:', error)
      return ctx.internalServerError(`Ошибка при получении заказов: ${error.message}`)
    }
  },
}))
