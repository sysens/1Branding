import { buildUploadConfig, type StrapiEnv } from "./upload";

export default ({ env }: { env: StrapiEnv }) => ({
  upload: buildUploadConfig(env),

  graphql: {
    config: {
      endpoint: "/graphql",
      shadowCRUD: true,
      landingPage: env.bool("GRAPHQL_PLAYGROUND", false),
      depthLimit: 10,
      defaultLimit: 25,
      maxLimit: 100,
      apolloServer: {
        cors: false, // The global origin allowlist also applies to /graphql.
        introspection: env.bool(
          "GRAPHQL_INTROSPECTION",
          env("NODE_ENV", "development") !== "production"
        ),
      },
    },
  },
});
