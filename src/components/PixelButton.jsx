export default function PixelButton({
  children,
  href,
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}) {
  const classes = ['pixel-button', `pixel-button--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return (
      <a className={classes} href={href} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <button className={classes} type={type} {...rest}>
      {children}
    </button>
  )
}
