export interface Event {
  id: string;
  title: string;
  category: string;
  date: string;
  endDate?: string | null;
  time?: string;
  location: string;
  price?: string;
  description?: string;
  descriptionFull?: string;
  imageUrl?: string;
  sourceUrl?: string;
  contacts?: string;
  ticketUrl?: string;
  tags?: string;
  featured?: boolean;
  source?: string;
  organizer?: string;
  ageRating?: string;
  scrapedAt?: string;
  hidden?: boolean;
}
