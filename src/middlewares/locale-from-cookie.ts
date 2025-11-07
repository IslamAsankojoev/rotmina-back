/**
 * Middleware для автоматического определения locale из cookies
 * Если в cookies есть locale и в query параметрах его нет, добавляет его
 * Поддерживает имена cookies: 'locale', 'strapi-locale'
 */
export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Читаем locale из cookies (пробуем разные варианты имен)
    const localeFromCookie = 
      ctx.cookies.get('locale') || 
      ctx.cookies.get('strapi-locale');
    
    // Если locale есть в cookies и его нет в query параметрах, добавляем его
    if (localeFromCookie && !ctx.query.locale) {
      ctx.query.locale = localeFromCookie;
    }
    
    await next();
  };
};

