// --- Modal de Sugerencias de Adicionales y Bebidas ---
let menuCache = null; // Se guarda el menú para sugerencias

export function setMenuCache(menu) {
  menuCache = menu;
}

export function mostrarModalSugerencias(productoBase, onAddItems) {
  if (!menuCache) return;
  // Crear overlay
  let overlay = document.createElement("div");
  overlay.id = "modal-sugerencias-overlay";
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";

  // Modal principal
  let modal = document.createElement("div");
  modal.className =
    "bg-white rounded-lg shadow-lg p-6 max-w-md w-full animate-fade-in";

  modal.innerHTML = `
    <h3 class="text-lg font-bold mb-2 text-green-700">✅ ${
      productoBase.name
    } agregada</h3>
    <div class="mb-4">
      <h4 class="font-semibold mb-1">¿Quieres personalizarla?</h4>
      <div class="grid grid-cols-1 gap-2">
        ${(menuCache.adicionales || [])
          .map(
            (adic) => `
          <label class="flex items-center space-x-2">
            <input type="checkbox" class="sug-adic" value="${
              adic.id
            }" data-name="${adic.name}" data-price="${
              adic.price
            }" data-emoji="${adic.emoji || ""}">
            <span>${adic.emoji || ""} ${
              adic.name
            } <span class="text-xs text-gray-500">(+Bs ${
              adic.price
            })</span></span>
          </label>
        `
          )
          .join("")}
      </div>
    </div>
    <div class="mb-4">
      <h4 class="font-semibold mb-1">¿Agregar bebida?</h4>
      <div class="grid grid-cols-1 gap-2">
        ${(menuCache.bebidas || [])
          .slice(0, 3)
          .map(
            (beb) => `
          <label class="flex items-center space-x-2">
            <input type="checkbox" class="sug-beb" value="${
              beb.id
            }" data-name="${beb.name}" data-price="${beb.price}" data-emoji="${
              beb.emoji || ""
            }">
            <span>${beb.emoji || ""} ${
              beb.name
            } <span class="text-xs text-gray-500">(+Bs ${
              beb.price
            })</span></span>
          </label>
        `
          )
          .join("")}
      </div>
    </div>
    <div class="flex justify-end space-x-2 mt-4">
      <button id="btn-sug-continuar" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Continuar</button>
      <button id="btn-sug-carrito" class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Ir al Carrito</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Acciones de los botones
  overlay.querySelector("#btn-sug-continuar").onclick = () => {
    const adicionales = Array.from(
      overlay.querySelectorAll(".sug-adic:checked")
    ).map((input) => ({
      id: input.value,
      name: input.dataset.name,
      price: parseFloat(input.dataset.price),
      emoji: input.dataset.emoji,
      quantity: 1,
    }));
    const bebidas = Array.from(
      overlay.querySelectorAll(".sug-beb:checked")
    ).map((input) => ({
      id: input.value,
      name: input.dataset.name,
      price: parseFloat(input.dataset.price),
      emoji: input.dataset.emoji,
      quantity: 1,
    }));
    document.body.removeChild(overlay);
    if (onAddItems) onAddItems([...adicionales, ...bebidas]);
  };
  overlay.querySelector("#btn-sug-carrito").onclick = () => {
    const adicionales = Array.from(
      overlay.querySelectorAll(".sug-adic:checked")
    ).map((input) => ({
      id: input.value,
      name: input.dataset.name,
      price: parseFloat(input.dataset.price),
      emoji: input.dataset.emoji,
      quantity: 1,
    }));
    const bebidas = Array.from(
      overlay.querySelectorAll(".sug-beb:checked")
    ).map((input) => ({
      id: input.value,
      name: input.dataset.name,
      price: parseFloat(input.dataset.price),
      emoji: input.dataset.emoji,
      quantity: 1,
    }));
    document.body.removeChild(overlay);
    if (onAddItems) onAddItems([...adicionales, ...bebidas], true); // true = ir al carrito
  };
}
// js/ui.js
// Este archivo contendrá toda la lógica para manipular el DOM.

// Referencias a "páginas"
export const pageWelcome = document.getElementById("page-welcome");
export const mainHeader = document.getElementById("main-header");
export const pageCategories = document.getElementById("page-categories");
export const pageProducts = document.getElementById("page-products");
export const productTitle = document.getElementById("product-title");
export const productListContainer = document.getElementById(
  "product-list-container"
);
export const pageCustomPizza = document.getElementById("page-custom-pizza");
export const pageCart = document.getElementById("page-cart");
export const cartItemsList = document.getElementById("cart-items-list");
export const cartEmptyMsg = document.getElementById("cart-empty-msg");
export const cartTotal = document.getElementById("cart-total");
export const pagePaymentMethod = document.getElementById("page-payment-method");
export const pageMyOrders = document.getElementById("page-my-orders");
export const myOrdersList = document.getElementById("my-orders-list");
export const noOrdersMsg = document.getElementById("no-orders-msg");
export const pageOrderTracking = document.getElementById("page-order-tracking");
export const trackingOrderId = document.getElementById("tracking-order-id");
export const btnRateOrder = document.getElementById("btn-rate-order");
export const pageRateDriver = document.getElementById("page-rate-driver");
export const ratingOrderId = document.getElementById("rating-order-id");
export const ratingStarsContainer = document.getElementById(
  "rating-stars-container"
);
export const btnSubmitRating = document.getElementById("btn-submit-rating");

// Referencias a Botones

export const btnMyOrders = document.getElementById("btn-my-orders");
export const btnBack = document.getElementById("btn-back");
export const btnBackCustom = document.getElementById("btn-back-custom");
export const btnBackCart = document.getElementById("btn-back-cart");
export const btnBackPayment = document.getElementById("btn-back-payment");
export const btnBackMyOrders = document.getElementById("btn-back-my-orders");
export const btnBackTracking = document.getElementById("btn-back-tracking");
export const btnBackRating = document.getElementById("btn-back-rating");
export const btnGeneratePizza = document.getElementById("btn-generate-pizza");
export const btnAddCustomPizza = document.getElementById(
  "btn-add-custom-pizza"
);
export const btnPayCash = document.getElementById("btn-pay-cash");
export const btnPayCard = document.getElementById("btn-pay-card");
export const btnGetLocation = document.getElementById("btn-get-location");
export const locationText = document.getElementById("location-text");
export const addressDetailsInput = document.getElementById("address-details");

// Telegram WebApp mainButton
import { tg } from "./telegram.js";
console.log("tg in ui:", tg);
// import { fetchProducts } from "./data.js";
import { cart, myOrders, currentRating } from "./state.js";

// --- Floating cart badge + UI update ---
function ensureFloatingCart() {
  let el = document.getElementById("floating-cart");
  if (el) return el;
  el = document.createElement("div");
  el.id = "floating-cart";
  el.style.position = "fixed";
  el.style.right = "18px";
  el.style.bottom = "80px";
  el.style.zIndex = "60";
  el.style.background = "#2563eb";
  el.style.color = "white";
  el.style.padding = "10px 14px";
  el.style.borderRadius = "999px";
  el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.1)";
  el.style.cursor = "pointer";
  el.onclick = () => showCartPage();
  const span = document.createElement("span");
  span.id = "floating-cart-count";
  span.style.fontWeight = "700";
  el.appendChild(span);
  document.body.appendChild(el);
  return el;
}

export function updateCartUI() {
  const el = ensureFloatingCart();
  const badge = el.querySelector("#floating-cart-count");
  const totalItems = (cart || []).reduce((s, i) => s + (i.quantity || 0), 0);
  badge.textContent = `${totalItems}`;

  // Si la página del carrito está visible, renderizar
  if (!pageCart.classList.contains("hidden")) {
    cartItemsList.innerHTML = "";
    if (!cart || cart.length === 0) {
      cartEmptyMsg.classList.remove("hidden");
      cartTotal.textContent = "$0.00";
      return;
    }
    cartEmptyMsg.classList.add("hidden");
    cart.forEach((item, idx) => {
      const itemEl = document.createElement("div");
      itemEl.className = "cart-item flex items-center justify-between p-3 bg-white rounded-lg mb-3";
      itemEl.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">${item.emoji || "🍕"}</div>
          <div>
            <div class="font-semibold">${item.name}</div>
            <div class="text-sm text-gray-500">Bs ${item.price.toFixed(2)}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-qty-change px-2 py-1 bg-gray-200 rounded" data-index="${idx}" data-change="-1">-</button>
          <span class="font-semibold">${item.quantity}</span>
          <button class="btn-qty-change px-2 py-1 bg-gray-200 rounded" data-index="${idx}" data-change="1">+</button>
          <button class="btn-remove-item ml-3 text-red-500" data-index="${idx}">Eliminar</button>
        </div>
      `;
      cartItemsList.appendChild(itemEl);
    });
    const total = cart.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
  }
}

