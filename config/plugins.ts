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
    },
  },
});