export function EditorHeaderShimmer() {
  return (
    <header className="w-full bg-white border-b border-gray-200 flex items-center justify-between px-6 h-14 shadow-sm">
      <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
    </header>
  );
}
