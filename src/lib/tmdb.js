const API = 'https://api.themoviedb.org/3'
const KEY = import.meta.env.VITE_TMDB_API_KEY?.trim()

export const hasApiKey = Boolean(KEY)

export const IMG = 'https://image.tmdb.org/t/p'
const SIZES = {
  poster: 'w500',
  backdrop: 'w1280',
  thumb: 'w300',
  profile: 'w185',
}

export function imgUrl(path, size = 'poster') {
  if (!path) return null
  return `${IMG}/${SIZES[size] ?? size}${path}`
}

async function fetchJson(path, params = {}) {
  if (!KEY) {
    throw new Error('TMDB_API_KEY_MISSING')
  }
  const qs = new URLSearchParams({ api_key: KEY, ...params })
  const res = await fetch(`${API}${path}?${qs}`)
  if (!res.ok) {
    if (res.status === 401) throw new Error('TMDB_API_KEY_INVALID')
    if (res.status === 429) throw new Error('TMDB_RATE_LIMIT')
    throw new Error(`TMDB_HTTP_${res.status}`)
  }
  return res.json()
}

/* ---------- Public helpers ---------- */
export function getYear(date, key = 'release_date') {
  const d = date?.[key] ?? date
  if (!d) return null
  return String(d).slice(0, 4)
}

export function runtimeLabel(minutes) {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export function rating(n) {
  if (n == null) return null
  return Math.round(n * 10) / 10
}

export function genreNames(ids, genreMap) {
  if (!ids?.length) return []
  return ids.map((id) => genreMap.get(id)).filter(Boolean)
}

/* ---------- Normalizers ---------- */
function mapGenres(list) {
  return new Map((list ?? []).map((g) => [g.id, g.name]))
}

export function normalizeMediaItem(m, mediaType) {
  const type = m.media_type ?? mediaType
  const isMovie = type === 'movie'
  return {
    id: m.id,
    mediaType: type,
    title: isMovie ? m.title : m.name,
    originalTitle: isMovie ? m.original_title : m.original_name,
    year: isMovie ? getYear(m.release_date) : getYear(m.first_air_date, 'first_air_date'),
    rating: rating(m.vote_average),
    voteCount: m.vote_count,
    overview: m.overview,
    poster: imgUrl(m.poster_path),
    backdrop: imgUrl(m.backdrop_path, 'backdrop'),
    genreIds: m.genre_ids ?? m.genres?.map((g) => g.id) ?? [],
    hasVideo: m.video !== undefined ? m.video : true,
  }
}

export function normalizeList(data, mediaType) {
  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    items: (data.results ?? []).map((m) => normalizeMediaItem(m, mediaType)),
  }
}

function mapVideo(v) {
  if (!v || !v.key) return null
  return {
    id: v.id,
    key: v.key,
    name: v.name,
    site: v.site,
    type: v.type,
    official: v.official,
  }
}

export function pickTrailer(videos) {
  const vids = (videos?.results ?? [])
    .map(mapVideo)
    .filter((v) => v && v.site === 'YouTube' && v.key)
  return (
    vids.find((v) => v.type === 'Trailer' && v.official) ||
    vids.find((v) => v.type === 'Trailer') ||
    vids.find((v) => v.type === 'Teaser') ||
    vids[0] ||
    null
  )
}

export function pickBackdrop(item) {
  return item.backdrop || imgUrl(item.poster_path, 'backdrop') || null
}

function mapCredit(person, mediaType) {
  const isMovie = mediaType === 'movie'
  return {
    id: person.id,
    name: person.name,
    character: isMovie ? person.character : person.roles?.[0]?.character ?? person.character,
    job: person.job,
    order: person.order ?? 99,
    photo: imgUrl(person.profile_path, 'profile'),
  }
}

export function extractCredits(mediaType, credits) {
  if (!credits) return { crew: [], cast: [] }
  const crew = (credits.crew ?? []).map((p) => mapCredit(p, mediaType))
  const cast = [...(credits.cast ?? [])]
    .map((p) => mapCredit(p, mediaType))
    .sort((a, b) => a.order - b.order)
    .slice(0, 14)
  const director = crew.find((p) => p.job === 'Director')?.name
  const writers = crew
    .filter((p) => p.job === 'Writer' || p.job === 'Screenplay' || p.job === 'Story')
    .slice(0, 3)
    .map((p) => p.name)
  return { crew, cast, director, writers }
}

