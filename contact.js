(function () {
  var TIMEOUT_MS = 12000;

  function getConfig() {
    return window.OUTSIDE_SUPPORT_CONTACT_CONFIG || {};
  }
  function getRecipientEmail() {
    return getConfig().recipientEmail || "team@outsidesupport.org";
  }

  // Resolves only if the server confirms {ok:true}. Any transport error,
  // non-2xx status, non-JSON body, or ok:false rejects.
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
        try { data = JSON.parse(text); } catch (err) { throw new Error("Unexpected response from server"); }
        if (!data || data.ok !== true) throw new Error((data && data.error) || "Server rejected the submission");
        return data;
      })
      .finally(function () { clearTimeout(timer); });
  }

  function mailtoFallback(status, recipientEmail) {
    if (!status) return;
    status.innerHTML =
      'We couldn\'t submit that. Please email <a href="mailto:' + recipientEmail + '">' +
      recipientEmail + "</a> and we'll follow up.";
  }

  // ---- Simple email capture (waitlist / contact) ----
  function wireEmailCapture() {
    var endpoint = (getConfig().endpoint || "").trim();
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
        if (!endpoint) {
          var subject = encodeURIComponent("Outside Support inquiry");
          var body = encodeURIComponent("Please follow up with me at " + email + ".\n\nSource page: " + window.location.href);
          window.location.href = "mailto:" + recipientEmail + "?subject=" + subject + "&body=" + body;
          if (status) status.textContent = "Your email app should open. Please send the draft so we can follow up.";
          return;
        }
        if (status) status.textContent = "Sending...";
        if (button) button.disabled = true;
        submitToEndpoint(endpoint, payload)
          .then(function () { form.reset(); if (status) status.textContent = "Thanks — we'll be in touch."; })
          .catch(function (err) { if (window.console && console.warn) console.warn("Signup failed:", err); mailtoFallback(status, recipientEmail); })
          .finally(function () { if (button) button.disabled = false; });
      });
    });
  }

  // ---- Referral / interest capture (multi-field, progressive disclosure) ----
  function wireReferralCapture() {
    var endpoint = (getConfig().endpoint || "").trim();
    var recipientEmail = getRecipientEmail();

    // Expand: reveal the fields when "Get started" is clicked.
    document.querySelectorAll("[data-referral-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var form = btn.parentNode.querySelector("[data-referral-capture]");
        if (!form) return;
        form.hidden = false;
        btn.hidden = true;
        var first = form.querySelector("input, select");
        if (first) first.focus();
      });
    });

    document.querySelectorAll("[data-referral-capture]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var status = form.parentNode.querySelector("[data-referral-status]");
        var button = form.querySelector('button[type="submit"]');

        var email = (form.querySelector('[name="email"]') || {}).value || "";
        email = email.trim();
        if (!email || email.indexOf("@") === -1) {
          if (status) status.textContent = "Please enter a valid email address.";
          return;
        }

        var payload = {
          name: (form.querySelector('[name="name"]') || {}).value || "",
          email: email,
          phone: (form.querySelector('[name="phone"]') || {}).value || "",
          school: (form.querySelector('[name="school"]') || {}).value || "",
          grade: (form.querySelector('[name="grade"]') || {}).value || "",
          formType: form.getAttribute("data-referral-capture") || "interest",
          sourcePage: document.title,
          pageUrl: window.location.href,
          submittedAt: new Date().toISOString()
        };

        if (!endpoint) {
          var body = encodeURIComponent(
            "Name: " + payload.name + "\nEmail: " + payload.email + "\nPhone: " + payload.phone +
            "\nChild's school: " + payload.school + "\nChild's grade: " + payload.grade
          );
          window.location.href = "mailto:" + recipientEmail + "?subject=" + encodeURIComponent("Outside Support interest") + "&body=" + body;
          if (status) status.textContent = "Your email app should open. Please send the draft so we can follow up.";
          return;
        }

        if (status) status.textContent = "Sending...";
        if (button) button.disabled = true;

        submitToEndpoint(endpoint, payload)
          .then(function () {
            form.hidden = true;
            if (status) status.textContent = "Thanks — we've got your details. A member of our team will be in touch shortly.";
          })
          .catch(function (err) {
            if (window.console && console.warn) console.warn("Referral failed:", err);
            mailtoFallback(status, recipientEmail);
          })
          .finally(function () { if (button) button.disabled = false; });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireEmailCapture();
    wireReferralCapture();
  });
})();