// --- Funciones de Navegación ---

export function hideAllPages() {
  pageWelcome.classList.add("hidden");
  mainHeader.classList.add("hidden");
  pageCategories.classList.add("hidden");
  pageProducts.classList.add("hidden");
  pageCustomPizza.classList.add("hidden");
  pageCart.classList.add("hidden");
  pagePaymentMethod.classList.add("hidden");
  pageMyOrders.classList.add("hidden");
  pageOrderTracking.classList.add("hidden");
  pageRateDriver.classList.add("hidden");
  if (tg && tg.MainButton) {
    tg.MainButton.hide();
  }
  if (tg && tg.BackButton) {
    tg.BackButton.hide();
  }
}

export function showWelcomePage() {
  hideAllPages();
  pageWelcome.classList.remove("hidden");
}

import { fetchProducts } from "./data.js";

const categoriasConfig = {
  promociones: { emoji: "🔥", nombre: "Promociones", color: "#ff6b6b" },
  pizzas: { emoji: "🍕", nombre: "Pizzas", color: "#ffa500" },
  bebidas: { emoji: "🥤", nombre: "Bebidas", color: "#4ecdc4" },
  postres: { emoji: "🍰", nombre: "Postres", color: "#ff6b9d" },
  adicionales: { emoji: "➕", nombre: "Adicionales", color: "#95e1d3" },
};

