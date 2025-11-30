// --- CONFIGURACIÓN ---
// La URL del backend se importa desde `js/config.js` para evitar duplicados
import { BACKEND_URL } from "./config.js";

// --- REFERENCIAS A ELEMENTOS ---
const ordersContainer = document.getElementById("orders-container");
const loadingMessage = document.getElementById("loading-message");
const errorMessage = document.getElementById("error-message");
const errorText = document.getElementById("error-text");
const btnRefresh = document.getElementById("btn-refresh");

// --- LÓGICA PRINCIPAL ---

// Función para obtener el color del estado
function getStatusColor(status) {
  switch (status) {
    case "Confirmado":
      return "bg-blue-100 text-blue-800";
    case "En Preparación":
      return "bg-yellow-100 text-yellow-800";
    case "En Camino":
      return "bg-indigo-100 text-indigo-800";
    case "Entregado":
      return "bg-green-100 text-green-800";
    case "Cancelado":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Función para renderizar un solo pedido
function renderOrder(order) {
  const orderTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const itemsHTML = order.items
    .map(
      (item) => `
        <li class="flex justify-between">
            <span>${item.quantity}x ${item.name}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </li>
    `
    )
    .join("");

  const orderCard = document.createElement("div");
  orderCard.className = "bg-white rounded-lg shadow p-5";
  orderCard.innerHTML = `
        <div class="flex flex-wrap justify-between items-center border-b pb-3 mb-3">
            <div>
                <h2 class="text-xl font-bold">Pedido #${order.id}</h2>
                <p class="text-sm text-gray-500">Cliente Chat ID: ${
                  order.chat_id
                }</p>
                <p class="text-sm text-gray-500">Fecha: ${new Date(
                  order.date
                ).toLocaleString("es-ES")}</p>
            </div>
            <div class="mt-2 sm:mt-0">
                <span class="text-sm font-semibold px-3 py-1 rounded-full ${getStatusColor(
                  order.status
                )}">
                    ${order.status}
                </span>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 class="font-bold mb-2">Productos:</h3>
                <ul class="space-y-1 text-sm text-gray-700">${itemsHTML}</ul>
                <p class="font-bold text-right mt-2">Total: $${orderTotal.toFixed(
                  2
                )}</p>
            </div>
            <div>
                <h3 class="font-bold mb-2">Datos de Entrega:</h3>
                <p class="text-sm text-gray-700"><strong>Dirección:</strong> ${
                  order.address
                }</p>
                <p class="text-sm text-gray-700"><strong>Método Pago:</strong> ${
                  order.paymentMethod
                }</p>
            </div>
        </div>
        <div class="mt-4 pt-4 border-t">
            <label for="status-${
              order.id
            }" class="block text-sm font-medium text-gray-700 mb-1">Actualizar Estado:</label>
            <div class="flex items-center space-x-2">
                <select id="status-${
                  order.id
                }" class="status-select block w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5">
                    <option value="Confirmado" ${
                      order.status === "Confirmado" ? "selected" : ""
                    }>Confirmado</option>
                    <option value="En Preparación" ${
                      order.status === "En Preparación" ? "selected" : ""
                    }>En Preparación</option>
                    <option value="En Camino" ${
                      order.status === "En Camino" ? "selected" : ""
                    }>En Camino</option>
                    <option value="Entregado" ${
                      order.status === "Entregado" ? "selected" : ""
                    }>Entregado</option>
                    <option value="Cancelado" ${
                      order.status === "Cancelado" ? "selected" : ""
                    }>Cancelado</option>
                </select>
                <button class="btn-update-status bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700" data-order-id="${
                  order.id
                }">
                    Guardar
                </button>
            </div>
        </div>
    `;
  return orderCard;
}

// Función para obtener y mostrar los pedidos
async function fetchAndDisplayOrders() {
  loadingMessage.classList.remove("hidden");
  ordersContainer.classList.add("hidden");
  errorMessage.classList.add("hidden");
  ordersContainer.innerHTML = "";

  try {
    // Asumimos que el backend tendrá una ruta /get_orders
    const response = await fetch(`${BACKEND_URL}/get_orders`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || `Error del servidor: ${response.status}`
      );
    }
    const orders = await response.json();

    if (orders.length === 0) {
      loadingMessage.innerHTML =
        '<p class="text-gray-600 text-lg">No hay pedidos activos en este momento.</p>';
    } else {
      // Ordenar pedidos: los más recientes primero
      orders.sort((a, b) => new Date(b.date) - new Date(a.date));
      orders.forEach((order) => {
        ordersContainer.appendChild(renderOrder(order));
      });
      loadingMessage.classList.add("hidden");
      ordersContainer.classList.remove("hidden");
    }
  } catch (error) {
    errorText.textContent = `No se pudieron cargar los pedidos. ${error.message}`;
    errorMessage.classList.remove("hidden");
    loadingMessage.classList.add("hidden");
  }
}

// Función para actualizar el estado de un pedido
async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`${BACKEND_URL}/update_status/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      const result = await response.json();
      alert(result.message || "Estado actualizado.");
      fetchAndDisplayOrders(); // Refresca la lista para mostrar el nuevo estado
      return;
    }

    // Si el POST no fue OK, tratamos de leer el body de error, pero
    // aplicamos la mitigación: hacemos un GET inmediato para sincronizar
    // el estado con lo que realmente hay en el servidor.
    let serverError = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      serverError =
        errData.message || errData.detail || JSON.stringify(errData);
    } catch (e) {
      // ignore, keep serverError as status
    }

    // Mitigación: comprobar estado real con GET /get_order/{id}
    try {
      const getResp = await fetch(`${BACKEND_URL}/get_order/${orderId}`);
      if (getResp.ok) {
        const ord = await getResp.json();
        alert(
          `No se pudo aplicar "${newStatus}" (server: ${serverError}). Estado actual en servidor: "${ord.status}". Sincronizado.`
        );
        fetchAndDisplayOrders();
        return;
      } else {
        // Si el GET falla, lanzamos error para mostrar al usuario.
        throw new Error(`GET /get_order falló con ${getResp.status}`);
      }
    } catch (getErr) {
      throw new Error(
        `Error al actualizar: ${serverError}. Además no se pudo verificar estado: ${getErr.message}`
      );
    }
  } catch (error) {
    alert(`Error al actualizar el estado: ${error.message}`);
  }
}

// --- EVENT LISTENERS ---
btnRefresh.addEventListener("click", fetchAndDisplayOrders);

ordersContainer.addEventListener("click", (e) => {
  const button = e.target.closest(".btn-update-status");
  if (button) {
    const orderId = button.dataset.orderId;
    const select = document.getElementById(`status-${orderId}`);
    const newStatus = select.value;
    button.textContent = "Guardando...";
    button.disabled = true;

    updateOrderStatus(orderId, newStatus).finally(() => {
      button.textContent = "Guardar";
      button.disabled = false;
    });
  }
});

// Carga inicial
document.addEventListener("DOMContentLoaded", fetchAndDisplayOrders);
