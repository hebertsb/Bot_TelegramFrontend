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
      close: () => console.debug("Mock WebApp.close() called"),
      mainButton: {
        // Note: mainButton is lowercase in the actual API
        text: "",
        isVisible: false,
        isActive: false,
        setText: function (text) {
          this.text = text;
          console.debug("Mock mainButton.setText:", text);
        },
        show: function () {
          this.isVisible = true;
          console.debug("Mock mainButton.show()");
        },
        hide: function () {
          this.isVisible = false;
          console.debug("Mock mainButton.hide()");
        },
        enable: function () {
          this.isActive = true;
          console.debug("Mock mainButton.enable()");
        },
        disable: function () {
          this.isActive = false;
          console.debug("Mock mainButton.disable()");
        },
        onClick: (callback) => {
          console.debug("Mock mainButton.onClick registered");
        },
        offClick: (callback) => {
          console.debug("Mock mainButton.offClick unregistered");
        },
        showProgress: () => console.debug("Mock mainButton.showProgress()"),
        hideProgress: () => console.debug("Mock mainButton.hideProgress()"),
      },
      backButton: {
        isVisible: false,
        show: function () {
          this.isVisible = true;
          console.debug("Mock backButton.show()");
        },
        hide: function () {
          this.isVisible = false;
          console.debug("Mock backButton.hide()");
        },
        onClick: (callback) => {
          console.debug("Mock backButton.onClick registered");
        },
        offClick: (callback) => {
          console.debug("Mock backButton.offClick unregistered");
        },
      },
      HapticFeedback: {
        impactOccurred: (style) =>
          console.debug(`Mock HapticFeedback.impactOccurred(${style})`),
        notificationOccurred: (type) =>
          console.debug(`Mock HapticFeedback.notificationOccurred(${type})`),
        selectionChanged: () =>
          console.debug("Mock HapticFeedback.selectionChanged()"),
      },
      requestLocation: (successCallback, errorCallback) => {
        console.debug("Mock requestLocation called. Simulating error.");
        if (errorCallback)
          errorCallback("User denied or location not available (mock)");
      },
    };
  }
})();
