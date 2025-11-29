import { BACKEND_URL } from "./config.js";

// Devuelve un objeto con las categorías y productos desde el backend
// Devuelve un objeto con las categorías y productos desde el backend, aceptando claves flexibles
export async function fetchProducts() {
  const url = `${BACKEND_URL}/get_products`;

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(
      `Backend responded ${response.status}: ${
        text ? text.slice(0, 200) : response.statusText
      }`
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    throw new Error(`Expected JSON but received: ${text.slice(0, 200)}`);
  }

  const data = await response.json();

  // Mapeo: convierte claves a formato amigable si es necesario
  // Ejemplo: { promociones: [...], pizzas: [...], adicionales: [...], bebidas: [...] }
  // El frontend puede iterar sobre Object.entries(data) para mostrar todas las categorías
  return data;
}
