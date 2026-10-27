import { useState } from 'react'

const PHOTO_SRC = '/profile.jpg'

export default function PortraitFrame() {
  const [hasPhoto, setHasPhoto] = useState(true)

  return (
    <div className="portrait">
      <span className="portrait__post" aria-hidden="true" />

      <figure className="portrait__frame">
        <span className="portrait__nail" aria-hidden="true" />
        <div className="portrait__window">
          {hasPhoto ? (
            <img
              className="portrait__image"
              src={PHOTO_SRC}
              alt="Portrait of POP"
              width="600"
              height="800"
              loading="lazy"
              decoding="async"
              onError={() => setHasPhoto(false)}
            />
          ) : (
            <div
              className="portrait__placeholder"
              role="img"
              aria-label="Portrait of POP. Your photo goes here."
            >
              <span className="portrait__silhouette" aria-hidden="true" />
              <span className="portrait__placeholder-label" aria-hidden="true">
                YOUR PHOTO HERE
              </span>
            </div>
          )}
        </div>
      </figure>
    </div>
  )
}
