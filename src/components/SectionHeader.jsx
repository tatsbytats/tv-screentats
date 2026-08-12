import { Link } from 'react-router-dom'
import { ArrowRightIcon } from './Icons'

export default function SectionHeader({ eyebrow, title, seeAllTo, seeAllLabel, sub }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 style={{ marginTop: eyebrow ? 10 : 0 }}>{title}</h2>
        {sub && <p className="sub" style={{ marginTop: 10 }}>{sub}</p>}
      </div>
      {seeAllTo && (
        <Link to={seeAllTo} className="see-all">
          {seeAllLabel || 'See all'}
          <ArrowRightIcon width={14} height={14} style={{ verticalAlign: -2, marginLeft: 4 }} />
        </Link>
      )}
    </div>
  )
}