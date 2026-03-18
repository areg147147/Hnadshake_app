export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
    {
      domain: 'https://loving-chow-83.accounts.dev',
      applicationID: 'convex',
    },
    {
      domain: 'https://loving-chow-83.clerk.accounts.dev',
      applicationID: 'convex',
    },
    {
      domain: 'https://clerk.loving-chow-83.accounts.dev',
      applicationID: 'convex',
    },
  ],
}
