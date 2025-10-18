'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
  async create(ctx) {
    const { username, email, password, surname } = ctx.request.body;

    // Валидация обязательных полей
    if (!username || !email || !password) {
      return ctx.badRequest('Username, email и password обязательны');
    }

    try {
      // Создание пользователя
      const user = await strapi.plugins['users-permissions'].services.user.add({
        username,
        email,
        password,
        surname,
        confirmed: true,
      });

      return ctx.send({
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          surname: user.surname,
          confirmed: user.confirmed,
          blocked: user.blocked,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      });
    } catch (error) {
      return ctx.badRequest(error.message);
    }
  },
}));
