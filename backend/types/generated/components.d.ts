import type { Schema, Struct } from '@strapi/strapi';

export interface AboutPageCoreIdea extends Struct.ComponentSchema {
  collectionName: 'components_about_page_core_ideas';
  info: {
    displayName: 'CoreIdea';
  };
  attributes: {
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface AboutPageCreators extends Struct.ComponentSchema {
  collectionName: 'components_about_page_creators';
  info: {
    displayName: 'Creators';
  };
  attributes: {
    creatorsImages: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    subTitle: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface AboutPageTeamSection extends Struct.ComponentSchema {
  collectionName: 'components_about_page_team_sections';
  info: {
    displayName: 'TeamSection';
  };
  attributes: {
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    title: Schema.Attribute.String;
  };
}

export interface ContactsPageContactInfo extends Struct.ComponentSchema {
  collectionName: 'components_contacts_page_contact_infos';
  info: {
    displayName: 'ContactInfo';
  };
  attributes: {
    phoneNumber: Schema.Attribute.String;
    websiteUrl: Schema.Attribute.String;
  };
}

export interface ContactsPageDownloadBrief extends Struct.ComponentSchema {
  collectionName: 'components_contacts_page_download_briefs';
  info: {
    displayName: 'DownloadBrief';
  };
  attributes: {
    file: Schema.Attribute.Media<'files' | 'images' | 'videos'>;
    text: Schema.Attribute.Text;
  };
}

export interface ContactsPageLocation extends Struct.ComponentSchema {
  collectionName: 'components_contacts_page_locations';
  info: {
    displayName: 'Location';
  };
  attributes: {
    location: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface ContactsPageNote extends Struct.ComponentSchema {
  collectionName: 'components_contacts_page_notes';
  info: {
    displayName: 'Note';
  };
  attributes: {
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface ContactsPageSection1 extends Struct.ComponentSchema {
  collectionName: 'components_contacts_page_section1s';
  info: {
    description: 'Address, hours, phone, website, note and the brief file.';
    displayName: 'Contacts: Main info';
  };
  attributes: {
    contactInfo: Schema.Attribute.Component<
      'contacts-page.contact-info',
      false
    >;
    downloadBrief: Schema.Attribute.Component<
      'contacts-page.download-brief',
      false
    >;
    location: Schema.Attribute.Component<'contacts-page.location', false>;
    note: Schema.Attribute.Component<'contacts-page.note', false>;
    title: Schema.Attribute.String;
    workingHours: Schema.Attribute.Component<
      'contacts-page.working-hours',
      false
    >;
  };
}

export interface ContactsPageSection2 extends Struct.ComponentSchema {
  collectionName: 'components_contacts_page_section2s';
  info: {
    description: 'Title and text above the contact form.';
    displayName: 'Contacts: Form heading';
  };
  attributes: {
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface ContactsPageWorkingHours extends Struct.ComponentSchema {
  collectionName: 'components_contacts_page_working_hours';
  info: {
    displayName: 'WorkingHours';
  };
  attributes: {
    hour: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface FooterSocialMediaLinks extends Struct.ComponentSchema {
  collectionName: 'components_footer_social_media_links';
  info: {
    displayName: 'SocialMediaLinks';
  };
  attributes: {
    behanceLink: Schema.Attribute.String;
    instagramLink: Schema.Attribute.String;
    linkedinLink: Schema.Attribute.String;
    telegramLink: Schema.Attribute.String;
  };
}

export interface LandingPageBrandCollage extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_brand_collages';
  info: {
    displayName: 'BrandCollage';
  };
  attributes: {
    row1: Schema.Attribute.Media<'images', true>;
    row2: Schema.Attribute.Media<'images', true>;
    row3: Schema.Attribute.Media<'images', true>;
  };
}

export interface LandingPageBrandPositioning extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_brand_positionings';
  info: {
    displayName: 'BrandPositioning';
  };
  attributes: {
    subTitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface LandingPageDesignElCards extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_design_el_cards';
  info: {
    displayName: 'DesignElCards';
  };
  attributes: {
    description: Schema.Attribute.String;
    icon: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    title: Schema.Attribute.String;
  };
}

export interface LandingPageDesignElements extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_design_elements';
  info: {
    displayName: 'DesignElements';
  };
  attributes: {
    cards: Schema.Attribute.Component<'landing-page.design-el-cards', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 3;
          min: 3;
        },
        number
      >;
    title: Schema.Attribute.String;
  };
}

export interface LandingPageHeroSlogan extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_hero_slogans';
  info: {
    displayName: 'HeroSlogan';
  };
  attributes: {
    accentText: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    mainText: Schema.Attribute.String;
    mutedText: Schema.Attribute.Text;
    scrollEyebrowText: Schema.Attribute.String;
    scrollHeadlineText: Schema.Attribute.String;
  };
}

export interface LandingPageInfo extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_infos';
  info: {
    displayName: 'Info';
  };
  attributes: {
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    text1: Schema.Attribute.String;
    text2: Schema.Attribute.String;
  };
}

export interface LandingPagePartner extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_partners';
  info: {
    displayName: 'Partner';
  };
  attributes: {
    partnersLogo: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
  };
}

export interface LandingPageSection9 extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_section9s';
  info: {
    description: 'Not used by the current landing.';
    displayName: 'Landing: Section 9 (not shown)';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    title: Schema.Attribute.String;
  };
}

export interface LandingPageSplineRobot extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_spline_robots';
  info: {
    displayName: 'SplineRobot';
  };
  attributes: {
    description: Schema.Attribute.Text;
    sceneUrl: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface LandingPageStats extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_stats';
  info: {
    displayName: 'Stats';
  };
  attributes: {
    countImage: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface OneGuaranteePageComments extends Struct.ComponentSchema {
  collectionName: 'components_one_guarantee_page_comments';
  info: {
    displayName: 'Comment';
  };
  attributes: {
    authorFullName: Schema.Attribute.String;
    authorPosition: Schema.Attribute.String;
    authorQuote: Schema.Attribute.Text;
  };
}

export interface OneGuaranteePageCommentsSection
  extends Struct.ComponentSchema {
  collectionName: 'components_one_guarantee_page_comments_sections';
  info: {
    displayName: 'CommentsSection';
  };
  attributes: {
    comment: Schema.Attribute.Component<'one-guarantee-page.comments', true>;
    subTitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface OneGuaranteePageEffective extends Struct.ComponentSchema {
  collectionName: 'components_one_guarantee_page_effectives';
  info: {
    displayName: 'Effective';
  };
  attributes: {
    title: Schema.Attribute.String;
    whyItWorks: Schema.Attribute.Component<
      'one-guarantee-page.why-it-works',
      true
    >;
  };
}

export interface OneGuaranteePageGuarantee extends Struct.ComponentSchema {
  collectionName: 'components_one_guarantee_page_guarantees';
  info: {
    displayName: 'Guarantee';
  };
  attributes: {
    text1: Schema.Attribute.String;
    text2: Schema.Attribute.String;
    text3: Schema.Attribute.String;
    text4: Schema.Attribute.String;
    text5: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface OneGuaranteePageSection6 extends Struct.ComponentSchema {
  collectionName: 'components_one_guarantee_page_section6s';
  info: {
    description: 'Title, text and button at the end of the One Guarantee page.';
    displayName: 'Guarantee: Call to action';
  };
  attributes: {
    buttonText: Schema.Attribute.String;
    buttonUrl: Schema.Attribute.String;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface OneGuaranteePageWhyItWorks extends Struct.ComponentSchema {
  collectionName: 'components_one_guarantee_page_why_it_works';
  info: {
    displayName: 'WhyItWorks';
  };
  attributes: {
    checkMark: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    text: Schema.Attribute.String;
  };
}

export interface PriceForCustomers extends Struct.ComponentSchema {
  collectionName: 'components_price_for_customers';
  info: {
    displayName: 'ForCustomers';
  };
  attributes: {
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface PricePricing extends Struct.ComponentSchema {
  collectionName: 'components_price_pricings';
  info: {
    displayName: 'Pricing';
  };
  attributes: {
    description: Schema.Attribute.Text;
    oldPrice: Schema.Attribute.String;
    price: Schema.Attribute.String;
    priceText: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface ProjectsPageBrandSystem extends Struct.ComponentSchema {
  collectionName: 'components_projects_page_brand_systems';
  info: {
    description: "Below the cover picture: an illustration beside a short statement (one line each, **stars** around the green words, otherwise each line's first word is green), then a heading and its paragraph. Empty fields show the site's own copy.";
    displayName: 'Project: Brand system';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    statement: Schema.Attribute.Text;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface ProjectsPageColorCard extends Struct.ComponentSchema {
  collectionName: 'components_projects_page_color_cards';
  info: {
    displayName: 'ColorCard';
  };
  attributes: {
    HexColorCode: Schema.Attribute.String;
  };
}

export interface ProjectsPageColorPalette extends Struct.ComponentSchema {
  collectionName: 'components_projects_page_color_palettes';
  info: {
    displayName: 'ColorPalette';
  };
  attributes: {
    colorCard: Schema.Attribute.Component<'projects-page.color-card', true>;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface ProjectsPageHeroSection extends Struct.ComponentSchema {
  collectionName: 'components_projects_page_hero_sections';
  info: {
    displayName: 'Hero section';
  };
  attributes: {
    images: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    projectTitle: Schema.Attribute.String;
    text: Schema.Attribute.Text;
  };
}

export interface ProjectsPageSection2 extends Struct.ComponentSchema {
  collectionName: 'components_projects_page_section2s';
  info: {
    description: 'Story block of a project page.';
    displayName: 'Project: Text and image';
  };
  attributes: {
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface ProjectsPageTag extends Struct.ComponentSchema {
  collectionName: 'components_projects_page_tags';
  info: {
    displayName: 'Tag';
  };
  attributes: {
    label: Schema.Attribute.String;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: "Page title and meta description. Short or placeholder text is ignored and the site's own copy is used.";
    displayName: 'SEO';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'about-page.core-idea': AboutPageCoreIdea;
      'about-page.creators': AboutPageCreators;
      'about-page.team-section': AboutPageTeamSection;
      'contacts-page.contact-info': ContactsPageContactInfo;
      'contacts-page.download-brief': ContactsPageDownloadBrief;
      'contacts-page.location': ContactsPageLocation;
      'contacts-page.note': ContactsPageNote;
      'contacts-page.section1': ContactsPageSection1;
      'contacts-page.section2': ContactsPageSection2;
      'contacts-page.working-hours': ContactsPageWorkingHours;
      'footer.social-media-links': FooterSocialMediaLinks;
      'landing-page.brand-collage': LandingPageBrandCollage;
      'landing-page.brand-positioning': LandingPageBrandPositioning;
      'landing-page.design-el-cards': LandingPageDesignElCards;
      'landing-page.design-elements': LandingPageDesignElements;
      'landing-page.hero-slogan': LandingPageHeroSlogan;
      'landing-page.info': LandingPageInfo;
      'landing-page.partner': LandingPagePartner;
      'landing-page.section9': LandingPageSection9;
      'landing-page.spline-robot': LandingPageSplineRobot;
      'landing-page.stats': LandingPageStats;
      'one-guarantee-page.comments': OneGuaranteePageComments;
      'one-guarantee-page.comments-section': OneGuaranteePageCommentsSection;
      'one-guarantee-page.effective': OneGuaranteePageEffective;
      'one-guarantee-page.guarantee': OneGuaranteePageGuarantee;
      'one-guarantee-page.section6': OneGuaranteePageSection6;
      'one-guarantee-page.why-it-works': OneGuaranteePageWhyItWorks;
      'price.for-customers': PriceForCustomers;
      'price.pricing': PricePricing;
      'projects-page.brand-system': ProjectsPageBrandSystem;
      'projects-page.color-card': ProjectsPageColorCard;
      'projects-page.color-palette': ProjectsPageColorPalette;
      'projects-page.hero-section': ProjectsPageHeroSection;
      'projects-page.section2': ProjectsPageSection2;
      'projects-page.tag': ProjectsPageTag;
      'shared.seo': SharedSeo;
    }
  }
}
