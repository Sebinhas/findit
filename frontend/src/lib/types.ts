export type Role = 'user' | 'admin'
export type ItemType = 'LOST' | 'FOUND'
export type ItemStatus = 'ACTIVE' | 'RESOLVED' | 'CLOSED'
export type ClaimStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'

export interface Profile {
  id: string
  first_name: string
  last_name: string
  role: Role
  avatar_url: string | null
  is_active: boolean
  blocked_reason: string | null
  created_at: string
}

export interface Category { id: string; name: string; slug: string; icon: string | null; is_active: boolean }
export interface Location { id: string; name: string; is_active: boolean }

export interface Item {
  id: string
  user_id: string
  category_id: string
  location_id: string
  location_detail: string | null
  type: ItemType
  title: string
  description: string
  incident_date: string
  image_url: string | null
  custody_info: string | null
  status: ItemStatus
  is_hidden: boolean
  hidden_reason: string | null
  deleted_at: string | null
  created_at: string
  category?: Pick<Category, 'id' | 'name' | 'slug'>
  location?: Pick<Location, 'id' | 'name'>
  owner?: Pick<Profile, 'id' | 'first_name' | 'last_name'>
}

export interface Match {
  id: string
  lost_item_id: string
  found_item_id: string
  score: number
  category_score: number
  keyword_score: number
  location_score: number
  date_score: number
  status: 'ACTIVE' | 'CLOSED'
  lost_owner_dismissed: boolean
  found_owner_dismissed: boolean
  created_at: string
  lost?: Item
  found?: Item
}

export interface Claim {
  id: string
  item_id: string
  requester_id: string
  lost_item_id: string | null
  message: string
  lost_location_detail: string | null
  lost_date: string | null
  ownership_details: string
  status: ClaimStatus
  response_message: string | null
  created_at: string
  item?: Item
  requester?: Pick<Profile, 'id' | 'first_name' | 'last_name'>
  lost_location?: Pick<Location, 'id' | 'name'> | null
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  related_entity_type: string | null
  related_entity_id: string | null
  is_read: boolean
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  item_id: string
  reason: string
  description: string | null
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED'
  resolution_note: string | null
  created_at: string
  item?: Pick<Item, 'id' | 'title' | 'is_hidden'>
  reporter?: Pick<Profile, 'first_name' | 'last_name'>
}
