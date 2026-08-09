export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-700 border-r-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
