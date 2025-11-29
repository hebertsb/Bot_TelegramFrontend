import { tg } from "./telegram.js";

import {
  cart,
  myOrders,
  currentRating,
  userLocation,
  userChatId,
} from "./state.js";
import { BACKEND_URL } from "./config.js";
import {
  showWelcomePage,
  showCategoriesPage,
  showProductPage,
  showCustomPizzaPage,
  showCartPage,
  showPaymentMethodPage,
  showMyOrdersPage,
  showOrderTrackingPage,
  showRateDriverPage,
  mostrarModalSugerencias,
  setMenuCache,
  updateCartUI,
} from "./ui.js";

// --- Leaflet Tracking Map Variables ---
let trackingMap = null;
let trackingClientMarker = null;
let trackingDeliveryMarker = null;
import {
  pageWelcome,
  mainHeader,
  pageCategories,
  pageProducts,
  productTitle,
  productListContainer,
  pageCustomPizza,
  pageCart,
  cartItemsList,
  cartEmptyMsg,
  cartTotal,
  pagePaymentMethod,
  pageMyOrders,
  myOrdersList,
  noOrdersMsg,
  pageOrderTracking,
  trackingOrderId,
  btnRateOrder,
  pageRateDriver,
  ratingOrderId,
  ratingStarsContainer,
  btnSubmitRating,
  btnMyOrders,
  btnBack,
  btnBackCustom,
  btnBackCart,
  btnBackPayment,
  btnBackMyOrders,
  btnBackTracking,
  btnBackRating,
  btnGeneratePizza,
  btnAddCustomPizza,
  btnPayCash,
  btnPayCard,
  btnGetLocation,
  locationText,
  addressDetailsInput,
} from "./ui.js";

