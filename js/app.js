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
    if (!userChatId) return;
    const response = await fetch(`${BACKEND_URL}/get_orders`);
    if (!response.ok) throw new Error("No se pudo obtener los pedidos");
    const allOrders = await response.json();
    // Filtrar solo los pedidos de este usuario
    const userOrders = allOrders.filter(
      (o) => String(o.chat_id) === String(userChatId)
    );
    myOrders.splice(0, myOrders.length, ...userOrders);
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
  if (!userLocation || addressDetails.length < 10) {
    let msg = "";
    if (!userLocation && addressDetails.length < 10) {
      msg =
        'Por favor, selecciona tu ubicación en el mapa y escribe tu dirección completa en el campo "Detalles" (Ej: Barrio Las Gramas, Casa 123).';
    } else if (!userLocation) {
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

async function showFinalConfirmation(paymentMethod) {
  tg.HapticFeedback.notificationOccurred("success");

  // Combinar lat/long con detalles de dirección
  const addressDetails = addressDetailsInput.value.trim();
  let fullAddress = addressDetails; // Ej: "Barrio Las Gramas, Casa 123"

  // Hacemos el mapa opcional: Si SÍ funcionó, lo añadimos
  if (userLocation) {
    fullAddress += ` (Coords: ${userLocation.latitude.toFixed(
      4
    )}, ${userLocation.longitude.toFixed(4)})`;
  }

  const newOrder = {
    id: Math.floor(1000 + Math.random() * 9000),
    items: [...cart],
    address: fullAddress, // <-- Enviamos la dirección de TEXTO
    location: userLocation, // <-- Esto puede ir null si el mapa falló (¡y está bien!)
    paymentMethod: paymentMethod,
    date: new Date().toISOString(),
    status: "Confirmado",
    isRated: false,
    total: cart
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2),
  };

  // --- INICIO CAMBIO NOTIFICACIONES (Sugerencias 2, 3, 4) ---
  try {
    mainButton.showProgress(true);

    const response = await fetch(`${BACKEND_URL}/submit_order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: userChatId,
        order: newOrder,
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(
        errorResponse.message || "El servidor del backend falló."
      );
    }

    const result = await response.json();

    myOrders.push(newOrder);
    saveOrdersToStorage();

    // Vaciar el carrito correctamente (no reasignar la variable importada)
    if (Array.isArray(cart)) cart.splice(0, cart.length);
    // Actualizar UI del carrito
    if (typeof updateCartUI === "function") updateCartUI();
    userLocation = null;
    locationText.textContent = "";
    addressDetailsInput.value = "";

    // Ya no mostramos tg.showAlert(), el backend envía el mensaje
    // Cerramos la WebApp para que el usuario vea el resumen en el chat
    tg.close();
  } catch (error) {
    console.error("Error al enviar el pedido al backend:", error);
    tg.showAlert(
      "Error de Red",
      `No pudimos contactar a nuestro servidor. Por favor, inténtalo de nuevo. (${error.message})`
    );
  } finally {
    mainButton.hideProgress();
  }
  // --- FIN CAMBIO NOTIFICACIONES ---
}

async function addToCart(item) {
  const existingItem = cart.find((i) => i.id === item.id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  tg.HapticFeedback.notificationOccurred("success");
  if (typeof updateCartUI === "function") updateCartUI();

  // Si es pizza, mostrar modal de sugerencias
  if (item && item.id && item.id.startsWith("pizza")) {
    // Asegurarse de tener el menú en caché
    if (!window._menuCache) {
      const menu = await fetchProducts();
      setMenuCache(menu);
      window._menuCache = menu;
    } else {
      setMenuCache(window._menuCache);
    }
    mostrarModalSugerencias(item, (items, irCarrito) => {
      if (Array.isArray(items)) {
        items.forEach((prod) => {
          const exist = cart.find((i) => i.id === prod.id);
          if (exist) {
            exist.quantity += 1;
          } else {
            cart.push(prod);
          }
        });
      }
      if (irCarrito) {
        showCartPage();
      }
    });
  }
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
    // También actualizar en el state.js si es necesario
    if (typeof userChatId !== "undefined") {
      // hack para variable importada
      try {
        userChatId = params.get("chat_id");
      } catch {}
    }
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
      if (userLocation) {
        leafletMap.setView([userLocation.latitude, userLocation.longitude], 16);
        leafletMarker.setLatLng([
          userLocation.latitude,
          userLocation.longitude,
        ]);
      }
    }, 200);
  });

  closeMapModal.addEventListener("click", () => {
    mapModal.classList.add("hidden");
  });

  saveLocationBtn.addEventListener("click", () => {
    const latlng = leafletMarker.getLatLng();
    userLocation = { latitude: latlng.lat, longitude: latlng.lng };
    locationText.textContent = `Ubicación: ${latlng.lat.toFixed(
      4
    )}, ${latlng.lng.toFixed(4)}`;
    locationText.classList.remove("text-red-600");
    locationText.classList.add("text-green-600");
    mapModal.classList.add("hidden");
    tg.HapticFeedback.notificationOccurred("success");
  });

  pageProducts.addEventListener("click", (e) => {
    const button = e.target.closest(".btn-add-cart");
    if (button) {
      const item = {
        id: button.dataset.id,
        name: button.dataset.name,
        price: parseFloat(button.dataset.price),
        emoji: button.dataset.emoji,
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

  btnPayCash.addEventListener("click", () => showFinalConfirmation("Efectivo"));
  btnPayCard.addEventListener("click", () =>
    showFinalConfirmation("Tarjeta (Simulado)")
  );

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
