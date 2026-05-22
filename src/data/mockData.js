// ─── Data placeholders ────────────────────────────────────────────────────────
// Replace each export with a Supabase query:
//   const { data } = await supabase.from('table').select('*').eq('trip_id', TRIP_ID)

export const bride = null

export const participants = []

export const scheduleDays = [
  { id: 'd1', label: 'חמישי', date: 'יוני 6', value: 'thu' },
  { id: 'd2', label: 'שישי',  date: 'יוני 7', value: 'fri' },
  { id: 'd3', label: 'שבת',   date: 'יוני 8', value: 'sat' },
  { id: 'd4', label: 'ראשון', date: 'יוני 9', value: 'sun' },
]

export const scheduleItems = {
  thu: [],
  fri: [],
  sat: [],
  sun: [],
}

export const chatMessages = []

export const savedPlaces = []

export const memories = []
