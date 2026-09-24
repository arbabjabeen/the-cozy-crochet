export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">
        Loading...
      </p>
    </div>
  );
}
