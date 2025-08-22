export default () => ({
  'strapi-v5-http-only-auth': {
    enabled: true,
    config: {
      cookieOptions: {
        secure: false,
        sameSite: 'Lax',
        domain: 'localhost',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      },
      deleteJwtFromResponse: true,
    },
  },
});