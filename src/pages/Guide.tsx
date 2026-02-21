const LINKS = [
  {
    url: 'https://milwaukeerecord.com/food-drink/its-official-again-today-is-friday-fish-fry-day-throughout-wisconsin/',
    name: 'Milwaukee Record',
    description: "A deep dive into Wisconsin's beloved Friday fish fry tradition and why it's such an enduring part of local culture.",
  },
  {
    url: 'https://onmilwaukee.com/articles/milwaukeefishfryguide',
    name: 'OnMilwaukee Fish Fry Guide',
    description: 'OnMilwaukee\'s comprehensive guide to the best fish fries around the city, with picks and reviews.',
  },
  {
    url: 'https://madisonfishfry.com/',
    name: 'Madison Fish Fry',
    description: 'A directory of Lenten fish fries in and around Madison, Wisconsin — a great reference for the rest of the state.',
  },
  {
    url: 'https://catholicherald.org/local/2026-lenten-fish-fry-listing/',
    name: 'Catholic Herald — 2026 Lenten Fish Fry Listing',
    description: "The Archdiocese of Milwaukee's official listing of parish fish fries for Lent 2026.",
  },
]

export default function Guide() {
  return (
    <div>
      <h2 className="mb-1">Fish Fry Guide</h2>
      <p className="text-muted mb-4">Other great Milwaukee-area fish fry resources around the web.</p>

      <ul className="list-group list-group-flush">
        {LINKS.map(({ url, name, description }) => (
          <li key={url} className="list-group-item px-0 py-3">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="fw-semibold text-decoration-none"
            >
              {name} ↗
            </a>
            <p className="mb-0 mt-1 text-muted small">{description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