export async function showCategoriesPage() {
  console.log("showCategoriesPage called");
  hideAllPages();
  mainHeader.classList.remove("hidden");
  pageCategories.classList.remove("hidden");

  tg.MainButton.onClick(showCartPage);

  document.getElementById("pizza-result").classList.add("hidden");
  document.getElementById("loading-spinner").classList.add("hidden");
  tg.BackButton.show();
  tg.BackButton.onClick(showWelcomePage);
  tg.HapticFeedback.impactOccurred("light");

  // --- CATEGORÍAS DINÁMICAS ---
  const categoriesContainer = document.getElementById("categories-container");
  categoriesContainer.innerHTML =
    "<div class='col-span-2 text-center text-gray-400'>Cargando...</div>";
  let menu;
  try {
    menu = await fetchProducts();
  } catch (e) {
    categoriesContainer.innerHTML = `<div class='col-span-2 text-center text-red-500'>Error cargando categorías: ${e.message}</div>`;
    return;
  }
  const categorias = Object.keys(menu);
  categoriesContainer.innerHTML = "";
  categorias.forEach((cat) => {
    const config = categoriasConfig[cat] || {
      emoji: "📦",
      nombre: cat.charAt(0).toUpperCase() + cat.slice(1),
      color: "#999",
    };
    const card = document.createElement("div");
    card.className =
      "category-card bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1";
    card.style.borderTop = `4px solid ${config.color}`;
    card.innerHTML = `
      <span class="text-5xl">${config.emoji}</span>
      <span class="font-semibold text-gray-700 mt-2 text-center">${config.nombre}</span>
    `;
    card.onclick = () => {
      console.log("Category clicked:", config.nombre);
      showProductPage(config.nombre, cat);
    };
    categoriesContainer.appendChild(card);
  });

  // Botón especial para pizza personalizada
  const customCard = document.createElement("div");
  customCard.className =
    "category-card bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 col-span-2";
  customCard.style.borderTop = "4px solid #6366f1";
  customCard.innerHTML = `
    <span class="text-5xl">✨</span>
    <span class="font-semibold text-gray-700 mt-2 text-center">Crea tu Pizza Personalizada</span>
  `;
  customCard.onclick = () => showCustomPizzaPage();
  categoriesContainer.appendChild(customCard);
}

