import { buildUploadConfig, type StrapiEnv } from "./upload";

export default ({ env }: { env: StrapiEnv }) => ({
  upload: buildUploadConfig(env),

  graphql: {
    config: {
      endpoint: "/graphql",
      shadowCRUD: true,
      playgroundAlways: true,
      depthLimit: 10,
      amountLimit: 100,
      apolloServer: {
        tracing: false,
        introspection: true,
      },
    },
  },
});
