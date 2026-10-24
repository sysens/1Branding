// The twelve services, shared by the landing's "One partner. Every solution."
// list and the header's Services menu. Names, descriptions and taglines live in
// i18n under home.services.items.<id>; the pictures are stand-ins from our own
// projects until dedicated ones exist; `icon` is an SVG path in a 24px box;
// `page` is the service's own page (utils/servicePages.ts).
import type { ServiceKey } from "./servicePages";

export interface ServiceEntry {
  id: string;
  page: ServiceKey;
  image: string;
  icon: string;
}

export const SERVICE_CATALOG: readonly ServiceEntry[] = [
  { id: "01", page: "strategy", image: "/home/threeLayerLocal/15.webp", icon: "M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8-8-8Zm4.5-4.5h.01" },
  { id: "02", page: "branding", image: "/home/threeLayerLocal/14.webp", icon: "M12 3 4 7l8 4 8-4-8-4Zm-8 9 8 4 8-4M4 17l8 4 8-4" },
  { id: "03", page: "packaging", image: "/home/w1280/Quaker.webp", icon: "M4 8l8-4 8 4v8l-8 4-8-4V8Zm0 0 8 4 8-4M12 12v8" },
  { id: "04", page: "print", image: "/home/threeLayerLocal/36.webp", icon: "M7 8V4h10v4M5 8h14a1 1 0 0 1 1 1v6h-3M7 15H4V9a1 1 0 0 1 1-1M7 12h10v8H7v-8Z" },
  { id: "05", page: "social", image: "/home/threeLayerLocal/33.webp", icon: "M20 12a8 8 0 0 1-11.6 7.1L4 20l.9-4.4A8 8 0 1 1 20 12ZM8.5 12h.01M12 12h.01M15.5 12h.01" },
  { id: "06", page: "photo", image: "/home/threeLayerLocal/22.webp", icon: "M4 8a1 1 0 0 1 1-1h3l1.5-2h5L16 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Zm8 8.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" },
  { id: "07", page: "motion", image: "/home/threeLayerLocal/12.webp", icon: "M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Zm0 9 8-4.5M12 12v9M12 12 4 7.5" },
  { id: "08", page: "presentation", image: "/home/threeLayerLocal/19.webp", icon: "M3 4h18M5 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4M12 15v3M8 21l4-3 4 3M9 11l2-2 2 2 3-3" },
  { id: "09", page: "web", image: "/home/threeLayerLocal/28.webp", icon: "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm0 3h18M6 6.5h.01M8.5 6.5h.01" },
  { id: "10", page: "uiux", image: "/home/threeLayerLocal/39.webp", icon: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 15h2" },
  { id: "11", page: "crm", image: "/home/Frame331.jpg", icon: "M12 5.5a2 2 0 1 0 0-.01M5 18.5a2 2 0 1 0 0-.01M19 18.5a2 2 0 1 0 0-.01M10.5 7 6.5 16.5M13.5 7l4 9.5M7 18.5h10" },
  { id: "12", page: "signage", image: "/home/scene.jpg", icon: "M4 5h16v9H4V5Zm8 9v6M8 20h8M7 8h6M7 11h4" },
];
