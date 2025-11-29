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
let trackingRiderMarker = null; // marcador animado del repartidor
// Ubicación fija del restaurante (Plaza 24 de Septiembre, Santa Cruz - usada por el backend)
const RESTAURANT_LOCATION = {
  latitude: -17.7832662,
  longitude: -63.1820985,
  name: "Plaza 24 de Septiembre",
};
// Versión ligeramente desplazada para que el icono del restaurante quede en una calle lateral
const RESTAURANT_MAP_LOCATION = {
  latitude: RESTAURANT_LOCATION.latitude - 0.00035,
  longitude: RESTAURANT_LOCATION.longitude + 0.0006,
};
// Iconos embebidos (data URIs) para evitar dependencias externas en despliegues
const CLIENT_ICON_URI =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><path d='M16 2a8 8 0 100 16 8 8 0 000-16z' fill='%233b82f6'/><path d='M16 18c-4 0-8 6-8 8h16c0-2-4-8-8-8z' fill='%233b82f6'/></svg>";
const REST_ICON_URI =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 32 32'><circle cx='16' cy='12' r='8' fill='%23f97316'/><path d='M16 20c-3 0-6 4-6 6h12c0-2-3-6-6-6z' fill='%23f97316'/></svg>";
const RIDER_ICON_URI =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 32 32'><rect x='6' y='12' width='20' height='8' rx='2' fill='%2310b981'/><circle cx='10' cy='22' r='3' fill='%23000'/><circle cx='22' cy='22' r='3' fill='%23000'/></svg>";
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
let trackingMapDiv = document.getElementById("tracking-map");
function showTrackingMap(order) {
  console.log("showTrackingMap called", order && order.id);
  // Asegurar que el contenedor exista; si no, crearlo dentro de la página de tracking
  if (!trackingMapDiv) {
    const trackingContainer = document.getElementById("page-order-tracking");
    if (trackingContainer) {
      const div = document.createElement("div");
      div.id = "tracking-map";
      div.style.height = "250px";
      div.style.width = "100%";
      div.className = "rounded mb-4";
      // Insertar al inicio de la página de tracking (encima del stepper)
      try {
        trackingContainer.insertBefore(div, trackingContainer.firstChild);
      } catch (e) {
        const firstChild = trackingContainer.querySelector(".mb-6");
        if (firstChild && firstChild.parentNode)
          firstChild.parentNode.insertBefore(div, firstChild.nextSibling);
      }
      // actualizar referencia
      try {
        trackingMapDiv = document.getElementById("tracking-map");
      } catch (e) {
        console.warn("no trackingMapDiv");
      }
    } else {
      console.warn(
        "No se encontró page-order-tracking para crear tracking-map"
      );
    }
  }
  if (!trackingMapDiv) return;
  // Solo inicializar una vez
  if (!trackingMap) {
    trackingMap = L.map("tracking-map").setView([-17.7833, -63.1821], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(trackingMap);
  } else {
    // forzar resize tras renderizar la vista
    setTimeout(() => {
      try {
        trackingMap.invalidateSize();
      } catch (e) {}
    }, 250);
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
          iconUrl: CLIENT_ICON_URI,
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

// Hacer accesible la función de renderizado del mapa desde el window (UI la invoca)
try {
  window.showTrackingMap = showTrackingMap;
} catch (e) {
  /* noop */
}

// --- Leaflet Map Variables ---
let leafletMap = null;
let leafletMarker = null;
let leafletRestaurantMarker = null;
const mapModal = document.getElementById("map-modal");
const closeMapModal = document.getElementById("close-map-modal");
const saveLocationBtn = document.getElementById("save-location");

// --- Lógica de la Aplicación ---

// --- Cargar/Guardar Pedidos (Persistencia) ---
function saveOrdersToStorage() {
  // Preparar referencia al MainButton (si existe) fuera del try/finally
  let mb = tg.mainButton || tg.MainButton || null;
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
      console.warn(
        "No chat_id available; skipping loadOrdersFromBackend (will keep local orders if any)"
      );
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
        const isAddon =
          !!(it && it.isAddon) ||
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
        const copy = {
          ...(it || {}),
          price: parseFloat((it && it.price) || 0),
        };
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
  // Referencia segura al MainButton (si existe)
  let mb = (tg && (tg.mainButton || tg.MainButton)) || null;
  try {
    // mb declarado fuera del bloque try/finally para que esté disponible en finally
    if (mb && typeof mb.showProgress === "function") mb.showProgress(true);

    // Determinar chat_id prioritizando window.userChatId, luego importado, luego initDataUnsafe
    const chatIdFromWebApp =
      tg &&
      tg.initDataUnsafe &&
      tg.initDataUnsafe.user &&
      tg.initDataUnsafe.user.id
        ? tg.initDataUnsafe.user.id
        : null;
    let chat_id = window.userChatId || userChatId || chatIdFromWebApp;
    // Si no hay chat_id y estamos en localhost (pruebas), usar un valor por defecto
    const runningLocally =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const forceFallback =
      new URL(window.location.href).searchParams.get("force_fallback") === "1";
    if (!chat_id && (runningLocally || forceFallback)) {
      console.warn(
        "No chat_id disponible: usando chat_id de prueba 'LOCAL_TEST' para ambiente local"
      );
      chat_id = "LOCAL_TEST";
      try {
        window.userChatId = chat_id;
      } catch (e) {
        /* noop */
      }
    }

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

    // Iniciar polling de estado por 30s (actualiza backend y UI)
    try {
      pollOrderStatus(returnedId, 30000, 5000).catch((e) =>
        console.warn("pollOrderStatus error:", e)
      );
    } catch (e) {
      console.warn("No se pudo iniciar polling:", e);
    }

    myOrders.push(newOrder);
    saveOrdersToStorage();

    // En entorno local/forzado, navegar a Mis pedidos inmediatamente para pruebas
    try {
      if (runningLocally || forceFallback) {
        if (typeof showMyOrdersPage === "function") showMyOrdersPage();
      }
    } catch (e) {
      /* noop */
    }

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

// Poll an order state from backend for a limited time and update UI
async function pollOrderStatus(orderId, durationMs = 30000, intervalMs = 5000) {
  if (!orderId) return;
  const endAt = Date.now() + durationMs;
  let lastStatus = null;

  // show a temporary banner while polling
  function showTempBanner(msg) {
    let b = document.getElementById("order-poll-banner");
    if (!b) {
      b = document.createElement("div");
      b.id = "order-poll-banner";
      b.className =
        "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg text-white font-semibold shadow-lg";
      b.style.background = "#2563eb";
      document.body.appendChild(b);
    }
    b.textContent = msg;
    b.style.opacity = "1";
  }

  try {
    showTempBanner("Buscando actualizaciones del pedido...");
    while (Date.now() < endAt) {
      try {
        const resp = await fetch(
          `${BACKEND_URL}/get_order/${encodeURIComponent(orderId)}`
        );
        if (resp.ok) {
          const order = await resp.json();
          if (order && order.status && order.status !== lastStatus) {
            lastStatus = order.status;
            // actualizar myOrders en memoria
            const idx = myOrders.findIndex(
              (o) => String(o.id) === String(orderId)
            );
            if (idx >= 0) {
              myOrders[idx] = order;
            } else {
              myOrders.push(order);
            }
            try {
              // Mostrar ubicación del restaurante (fija)
              try {
                const restLatLng = [
                  RESTAURANT_MAP_LOCATION.latitude,
                  RESTAURANT_MAP_LOCATION.longitude,
                ];
                // asegurar icono y actualizar
                const restIcon = L.icon({
                  iconUrl: REST_ICON_URI,
                  iconSize: [28, 28],
                  iconAnchor: [14, 28],
                });
                if (!trackingDeliveryMarker) {
                  trackingDeliveryMarker = L.marker(restLatLng, {
                    icon: restIcon,
                  })
                    .addTo(trackingMap)
                    .bindPopup(`${RESTAURANT_LOCATION.name}`);
                  try {
                    trackingDeliveryMarker.openPopup();
                  } catch (e) {}
                } else {
                  try {
                    trackingDeliveryMarker.setLatLng(restLatLng);
                    trackingDeliveryMarker.setIcon(restIcon);
                  } catch (e) {}
                }

                // Si tenemos cliente, dibujar línea entre restaurante y cliente
                if (trackingClientMarker) {
                  try {
                    // eliminar polylines previas
                    if (trackingMap._routeLine) {
                      trackingMap.removeLayer(trackingMap._routeLine);
                      trackingMap._routeLine = null;
                    }
                    const clientLatLng = trackingClientMarker.getLatLng();
                    const poly = L.polyline(
                      [restLatLng, [clientLatLng.lat, clientLatLng.lng]],
                      { color: "#2563eb", dashArray: "6,6" }
                    ).addTo(trackingMap);
                    trackingMap._routeLine = poly;
                  } catch (e) {
                    /* noop */
                  }
                }
                // Mostrar distancia y ETA en un pequeño control si hay cliente
                try {
                  if (order && order.location) {
                    const dkm = computeDistanceKm(
                      RESTAURANT_LOCATION.latitude,
                      RESTAURANT_LOCATION.longitude,
                      order.location.latitude,
                      order.location.longitude
                    );
                    const etaMin = estimateTotalMinutes(
                      dkm,
                      (order.items || []).length
                    );
                    const ctrlId = "tracking-eta-box";
                    let ctrl = document.getElementById(ctrlId);
                    if (!ctrl) {
                      ctrl = document.createElement("div");
                      ctrl.id = ctrlId;
                      ctrl.style.position = "absolute";
                      ctrl.style.left = "12px";
                      ctrl.style.top = "12px";
                      ctrl.style.zIndex = "80";
                      ctrl.style.background = "rgba(255,255,255,0.95)";
                      ctrl.style.padding = "8px 10px";
                      ctrl.style.borderRadius = "8px";
                      ctrl.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
                      ctrl.style.fontSize = "13px";
                      trackingMapDiv.appendChild(ctrl);
                    }
                    ctrl.innerHTML = `Distancia: ${dkm.toFixed(
                      2
                    )} km<br/>ETA aprox: ${Math.round(
                      etaMin
                    )} min (~${Math.round(etaMin)} s demo)`;
                  }
                } catch (e) {
                  /* noop */
                }
              } catch (e) {
                console.warn("Error mostrando marcador restaurante:", e);
              }
              saveOrdersToStorage();

              // Helpers para distancia y ETA
              function computeDistanceKm(lat1, lon1, lat2, lon2) {
                // Haversine
                const toRad = (v) => (v * Math.PI) / 180;
                const R = 6371; // km
                const dLat = toRad(lat2 - lat1);
                const dLon = toRad(lon2 - lon1);
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) *
                    Math.cos(toRad(lat2)) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
              }

              function estimateTotalMinutes(distanceKm, itemsCount) {
                const kitchenBase = 15; // minutos base
                const kitchenPerItem = 2; // minutos por ítem extra
                const kitchen =
                  kitchenBase + Math.max(0, itemsCount - 1) * kitchenPerItem;
                const travelMinutes = distanceKm * 2; // a 30 km/h => 2 min por km
                return kitchen + travelMinutes;
              }

              // Animar el marcador del repartidor desde restaurante hasta cliente en tiempo simulado
              function startDeliveryAnimation(order, options = {}) {
                try {
                  if (!order || !order.location) return;
                  const clientLat = order.location.latitude;
                  const clientLon = order.location.longitude;
                  const rest = [
                    RESTAURANT_MAP_LOCATION.latitude,
                    RESTAURANT_MAP_LOCATION.longitude,
                  ];
                  const client = [clientLat, clientLon];
                  const dkm = computeDistanceKm(
                    RESTAURANT_MAP_LOCATION.latitude,
                    RESTAURANT_MAP_LOCATION.longitude,
                    clientLat,
                    clientLon
                  );
                  const etaMin = estimateTotalMinutes(
                    dkm,
                    (order.items || []).length
                  );
                  // demo: 1 min real = 1 s demo
                  const durationSec = Math.max(5, Math.round(etaMin));
                  const durationMs = durationSec * 1000;

                  if (!trackingMap) showTrackingMap(order);

                  // crear el marcador del repartidor si no existe
                  const riderIcon = L.icon({
                    iconUrl: RIDER_ICON_URI,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18],
                  });
                  if (!trackingRiderMarker) {
                    trackingRiderMarker = L.marker(rest, { icon: riderIcon })
                      .addTo(trackingMap)
                      .bindPopup("Repartidor");
                  } else {
                    trackingRiderMarker.setLatLng(rest);
                    trackingRiderMarker.setIcon(riderIcon);
                  }

                  // animación simple: interpolar lat/lon en tiempo
                  const start = performance.now();
                  const startLat = rest[0],
                    startLon = rest[1];
                  const endLat = client[0],
                    endLon = client[1];
                  let rafId = null;
                  function step(ts) {
                    const t = Math.min(1, (ts - start) / durationMs);
                    const curLat = startLat + (endLat - startLat) * t;
                    const curLon = startLon + (endLon - startLon) * t;
                    try {
                      trackingRiderMarker.setLatLng([curLat, curLon]);
                    } catch (e) {}
                    if (t < 1) {
                      rafId = requestAnimationFrame(step);
                    } else {
                      // Al terminar, colocar el repartidor en la ubicación del cliente
                      try {
                        trackingRiderMarker.setLatLng([endLat, endLon]);
                      } catch (e) {}
                    }
                  }
                  // Cancel previous animation if any
                  if (trackingMap && trackingMap._routeRider) {
                    try {
                      cancelAnimationFrame(trackingMap._routeRider);
                    } catch (e) {}
                    trackingMap._routeRider = null;
                  }
                  trackingMap._routeRider = requestAnimationFrame(step);
                  // Guardar referencia para poder cancelarla
                  trackingMap._riderStop = () => {
                    if (trackingMap && trackingMap._routeRider) {
                      try {
                        cancelAnimationFrame(trackingMap._routeRider);
                      } catch (e) {}
                      trackingMap._routeRider = null;
                    }
                  };
                  return { durationSec };
                } catch (e) {
                  console.warn("startDeliveryAnimation error", e);
                  return null;
                }
              }

              function stopDeliveryAnimation() {
                try {
                  if (trackingMap && trackingMap._riderStop)
                    trackingMap._riderStop();
                  if (trackingRiderMarker) {
                    try {
                      trackingMap.removeLayer(trackingRiderMarker);
                    } catch (e) {}
                    trackingRiderMarker = null;
                  }
                } catch (e) {}
              }

              // Exponer a window para que ui.js pueda invocarlo
              window.startDeliveryAnimation = startDeliveryAnimation;
              window.stopDeliveryAnimation = stopDeliveryAnimation;
            } catch (e) {
              /* noop */
            }
            // Mostrar el estado textual en el banner mientras hacemos polling
            try {
              showTempBanner(`Estado: ${order.status}`);
            } catch (e) {
              /* noop */
            }
            // Si el usuario está en la vista Mis pedidos, refrescarla
            try {
              if (
                !pageMyOrders.classList.contains("hidden") &&
                typeof showMyOrdersPage === "function"
              ) {
                showMyOrdersPage();
              }
            } catch (e) {
              /* noop */
            }
          }
        }
      } catch (e) {
        console.warn("pollOrderStatus fetch error:", e);
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  } finally {
    // hide banner and navigate to Mis pedidos
    const b = document.getElementById("order-poll-banner");
    if (b) {
      b.style.opacity = "0";
      setTimeout(() => b.remove(), 400);
    }
    try {
      if (typeof showMyOrdersPage === "function") showMyOrdersPage();
    } catch (e) {
      console.warn("No se pudo mostrar Mis pedidos automáticamente:", e);
    }
  }
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

  // Calcular ETA aproximado si hay coordenadas en el pedido
  let etaHtml = "";
  try {
    if (
      order &&
      order.location &&
      order.location.latitude &&
      order.location.longitude
    ) {
      const dkm = computeDistanceKm(
        RESTAURANT_LOCATION.latitude,
        RESTAURANT_LOCATION.longitude,
        order.location.latitude,
        order.location.longitude
      );
      const etaMin = estimateTotalMinutes(dkm, (order.items || []).length);
      etaHtml = `<div style="margin-bottom:8px">ETA aprox: ${Math.round(
        etaMin
      )} min (~${Math.round(etaMin)} s demo)</div>`;
    }
  } catch (e) {
    /* noop */
  }

  const html = `
    <h3 style="font-size:18px;margin-bottom:8px">Pedido Recibido</h3>
    <div style="margin-bottom:8px">Pedido: <strong>${order.id}</strong></div>
    <div style="margin-bottom:8px">Fecha: ${formatDateLocal(order.date)}</div>
    <div style="margin-bottom:8px">Dirección: ${order.address || ""}</div>
    ${etaHtml}
    <div style="margin-bottom:8px">Método de pago: ${
      order.paymentMethod || ""
    }</div>
    <div style="margin:8px 0;padding:8px;border:1px solid #eee;border-radius:6px">${itemsHtml}</div>
    <div style="display:flex;justify-content:space-between;font-weight:bold;margin-bottom:12px">Total:<div>${
      order.currency || "Bs"
    } ${Number(order.total).toFixed(2)}</div></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
      <button id="btn-open-factura" style="padding:8px 12px;border-radius:6px;border:1px solid #eee;background:#fafafa;">Abrir Factura</button>
      <button id="btn-view-orders" style="padding:8px 12px;border-radius:6px;background:#10b981;color:white;border:none;">Ver mis pedidos</button>
      <button id="btn-keep-shopping" style="padding:8px 12px;border-radius:6px;background:#6b7280;color:white;border:none;">Seguir comprando</button>
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
  ov.querySelector("#btn-view-orders").onclick = () => {
    try {
      ov.remove();
      // Mostrar la página de mis pedidos
      if (typeof showMyOrdersPage === "function") showMyOrdersPage();
    } catch (e) {
      console.error("Error mostrando mis pedidos:", e);
    }
  };
  ov.querySelector("#btn-keep-shopping").onclick = () => {
    try {
      ov.remove();
      if (typeof showCategoriesPage === "function") showCategoriesPage();
    } catch (e) {
      console.error("Error al seguir comprando:", e);
    }
  };
  ov.querySelector("#btn-close-ticket").onclick = () => {
    ov.remove();
    if (onClose) onClose();
  };
}

// Helper: formatea fecha ISO/ts a hora local Bolivia
function formatDateLocal(isoOrDate) {
  try {
    let d;
    if (typeof isoOrDate === "number") {
      d = new Date(isoOrDate);
    } else {
      d = new Date(isoOrDate);
    }
    // Usar Intl para convertir a America/La_Paz
    const opts = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "America/La_Paz",
    };
    return new Intl.DateTimeFormat("es-ES", opts).format(d);
  } catch (e) {
    try {
      return new Date(isoOrDate).toLocaleString();
    } catch (e2) {
      return isoOrDate;
    }
  }
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
    if (
      tg &&
      tg.HapticFeedback &&
      typeof tg.HapticFeedback.notificationOccurred === "function"
    )
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
        // Añadir marcador fijo del restaurante en el mapa modal para referencia del usuario
        const restLatLng = [
          RESTAURANT_MAP_LOCATION.latitude,
          RESTAURANT_MAP_LOCATION.longitude,
        ];
        try {
          const restIconSmall = L.icon({
            iconUrl: REST_ICON_URI,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
          });
          leafletRestaurantMarker = L.marker(restLatLng, {
            icon: restIconSmall,
          })
            .addTo(leafletMap)
            .bindPopup(RESTAURANT_LOCATION.name);
        } catch (e) {
          console.warn(
            "No se pudo añadir el marcador del restaurante en el mapa modal (icono):",
            e
          );
        }
        // Fallback visual si el icono externo falla o no se creó: dibujar un circleMarker
        if (!leafletRestaurantMarker) {
          try {
            leafletRestaurantMarker = L.circleMarker(restLatLng, {
              radius: 8,
              color: "#e11d48",
              fillColor: "#e11d48",
              fillOpacity: 0.9,
            })
              .addTo(leafletMap)
              .bindPopup(RESTAURANT_LOCATION.name + " (ubicación)");
          } catch (e) {
            console.warn(
              "No se pudo añadir el marcador de fallback del restaurante en el mapa modal:",
              e
            );
          }
        }
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
      // Calcular ETA aproximado usando la ubicación del restaurante fija
      try {
        const dkm = computeDistanceKm(
          RESTAURANT_LOCATION.latitude,
          RESTAURANT_LOCATION.longitude,
          latlng.lat,
          latlng.lng
        );
        const etaMin = estimateTotalMinutes(dkm, (cart || []).length || 1);
        locationText.textContent = `Ubicación: ${latlng.lat.toFixed(
          4
        )}, ${latlng.lng.toFixed(4)} — ETA aprox: ${Math.round(
          etaMin
        )} min (~${Math.round(etaMin)} s demo)`;
      } catch (e) {
        locationText.textContent = `Ubicación: ${latlng.lat.toFixed(
          4
        )}, ${latlng.lng.toFixed(4)}`;
      }
      // Intentar reverse-geocoding para rellenar la dirección legible
      (async () => {
        try {
          let success = false;

          // 1) Intentar primero a través del backend (proxy) para evitar problemas de CORS.
          try {
            const proxyUrl = `${BACKEND_URL}/reverse_geocode?lat=${latlng.lat}&lon=${latlng.lng}`;
            const proxyResp = await fetch(proxyUrl, {
              headers: { Accept: "application/json" },
            });
            if (proxyResp.ok) {
              const pdata = await proxyResp.json().catch(() => null);
              if (pdata && (pdata.display_name || pdata.address)) {
                const display =
                  pdata.display_name || pdata.address || JSON.stringify(pdata);
                addressDetailsInput.value = display;
                console.log("Reverse geocode: used backend proxy result");
                // Mostrar indicador breve de origen
                try {
                  let badge = document.getElementById("address-source");
                  if (!badge) {
                    badge = document.createElement("span");
                    badge.id = "address-source";
                    badge.style.marginLeft = "8px";
                    badge.style.padding = "4px 8px";
                    badge.style.background = "#10b981";
                    badge.style.color = "#fff";
                    badge.style.borderRadius = "999px";
                    badge.style.fontSize = "12px";
                    badge.style.fontWeight = "700";
                    addressDetailsInput.parentNode &&
                      addressDetailsInput.parentNode.appendChild(badge);
                  }
                  badge.textContent = "Dirección obtenida";
                  badge.style.display = "inline-block";
                  setTimeout(() => {
                    if (badge) badge.style.display = "none";
                  }, 4000);
                } catch (e) {
                  console.warn("address-source badge failed", e);
                }
                success = true;
              }
            }
          } catch (err) {
            console.warn(
              "Backend reverse_geocode proxy failed or not present:",
              err
            );
          }

          // 2) Si el proxy no devolvió resultado, intentar Nominatim directamente (podría fallar por CORS)
          if (!success) {
            try {
              const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`;
              const resp = await fetch(url, {
                headers: { Accept: "application/json" },
              });
              if (resp.ok) {
                const data = await resp.json();
                if (data && data.display_name) {
                  addressDetailsInput.value = data.display_name;
                  console.log("Reverse geocode: used Nominatim result");
                  success = true;
                }
              }
            } catch (err) {
              // possible CORS or network error
              console.warn("Reverse geocode fetch failed (Nominatim):", err);
            }
          }

          // 3) Fallback: mostrar lat/lon en el campo y avisar al usuario (si no hubo éxito)
          if (!success) {
            addressDetailsInput.value = `Coordenadas: ${latlng.lat.toFixed(
              6
            )}, ${latlng.lng.toFixed(6)} (Dirección no disponible)`;
            try {
              if (tg && typeof tg.showAlert === "function")
                tg.showAlert(
                  "Dirección no disponible",
                  "No pudimos obtener la dirección legible desde el servicio de geocodificación. Se guardaron las coordenadas. Puedes editar el campo de dirección manualmente."
                );
            } catch (e) {
              console.warn("tg.showAlert failed", e);
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
    if (
      tg &&
      tg.HapticFeedback &&
      typeof tg.HapticFeedback.notificationOccurred === "function"
    )
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
