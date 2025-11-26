console.log("telegram.js loaded");
export const tg = (function () {
  if (window.Telegram && window.Telegram.WebApp) {
    const webApp = window.Telegram.WebApp;
    webApp.ready();
    webApp.expand();
    webApp.setHeaderColor("#F3F4F6");
    return webApp;
  } else {
    // Mock Telegram WebApp object for local development
    console.warn("Telegram WebApp object not found. Using mock object.");
    return {
      ready: () => {},
      expand: () => {},
      setHeaderColor: () => {},
      showAlert: (title, message) => alert(`${title}\n${message}`),
      showConfirm: (message, callback) => {
        const result = confirm(message);
        if (callback) callback(result);
      },
      close: () => console.log("Mock WebApp.close() called"),
      mainButton: {
        // Note: mainButton is lowercase in the actual API
        text: "",
        isVisible: false,
        isActive: false,
        setText: function (text) {
          this.text = text;
          console.log("Mock mainButton.setText:", text);
        },
        show: function () {
          this.isVisible = true;
          console.log("Mock mainButton.show()");
        },
        hide: function () {
          this.isVisible = false;
          console.log("Mock mainButton.hide()");
        },
        enable: function () {
          this.isActive = true;
          console.log("Mock mainButton.enable()");
        },
        disable: function () {
          this.isActive = false;
          console.log("Mock mainButton.disable()");
        },
        onClick: (callback) => {
          console.log("Mock mainButton.onClick registered");
        },
        offClick: (callback) => {
          console.log("Mock mainButton.offClick unregistered");
        },
        showProgress: () => console.log("Mock mainButton.showProgress()"),
        hideProgress: () => console.log("Mock mainButton.hideProgress()"),
      },
      backButton: {
        isVisible: false,
        show: function () {
          this.isVisible = true;
          console.log("Mock backButton.show()");
        },
        hide: function () {
          this.isVisible = false;
          console.log("Mock backButton.hide()");
        },
        onClick: (callback) => {
          console.log("Mock backButton.onClick registered");
        },
        offClick: (callback) => {
          console.log("Mock backButton.offClick unregistered");
        },
      },
      HapticFeedback: {
        impactOccurred: (style) =>
          console.log(`Mock HapticFeedback.impactOccurred(${style})`),
        notificationOccurred: (type) =>
          console.log(`Mock HapticFeedback.notificationOccurred(${type})`),
        selectionChanged: () =>
          console.log("Mock HapticFeedback.selectionChanged()"),
      },
      requestLocation: (successCallback, errorCallback) => {
        console.log("Mock requestLocation called. Simulating error.");
        if (errorCallback)
          errorCallback("User denied or location not available (mock)");
      },
    };
  }
})();
