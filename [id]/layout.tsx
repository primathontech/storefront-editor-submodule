import "../editor-theme.css";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-editor-theme="light">{children}</div>;
}
