export default function Panel({
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
    <div className={['panel', className].filter(Boolean).join(' ')} {...rest}>
      {eyebrow || title ? (
        <div className="panel__header">
          {eyebrow ? <p className="panel__eyebrow">{eyebrow}</p> : null}
          {title ? <Heading className="panel__title">{title}</Heading> : null}
        </div>
      ) : null}
      <div className="panel__body">{children}</div>
      {footer ? <div className="panel__footer">{footer}</div> : null}
    </div>
  )
}
