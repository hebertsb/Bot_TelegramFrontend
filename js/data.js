import { BACKEND_URL } from "./config.js";

// Devuelve un objeto con las categorías y productos desde el backend
// Devuelve un objeto con las categorías y productos desde el backend, aceptando claves flexibles
export async function fetchProducts() {
  const url = `${BACKEND_URL}/get_products`;

  // Intentar varias veces porque túneles como ngrok pueden devolver HTML temporalmente
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    }

    // Si no es JSON, leer texto para diagnosticar y reintentar
    const text = await response.text().catch(() => "");
    if (attempt < maxAttempts) {
      // pequeña espera antes de reintentar (para que ngrok "despierte")
      await new Promise((res) => setTimeout(res, 600));
      continue;
    }

    throw new Error(
      `Expected JSON but received (attempt ${attempt}): ${text.slice(0, 200)}`
    );
  }

  // Mapeo: convierte claves a formato amigable si es necesario
  // Ejemplo: { promociones: [...], pizzas: [...], adicionales: [...], bebidas: [...] }
  // El frontend puede iterar sobre Object.entries(data) para mostrar todas las categorías
  return data;
}
