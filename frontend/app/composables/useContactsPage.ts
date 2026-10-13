/**
 * The Contacts single type for the whole page (Locations and the contact
 * Form share this query). `fallback` is the English entry, loaded off English.
 */
export type ContactsSection1 = {
  title?: string | null;
  location?: { title?: string | null; location?: string | null } | null;
  workingHours?: { title?: string | null; hour?: string | null } | null;
  contactInfo?: { phoneNumber?: string | null; websiteUrl?: string | null } | null;
  note?: { title?: string | null; text?: string | null } | null;
  downloadBrief?: { text?: string | null; file?: { url?: string | null } | null } | null;
};

export type ContactsPageEntry = {
  section1?: ContactsSection1 | null;
  section2?: { title?: string | null; text?: string | null } | null;
};

const FIELDS = `
  section1 {
    title
    location { title location }
    workingHours { title hour }
    contactInfo { phoneNumber websiteUrl }
    note { title text }
    downloadBrief { text file { url } }
  }
  section2 { title text }
`;

const QUERY = `
  query ContactsPage($locale: I18NLocaleCode, $withFallback: Boolean!) {
    contactsPage(locale: $locale) { ${FIELDS} }
    fallbackContactsPage: contactsPage(locale: "en") @include(if: $withFallback) { ${FIELDS} }
  }
`;

type ContactsPageResponse = {
  contactsPage?: ContactsPageEntry | null;
  fallbackContactsPage?: ContactsPageEntry | null;
};

export const useContactsPage = async () => {
  const { data } = await useCmsQuery<ContactsPageResponse>("contacts-page", QUERY);
  return {
    own: computed(() => data.value?.data?.contactsPage ?? null),
    fallback: computed(() => data.value?.data?.fallbackContactsPage ?? null),
  };
};
