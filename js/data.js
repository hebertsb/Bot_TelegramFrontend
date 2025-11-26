import { BACKEND_URL } from "./config.js";

// Devuelve un objeto con las categorías y productos desde el backend
// Devuelve un objeto con las categorías y productos desde el backend, aceptando claves flexibles
export async function fetchProducts() {
  const url = `${BACKEND_URL}/get_products`;
  alert(`Fetching from: ${url}`);
  const response = await fetch(url);
  alert(`Response status: ${response.status}`);
  if (!response.ok) {
    alert(`Response not ok: ${response.status} ${response.statusText}`);
    throw new Error("No se pudo obtener el menú del backend");
  }
  const data = await response.json();
  alert(`Data received: ${JSON.stringify(data)}`);
  // Mapeo: convierte claves a formato amigable si es necesario
  // Ejemplo: { promociones: [...], pizzas: [...], adicionales: [...], bebidas: [...] }
  // El frontend puede iterar sobre Object.entries(data) para mostrar todas las categorías
  return data;
}
