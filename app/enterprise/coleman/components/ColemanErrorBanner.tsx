"use client";

type ColemanErrorBannerProps = {
  message: string;
  onDismiss?: () => void;
};

export default function ColemanErrorBanner({
  message,
  onDismiss,
}: ColemanErrorBannerProps) {
  return (
    <div className="coleman-error-banner" role="alert">
      <p>{message}</p>
      {onDismiss ? (
        <button type="button" className="coleman-error-dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
