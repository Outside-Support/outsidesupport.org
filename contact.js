(function () {
  function getConfig() {
    return window.OUTSIDE_SUPPORT_CONTACT_CONFIG || {};
  }

  function getRecipientEmail() {
    return getConfig().recipientEmail || "team@outsidesupport.org";
  }

  function buildContactSection() {
    var email = getRecipientEmail();
    var section = document.createElement("section");
    section.id = "get-in-touch";
    section.className = "contact-capture";
    section.innerHTML = [
      '<div class="contact-capture-inner">',
      '  <div>',
      '    <div class="section-label">Get In Touch</div>',
      "    <h2>Want to learn more?</h2>",
      "    <p>Share your email and we'll follow up. You can also reach us directly at ",
      '      <a href="mailto:' + email + '">' + email + "</a>.",
      "    </p>",
      "  </div>",
      "  <div>",
      '    <form class="email-capture-form" data-email-capture>',
      '      <input type="email" name="email" autocomplete="email" placeholder="Email address" required />',
      '      <button type="submit">Send</button>',
      "    </form>",
      '    <div class="email-capture-status" data-email-capture-status></div>',
      "  </div>",
      "</div>"
    ].join("");
    return section;
  }

  function scrollToContactSection(section) {
    var nav = document.querySelector("nav");
    var offset = nav ? nav.offsetHeight + 16 : 0;
    var top = section.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: top, behavior: "auto" });
  }

  function insertContactSection() {
    if (document.getElementById("get-in-touch")) return;
    var footer = document.querySelector("footer");
    if (!footer) return;
    var section = buildContactSection();
    footer.parentNode.insertBefore(section, footer);

    if (window.location.hash === "#get-in-touch") {
      window.addEventListener("load", function () {
        scrollToContactSection(section);
      });
    }
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
        var email = input.value.trim();
        var payload = {
          email: email,
          sourcePage: document.title,
          pageUrl: window.location.href,
          submittedAt: new Date().toISOString()
        };

        if (!email) return;
        if (status) status.textContent = "Sending...";

        if (endpoint) {
          submitToEndpoint(endpoint, payload)
            .then(function () {
              form.reset();
              if (status) status.textContent = "You're on the list";
            })
            .catch(function () {
              if (status) {
                status.innerHTML = 'Something went wrong. Please email <a href="mailto:' + recipientEmail + '">' + recipientEmail + "</a>.";
              }
            });
          return;
        }

        var subject = encodeURIComponent("Outside Support inquiry");
        var body = encodeURIComponent("Please follow up with me at " + email + ".\n\nSource page: " + window.location.href);
        window.location.href = "mailto:" + recipientEmail + "?subject=" + subject + "&body=" + body;
        if (status) status.textContent = "Your email app should open. Please send the draft so we can follow up.";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    insertContactSection();
    wireEmailCapture();
  });
})();
