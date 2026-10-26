export default function NewsImage({ alt = "", onError, ...props }) {
  function handleError(event) {
    const image = event.currentTarget;
    if (image.dataset.fallback === "true") return;
    image.dataset.fallback = "true";
    image.src = "/news-placeholder.svg";
    onError?.(event);
  }

  return <img {...props} alt={alt} onError={handleError} />;
}
