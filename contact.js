(function () {
  var TIMEOUT_MS = 12000;

  function getConfig() {
    return window.OUTSIDE_SUPPORT_CONTACT_CONFIG || {};
  }

  function getRecipientEmail() {
    return getConfig().recipientEmail || "team@outsidesupport.org";
  }

  function mailtoFallback(status, recipientEmail) {
    if (!status) return;
    status.innerHTML =
      'We couldn\'t submit that. Please email <a href="mailto:' + recipientEmail + '">' +
      recipientEmail + "</a> and we'll follow up.";
  }

  // Posts the payload and RESOLVES ONLY IF the server confirms {ok:true}.
  // Any transport error, non-2xx status, non-JSON body, or {ok:false} rejects.
  function submitToEndpoint(endpoint, payload) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

    return fetch(endpoint, {
      method: "POST",
      body: new URLSearchParams(payload),
      signal: controller.signal
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (text) {
        var data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          throw new Error("Unexpected response from server");
        }
        if (!data || data.ok !== true) {
          throw new Error((data && data.error) || "Server rejected the submission");
        }
        return data;
      })
      .finally(function () { clearTimeout(timer); });
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

        if (!email || email.indexOf("@") === -1) {
          if (status) status.textContent = "Please enter a valid email address.";
          return;
        }

        var payload = {
          email: email,
          formType: form.getAttribute("data-email-capture") || "general",
          sourcePage: document.title,
          pageUrl: window.location.href,
          submittedAt: new Date().toISOString()
        };

        // No endpoint configured: fall back to opening the user's mail client.
        if (!endpoint) {
          var subject = encodeURIComponent("Outside Support inquiry");
          var body = encodeURIComponent(
            "Please follow up with me at " + email + ".\n\nSource page: " + window.location.href
          );
          window.location.href = "mailto:" + recipientEmail + "?subject=" + subject + "&body=" + body;
          if (status) status.textContent = "Your email app should open. Please send the draft so we can follow up.";
          return;
        }

        if (status) status.textContent = "Sending...";
        if (button) button.disabled = true;

        submitToEndpoint(endpoint, payload)
          .then(function () {
            form.reset();
            if (status) status.textContent = "Thanks — we'll be in touch.";
          })
          .catch(function (err) {
            if (window.console && console.warn) {
              console.warn("Outside Support signup failed:", err);
            }
            mailtoFallback(status, recipientEmail);
          })
          .finally(function () {
            if (button) button.disabled = false;
          });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", wireEmailCapture);
})();
