type TextPanelProps = {
  title: string;
  content: string;
  isCode?: boolean;
};

export function TextPanel({ title, content, isCode = false }: TextPanelProps) {
  return (
    <section className="panelShell">
      <div className="panelTitle">{title}</div>
      {isCode ? (
        <pre className="panelCode">{content}</pre>
      ) : (
        <div className="panelContent">{content}</div>
      )}
    </section>
  );
}