export async function showProductPage(categoryName, categoryKey) {
  console.log("Nueva versión de showProductPage cargada");
  hideAllPages();
  pageProducts.classList.remove("hidden");
  tg.MainButton.onClick(showCartPage);
  tg.BackButton.show();
  tg.BackButton.onClick(showCategoriesPage);
  tg.HapticFeedback.impactOccurred("light");

  productTitle.textContent = categoryName;
  btnBack.dataset.target = "categories";
  productListContainer.innerHTML =
    "<div class='text-center text-gray-500'>Cargando productos...</div>";

  try {
    const products = await fetchProducts();
    const items = products[categoryKey];
    productListContainer.innerHTML = "";
    if (items && items.length > 0) {
      items.forEach((item) => {
        const itemHTML = `
          <div class="bg-white rounded-xl shadow-lg p-4 flex flex-col sm:flex-row items-center gap-4 hover:shadow-2xl transition-all">
            <div class="flex-shrink-0 flex flex-col items-center justify-center">
              <img src="${item.image || "https://placehold.co/100x100"}" alt="${
          item.name
        }" class="w-24 h-24 object-cover rounded-lg border mb-2 shadow-sm">
              <span class="text-3xl">${item.emoji || "🍕"}</span>
            </div>
            <div class="flex-grow w-full">
              <h3 class="text-lg font-bold text-gray-900 mb-1">${item.name}</h3>
              <p class="text-gray-500 text-sm mb-2">${
                item.description || ""
              }</p>
              <div class="flex items-center justify-between mt-2">
                <span class="text-xl font-semibold text-blue-600">Bs ${item.price.toFixed(
                  2
                )}</span>
                <button class="btn-add-cart bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow"
                  data-id="${item.id || item.name}" data-name="${
          item.name
        }" data-price="${item.price}" data-emoji="${item.emoji || "🍕"}">
                  Añadir
                </button>
              </div>
            </div>
          </div>
        `;
        productListContainer.innerHTML += itemHTML;
      });
    } else {
      productListContainer.innerHTML =
        '<p class="text-gray-600">No hay productos en esta categoría.</p>';
    }
  } catch (error) {
    productListContainer.innerHTML = `<p class='text-red-600'>Error cargando productos: ${error.message}</p>`;
  }
}

export function showCustomPizzaPage() {
  hideAllPages();
  pageCustomPizza.classList.remove("hidden");
  tg.MainButton.setText("Generar Pizza");
  tg.MainButton.show();
  tg.MainButton.onClick(() => {
    // Lógica para generar pizza
  });
  tg.BackButton.show();
  tg.BackButton.onClick(showCategoriesPage);
  tg.HapticFeedback.impactOccurred("light");
}

export function showCartPage() {
  hideAllPages();
  pageCart.classList.remove("hidden");
  tg.MainButton.setText("Pagar");
  tg.MainButton.show();
  tg.MainButton.onClick(showPaymentMethodPage);
  tg.BackButton.show();
  tg.BackButton.onClick(showCategoriesPage);
  tg.HapticFeedback.impactOccurred("light");
  // Actualizar el carrito en la UI
  if (typeof updateCartUI === "function") updateCartUI();
}

export function showPaymentMethodPage() {
  hideAllPages();
  pagePaymentMethod.classList.remove("hidden");
  tg.MainButton.hide();
  tg.BackButton.show();
  tg.BackButton.onClick(showCartPage);
  tg.HapticFeedback.impactOccurred("light");
}

