export default ({ env }) => ({
  documentation: {
    enabled: true,
    config: {
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'Rotmina API Documentation',
        description: 'API документация для Rotmina',
        termsOfService: 'YOUR_TERMS_OF_SERVICE_URL',
        contact: {
          name: 'API Support',
          email: 'support@rotmina.com',
          url: 'https://rotmina.com'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        },
      },
      servers: [
        {
          url: env('API_URL', 'http://localhost:1337/api'),
          description: 'Development server',
        },
      ],
      externalDocs: {
        description: 'Find out more',
        url: 'https://docs.strapi.io/developer-docs/latest/getting-started/introduction.html'
      },
      security: [
        {
          bearerAuth: []
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  },
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
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.gmail.com'),
        port: env.int('SMTP_PORT', 465),
        secure: env.bool('SMTP_SECURE', true),
        auth: {
          user: env('SMTP_USER', 'your-email@example.com'),
          pass: env('SMTP_PASS', 'asdf asdf asdf asdf'),
        },
      },
      settings: {
        defaultFrom: env('EMAIL_FROM', 'your-email@example.com'),
        defaultReplyTo: env('EMAIL_REPLY_TO', 'your-email@example.com'),
      },
    },
  },
  'users-permissions': {
    config: {
      register: {
        allowedFields: ["surname"],
      },
      jwt: {
        expiresIn: '1h',
      },
    },
  },
});