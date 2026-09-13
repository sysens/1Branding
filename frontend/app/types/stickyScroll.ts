export interface StickyScrollItem {
  id: string;
  title: string;
  description: string;
  foreground: string;
  background: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
    variant: "logo" | "artwork";
  };
}
