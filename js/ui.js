// --- Modal de Sugerencias de Adicionales y Bebidas ---
let menuCache = null; // Se guarda el menú para sugerencias

// (Nota: la lógica del timeline y los overlays están definidos más abajo en este archivo.)
// js/ui.js
// Permitir que otras partes del app registren el menú descargado
export function setMenuCache(menu) {
  try {
    menuCache = menu || null;
    // también exponer en ventana para depuración/test
    try {
      window._menuCache = menuCache;
    } catch (e) {}
  } catch (e) {
    console.warn("setMenuCache failed", e);
  }
}

// Mostrar un modal simple para sugerir adicionales y bebidas
// item: producto base (la pizza creada), onAddItems: callback(itemsArray, irCarrito)
export function mostrarModalSugerencias(item, onAddItems) {
  const menu = menuCache || window._menuCache || {};
  const adicionalesList = Array.isArray(menu.adicionales)
    ? menu.adicionales
    : [];
  const bebidasList = Array.isArray(menu.bebidas) ? menu.bebidas : [];

  const renderItems = (list, prefix) =>
    list
      .map(
        (it, idx) => `
      <label class="flex items-center gap-3 p-2 border rounded mb-2 cursor-pointer">
        <input type="checkbox" data-price="${it.price || 0}" data-name="${
          it.name || ""
        }" data-emoji="${
          it.emoji || ""
        }" class="sug-item" data-kind="${prefix}" value="${it.id || idx}">
        <div class="flex-1">
          <div class="font-semibold">${it.name}</div>
          <div class="text-sm text-gray-500">Bs ${(it.price || 0).toFixed(
            2
          )}</div>
        </div>
        <div>${it.emoji || ""}</div>
      </label>`
      )
      .join("");

  const html = `
    <h3 class="text-lg font-bold mb-2">Sugerencias para ${
      item?.name || "tu producto"
    }</h3>
    <div class="mb-2 text-sm text-gray-600">Elige adicionales o bebidas para este pedido.</div>
    <div style="max-height:60vh;overflow:auto;padding-right:8px">
      <div class="mb-4">
        <div class="font-semibold mb-1">Adicionales</div>
        ${
          renderItems(adicionalesList, "adicional") ||
          '<div class="text-sm text-gray-500">No hay adicionales.</div>'
        }
      </div>
      <div class="mb-4">
        <div class="font-semibold mb-1">Bebidas</div>
        ${
          renderItems(bebidasList, "bebida") ||
          '<div class="text-sm text-gray-500">No hay bebidas.</div>'
        }
      </div>
    </div>
    <div class="flex gap-2">
      <button id="sug-add-btn" class="w-full bg-blue-600 text-white px-3 py-2 rounded">Agregar seleccionados</button>
      <button id="sug-close-btn" class="w-full bg-white border px-3 py-2 rounded">Cerrar</button>
    </div>
  `;

  // crear overlay
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4";
  const panel = document.createElement("div");
  panel.className = "bg-white rounded-lg shadow-lg p-6 w-full max-w-md";
  // limitar altura del panel para que no salga de la vista en móviles
  panel.style.maxHeight = "80vh";
  panel.style.overflowY = "auto";
  panel.style.boxSizing = "border-box";
  panel.style.maxWidth = "520px";
  panel.innerHTML = html;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  const btnClose = overlay.querySelector("#sug-close-btn");
  const btnAdd = overlay.querySelector("#sug-add-btn");
  // hacer los inputs un poco más grandes y táctiles
  try {
    Array.from(panel.querySelectorAll("input.sug-item")).forEach((i) => {
      i.style.width = "18px";
      i.style.height = "18px";
      i.style.marginRight = "8px";
    });
    // también asegurar que cada label use box-sizing
    Array.from(panel.querySelectorAll("label")).forEach((l) => {
      l.style.boxSizing = "border-box";
      l.style.width = "100%";
    });
  } catch (e) {}
  if (btnClose) btnClose.onclick = () => overlay.remove();
  if (btnAdd) {
    btnAdd.onclick = () => {
      const checked = Array.from(
        panel.querySelectorAll("input.sug-item:checked")
      );
      const adicionales = checked
        .filter((i) => i.dataset.kind === "adicional")
        .map((i) => ({
          id: i.value,
          name: i.dataset.name,
          price: parseFloat(i.dataset.price || 0),
          emoji: i.dataset.emoji,
          isAddon: true,
        }));
      const bebidas = checked
        .filter((i) => i.dataset.kind === "bebida")
        .map((i) => ({
          id: i.value,
          name: i.dataset.name,
          price: parseFloat(i.dataset.price || 0),
          emoji: i.dataset.emoji,
          isDrink: true,
        }));
      overlay.remove();
      try {
        if (typeof onAddItems === "function")
          onAddItems([...adicionales, ...bebidas], true);
      } catch (e) {
        console.warn(e);
      }
    };
  }
}
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
console.debug("tg in ui:", tg);
// import { fetchProducts } from "./data.js";
import { cart, myOrders, currentRating } from "./state.js";

