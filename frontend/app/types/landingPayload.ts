export type AppLocale = "ru" | "en";

export type LandingMedia = {
  url?: string | null;
  createdAt?: string | null;
  alternativeText?: string | null;
  caption?: string | null;
  formats?: Partial<Record<"thumbnail" | "small" | "medium" | "large", {
    url: string;
    width: number;
    height: number;
  }>> | null;
};

export type LandingHeroSlogan = {
  mutedText?: string | null;
  mainText?: string | null;
  accentText?: string | null;
};

export type LandingSection2 = {
  title?: string | null;
  description?: string | null;
};

export type LandingSection3 = {
  partnersLogo?: LandingMedia[] | null;
};

export type LandingSection5Item = {
  title?: string | null;
  subTitle?: string | null;
};

export type LandingSection10Block = {
  title?: string | null;
  description?: string | null;
  image?: LandingMedia | null;
};

export type LandingBrandCollage = {
  row1?: LandingMedia[] | null;
  row2?: LandingMedia[] | null;
  row3?: LandingMedia[] | null;
};

export type LandingSplineRobot = {
  title?: string | null;
  description?: string | null;
  sceneUrl?: string | null;
};

export type FooterSocialMediaLinks = {
  instagramLink?: string | null;
  behanceLink?: string | null;
  telegramLink?: string | null;
};

export type LandingPageContent = {
  heroSlogan?: LandingHeroSlogan | null;
  slogan?: LandingMedia | null;
  sloganMobile?: LandingMedia | null;
  section2?: LandingSection2 | null;
  section3?: LandingSection3 | null;
  section5?: Array<LandingSection5Item | null> | null;
  section10?: LandingSection10Block | Array<LandingSection10Block | null> | null;
  brandCollage?: LandingBrandCollage | null;
  splineRobot?: LandingSplineRobot | null;
};

export type OneGuaranteeCard = {
  title?: string | null;
  description?: string | null;
  icon?: LandingMedia | null;
};

export type OneGuaranteeSection4 = {
  title?: string | null;
  cards?: OneGuaranteeCard[] | null;
};

export type LandingSeo = {
  title?: string | null;
  description?: string | null;
};

export type LandingPayloadResponse = {
  data?: {
    landingPage?: LandingPageContent | null;
    seo?: {
      landingPage?: LandingSeo | null;
    } | null;
    footer?: {
      socialMedia?: FooterSocialMediaLinks | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};
