/**
 * The alt text of a landing portfolio picture (/home/threeLayerLocal/<id>.webp,
 * /home/frenk.webp), from i18n `portfolio.p<id>`: what the picture shows, in the
 * page's language. The walls that show them are decorative (aria-hidden), but
 * image search reads the alt; a picture without an entry stays alt="".
 */
export const usePortfolioAlt = () => {
  const { t, te } = useI18n();
  return (src: string) => {
    const id = src.match(/\/([^/]+)\.webp$/)?.[1];
    const key = id ? `portfolio.p${id}` : "";
    return key && te(key) ? t(key) : "";
  };
};
