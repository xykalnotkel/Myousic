// Background blur blobs (bukan glassmorphism — murni cahaya blur di belakang konten)
export default function Blobs() {
  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="blob w-[46vw] h-[46vw] -top-[12vw] -left-[10vw]" />
      <div className="blob w-[38vw] h-[38vw] top-[30vh] -right-[14vw]" style={{ animationDelay: "-9s" }} />
      <div className="blob w-[34vw] h-[34vw] -bottom-[12vw] left-[24vw]" style={{ animationDelay: "-17s" }} />
      <div className="blob w-[22vw] h-[22vw] top-[8vh] left-[42vw]" style={{ animationDelay: "-5s", opacity: 0.035 }} />
    </div>
  );
}
