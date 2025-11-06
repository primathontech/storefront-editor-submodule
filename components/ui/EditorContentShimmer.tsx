export function EditorContentShimmer() {
  return (
    <div className="flex flex-1 min-h-0">
      <div className="w-80 bg-white border-r border-gray-200 animate-pulse" />
      <div className="flex-1 bg-gray-50 animate-pulse" />
    </div>
  );
}
