export default function Blobs() {
  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="blob w-[40vw] h-[40vw] -top-[14vw] -left-[12vw]" style={{ animationDuration: "40s" }} />
      <div
        className="blob w-[32vw] h-[32vw] -bottom-[10vw] -right-[10vw]"
        style={{ animationDelay: "-18s", animationDuration: "48s" }}
      />
    </div>
  );
}
