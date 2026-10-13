import { createRequire } from 'node:module';

/**
 * Logs at boot whether the R2 bucket can be reached with the configured
 * credentials, so a wrong key shows up in the deploy log rather than as a
 * failed upload in the admin panel. Lists at most one key; never throws.
 */
export const checkUploadStorage = async (strapi: any): Promise<void> => {
  const config = strapi.config.get('plugin::upload') ?? {};
  if (config.provider !== 'aws-s3') {
    strapi.log.warn('[upload] Local disk provider: uploaded files are lost on every redeploy unless a volume is mounted');
    return;
  }
  const { s3Options, rootPath } = config.providerOptions ?? {};
  try {
    // The S3 client the aws-s3 provider itself depends on.
    const load = createRequire(require.resolve('@strapi/provider-upload-aws-s3'));
    const { S3Client, ListObjectsV2Command } = load('@aws-sdk/client-s3');
    const { params, ...clientOptions } = s3Options ?? {};
    const client = new S3Client(clientOptions);
    await client.send(new ListObjectsV2Command({
      Bucket: params?.Bucket,
      MaxKeys: 1,
      ...(rootPath ? { Prefix: `${String(rootPath).replace(/\/+$/, '')}/` } : {}),
    }));
    client.destroy();
    strapi.log.info(`[upload] R2 bucket "${params?.Bucket}" reachable; media go to ${config.providerOptions?.baseUrl}`);
  } catch (error) {
    const name = (error as { name?: string })?.name ?? 'Error';
    const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    // SDK messages name the failure (unknown key, no such bucket, DNS), never the secret.
    const message = String((error as { message?: string })?.message ?? '').slice(0, 160);
    strapi.log.error(`[upload] R2 bucket check failed (${name}${status ? `, HTTP ${status}` : ''}: ${message}): uploads will fail until the R2_* variables are fixed`);
  }
};
