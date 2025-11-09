# 🍕 Pizzeria Nova - Frontend para Bot de Telegram

Este proyecto es el frontend para un bot de Telegram que permite a los usuarios pedir pizzas de un restaurante ficticio llamado "Pizzeria Nova". La aplicación web está diseñada para funcionar dentro de la plataforma de Telegram como una Web App.

## ✨ Características

- **Menú interactivo:** Los usuarios pueden navegar por categorías de productos (Promociones, Pizzas, Bebidas, Postres).
- **Creación de Pizza con IA:** Una función para generar un nombre y descripción de pizza únicos basados en los ingredientes que el usuario escribe, utilizando una API externa.
- **Carrito de compras:** Los usuarios pueden añadir y quitar productos, y ver el total de su compra.
- **Proceso de Pedido:**
    - Selección de ubicación en el mapa (integrado con la API de Telegram).
    - Selección de método de pago (Efectivo o Tarjeta).
    - Confirmación y envío del pedido a un backend.
- **Seguimiento de Pedidos:** Los usuarios pueden ver el estado de sus pedidos anteriores ("Confirmado", "En Preparación", "En Camino", "Entregado").
- **Valoración de Pedidos:** Después de que un pedido es entregado, el usuario puede valorarlo.
- **Panel de Administración:** Una página separada (`admin.html`) para que los administradores del restaurante vean y actualicen el estado de los pedidos.

## 📂 Estructura del Proyecto

El proyecto está estructurado para separar el contenido (HTML), los estilos (CSS) y la lógica (JavaScript), utilizando módulos de ES6 para una mejor organización.

```
/
├── admin.html              # Panel de administración para ver y gestionar pedidos.
├── index.html              # Aplicación principal para clientes.
├── README.md               # Este archivo.
├── css/
│   └── style.css           # Hoja de estilos principal para ambas páginas.
└── js/
    ├── app.js              # Lógica principal de la aplicación (event listeners, etc.).
    ├── main.js             # Punto de entrada principal que inicializa la aplicación.
    ├── ui.js               # Funciones y variables para manipular el DOM.
    ├── data.js             # Contiene los datos de los productos del menú.
    ├── config.js           # Configuración de la aplicación (URL del backend).
    └── common/
        └── telegram.js     # Módulo para la integración con la API de Telegram Web App.
```

## 🚀 Cómo Empezar

### Prerrequisitos

- Un servidor web para servir los archivos estáticos. Puedes usar extensiones como "Live Server" en VS Code.
- Un backend en funcionamiento que reciba los pedidos. La URL del backend debe configurarse en `js/config.js`.

### Configuración

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/hebertsb/Bot_TelegramFrontend.git
    cd Bot_TelegramFrontend
    ```

2.  **Configura el backend:**
    - Abre el archivo `js/config.js`.
    - Modifica la constante `BACKEND_URL` con la URL pública de tu servidor de backend.
    ```javascript
    export const BACKEND_URL = "https://tu-backend-url.com";
    ```

3.  **Ejecuta la aplicación:**
    - Sirve los archivos del proyecto a través de un servidor web. Si usas la extensión "Live Server" de VS Code, simplemente haz clic derecho en `index.html` y selecciona "Open with Live Server".
    - Accede a la aplicación a través de tu bot de Telegram, que debe estar configurado para apuntar a la URL de tu servidor web.

## ⚙️ Cómo Funciona

1.  **`index.html`**: Es el punto de entrada para los clientes. Carga `js/main.js` como un módulo.
2.  **`js/main.js`**: Importa la función `init` de `js/app.js` y la ejecuta para iniciar la aplicación.
3.  **`js/app.js`**: Contiene la lógica principal. Registra todos los `event listeners` para los botones y la interacción del usuario. Se comunica con los módulos `ui.js`, `data.js` y `telegram.js` para funcionar.
4.  **`js/ui.js`**: Gestiona toda la manipulación del DOM, como mostrar y ocultar páginas, y renderizar listas de productos.
5.  **`admin.html`**: Es una página independiente para la administración. Carga `js/admin.js`, que se encarga de obtener y actualizar los pedidos comunicándose con el backend.
