(function () {
  function getConfig() {
    return window.OUTSIDE_SUPPORT_CONTACT_CONFIG || {};
  }

  function getRecipientEmail() {
    return getConfig().recipientEmail || "team@outsidesupport.org";
  }

  function submitToEndpoint(endpoint, payload) {
    return fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams(payload)
    });
  }

  function wireEmailCapture() {
    var config = getConfig();
    var endpoint = (config.endpoint || "").trim();
    var recipientEmail = getRecipientEmail();

    document.querySelectorAll("[data-email-capture]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var status = form.parentNode.querySelector("[data-email-capture-status]");
        var button = form.querySelector('button[type="submit"]');
        var email = input.value.trim();
        var payload = {
          email: email,
          formType: form.getAttribute("data-email-capture") || "general",
          sourcePage: document.title,
          pageUrl: window.location.href,
          submittedAt: new Date().toISOString()
        };

        if (!email) return;
        if (status) status.textContent = "Sending...";
        if (button) button.disabled = true;

        if (endpoint) {
          submitToEndpoint(endpoint, payload)
            .then(function () {
              form.reset();
              if (status) status.textContent = "Thanks — we'll be in touch.";
            })
            .catch(function () {
              if (status) {
                status.innerHTML = 'Something went wrong. Please email <a href="mailto:' + recipientEmail + '">' + recipientEmail + "</a>.";
              }
            })
            .then(function () {
              if (button) button.disabled = false;
            });
          return;
        }

        var subject = encodeURIComponent("Outside Support inquiry");
        var body = encodeURIComponent("Please follow up with me at " + email + ".\n\nSource page: " + window.location.href);
        window.location.href = "mailto:" + recipientEmail + "?subject=" + subject + "&body=" + body;
        if (status) status.textContent = "Your email app should open. Please send the draft so we can follow up.";
        if (button) button.disabled = false;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", wireEmailCapture);
})();
