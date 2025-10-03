export default ({ env }) => ({
  'strapi-v5-http-only-auth': {
    enabled: true,
    config: {
      cookieOptions: {
        secure: false,
        sameSite: 'Lax',
        domain: env('ORIGIN', 'localhost'),
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      },
      deleteJwtFromResponse: true,
    },
  },
});