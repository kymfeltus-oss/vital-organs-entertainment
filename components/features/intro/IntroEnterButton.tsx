"use client";

type IntroEnterButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export default function IntroEnterButton({ onClick, disabled = false }: IntroEnterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Enter Parable Streaming"
      className="intro-media-enter-btn intro-flash-enter-btn"
    >
      <span className="intro-flash-enter-btn-glow" aria-hidden="true" />
      <span className="intro-flash-enter-btn-label intro-media-enter-btn__label">Enter</span>
    </button>
  );
}
