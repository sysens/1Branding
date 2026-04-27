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

export interface ContactsPageContact extends Struct.ComponentSchema {
  collectionName: 'components_contacts_page_contacts';
  info: {
    displayName: 'Contact';
  };
  attributes: {
    company: Schema.Attribute.String;
    email: Schema.Attribute.Email;
    fullName: Schema.Attribute.String;
    jobTitle: Schema.Attribute.String;
    phoneNumber: Schema.Attribute.String;
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

export interface ContactsPageRequestedServicesMessage
  extends Struct.ComponentSchema {
  collectionName: 'components_contacts_page_requested_services_messages';
  info: {
    displayName: 'RequestedServicesMessage';
  };
  attributes: {
    file: Schema.Attribute.Media<'files'>;
    input: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface ContactsPageSection1 extends Struct.ComponentSchema {
  collectionName: 'components_contacts_page_section1s';
  info: {
    displayName: 'Section1';
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
    displayName: 'Section2';
  };
  attributes: {
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface ContactsPageTopic extends Struct.ComponentSchema {
  collectionName: 'components_contacts_page_topics';
  info: {
    displayName: 'Topic';
  };
  attributes: {
    input: Schema.Attribute.Text;
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

export interface ContactsPageWriteToOneBrending extends Struct.ComponentSchema {
  collectionName: 'components_contacts_page_write_to_one_brendings';
  info: {
    displayName: 'WriteToOneBrending';
  };
  attributes: {
    contactsInputs: Schema.Attribute.Component<'contacts-page.contact', false>;
    requestedServicesMessage: Schema.Attribute.Component<
      'contacts-page.requested-services-message',
      false
    >;
    topic: Schema.Attribute.Component<'contacts-page.topic', false>;
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

export interface LandingPageAnswerQuestion extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_answer_questions';
  info: {
    displayName: 'AnswerQuestion';
  };
  attributes: {
    answer: Schema.Attribute.Text;
    question: Schema.Attribute.Text;
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
    cards: Schema.Attribute.Component<'landing-page.design-el-cards', true>;
    title: Schema.Attribute.String;
  };
}

export interface LandingPageFaq extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_faqs';
  info: {
    displayName: 'FAQ';
  };
  attributes: {
    AnswerQuestions: Schema.Attribute.Component<
      'landing-page.answer-question',
      true
    >;
    title: Schema.Attribute.String;
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

export interface LandingPageProjectsImages extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_projects_images';
  info: {
    displayName: 'ProjectsImages';
  };
  attributes: {
    projectsImages: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
  };
}

export interface LandingPageSection9 extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_section9s';
  info: {
    displayName: 'Section9';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    title: Schema.Attribute.String;
  };
}

export interface LandingPageStats extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_stats';
  info: {
    displayName: 'stats';
  };
  attributes: {
    countImage: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface LandingPageTools extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_tools';
  info: {
    displayName: 'Tools';
  };
  attributes: {
    icon: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    name: Schema.Attribute.String;
  };
}

export interface LandingPageWhatWeDo extends Struct.ComponentSchema {
  collectionName: 'components_landing_page_what_we_dos';
  info: {
    displayName: 'WhatWeDo';
  };
  attributes: {
    images: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    title: Schema.Attribute.String;
  };
}

export interface OneGuaranteePageComments extends Struct.ComponentSchema {
  collectionName: 'components_one_guarantee_page_comments';
  info: {
    displayName: 'comments';
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
    displayName: 'section6';
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
    price: Schema.Attribute.String;
    priceText: Schema.Attribute.String;
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
    displayName: 'heroSection';
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
    displayName: 'Section2';
  };
  attributes: {
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SeoAboutPage extends Struct.ComponentSchema {
  collectionName: 'components_seo_about_pages';
  info: {
    displayName: 'AboutPage';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SeoContactsPage extends Struct.ComponentSchema {
  collectionName: 'components_seo_contacts_pages';
  info: {
    displayName: 'ContactsPage';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SeoLandingPage extends Struct.ComponentSchema {
  collectionName: 'components_seo_landing_pages';
  info: {
    displayName: 'LandingPage';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SeoOneGuaranteePage extends Struct.ComponentSchema {
  collectionName: 'components_seo_one_guarantee_pages';
  info: {
    displayName: 'OneGuaranteePage';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SeoPricePage extends Struct.ComponentSchema {
  collectionName: 'components_seo_price_pages';
  info: {
    displayName: 'PricePage';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'about-page.core-idea': AboutPageCoreIdea;
      'about-page.creators': AboutPageCreators;
      'about-page.team-section': AboutPageTeamSection;
      'contacts-page.contact': ContactsPageContact;
      'contacts-page.contact-info': ContactsPageContactInfo;
      'contacts-page.download-brief': ContactsPageDownloadBrief;
      'contacts-page.location': ContactsPageLocation;
      'contacts-page.note': ContactsPageNote;
      'contacts-page.requested-services-message': ContactsPageRequestedServicesMessage;
      'contacts-page.section1': ContactsPageSection1;
      'contacts-page.section2': ContactsPageSection2;
      'contacts-page.topic': ContactsPageTopic;
      'contacts-page.working-hours': ContactsPageWorkingHours;
      'contacts-page.write-to-one-brending': ContactsPageWriteToOneBrending;
      'footer.social-media-links': FooterSocialMediaLinks;
      'landing-page.answer-question': LandingPageAnswerQuestion;
      'landing-page.brand-positioning': LandingPageBrandPositioning;
      'landing-page.design-el-cards': LandingPageDesignElCards;
      'landing-page.design-elements': LandingPageDesignElements;
      'landing-page.faq': LandingPageFaq;
      'landing-page.info': LandingPageInfo;
      'landing-page.partner': LandingPagePartner;
      'landing-page.projects-images': LandingPageProjectsImages;
      'landing-page.section9': LandingPageSection9;
      'landing-page.stats': LandingPageStats;
      'landing-page.tools': LandingPageTools;
      'landing-page.what-we-do': LandingPageWhatWeDo;
      'one-guarantee-page.comments': OneGuaranteePageComments;
      'one-guarantee-page.comments-section': OneGuaranteePageCommentsSection;
      'one-guarantee-page.effective': OneGuaranteePageEffective;
      'one-guarantee-page.guarantee': OneGuaranteePageGuarantee;
      'one-guarantee-page.section6': OneGuaranteePageSection6;
      'one-guarantee-page.why-it-works': OneGuaranteePageWhyItWorks;
      'price.for-customers': PriceForCustomers;
      'price.pricing': PricePricing;
      'projects-page.color-card': ProjectsPageColorCard;
      'projects-page.color-palette': ProjectsPageColorPalette;
      'projects-page.hero-section': ProjectsPageHeroSection;
      'projects-page.section2': ProjectsPageSection2;
      'seo.about-page': SeoAboutPage;
      'seo.contacts-page': SeoContactsPage;
      'seo.landing-page': SeoLandingPage;
      'seo.one-guarantee-page': SeoOneGuaranteePage;
      'seo.price-page': SeoPricePage;
    }
  }
}