export async function showMyOrdersPage() {
  hideAllPages();
  pageMyOrders.classList.remove("hidden");
  tg.MainButton.hide();
  tg.BackButton.show();
  tg.BackButton.onClick(showWelcomePage);

  myOrdersList.innerHTML =
    "<div class='text-center text-gray-500'>Cargando pedidos...</div>";

  // Refrescar pedidos desde backend antes de mostrar
  try {
    // Si la función está global, usarla; si no, fallback a local
    let loadOrdersFromBackend = window.loadOrdersFromBackend;
    if (!loadOrdersFromBackend) {
      // fallback: no recarga
      myOrdersList.innerHTML =
        '<p class="text-red-600">No se pudo cargar pedidos (función no encontrada)</p>';
      return;
    }
    await loadOrdersFromBackend();
    myOrdersList.innerHTML = "";
    if (myOrders.length === 0) {
      noOrdersMsg.classList.remove("hidden");
    } else {
      noOrdersMsg.classList.add("hidden");
      myOrders.forEach((order) => {
        const orderTotal = order.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const orderHTML = `
                  <div class="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-all" data-order-id="${
                    order.id
                  }">
                      <div class="flex justify-between items-center">
                          <span class="font-bold text-lg">Pedido #${
                            order.id
                          }</span>
                          <span class="text-gray-600">${order.status}</span>
                      </div>
                      <p class="text-sm text-gray-500">${order.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      )} productos - Total: $${orderTotal.toFixed(2)}</p>
                      <p class="text-sm text-gray-500">Realizado el: ${new Date(
                        order.date
                      ).toLocaleString("es-ES")}</p>
                  </div>
              `;
        myOrdersList.innerHTML = orderHTML + myOrdersList.innerHTML;
      });
    }
  } catch (e) {
    myOrdersList.innerHTML = `<p class='text-red-600'>Error cargando pedidos: ${e.message}</p>`;
  }
}

import { BACKEND_URL } from "./config.js";

export async function showOrderTrackingPage(orderId) {
  hideAllPages();
  pageOrderTracking.classList.remove("hidden");
  tg.MainButton.hide();
  tg.BackButton.show();
  tg.BackButton.onClick(() => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }
    showMyOrdersPage();
  });

  // Función interna para refrescar el estado
  // Variable global para el intervalo de refresco y estado anterior
  let trackingInterval = null;
  let lastOrderStatus = null;

  // Función para mostrar un banner de notificación
  function showStatusBanner(message, color = "bg-blue-600") {
    let banner = document.getElementById("order-status-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "order-status-banner";
      banner.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all duration-500 ${color}`;
      document.body.appendChild(banner);
    }
    banner.textContent = message;
    banner.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all duration-500 ${color}`;
    banner.style.opacity = "1";
    setTimeout(() => {
      banner.style.opacity = "0";
    }, 3500);
  }

  async function refreshTracking() {
    try {
      const response = await fetch(`${BACKEND_URL}/get_orders`);
      if (!response.ok) throw new Error("No se pudo obtener pedidos");
      const allOrders = await response.json();
      order = allOrders.find((o) => String(o.id) === String(orderId));
    } catch (e) {
      order = null;
    }
    if (!order) {
      trackingOrderId.textContent = `Pedido no encontrado o error de red.`;
      btnRateOrder.classList.add("hidden");
      return;
    }

    trackingOrderId.textContent = `Pedido #${order.id}`;
    btnRateOrder.dataset.orderId = order.id;
  }
}

export function showRateDriverPage(orderId) {
  hideAllPages();
  pageRateDriver.classList.remove("hidden");
  tg.MainButton.hide();
  tg.BackButton.show();
  tg.BackButton.onClick(() => showOrderTrackingPage(orderId));

  ratingOrderId.textContent = `Pedido #${orderId}`;
  btnSubmitRating.dataset.orderId = orderId;

  currentRating = 0;
  document.querySelectorAll(".rating-stars span").forEach((star) => {
    star.classList.remove("selected");
  });
  document.getElementById("rating-comments").value = "";
}
