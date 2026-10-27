export default function Card({
  eyebrow,
  title,
  headingLevel = 3,
  footer,
  children,
  className = '',
  ...rest
}) {
  const Heading = `h${headingLevel}`

  return (
    <article className={['card', className].filter(Boolean).join(' ')} {...rest}>
      {eyebrow || title ? (
        <header className="card__header">
          {eyebrow ? <p className="card__eyebrow">{eyebrow}</p> : null}
          {title ? <Heading className="card__title">{title}</Heading> : null}
        </header>
      ) : null}
      <div className="card__body">{children}</div>
      {footer ? <footer className="card__footer">{footer}</footer> : null}
    </article>
  )
}
