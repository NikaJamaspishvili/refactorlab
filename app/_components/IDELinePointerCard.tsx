import type { ReactNode } from "react";

type IDELinePointerCardProps = {
  content: string;
  title?: string;
  avatarSrc?: string;
  footer?: ReactNode;
  pointerSide?: "top" | "bottom";
  maxBodyHeight?: number;
};

function IDELinePointerCard({
  content,
  title = "Code Hint",
  avatarSrc = "HoodieGuy.jpeg",
  footer,
  pointerSide = "bottom",
  maxBodyHeight,
}: IDELinePointerCardProps) {
  const pointerStyle =
    pointerSide === "top"
      ? {
          position: "absolute" as const,
          left: "18px",
          top: "-6px",
          width: "12px",
          height: "12px",
          transform: "rotate(45deg)",
          borderLeft: "1px solid rgba(148, 163, 184, 0.22)",
          borderTop: "1px solid rgba(148, 163, 184, 0.22)",
          backgroundColor: "#0f172a",
        }
      : {
          position: "absolute" as const,
          left: "18px",
          bottom: "-6px",
          width: "12px",
          height: "12px",
          transform: "rotate(45deg)",
          borderRight: "1px solid rgba(148, 163, 184, 0.22)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.22)",
          backgroundColor: "#0f172a",
        };

  return (
    <section
      style={{
        position: "relative",
        width: "min(280px, calc(100vw - 40px))",
        maxWidth: "280px",
        padding: "10px 12px 14px",
        borderRadius: "12px",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        background:
          "linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.9) 100%)",
        color: "#e2e8f0",
        boxShadow: "0 10px 28px rgba(2, 6, 23, 0.45)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div style={pointerStyle} />

      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <img
          style={{
            borderRadius: "999px",
            width: "100px",
            height: "100px",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
            border: "1px solid rgba(148, 163, 184, 0.28)",
            flexShrink: 0,
          }}
          src={avatarSrc}
          alt="Hint avatar"
        />
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: "#f8fafc",
          }}
        >
          {title}
        </div>
      </header>

      <div
        style={{
          fontSize: "12px",
          lineHeight: 1.45,
          color: "#cbd5e1",
          overflowWrap: "anywhere",
          maxHeight: maxBodyHeight
            ? `${Math.max(48, maxBodyHeight)}px`
            : undefined,
          overflowY: maxBodyHeight ? "auto" : "visible",
          paddingRight: maxBodyHeight ? "2px" : undefined,
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      <div
        style={{
          marginTop: "12px",
          minHeight: "34px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {footer}
      </div>
    </section>
  );
}

export default IDELinePointerCard;