export function extractCountry(data, isMovie) {
  if (!data) return null
  if (isMovie) {
    const rc = data.release_dates?.results?.find((r) => r.iso_3166_1 === 'US')
    const cert = rc?.release_dates?.[0]?.certification
    const country = data.production_countries?.[0]?.iso_3166_1 ?? null
    return { country, certification: cert || null }
  }
  const cert = data.content_ratings?.results?.find((r) => r.iso_3166_1 === 'US')?.rating
  return { country: data.origin_country?.[0] ?? null, certification: cert || null }
}

/* ---------- Media detail ---------- */
async function fetchDetail(mediaType, id) {
  const isMovie = mediaType === 'movie'
  const data = await fetchJson(`/${mediaType}/${id}`, {
    append_to_response: 'credits,videos,similar,recommendations,release_dates,content_ratings',
  })
  const country = extractCountry(data, isMovie)
  const { cast, director, writers } = extractCredits(mediaType, data.credits)
  return {
    ...normalizeMediaItem(
      {
        ...data,
        media_type: mediaType,
      },
      mediaType,
    ),
    tagline: data.tagline || null,
    runtime: isMovie ? data.runtime : null,
    status: data.status,
    firstAir: isMovie ? null : data.first_air_date,
    languages: isMovie ? data.spoken_languages?.map((l) => l.english_name) : [data.original_language ?? ''].filter(Boolean),
    production: (data.production_companies ?? []).map((c) => c.name),
    country: country?.country ?? null,
    certification: country?.certification ?? null,
    director,
    writers,
    cast,
    trailer: pickTrailer(data.videos),
    similar: normalizeList(data.similar, mediaType).items,
    recommendations: normalizeList(data.recommendations, mediaType).items,
    seasons: mediaType === 'tv' ? data.seasons ?? [] : null,
    totalSeasons: mediaType === 'tv' ? data.number_of_seasons ?? null : null,
    numberOfEpisodes: mediaType === 'tv' ? data.number_of_episodes ?? null : null,
    lastAir: mediaType === 'tv' ? data.last_air_date : null,
  }
}

/* ---------- TV seasons ---------- */
async function fetchSeason(mediaType, id, season) {
  const data = await fetchJson(`/${mediaType}/${id}/season/${season}`)
  return {
    id: data.id,
    season: data.season_number,
    name: data.name,
    episodes: (data.episodes ?? []).map((e) => ({
      id: e.id,
      episode: e.episode_number,
      name: e.name,
      overview: e.overview,
      airDate: e.air_date,
      rating: rating(e.vote_average),
      still: imgUrl(e.still_path, 'thumb'),
    })),
  }
}

/* Genre maps (cached per media type) */
const GENRES = { movie: null, tv: null }

export async function getGenreMap(mediaType) {
  if (GENRES[mediaType]) return GENRES[mediaType]
  GENRES[mediaType] = fetchJson(`/genre/${mediaType}/list`)
    .then((d) => mapGenres(d.genres))
    .catch((err) => {
      GENRES[mediaType] = null
      throw err
    })
  return GENRES[mediaType]
}

/* ---------- Public API ---------- */
const tmdb = {
  hasApiKey,
  getGenreMap,

  trending(mediaType = 'all', window = 'week') {
    return fetchJson(`/trending/${mediaType}/${window}`).then((d) =>
      normalizeList(d, mediaType === 'all' ? 'all' : mediaType),
    )
  },

  popular(mediaType, page = 1) {
    return fetchJson(`/${mediaType}/popular`, { page }).then((d) => normalizeList(d, mediaType))
  },

  topRated(mediaType, page = 1) {
    return fetchJson(`/${mediaType}/top_rated`, { page }).then((d) => normalizeList(d, mediaType))
  },

  discover({
    mediaType = 'movie',
    genres,
    year,
    minRating,
    sort = 'popularity.desc',
    page = 1,
  }) {
    const isMovie = mediaType === 'movie'
    const params = {
      page,
      sort_by: sort,
      'vote_average.gte': minRating || undefined,
    }
    if (isMovie) {
      params.primary_release_year = year || undefined
      params.with_release_type = '2|3'
    } else {
      params.first_air_date_year = year || undefined
    }
    if (genres?.length) params.with_genres = genres.join(',')
    return fetchJson(`/discover/${mediaType}`, params).then((d) => normalizeList(d, mediaType))
  },

  search(query, mediaType = 'multi', page = 1) {
    return fetchJson(`/search/${mediaType}`, { query, page, include_adult: 'false' }).then((d) =>
      normalizeList(d, mediaType),
    )
  },

  detail: fetchDetail,
  season: fetchSeason,
  videos(mediaType, id) {
    return fetchJson(`/${mediaType}/${id}/videos`)
  },
  recommendations(mediaType, id) {
    return fetchJson(`/${mediaType}/${id}/recommendations`).then((d) => normalizeList(d, mediaType))
  },
}

export default tmdb
export { mapGenres }