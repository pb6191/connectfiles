'use strict';

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */

const ConnectElementCommonMethodConfig = {
  setOnLoadError: _listener => { },
  setOnLoaderStart: _listener => { }
};
const ConnectElementCustomMethodConfig = {
  "account-onboarding": {
    setFullTermsOfServiceUrl: _termOfServiceUrl => { },
    setRecipientTermsOfServiceUrl: _recipientTermsOfServiceUrl => { },
    setPrivacyPolicyUrl: _privacyPolicyUrl => { },
    setSkipTermsOfServiceCollection: _skipTermsOfServiceCollection => { },
    setCollectionOptions: _collectionOptions => { },
    setOnExit: _listener => { },
    setOnStepChange: _listener => { }
  },
  "account-management": {
    setCollectionOptions: _collectionOptions => { }
  },
  "notification-banner": {
    setCollectionOptions: _collectionOptions => { },
    setOnNotificationsChange: _listener => { }
  },
  payments: {
    setDefaultFilters: _filters => { }
  },
  "payment-details": {
    setPayment: _payment => { },
    setOnClose: _listener => { }
  },
  "tax-settings": {
    setHideProductTaxCodeSelector: _hidden => { },
    setDisplayHeadOfficeCountries: _countries => { },
    setOnTaxSettingsUpdated: _listener => { }
  },
  "tax-registrations": {
    setOnAfterTaxRegistrationAdded: _listener => { },
    setDisplayCountries: _countries => { }
  }
};

const componentNameMapping = {
  "account-onboarding": "stripe-connect-account-onboarding",
  payments: "stripe-connect-payments",
  "payment-details": "stripe-connect-payment-details",
  payouts: "stripe-connect-payouts",
  "payouts-list": "stripe-connect-payouts-list",
  balances: "stripe-connect-balances",
  "account-management": "stripe-connect-account-management",
  "notification-banner": "stripe-connect-notification-banner",
  documents: "stripe-connect-documents",
  "tax-registrations": "stripe-connect-tax-registrations",
  "tax-settings": "stripe-connect-tax-settings"
};
const EXISTING_SCRIPT_MESSAGE = "loadConnect was called but an existing Connect.js script already exists in the document; existing script parameters will be used";
const V0_URL = "https://connect-js.stripe.com/v0.1/connect.js";
const V1_URL = "https://connect-js.stripe.com/v1.0/connect.js";
const findScript = () => {
  return document.querySelectorAll(`script[src="${V1_URL}"]`)[0] || document.querySelectorAll(`script[src="${V0_URL}"]`)[0] || null;
};
const injectScript = () => {
  const script = document.createElement("script");
  script.src = V1_URL;
  const head = document.head;
  if (!head) {
    throw new Error("Expected document.head not to be null. Connect.js requires a <head> element.");
  }
  document.head.appendChild(script);
  return script;
};
let stripePromise$1 = null;
const loadScript = () => {
  if (stripePromise$1 !== null) {
    return stripePromise$1;
  }
  stripePromise$1 = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject("ConnectJS won't load when rendering code in the server - it can only be loaded on a browser.");
      return;
    }
    if (window.StripeConnect) {
      console.warn(EXISTING_SCRIPT_MESSAGE);
    }
    if (window.StripeConnect) {
      const wrapper = createWrapper(window.StripeConnect);
      resolve(wrapper);
      return;
    }
    try {
      let script = findScript();
      if (script) {
        console.warn(EXISTING_SCRIPT_MESSAGE);
      } else if (!script) {
        script = injectScript();
      }
      script.addEventListener("load", () => {
        if (window.StripeConnect) {
          const wrapper = createWrapper(window.StripeConnect);
          resolve(wrapper);
        } else {
          reject(new Error("Connect.js did not load the necessary objects"));
        }
      });
      script.addEventListener("error", () => {
        reject(new Error("Failed to load Connect.js"));
      });
    } catch (error) {
      reject(error);
    }
  });
  return stripePromise$1;
};
const hasCustomMethod = tagName => {
  return tagName in ConnectElementCustomMethodConfig;
};
const initStripeConnect = (stripePromise, initParams) => {
  var _a;
  const eagerClientSecretPromise = (() => {
    try {
      return initParams.fetchClientSecret();
    } catch (error) {
      return Promise.reject(error);
    }
  })();
  const metaOptions = (_a = initParams.metaOptions) !== null && _a !== void 0 ? _a : {};
  const stripeConnectInstance = stripePromise.then(wrapper => wrapper.initialize(Object.assign(Object.assign({}, initParams), {
    metaOptions: Object.assign(Object.assign({}, metaOptions), {
      eagerClientSecretPromise
    })
  })));
  return {
    create: tagName => {
      let htmlName = componentNameMapping[tagName];
      if (!htmlName) {
        htmlName = tagName;
      }
      const element = document.createElement(htmlName);
      const customMethods = hasCustomMethod(tagName) ? ConnectElementCustomMethodConfig[tagName] : {};
      const methods = Object.assign(Object.assign({}, customMethods), ConnectElementCommonMethodConfig);
      for (const method in methods) {
        element[method] = function (value) {
          stripeConnectInstance.then(() => {
            this[`${method}InternalOnly`](value);
          });
        };
      }
      stripeConnectInstance.then(instance => {
        if (!element.isConnected && !element.setConnector) {
          const oldDisplay = element.style.display;
          element.style.display = "none";
          document.body.appendChild(element);
          document.body.removeChild(element);
          element.style.display = oldDisplay;
        }
        if (!element || !element.setConnector) {
          throw new Error(`Element ${tagName} was not transformed into a custom element.`);
        }
        element.setConnector(instance.connect);
      });
      return element;
    },
    update: updateOptions => {
      stripeConnectInstance.then(instance => {
        instance.update(updateOptions);
      });
    },
    debugInstance: () => {
      return stripeConnectInstance;
    },
    logout: () => {
      return stripeConnectInstance.then(instance => {
        return instance.logout();
      });
    }
  };
};
const createWrapper = stripeConnect => {
  window.StripeConnect = window.StripeConnect || {};
  window.StripeConnect.optimizedLoading = true;
  const wrapper = {
    initialize: params => {
      var _a;
      const metaOptions = (_a = params.metaOptions) !== null && _a !== void 0 ? _a : {};
      const stripeConnectInstance = stripeConnect.init(Object.assign(Object.assign({}, params), {
        metaOptions: Object.assign(Object.assign({}, metaOptions), {
          sdk: true,
          sdkOptions: {
            sdkVersion: "3.3.18"
          }
        })
      }));
      return stripeConnectInstance;
    }
  };
  return wrapper;
};

const stripePromise = Promise.resolve().then(() => loadScript());
let loadCalled = false;
stripePromise.catch(err => {
  if (!loadCalled) {
    console.warn(err);
  }
});
const loadConnectAndInitialize = initParams => {
  loadCalled = true;
  return initStripeConnect(stripePromise, initParams);
};

// Expose loadConnectAndInitialize globally
window.loadConnectAndInitialize = loadConnectAndInitialize;