// Helpers para compatibilidad entre versiones y mocks
const MB = tg && (tg.MainButton || tg.mainButton || tg.main_button || null);
const BB = tg && (tg.BackButton || tg.backButton || tg.back_button || null);
const HF = tg && (tg.HapticFeedback || tg.hapticFeedback || null);

// --- Floating cart badge + UI update ---
function ensureFloatingCart() {
  let el = document.getElementById("floating-cart");
  if (el) return el;
  el = document.createElement("div");
  el.id = "floating-cart";
  el.style.position = "fixed";
  el.style.right = "18px";
  el.style.top = "18px";
  el.style.zIndex = "60";
  el.style.background = "#2563eb";
  el.style.color = "white";
  el.style.padding = "8px 10px";
  el.style.borderRadius = "12px";
  el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.1)";
  el.style.cursor = "pointer";
  el.onclick = () => showCartPage();
  // Icon + badge
  el.innerHTML = `<span style="font-size:18px; margin-right:6px">🛒</span><span id="floating-cart-count" style="font-weight:700"></span>`;
  document.body.appendChild(el);
  return el;
}

export function updateCartUI() {
  const el = ensureFloatingCart();
  const badge = el.querySelector("#floating-cart-count");
  const totalItems = (cart || []).reduce((s, i) => s + (i.quantity || 0), 0);
  badge.textContent = `${totalItems}`;

  // Mostrar el carrito flotante solo cuando el usuario está seleccionando productos
  const showFloating = !pageCart.classList.contains("hidden")
    ? false
    : !pageCategories.classList.contains("hidden") ||
      !pageProducts.classList.contains("hidden") ||
      !pageCustomPizza.classList.contains("hidden");
  el.style.display = showFloating ? "flex" : "none";

  // Si la página del carrito está visible, renderizar contenido del carrito
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
      itemEl.className =
        "cart-item flex items-center justify-between p-3 bg-white rounded-lg mb-3";
      // Mostrar addons si existen
      const addonsHTML =
        item.addons && item.addons.length > 0
          ? `<div class="text-sm text-gray-500 mt-1">
              ${item.addons
                .map(
                  (a) =>
                    `<div class="flex items-center gap-2"><span class="text-xs">${
                      a.emoji || ""
                    }</span><span>${a.name} (+Bs ${a.price.toFixed(
                      2
                    )})</span></div>`
                )
                .join("")}
           </div>`
          : "";
      itemEl.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">${
            item.emoji || "🍕"
          }</div>
          <div>
            <div class="font-semibold">${item.name}</div>
            <div class="text-sm text-gray-500">Bs ${item.price.toFixed(2)}</div>
            ${addonsHTML}
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
    cartTotal.textContent = `Bs ${total.toFixed(2)}`;
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
  if (MB && typeof MB.hide === "function") MB.hide();
  if (BB && typeof BB.hide === "function") BB.hide();
  // Ocultar botón fallback si existe
  const fb = document.getElementById("fallback-pay-button");
  if (fb) fb.style.display = "none";
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
  console.debug("showCategoriesPage called");
  hideAllPages();
  mainHeader.classList.remove("hidden");
  pageCategories.classList.remove("hidden");

  if (MB && typeof MB.onClick === "function") MB.onClick(showCartPage);

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
      console.debug("Category clicked:", config.nombre);
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
  console.debug("Nueva versión de showProductPage cargada");
  hideAllPages();
  pageProducts.classList.remove("hidden");
  if (MB && typeof MB.onClick === "function") MB.onClick(showCartPage);
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
  if (MB && typeof MB.setText === "function") MB.setText("Generar Pizza");
  if (MB && typeof MB.show === "function") MB.show();
  if (MB && typeof MB.onClick === "function")
    MB.onClick(() => {
      // Lógica para generar pizza
    });
  if (BB && typeof BB.show === "function") BB.show();
  if (BB && typeof BB.onClick === "function") BB.onClick(showCategoriesPage);
  if (HF && typeof HF.impactOccurred === "function") HF.impactOccurred("light");
}

