export type BookingStatus = 'pending' | 'accepted' | 'on_way' | 'completed' | 'cancelled' | 'rejected';

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string | null;
  sort: number;
  is_active: boolean;
  providers_count?: number;
};

export type Provider = {
  id: string;
  login: string;
  full_name: string;
  phone: string | null;
  category_id: string | null;
  bio: string | null;
  experience_years: number;
  price_from: number;
  price_unit: string;
  district: string | null;
  avatar_url: string | null;
  telegram_chat_id: number | null;
  is_active: boolean;
  is_available: boolean;
  rating: number;
  reviews_count: number;
  jobs_done: number;
  created_at: string;
  category?: Pick<Category, 'id' | 'name' | 'slug' | 'icon' | 'color'> | null;
};

/** Mini app'ga beriladigan ochiq ma'lumot (login/parol/telegram id'siz) */
export type PublicProvider = Omit<Provider, 'login' | 'telegram_chat_id' | 'is_active' | 'created_at'> & {
  next_slot?: string | null;
};

export type Slot = { id: string; provider_id: string; starts_at: string; ends_at: string; is_booked: boolean };

export type Client = {
  id: string;
  telegram_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  photo_url: string | null;
  is_blocked: boolean;
  created_at: string;
  last_seen_at: string;
};

export type Booking = {
  id: string;
  client_id: string;
  provider_id: string;
  slot_id: string | null;
  scheduled_at: string;
  address: string;
  phone: string;
  note: string | null;
  status: BookingStatus;
  rating: number | null;
  review: string | null;
  created_at: string;
  updated_at: string;
};
