import { BACKEND_URL } from "./config.js";

// Devuelve un objeto con las categorías y productos desde el backend
// Devuelve un objeto con las categorías y productos desde el backend, aceptando claves flexibles
export async function fetchProducts() {
  const response = await fetch(`${BACKEND_URL}/get_products`);
  if (!response.ok) {
    throw new Error("No se pudo obtener el menú del backend");
  }
  const data = await response.json();
  // Mapeo: convierte claves a formato amigable si es necesario
  // Ejemplo: { promociones: [...], pizzas: [...], adicionales: [...], bebidas: [...] }
  // El frontend puede iterar sobre Object.entries(data) para mostrar todas las categorías
  return data;
}