export function showCartPage() {
  hideAllPages();
  pageCart.classList.remove("hidden");
  if (MB && typeof MB.setText === "function") MB.setText("Pagar");
  if (MB && typeof MB.show === "function") MB.show();
  if (MB && typeof MB.onClick === "function") MB.onClick(showPaymentMethodPage);
  if (BB && typeof BB.show === "function") BB.show();
  if (BB && typeof BB.onClick === "function") BB.onClick(showCategoriesPage);
  if (HF && typeof HF.impactOccurred === "function") HF.impactOccurred("light");
  // Actualizar el carrito en la UI
  if (typeof updateCartUI === "function") updateCartUI();

  // Si no hay MainButton disponible (o la versión no la soporta), mostrar botón fallback en la página
  let fb = document.getElementById("fallback-pay-button");
  if (!fb) {
    fb = document.createElement("button");
    fb.id = "fallback-pay-button";
    fb.textContent = "Pagar";
    fb.style.position = "fixed";
    fb.style.left = "50%";
    fb.style.transform = "translateX(-50%)";
    fb.style.bottom = "18px";
    fb.style.zIndex = "70";
    fb.style.background = "#2481cc";
    fb.style.color = "#fff";
    fb.style.border = "none";
    fb.style.padding = "12px 20px";
    fb.style.borderRadius = "999px";
    fb.style.boxShadow = "0 8px 24px rgba(36,129,204,0.2)";
    fb.style.fontWeight = "700";
    fb.style.cursor = "pointer";
    fb.onclick = () => {
      try {
        showPaymentMethodPage();
      } catch (e) {
        console.error("fallback pay click error", e);
      }
    };
    document.body.appendChild(fb);
  }

  // Mostrar fallback cuando:
  // - no exista MainButton compatible, OR
  // - estemos en `localhost` (pruebas locales), OR
  // - se pase el parámetro `?force_fallback=1` en la URL para forzar pruebas
  const urlParams = new URL(window.location.href).searchParams;
  const forceFallback = urlParams.get("force_fallback") === "1";
  const runningLocally =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const shouldShowFallback =
    forceFallback || runningLocally || !(MB && typeof MB.show === "function");
  fb.style.display = shouldShowFallback ? "block" : "none";
  // Actualizar estado del botón de pago según si hay ubicación seleccionada
  try {
    if (typeof window.refreshPayButtonState === "function")
      window.refreshPayButtonState();
  } catch (e) {}
}

export function showPaymentMethodPage() {
  hideAllPages();
  pagePaymentMethod.classList.remove("hidden");
  if (MB && typeof MB.hide === "function") MB.hide();
  if (BB && typeof BB.show === "function") BB.show();
  if (BB && typeof BB.onClick === "function") BB.onClick(showCartPage);
  if (HF && typeof HF.impactOccurred === "function") HF.impactOccurred("light");

  // Asegurar que el botón fallback no esté visible en la pantalla de pago
  const fb = document.getElementById("fallback-pay-button");
  if (fb) fb.style.display = "none";
}

