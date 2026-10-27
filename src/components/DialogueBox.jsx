export default function DialogueBox({
  label = 'Dialogue',
  speaker,
  children,
  className = '',
  ...rest
}) {
  return (
    <div className={['dialogue-box', className].filter(Boolean).join(' ')} {...rest}>
      <div className="dialogue-box__bar">
        <span className="dialogue-box__label">{label}</span>
        {speaker ? <span className="dialogue-box__speaker">{speaker}</span> : null}
      </div>
      <div className="dialogue-box__body">{children}</div>
    </div>
  )
}
