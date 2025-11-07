export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://localhost:3000', process.env.URL || 'http://localhost:3000'],
      credentials: true,
    },
  },
  'strapi::poweredBy',
  'global::locale-from-cookie',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
]