export async function showMyOrdersPage() {
  hideAllPages();
  pageMyOrders.classList.remove("hidden");
  if (MB && typeof MB.hide === "function") MB.hide();
  if (BB && typeof BB.show === "function") BB.show();
  if (BB && typeof BB.onClick === "function") BB.onClick(showWelcomePage);

  myOrdersList.innerHTML =
    "<div class='text-center text-gray-500'>Cargando pedidos...</div>";

  // Añadir indicador de depuración ligero para ayudar en pruebas locales
  try {
    let dbg = document.getElementById("orders-debug");
    if (!dbg) {
      dbg = document.createElement("div");
      dbg.id = "orders-debug";
      dbg.style.fontSize = "12px";
      dbg.style.color = "#6b7280";
      dbg.style.marginBottom = "8px";
      const header = pageMyOrders.querySelector("h2");
      if (header && header.parentNode)
        header.parentNode.insertBefore(dbg, header.nextSibling);
    }
    dbg.textContent = "Cargando...";
  } catch (e) {
    /* noop */
  }

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
    try {
      const dbg = document.getElementById("orders-debug");
      if (dbg) dbg.textContent = `Pedidos cargados: ${myOrders.length}`;
    } catch (e) {
      /* noop */
    }
    if (myOrders.length === 0) {
      noOrdersMsg.classList.remove("hidden");
    } else {
      noOrdersMsg.classList.add("hidden");
      myOrders.forEach((order) => {
        const orderTotal = (order.items || []).reduce(
          (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
          0
        );
        // build short description: first two items
        const itemNames = (order.items || []).map(
          (it) => `${it.name}${it.quantity ? " x" + it.quantity : ""}`
        );
        const shortDesc =
          itemNames.length === 0
            ? "Sin artículos"
            : itemNames.slice(0, 2).join(", ") +
              (itemNames.length > 2 ? "..." : "");
        const showTrackingBtn =
          String(order.status || "").toLowerCase() !== "entregado"
            ? `<button class="btn-view-tracking bg-blue-600 text-white px-3 py-2 rounded" data-order-id="${order.id}">Ver seguimiento</button>`
            : `<!-- entregado: seguimiento oculto -->`;

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
                      <p class="text-sm text-gray-500">${shortDesc}</p>
                      <p class="text-sm text-gray-500">${order.items.reduce(
                        (sum, item) => sum + (item.quantity || 0),
                        0
                      )} productos - Total: Bs ${orderTotal.toFixed(2)}</p>
                      <p class="text-sm text-gray-500">Realizado el: ${new Date(
                        order.date
                      ).toLocaleString("es-ES")}</p>
                      <p class="text-sm text-gray-500">Cliente: ${
                        order.customer_name || order.chat_id || "Anónimo"
                      }</p>
                      <div class="mt-3 flex gap-2">
                        ${showTrackingBtn}
                        <button class="btn-view-detail bg-white border px-3 py-2 rounded" data-order-id="${
                          order.id
                        }">Ver detalle</button>
                      </div>
                  </div>
              `;
        myOrdersList.innerHTML = orderHTML + myOrdersList.innerHTML;
      });
      // Delegación de eventos para botones dentro de la lista de pedidos
      if (!myOrdersList._hasClickHandler) {
        myOrdersList.addEventListener("click", (ev) => {
          const btn = ev.target.closest && ev.target.closest("button");
          if (!btn) return;
          const oid = btn.dataset && btn.dataset.orderId;
          if (!oid) return;
          if (btn.classList.contains("btn-view-tracking")) {
            try {
              showOrderTrackingPage(oid);
            } catch (e) {
              console.warn("showOrderTrackingPage missing", e);
            }
          } else if (btn.classList.contains("btn-view-detail")) {
            try {
              showOrderDetailModal(oid);
            } catch (e) {
              console.warn("showOrderDetailModal missing", e);
            }
          }
        });
        myOrdersList._hasClickHandler = true;
      }
    }
  } catch (e) {
    myOrdersList.innerHTML = `<p class='text-red-600'>Error cargando pedidos: ${e.message}</p>`;
  }
}

import { BACKEND_URL } from "./config.js";

export async function showOrderTrackingPage(orderId) {
  console.debug("showOrderTrackingPage init", orderId);
  hideAllPages();
  pageOrderTracking.classList.remove("hidden");
  if (MB && typeof MB.hide === "function") MB.hide();
  if (BB && typeof BB.show === "function") BB.show();
  if (BB && typeof BB.onClick === "function")
    BB.onClick(() => {
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

  // Actualiza la línea de tiempo estática según el estado normalizado
  function updateTimeline(normStatus) {
    try {
      const steps = [
        { id: "step-confirmado", keys: ["confirm", "confirmado"] },
        {
          id: "step-preparacion",
          keys: ["preparacion", "preparando", "enproceso"],
        },
        {
          id: "step-asignado",
          keys: [
            "repartidorasignado",
            "asignado",
            "aceptado",
            "repartidoraceptado",
          ],
        },
        {
          id: "step-camino",
          keys: [
            "encamino",
            "en_camino",
            "encamino",
            "encaminar",
            "salio",
            "enruta",
          ],
        },
        { id: "step-entregado", keys: ["entregado", "delivered"] },
      ];

      // Determinar el índice del paso actual
      let current = 0;
      for (let i = 0; i < steps.length; i++) {
        const keys = steps[i].keys || [];
        if (keys.some((k) => normStatus.includes(k))) {
          current = i;
          break;
        }
      }

      // Aplicar clases
      steps.forEach((step, idx) => {
        const el = document.getElementById(step.id);
        if (!el) return;
        el.classList.remove("active");
        el.classList.remove("completed");
        if (idx < current) el.classList.add("completed");
        else if (idx === current) el.classList.add("active");
      });
    } catch (e) {
      /* noop */
    }
  }

  async function refreshTracking() {
    // Implementación simplificada y robusta para refrescar el tracking
    try {
      console.debug("refreshTracking running for", orderId);
      const resp = await fetch(
        `${BACKEND_URL}/get_order/${encodeURIComponent(orderId)}`
      );
      if (!resp.ok) throw new Error("No se pudo obtener el pedido");
      const order = await resp.json();

      // Actualizar número y dataset
      const trackingNumEl = document.getElementById("tracking-order-number");
      if (trackingNumEl) trackingNumEl.textContent = order.id || "-";
      else trackingOrderId.textContent = `Pedido #${order.id || "-"}`;
      btnRateOrder.dataset.orderId = order.id;

      const s = (order.status || "").toString();
      const normStatus = s.toLowerCase().replace(/\s+|_/g, "");
      // Actualizar timeline visual
      updateTimeline(normStatus);
      const badge = document.getElementById("status-badge");
      const title = document.getElementById("status-title");
      const desc = document.getElementById("status-desc");
      const driverBox = document.getElementById("driver-box");

      if (badge) {
        badge.textContent = s.toUpperCase();
        if (/entregado/i.test(s))
          badge.className = "status-badge status-en-camino";
        else if (/en\s*camino|encamino|en_camino/i.test(s))
          badge.className = "status-badge status-en-camino";
        else badge.className = "status-badge status-pendiente";
      }
      if (title) {
        if (/en\s*camino|encamino|en_camino/i.test(s))
          title.textContent = "¡Tu pedido está cerca!";
        else if (/entregado/i.test(s))
          title.textContent = "¡Disfruta tu comida!";
        else title.textContent = s || "Desconocido";
      }
      if (desc) {
        if (/en\s*camino|encamino|en_camino/i.test(s))
          desc.textContent = "El repartidor se dirige a tu ubicación.";
        else if (/entregado/i.test(s))
          desc.textContent = "El pedido ha sido entregado.";
        else desc.textContent = "Procesando tu orden...";
      }
      if (driverBox) {
        if (
          /en\s*camino|encamino|en_camino|repartidorasignado|repartidor asignado|asignado|aceptado/i.test(
            s
          )
        )
          driverBox.style.display = "flex";
        else driverBox.style.display = "none";
      }

      // Calcular ETA sencillo si hay coordenadas
      try {
        const etaEl = document.getElementById("tracking-eta-small");
        if (etaEl && order && order.location) {
          const rest =
            order.restaurant_map_location || order.restaurant_location;
          if (rest && rest.latitude && rest.longitude) {
            const toRad = (v) => (v * Math.PI) / 180;
            const R = 6371;
            const dLat = toRad(order.location.latitude - rest.latitude);
            const dLon = toRad(order.location.longitude - rest.longitude);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(rest.latitude)) *
                Math.cos(toRad(order.location.latitude)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const dkm = R * c;
            const kitchenBase = 15;
            const kitchenPerItem = 2;
            const itemsCount = (order.items || []).length;
            const etaMin = Math.round(
              kitchenBase +
                Math.max(0, itemsCount - 1) * kitchenPerItem +
                dkm * 2
            );
            etaEl.textContent = `${etaMin} min`;
          }
        }
      } catch (e) {
        console.debug("ETA calc failed", e);
      }

      // Actualizar mapa si corresponde
      const mapStates = [
        "repartidorasignado",
        "repartidoraceptado",
        "asignado",
        "aceptado",
        "encamino",
        "en_camino",
        "en camino",
      ];
      try {
        if (mapStates.includes(normStatus)) {
          // Ensure we have a client location (fallback to in-memory/window state when backend hasn't saved it yet)
          try {
            if (
              !order.location ||
              !order.location.latitude ||
              !order.location.longitude
            ) {
              if (
                window.userLocation &&
                window.userLocation.latitude &&
                window.userLocation.longitude
              )
                order.location = window.userLocation;
              else if (typeof window !== "undefined" && window.userLocation)
                order.location = window.userLocation;
            }
          } catch (e) {}
          if (window.showTrackingMap) window.showTrackingMap(order);
          if (window.updateTrackingMarkers) window.updateTrackingMarkers(order);
        } else {
          if (window.stopTrackingMarkers) window.stopTrackingMarkers();
        }
      } catch (e) {
        console.warn("updateTrackingMarkers failed", e);
      }

      // Banner cuando cambia el estado
      if (lastOrderStatus && lastOrderStatus !== s)
        showStatusBanner(`Estado actualizado: ${s}`, "bg-green-600");
      lastOrderStatus = s;

      // Si entregado, detener polling
      if (/entregado/i.test(s)) {
        try {
          if (trackingInterval) {
            clearInterval(trackingInterval);
            trackingInterval = null;
          }
          try {
            btnRateOrder.classList.remove("hidden");
          } catch (e) {}
        } catch (e) {}
      }
    } catch (e) {
      console.warn("refreshTracking error", e);
    }
  }

  // Ejecutar inmediatamente y luego iniciar intervalo de polling cada 5s
  try {
    await refreshTracking();
    if (!trackingInterval)
      trackingInterval = setInterval(refreshTracking, 5000);
  } catch (e) {
    console.warn("init tracking failed", e);
  }
}

// Modal de detalle rápido para un pedido
export async function showOrderDetailModal(orderId) {
  hideAllPages();
  // Cargar el pedido desde el backend si es posible
  let order = null;
  try {
    const resp = await fetch(
      `${BACKEND_URL}/get_order/${encodeURIComponent(orderId)}`
    );
    if (resp.ok) order = await resp.json();
  } catch (e) {
    console.warn("Error fetching order for detail modal", e);
  }
  // Si no lo obtuvimos, buscar en myOrders
  if (!order) {
    order = (window.myOrders || []).find(
      (o) => String(o.id) === String(orderId)
    );
  }
  // Construir modal
  const html = `
    <h3 class="text-lg font-bold mb-2">Detalle Pedido #${orderId}</h3>
    <div class="mb-2 text-sm text-gray-700">Estado: <strong>${
      order?.status || "Desconocido"
    }</strong></div>
    <div class="mb-2 text-sm text-gray-700">Cliente: ${
      order?.customer_name || order?.chat_id || "Anónimo"
    }</div>
    <div class="mb-2 text-sm text-gray-700">Dirección: ${
      order?.address || "No disponible"
    }</div>
    <div class="mb-2 text-sm text-gray-700">Total: Bs ${
      order?.total || "0.00"
    }</div>
    <div class="mb-2 text-sm text-gray-700">Items:</div>
    <ul class="mb-4 text-sm text-gray-600">${(order?.items || [])
      .map(
        (it) =>
          `<li>${it.name} ${it.quantity ? " x" + it.quantity : ""} - Bs ${(
            it.price || 0
          ).toFixed(2)}</li>`
      )
      .join("")}</ul>
    <div class="flex gap-2">
      <button id="detail-track-btn" class="w-full bg-blue-600 text-white px-3 py-2 rounded">Ver seguimiento</button>
      <button id="detail-close-btn" class="w-full bg-white border px-3 py-2 rounded">Cerrar</button>
    </div>
  `;
  // Crear overlay manualmente (no dependemos de createOverlay en app.js)
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";
  overlay.innerHTML = `<div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">${html}</div>`;
  document.body.appendChild(overlay);
  // Hook botones
  const btnClose = overlay.querySelector("#detail-close-btn");
  const btnTrack = overlay.querySelector("#detail-track-btn");
  if (btnClose) btnClose.onclick = () => overlay.remove();
  if (btnTrack)
    btnTrack.onclick = () => {
      try {
        overlay.remove();
        showOrderTrackingPage(orderId);
      } catch (e) {
        console.warn(e);
      }
    };
}

export function showRateDriverPage(orderId) {
  hideAllPages();
  pageRateDriver.classList.remove("hidden");
  tg.MainButton.hide();
  tg.BackButton.show();
  tg.BackButton.onClick(() => showOrderTrackingPage(orderId));

  const ratingNumEl = document.getElementById("rating-order-number");
  if (ratingNumEl) ratingNumEl.textContent = orderId;
  else ratingOrderId.textContent = `Pedido #${orderId}`;
  btnSubmitRating.dataset.orderId = orderId;

  currentRating = 0;
  document.querySelectorAll(".rating-stars span").forEach((star) => {
    star.classList.remove("selected");
  });
  document.getElementById("rating-comments").value = "";
}
