"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="food-site section-space">
      <div className="section-shell">
        <p className="eyebrow">PATO FOOD</p>
        <h1>No pudimos cargar la carta.</h1>
        <p>Inténtalo de nuevo en un momento.</p>
        <button className="button" onClick={reset}>
          Volver a intentar
        </button>
      </div>
    </main>
  );
}
