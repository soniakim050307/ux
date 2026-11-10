export type MomentType = 'photo' | 'video' | 'audio'

export interface Song {
  title: string
  artist: string
}

export interface Moment {
  id: string
  type: MomentType
  note: string
  song: Song | null
  createdAt: number
}

export interface Album {
  id: string
  name: string
  date: string
  moments: Moment[]
}

/** Captured media that has not been pressed into the record yet. */
export interface Draft {
  id: string
  type: MomentType
}

// Song metadata only (no audio playback in this prototype).
export const SONGS: Song[] = [
  { title: 'Paris in the rain', artist: 'Lauv' },
  { title: 'La Vie en Rose', artist: 'Édith Piaf' },
  { title: 'Clair de Lune', artist: 'Claude Debussy' },
  { title: 'Gymnopédie No. 1', artist: 'Erik Satie' },
  { title: 'Summertime', artist: 'Ella Fitzgerald' },
  { title: 'Fly Me To The Moon', artist: 'Frank Sinatra' },
  { title: 'Blue in Green', artist: 'Miles Davis' },
  { title: 'Sunday Morning', artist: 'Maroon 5' },
]

// Album names and dates come from the Figma "main" screen.
export const SEED_ALBUMS: Album[] = [
  { id: 'barcelona', name: 'Barcelona, Spain', date: '2023.08', moments: [] },
  { id: 'newyork', name: 'New York, USA', date: '2023.11', moments: [] },
  { id: 'reykjavik', name: 'Reykjavik, Iceland', date: '2024.02', moments: [] },
  { id: 'bangkok', name: 'Bangkok, Thailand', date: '2024.07', moments: [] },
  { id: 'paris', name: 'Paris, France', date: '2024.12', moments: [] },
  { id: 'kyoto', name: 'Kyoto, Japan', date: '2025.04', moments: [] },
  { id: 'lisbon', name: 'Lisbon, Portugal', date: '2025.06', moments: [] },
  { id: 'jeju', name: 'Jeju, Korea', date: '2025.09', moments: [] },
]
