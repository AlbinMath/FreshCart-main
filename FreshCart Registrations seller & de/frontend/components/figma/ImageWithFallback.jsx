import React from 'react';

const ImageWithFallback = ({
  src,
  fallbackSrc,
  alt,
  className,
  ...props
}) => {
  const [imageSrc, setImageSrc] = React.useState(src);
  const [hasError, setHasError] = React.useState(false);

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    }
  };

  // Reset when src changes
  React.useEffect(() => {
    setImageSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
};

// Named export
export { ImageWithFallback };

// Default export
export default ImageWithFallback;