import { fetchProducts } from "./data.js";
// --- Tracking map DOM y función ---
const trackingMapDiv = document.getElementById("tracking-map");
function showTrackingMap(order) {
  if (!trackingMapDiv) return;
  // Solo inicializar una vez
  if (!trackingMap) {
    trackingMap = L.map("tracking-map").setView([-17.7833, -63.1821], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(trackingMap);
  } else {
    trackingMap.invalidateSize();
  }
  // Limpiar marcadores previos
  if (trackingClientMarker) {
    trackingMap.removeLayer(trackingClientMarker);
    trackingClientMarker = null;
  }
  // Mostrar ubicación del cliente si existe
  if (
    order &&
    order.location &&
    order.location.latitude &&
    order.location.longitude
  ) {
    trackingClientMarker = L.marker(
      [order.location.latitude, order.location.longitude],
      {
        icon: L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
      }
    )
      .addTo(trackingMap)
      .bindPopup("Tu ubicación de entrega")
      .openPopup();
    trackingMap.setView(
      [order.location.latitude, order.location.longitude],
      15
    );
  }
  // (En el futuro: agregar marker del delivery aquí)
}

// --- Leaflet Map Variables ---
let leafletMap = null;
let leafletMarker = null;
const mapModal = document.getElementById("map-modal");
const closeMapModal = document.getElementById("close-map-modal");
const saveLocationBtn = document.getElementById("save-location");

// --- Lógica de la Aplicación ---

// --- Cargar/Guardar Pedidos (Persistencia) ---
function saveOrdersToStorage() {
  try {
    localStorage.setItem("myOrders", JSON.stringify(myOrders));
  } catch (e) {
    console.error("Error guardando en localStorage:", e);
  }
}

// Nueva función: cargar pedidos del backend filtrando por chat_id
async function loadOrdersFromBackend() {
  try {
    const chatIdFromWebApp =
      tg &&
      tg.initDataUnsafe &&
      tg.initDataUnsafe.user &&
      tg.initDataUnsafe.user.id
        ? tg.initDataUnsafe.user.id
        : null;
    const chatId = window.userChatId || userChatId || chatIdFromWebApp;
    if (!chatId) {
      console.warn("No chat_id available; skipping loadOrdersFromBackend");
      myOrders.splice(0, myOrders.length);
      return;
    }

    const response = await fetch(`${BACKEND_URL}/get_orders`);
    if (!response.ok) throw new Error("No se pudo obtener los pedidos");
    const allOrders = await response.json();
    console.log("Loaded orders from backend:", allOrders.length || allOrders);
    // Filtrar solo los pedidos de este usuario
    const userOrders = allOrders.filter(
      (o) => String(o.chat_id) === String(chatId)
    );
    myOrders.splice(0, myOrders.length, ...userOrders);
    console.log(`Found ${userOrders.length} orders for chat_id=${chatId}`);
  } catch (e) {
    console.error("Error leyendo pedidos del backend:", e);
    myOrders.splice(0, myOrders.length);
  }
}
// Exponer para que ui.js pueda llamarla
window.loadOrdersFromBackend = loadOrdersFromBackend;

function handlePayment() {
  // --- CAMBIO MAPA (Sugerencia 1) ---
  // --- PEGA ESTE CÓDIGO NUEVO ---
  if (cart.length === 0) {
    tg.showAlert("Carrito Vacío", "Añade algunos productos antes de pagar.");
    return;
  }

  // Validar que el usuario haya seleccionado ubicación en el mapa Y escrito detalles
  const addressDetails = addressDetailsInput.value.trim();
  const currentLocation = window.userLocation || userLocation;
  if (!currentLocation || addressDetails.length < 10) {
    let msg = "";
    if (!currentLocation && addressDetails.length < 10) {
      msg =
        'Por favor, selecciona tu ubicación en el mapa y escribe tu dirección completa en el campo "Detalles" (Ej: Barrio Las Gramas, Casa 123).';
    } else if (!currentLocation) {
      msg = "Por favor, selecciona tu ubicación en el mapa.";
    } else {
      msg =
        'Por favor, escribe tu dirección completa en el campo "Detalles" (Ej: Barrio Las Gramas, Casa 123).';
    }
    tg.showAlert("Dirección Faltante", msg);
    return;
  }
  showPaymentMethodPage();
}

async function showFinalConfirmation(paymentMethod, paymentDetails = null) {
  tg.HapticFeedback.notificationOccurred("success");

  // Combinar lat/long con detalles de dirección
  const addressDetails = addressDetailsInput.value.trim();
  let fullAddress = addressDetails; // Ej: "Barrio Las Gramas, Casa 123"

  // Hacemos el mapa opcional: Si SÍ funcionó, lo añadimos
  const currentLocation = window.userLocation || userLocation;
  if (currentLocation) {
    fullAddress += ` (Coords: ${currentLocation.latitude.toFixed(
      4
    )}, ${currentLocation.longitude.toFixed(4)})`;
  }

  const newOrder = {
    id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    // Items preparados: merge heurístico para anidar adicionales en pizzas
    items: (function buildItemsFromCart(c) {
      const out = [];
      for (const it of c) {
        // Si ya es una instancia de pizza (tiene addons array), la conservamos
        if (it && Array.isArray(it.addons)) {
          // asegurar numericidad
          it.price = parseFloat((it.price || 0).toFixed(2));
          out.push(it);
          continue;
        }

        // Heurística: si el item está marcado como addon y hay una pizza previa,
        // lo anexamos a la última pizza del array (esto cubre el flujo usual).
        const isAddon = !!(it && it.isAddon) ||
          (it && String(it.id).toLowerCase().startsWith("adic"));

        if (isAddon && out.length > 0) {
          // anexar al último pizza si éste tiene addons (o convertirlo si es pizza)
          const last = out[out.length - 1];
          if (last && Array.isArray(last.addons)) {
            const addon = { ...it };
            addon.price = parseFloat((addon.price || 0).toFixed(2));
            last.addons.push(addon);
            last.price = parseFloat((last.price + addon.price).toFixed(2));
            continue; // ya incorporado
          }
        }

        // Fallback: item normal (bebida, adicional suelto, etc.)
        const copy = { ...(it || {}), price: parseFloat((it && it.price) || 0) };
        out.push(copy);
      }
      return out;
    })(cart),
    address: fullAddress, // <-- Enviamos la dirección de TEXTO
    location: userLocation, // <-- Esto puede ir null si el mapa falló (¡y está bien!)
    paymentMethod: paymentMethod,
    date: new Date().toISOString(),
    date_ts: Date.now(),
    channel: "telegram_webapp",
    currency: "Bs",
    status: "Pendiente",
    isRated: false,
    total: parseFloat(
      cart
        .reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
        .toFixed(2)
    ),
  };

  // --- INICIO CAMBIO NOTIFICACIONES (Sugerencias 2, 3, 4) ---
  try {
    const mb = tg.mainButton || tg.MainButton || null;
    if (mb && typeof mb.showProgress === "function") mb.showProgress(true);

    // Determinar chat_id prioritizando window.userChatId, luego importado, luego initDataUnsafe
    const chatIdFromWebApp =
      tg &&
      tg.initDataUnsafe &&
      tg.initDataUnsafe.user &&
      tg.initDataUnsafe.user.id
        ? tg.initDataUnsafe.user.id
        : null;
    const chat_id = window.userChatId || userChatId || chatIdFromWebApp;

    // Adjuntar detalles de pago si existen (ej. tarjeta enmascarada)
    if (paymentDetails) {
      newOrder.paymentDetails = paymentDetails;
    }

    const payload = {
      chat_id: String(chat_id || ""),
      order: newOrder,
      notify_restaurant: true,
    };
    console.log("Submitting order payload:", payload);

    const response = await fetch(`${BACKEND_URL}/submit_order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(
        errorResponse.message || "El servidor del backend falló."
      );
    }

    const result = await response.json();

    // Si el backend devuelve un order_id, usarlo como id canónico
    const returnedId =
      result && result.order_id ? result.order_id : newOrder.id;
    newOrder.id = returnedId;

    myOrders.push(newOrder);
    saveOrdersToStorage();

    // Vaciar el carrito correctamente (no reasignar la variable importada)
    if (Array.isArray(cart)) cart.splice(0, cart.length);
    // Actualizar UI del carrito
    if (typeof updateCartUI === "function") updateCartUI();
    // Limpiar ubicación usada (guardada en window)
    window.userLocation = null;
    locationText.textContent = "";
    addressDetailsInput.value = "";

    // Mostrar ticket/factura al usuario antes de cerrar
    const facturaUrl = `${BACKEND_URL}/factura/${encodeURIComponent(
      returnedId
    )}`;
    showOrderTicket(newOrder, facturaUrl, () => {
      // Al cerrar el ticket, cerrar la webapp
      try {
        tg.close();
      } catch (e) {
        console.log("Closing WebApp");
      }
    });
  } catch (error) {
    console.error("Error al enviar el pedido al backend:", error);
    tg.showAlert(
      "Error de Red",
      `No pudimos contactar a nuestro servidor. Por favor, inténtalo de nuevo. (${error.message})`
    );
  } finally {
    if (mb && typeof mb.hideProgress === "function") mb.hideProgress();
  }
  // --- FIN CAMBIO NOTIFICACIONES ---
}

// --- Helpers: modales simples para pago ---
function createOverlay(html) {
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";
  overlay.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">${html}</div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function showCashConfirmation(onConfirm) {
  const html = `
    <h3 class="text-lg font-bold mb-2">Confirmar Pago en Efectivo</h3>
    <p class="mb-4">Confirma que deseas pagar en efectivo al repartidor.</p>
    <div class="flex justify-end gap-2">
      <button id="cash-cancel" class="px-4 py-2 rounded bg-gray-200">Cancelar</button>
      <button id="cash-confirm" class="px-4 py-2 rounded bg-blue-600 text-white">Confirmar</button>
    </div>
  `;
  const ov = createOverlay(html);
  ov.querySelector("#cash-cancel").onclick = () => ov.remove();
  ov.querySelector("#cash-confirm").onclick = () => {
    ov.remove();
    if (onConfirm) onConfirm();
  };
}

function showCardPaymentModal(onConfirm) {
  const html = `
    <h3 class="text-lg font-bold mb-2">Pagar con Tarjeta (Simulado)</h3>
    <div class="space-y-2 mb-4">
      <input id="card-number" placeholder="Número de tarjeta" class="w-full p-2 border rounded" />
      <input id="card-name" placeholder="Nombre en la tarjeta" class="w-full p-2 border rounded" />
      <div class="flex gap-2">
        <input id="card-exp" placeholder="MM/AA" class="flex-1 p-2 border rounded" />
        <input id="card-cvv" placeholder="CVV" class="w-24 p-2 border rounded" />
      </div>
    </div>
    <div class="flex justify-end gap-2">
      <button id="card-cancel" class="px-4 py-2 rounded bg-gray-200">Cancelar</button>
      <button id="card-pay" class="px-4 py-2 rounded bg-green-600 text-white">Pagar (Simulado)</button>
    </div>
  `;
  const ov = createOverlay(html);
  const num = ov.querySelector("#card-number");
  const name = ov.querySelector("#card-name");
  const exp = ov.querySelector("#card-exp");
  const cvv = ov.querySelector("#card-cvv");
  ov.querySelector("#card-cancel").onclick = () => ov.remove();
  ov.querySelector("#card-pay").onclick = () => {
    // Validación mínima
    if (!num.value || num.value.length < 12)
      return alert("Número de tarjeta inválido");
    if (!name.value) return alert("Nombre inválido");
    // Enmascarar
    const masked = `**** **** **** ${num.value.slice(-4)}`;
    ov.remove();
    if (onConfirm) onConfirm({ masked, cardHolder: name.value });
  };
}

// --- Mostrar ticket / factura después del pedido ---
function showOrderTicket(order, facturaUrl, onClose) {
  const itemsHtml = (order.items || [])
    .map((it) => {
      const qty = it.quantity || 1;
      const price = (it.price || 0).toFixed(2);
      const line = `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <div><strong>${it.name}</strong> ${
        it.emoji || ""
      } <div style="font-size:12px;color:#666">x${qty}</div></div>
        <div style="text-align:right">Bs ${(it.price * qty).toFixed(2)}</div>
      </div>`;
      if (it.addons && it.addons.length) {
        const addons = it.addons
          .map(
            (a) =>
              `<div style="font-size:12px;color:#666;margin-left:8px">+ ${
                a.name
              } Bs ${a.price.toFixed(2)}</div>`
          )
          .join("");
        return line + addons;
      }
      return line;
    })
    .join("");

  const html = `
    <h3 style="font-size:18px;margin-bottom:8px">Pedido Recibido</h3>
    <div style="margin-bottom:8px">Pedido: <strong>${order.id}</strong></div>
    <div style="margin-bottom:8px">Fecha: ${order.date} </div>
    <div style="margin-bottom:8px">Dirección: ${order.address || ""}</div>
    <div style="margin-bottom:8px">Método de pago: ${
      order.paymentMethod || ""
    }</div>
    <div style="margin:8px 0;padding:8px;border:1px solid #eee;border-radius:6px">${itemsHtml}</div>
    <div style="display:flex;justify-content:space-between;font-weight:bold;margin-bottom:12px">Total:<div>Bs ${order.total.toFixed(
      2
    )}</div></div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button id="btn-open-factura" style="padding:8px 12px;border-radius:6px;border:1px solid #eee;background:#fafafa;">Abrir Factura</button>
      <button id="btn-close-ticket" style="padding:8px 12px;border-radius:6px;background:#2563eb;color:white;border:none;">Finalizar</button>
    </div>
  `;

  const ov = createOverlay(html);
  ov.querySelector("#btn-open-factura").onclick = () => {
    try {
      window.open(facturaUrl, "_blank");
    } catch (e) {
      console.log("Open factura", e);
    }
  };
  ov.querySelector("#btn-close-ticket").onclick = () => {
    ov.remove();
    if (onClose) onClose();
  };
}

async function addToCart(item) {
  // Si es una pizza, crear una instancia separada que pueda tener addons
  if (item && item.id && String(item.id).startsWith("pizza")) {
    const instanceId = `${item.id}_${Date.now()}`;
    const pizzaItem = {
      id: instanceId,
      baseId: item.id,
      name: item.name,
      emoji: item.emoji,
      basePrice: item.price,
      price: item.price, // precio por unidad incluyendo addons
      quantity: 1,
      addons: [],
    };
    cart.push(pizzaItem);
    tg.HapticFeedback.notificationOccurred("success");
    if (typeof updateCartUI === "function") updateCartUI();

    // Mostrar modal de sugerencias y fusionar adicionales con esta pizza
    if (!window._menuCache) {
      const menu = await fetchProducts();
      setMenuCache(menu);
      window._menuCache = menu;
    } else {
      setMenuCache(window._menuCache);
    }

    mostrarModalSugerencias(item, (items, irCarrito) => {
      if (Array.isArray(items) && items.length > 0) {
        items.forEach((prod) => {
          if (prod.isAddon) {
            // añadir al array de addons de la pizza y sumar precio
            pizzaItem.addons.push({ ...prod });
            pizzaItem.price = parseFloat(
              (pizzaItem.price + prod.price).toFixed(2)
            );
          } else if (prod.isDrink) {
            // bebidas como items independientes
            const drinkItem = {
              id: `drink_${prod.id}_${Date.now()}`,
              name: prod.name,
              price: prod.price,
              emoji: prod.emoji,
              quantity: prod.quantity || 1,
            };
            cart.push(drinkItem);
          } else {
            // fallback: si no está marcado, añadir como item separado
            const fallback = {
              id: `${prod.id}_${Date.now()}`,
              name: prod.name,
              price: prod.price,
              emoji: prod.emoji,
              quantity: prod.quantity || 1,
            };
            cart.push(fallback);
          }
        });
      }
      if (irCarrito) {
        showCartPage();
      } else {
        if (typeof updateCartUI === "function") updateCartUI();
      }
    });
    return;
  }

  // Si el item NO es pizza, pero está marcado como adicional, intentar anexarlo
  // a la última pizza del carrito para evitar que queden como items sueltos.
  if (item && item.isAddon) {
    // buscar la última pizza (instancia) en el carrito
    for (let i = cart.length - 1; i >= 0; i--) {
      const possiblePizza = cart[i];
      if (possiblePizza && Array.isArray(possiblePizza.addons)) {
        const addon = { ...item };
        // establecer parentPizzaId para referencia clara
        addon.parentPizzaId = possiblePizza.id || possiblePizza.baseId || null;
        addon.price = parseFloat((addon.price || 0).toFixed(2));
        possiblePizza.addons.push(addon);
        possiblePizza.price = parseFloat(
          (possiblePizza.price + addon.price).toFixed(2)
        );
        if (typeof updateCartUI === "function") updateCartUI();
        tg.HapticFeedback.notificationOccurred("success");
        return;
      }
    }
    // Si no se encontró pizza, caer en comportamiento por defecto y añadir suelto
  }

  // Items no-pizza mantienen comportamiento previo (se agrupan por id)
  const existingItem = cart.find((i) => i.id === item.id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  tg.HapticFeedback.notificationOccurred("success");
  if (typeof updateCartUI === "function") updateCartUI();
}

async function callBackendToCreatePizza() {
  const ingredientsText = document.getElementById("custom-ingredients").value;
  if (ingredientsText.trim() === "") {
    tg.showAlert("Ingredientes Vacíos", "Escribe algunos ingredientes.");
    return;
  }
  document.getElementById("loading-spinner").classList.remove("hidden");
  document.getElementById("pizza-result").classList.add("hidden");
  tg.HapticFeedback.impactOccurred("light");

  // The API Key is no longer here. The backend handles it.
  const apiUrl = `${BACKEND_URL}/generate_pizza_idea`;

  // Convert the comma-separated string into an array of strings.
  const ingredientsArray = ingredientsText
    .split(",")
    .map((ingredient) => ingredient.trim())
    .filter((i) => i);

  const payload = {
    ingredients: ingredientsArray,
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: "Error desconocido del servidor." }));
      throw new Error(errorData.detail || `Error ${response.status}`);
    }

    const pizzaData = await response.json();

    document.getElementById("pizza-name").textContent = pizzaData.name;
    document.getElementById("pizza-description").textContent =
      pizzaData.description;
    document.getElementById("pizza-result").classList.remove("hidden");
  } catch (error) {
    console.error("Error al llamar al backend:", error);
    tg.showAlert(
      "Error de IA",
      `No pudimos generar tu pizza. Error: ${error.message}.`
    );
    document.getElementById("pizza-result").classList.add("hidden");
  } finally {
    document.getElementById("loading-spinner").classList.add("hidden");
  }
}

async function handleHashChange() {
  // Obtener chat_id de la URL si está presente
  const params = new URLSearchParams(window.location.search);
  if (params.get("chat_id")) {
    window.userChatId = params.get("chat_id");
  }
  await loadOrdersFromBackend();
  const hash = window.location.hash;
  if (hash === "#mis-pedidos") {
    showMyOrdersPage();
  } else {
    showWelcomePage();
  }
}

export function init() {
  const btnStartOrder = document.getElementById("btn-start-order");
  const btnMyOrders = document.getElementById("btn-my-orders");
  // ... otros si es necesario

  btnStartOrder.addEventListener("click", showCategoriesPage);
  btnMyOrders.addEventListener("click", showMyOrdersPage);

  btnBack.addEventListener("click", showCategoriesPage);
  btnBackCustom.addEventListener("click", showCategoriesPage);
  btnBackCart.addEventListener("click", (e) => {
    const target = e.currentTarget.dataset.target || "categories";
    if (target === "categories") {
      showCategoriesPage();
    } else {
      showWelcomePage();
    }
  });
  btnBackPayment.addEventListener("click", () =>
    showCartPage(btnBackCart.dataset.target)
  );
  btnBackMyOrders.addEventListener("click", showWelcomePage);
  btnBackTracking.addEventListener("click", showMyOrdersPage);
  btnBackRating.addEventListener("click", (e) => {
    const orderId = e.currentTarget
      .closest("main")
      .querySelector("#rating-order-id")
      .textContent.replace("Pedido #", "");
    showOrderTrackingPage(orderId);
  });

  btnGetLocation.addEventListener("click", () => {
    // Mostrar modal del mapa
    mapModal.classList.remove("hidden");
    setTimeout(() => {
      if (!leafletMap) {
        leafletMap = L.map("leaflet-map").setView([-17.7833, -63.1821], 14); // Santa Cruz por defecto
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
        }).addTo(leafletMap);
        leafletMarker = L.marker([-17.7833, -63.1821], {
          draggable: true,
        }).addTo(leafletMap);
      } else {
        leafletMap.invalidateSize();
      }
      // Si ya hay ubicación previa, centrar y mover el marcador
      const currentLocation = window.userLocation || userLocation;
      if (currentLocation) {
        leafletMap.setView(
          [currentLocation.latitude, currentLocation.longitude],
          16
        );
        leafletMarker.setLatLng([
          currentLocation.latitude,
          currentLocation.longitude,
        ]);
      }
    }, 200);
  });

  closeMapModal.addEventListener("click", () => {
    mapModal.classList.add("hidden");
  });

  saveLocationBtn.addEventListener("click", () => {
    try {
      if (!leafletMarker || typeof leafletMarker.getLatLng !== "function") {
        tg.showAlert(
          "Error",
          "No se pudo obtener la ubicación. Intenta de nuevo."
        );
        return;
      }
      const latlng = leafletMarker.getLatLng();
      // Guardar en window para evitar reasignar la import
      window.userLocation = { latitude: latlng.lat, longitude: latlng.lng };
      locationText.textContent = `Ubicación: ${latlng.lat.toFixed(
        4
      )}, ${latlng.lng.toFixed(4)}`;
      // Intentar reverse-geocoding para rellenar la dirección legible
      (async () => {
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`;
          const resp = await fetch(url, {
            headers: { Accept: "application/json" },
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.display_name) {
              addressDetailsInput.value = data.display_name;
            }
          }
        } catch (e) {
          // no crítico, solo log
          console.warn("Reverse geocode failed:", e);
        }
      })();
    } catch (e) {
      console.error("Error guardando ubicación:", e);
      tg.showAlert(
        "Error",
        "No se pudo guardar la ubicación. Intenta otra vez."
      );
      return;
    }
    locationText.classList.remove("text-red-600");
    locationText.classList.add("text-green-600");
    mapModal.classList.add("hidden");
    tg.HapticFeedback.notificationOccurred("success");
  });

  pageProducts.addEventListener("click", (e) => {
    const button = e.target.closest(".btn-add-cart");
    if (button) {
      const rawId = button.dataset.id;
      const item = {
        id: rawId,
        name: button.dataset.name,
        price: parseFloat(button.dataset.price),
        emoji: button.dataset.emoji,
        // Marca heurística: si el id comienza por 'adic' lo consideramos adicional
        isAddon: rawId ? String(rawId).toLowerCase().startsWith("adic") : false,
      };
      addToCart(item);
    }
  });

  btnAddCustomPizza.addEventListener("click", (e) => {
    const name =
      document.getElementById("pizza-name").textContent ||
      "Pizza Personalizada";
    const item = {
      id: `custom_${new Date().getTime()}`,
      name: name,
      price: parseFloat(e.target.dataset.price),
      emoji: e.target.dataset.emoji,
    };
    addToCart(item);
    showCategoriesPage();
  });

  cartItemsList.addEventListener("click", (e) => {
    const removeButton = e.target.closest(".btn-remove-item");
    if (removeButton) {
      cart.splice(parseInt(removeButton.dataset.index, 10), 1);
      showCartPage(btnBackCart.dataset.target);
      tg.HapticFeedback.notificationOccurred("error");
    }

    const qtyButton = e.target.closest(".btn-qty-change");
    if (qtyButton) {
      const index = parseInt(qtyButton.dataset.index, 10);
      const change = parseInt(qtyButton.dataset.change, 10);
      if (cart[index]) {
        // Asegurarse que el item exista
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
          cart.splice(index, 1);
        }
        showCartPage(btnBackCart.dataset.target);
        tg.HapticFeedback.impactOccurred("light");
      }
    }
  });

  btnPayCash.addEventListener("click", () => {
    const total = cart.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
    showCashConfirmation(() => showFinalConfirmation("Efectivo"));
  });
  btnPayCard.addEventListener("click", () => {
    showCardPaymentModal((cardData) =>
      showFinalConfirmation("Tarjeta (Simulado)", cardData)
    );
  });

  myOrdersList.addEventListener("click", (e) => {
    const orderCard = e.target.closest("[data-order-id]");
    if (orderCard) {
      showOrderTrackingPage(orderCard.dataset.orderId);
    }
  });

  btnRateOrder.addEventListener("click", (e) => {
    showRateDriverPage(e.currentTarget.dataset.orderId);
  });

  // Hook para mostrar el mapa cuando se entra a la página de tracking
  // (Sobrescribe showOrderTrackingPage temporalmente para inyectar el mapa)
  const originalShowOrderTrackingPage = showOrderTrackingPage;
  window.showOrderTrackingPage = function (orderId) {
    originalShowOrderTrackingPage(orderId);
    // Buscar el pedido actual
    const order = myOrders.find((o) => o.id == orderId);
    showTrackingMap(order);
  };

  ratingStarsContainer.addEventListener("click", (e) => {
    const star = e.target.closest("span");
    if (star) {
      currentRating = parseInt(star.dataset.value, 10);
      document.querySelectorAll(".rating-stars span").forEach((s) => {
        s.classList.toggle(
          "selected",
          parseInt(s.dataset.value, 10) <= currentRating
        );
      });
    }
  });

  btnSubmitRating.addEventListener("click", (e) => {
    const orderId = e.currentTarget.dataset.orderId;
    const order = myOrders.find((o) => o.id == orderId);

    if (currentRating === 0) {
      tg.showAlert(
        "Valoración Incompleta",
        "Por favor, selecciona al menos una estrella."
      );
      return;
    }

    if (order) {
      order.isRated = true;
      saveOrdersToStorage();
    }

    tg.HapticFeedback.notificationOccurred("success");
    tg.showAlert(
      "¡Gracias!",
      "Tu valoración ha sido enviada. ¡Apreciamos tu feedback!"
    );

    showMyOrdersPage();
  });

  btnGeneratePizza.addEventListener("click", callBackendToCreatePizza);

  window.addEventListener("load", handleHashChange);
  window.addEventListener("hashchange", handleHashChange);
}
