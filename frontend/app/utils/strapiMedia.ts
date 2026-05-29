export const trimTrailingSlash = (value: string): string =>
  value.replace(/\/+$/, "");

export const trimLeadingSlash = (value: string): string =>
  value.replace(/^\/+/, "");

export const joinUrl = (baseUrl: string, path: string): string => {
  const cleanBase = trimTrailingSlash(baseUrl.trim());
  const cleanPath = trimLeadingSlash(path.trim());

  if (!cleanBase) {
    return path;
  }

  return cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
};

export const resolveStrapiMediaUrl = (
  url: string | null | undefined,
  graphqlUrl: string
): string => {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const apiBase = graphqlUrl.replace(/\/graphql\/?$/, "");
  return joinUrl(apiBase, url);
};
