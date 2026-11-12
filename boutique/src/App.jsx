/**
 * App.jsx
 *
 * Single-page boutique showcase (mobile-first, image upload + metadata stripping).
 *
 * Features:
 *   - Hero section with welcoming tagline "Découvrez notre sélection".
 *   - Product grid: image, name, price ("Prix : XX €"), short description, category tag.
 *   - Exactly two hard-coded categories: "Femme" and "Homme".
 *   - Simple category filter buttons.
 *   - Admin-style image upload: pick one or several images, strip EXIF/metadata
 *     client-side (canvas re-encode), show previews, and attach them to products.
 *   - Footer with light copyright info.
 *
 * Constraints respected:
 *   - No "CBD" anywhere in the UI.
 *   - No contact form, no buy button, no cart, no checkout, no external links.
 *   - React function components + hooks only (useState, useEffect, useCallback).
 *   - No external CSS/JS framework; native File API + canvas for image handling.
 */

import { useState, useCallback } from "react";
import { stripExif } from "./metadata";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

// Exactly two categories. Hard-coded; neither contains the word "CBD".
export const CATEGORIES = ["Femme", "Homme"];

// Offline SVG placeholders so the page works with no network / real photos.
const makePlaceholder = (label, bg, fg) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="100%" height="100%" fill="${bg}"/>
      <text x="50%" y="50%" font-family="system-ui, sans-serif" font-size="18" fill="${fg}" text-anchor="middle" dy="0.35em">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Format a price as "Prix : XX €".
const formatPrice = (price) =>
  `Prix : ${price.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;

const initialProducts = [
  { id: 1, name: "Robe fluide", price: 89, category: "Femme", desc: "Coupe légère et élégante.", img: makePlaceholder("Robe fluide", "#f2e9e4", "#8a6d62") },
  { id: 2, name: "Baskets en toile", price: 75, category: "Homme", desc: "Confort au quotidien.", img: makePlaceholder("Baskets", "#e8eaf6", "#5c6bc0") },
  { id: 3, name: "Lunettes de soleil", price: 45, category: "Femme", desc: "Monture fine, verres teintés.", img: makePlaceholder("Lunettes", "#fce4ec", "#ad1457") },
  { id: 4, name: "Montre en bois", price: 120, category: "Homme", desc: "Bracelet en bois massif.", img: makePlaceholder("Montre", "#d7ccc8", "#6d4c41") },
  { id: 5, name: "Sac en cuir", price: 110, category: "Femme", desc: "Cuir souple, finitions soignées.", img: makePlaceholder("Sac", "#efe9e2", "#795548") },
  { id: 6, name: "Ceinture tressée", price: 35, category: "Homme", desc: "Tressage artisanal.", img: makePlaceholder("Ceinture", "#fff3e0", "#ef6c00") },
];

export default function App() {
  const [products, setProducts] = useState(() => [...initialProducts]);
  const [filter, setFilter] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "info" });

  const notify = useCallback((text, type = "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "info" }), 4000);
  }, []);

  /* ---- Image upload + EXIF stripping ---- */

  const handleFiles = useCallback(async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setMessage({ text: `Traitement de ${files.length} image(s)…`, type: "info" });

    const clean = [];
    for (const file of files) {
      try {
        const dataUrl = await stripExif(file);
        clean.push({ name: file.name, dataUrl });
      } catch (err) {
        console.error("stripExif failed for", file.name, err);
        notify(`Impossible de traiter "${file.name}".`, "error");
      }
    }

    setPreviews((prev) => [...prev, ...clean]);
    setUploading(false);
    if (clean.length) {
      notify(`${clean.length} photo(s) nettoyée(s) (métadonnées retirées).`);
    }
    // Reset the input so the same file can be re-picked later.
    event.target.value = "";
  }, [notify]);

  /* Attach the most recent clean preview to a product (admin-style). */

  const attachPreviewToProduct = useCallback((productId, dataUrl) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, img: dataUrl } : p))
    );
    setPreviews((prev) => prev.filter((u) => u.dataUrl !== dataUrl));
    notify("Image du produit mise à jour.");
  }, [notify]);

  /* ---- Filtered product list ---- */

  const visibleProducts = filter
    ? products.filter((p) => p.category === filter)
    : products;

  /* ---- Render ---- */

  return (
    <>
      <header className="hero">
        <div className="hero__inner">
          <h1 className="hero__title">Shelf N’Sift</h1>
          <p className="hero__tagline">Découvrez notre sélection</p>
          <p className="hero__intro">
            Pièces soigneusement choisies pour elle et pour lui. Une sélection
            élégante, sans superflu.
          </p>
        </div>
      </header>

      <main>
        {/* Category filter */}
        <section className="filters" aria-label="Filtrer par catégorie">
          <button
            className={`filter-btn ${filter === null ? "is-active" : ""}`}
            onClick={() => setFilter(null)}
            aria-pressed={filter === null}
          >
            Toutes
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? "is-active" : ""}`}
              onClick={() => setFilter(cat)}
              aria-pressed={filter === cat}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* Product grid */}
        <section className="products" aria-label="Produits">
          <ul className="grid">
            {visibleProducts.map((product) => (
              <li key={product.id} className="card">
                <article className="card__content">
                  <div className="card__image">
                    <img
                      src={product.img}
                      alt={`Photo de ${product.name}`}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <span className="card__category tag">{product.category}</span>
                  <h3 className="card__name">{product.name}</h3>
                  {product.desc && <p className="card__desc">{product.desc}</p>}
                  <span className="card__price">{formatPrice(product.price)}</span>
                </article>
              </li>
            ))}
          </ul>
          {visibleProducts.length === 0 && (
            <p className="empty">Aucun produit dans cette catégorie.</p>
          )}
        </section>

        {/* Image upload (admin-style) */}
        <section className="upload" aria-label="Ajouter des photos de produits">
          <h2 className="section__title">Ajouter une photo de produit</h2>
          <p className="upload__hint">
            Sélectionnez une ou plusieurs images. Les métadonnées (EXIF, GPS,
            orientation…) sont retirées côté navigateur avant l’affichage.
          </p>

          <label className="upload__drop">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              aria-label="Choisir des photos de produit"
            />
            <span className="upload__button">
              {uploading ? "Traitement en cours…" : "Choisir des photos"}
            </span>
          </label>

          {previews.length > 0 && (
            <div className="previews" aria-label="Aperçus prêts à l’emploi">
              <p className="previews__label">
                Aperçus nettoyés (cliquez un produit pour lui affecter l’image) :
              </p>
              <div className="previews__list">
                {previews.map((preview, idx) => (
                  <div key={idx} className="preview">
                    <img src={preview.dataUrl} alt={`Aperçu ${preview.name}`} />
                    <span className="preview__name">{preview.name}</span>
                    {products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="preview__attach"
                        onClick={() => attachPreviewToProduct(p.id, preview.dataUrl)}
                        title={`Affecter à ${p.name}`}
                      >
                        → {p.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>2025 Boutique Shelf N’Sift – Tous droits réservés.</p>
      </footer>

      {message.text && (
        <div className={`notification notification--${message.type}`} role="status" aria-live="polite">
          {message.text}
        </div>
      )}
    </>
  );
}

