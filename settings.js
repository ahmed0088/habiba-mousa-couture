// ================================
// Site Settings — shared by public pages (index/about/contact/terms)
// Reads: settings/site (live). Overrides specific elements when a field is
// filled in; falls back to the static i18n copy otherwise so the site works
// before the owner has set anything in Admin → Settings.
// ================================

let currentSettings = {};

function setTextIfPresent(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.textContent = value;
}

function applySettingsOverrides() {
  const lang = getLang();
  const s = currentSettings;

  setTextIfPresent("heroSub", s[`heroTagline_${lang}`]);
  setTextIfPresent("turnaroundText", s[`turnaround_${lang}`]);
  setTextIfPresent("aboutIntroText", s[`aboutIntro_${lang}`]);
  setTextIfPresent("aboutStoryText", s[`aboutStory_${lang}`]);
  [1, 2, 3, 4].forEach((n) => {
    setTextIfPresent(`step${n}TitleText`, s[`step${n}Title_${lang}`]);
    setTextIfPresent(`step${n}DescText`, s[`step${n}Desc_${lang}`]);
  });
  setTextIfPresent("contactHoursText", s[`contactHours_${lang}`]);
  setTextIfPresent("contactAddressText", s[`address_${lang}`]);

  const phoneLink = document.getElementById("contactPhoneLink");
  if (phoneLink && s.contactPhone) {
    phoneLink.textContent = s.contactPhone;
    phoneLink.href = `tel:${s.contactPhone.replace(/[^+\d]/g, "")}`;
  }

  const whatsappLink = document.getElementById("contactWhatsappLink");
  if (whatsappLink && s.contactWhatsapp) {
    whatsappLink.textContent = s.contactWhatsapp;
    whatsappLink.href = `https://wa.me/${s.contactWhatsapp.replace(/\D/g, "")}`;
  }

  const emailLink = document.getElementById("contactEmailLink");
  if (emailLink && s.contactEmail) {
    emailLink.textContent = s.contactEmail;
    emailLink.href = `mailto:${s.contactEmail}`;
  }

  const mapsBtn = document.getElementById("googleMapsBtn");
  if (mapsBtn) {
    if (s.googleMapsUrl) {
      mapsBtn.href = s.googleMapsUrl;
      mapsBtn.style.display = "inline-block";
    } else {
      mapsBtn.style.display = "none";
    }
  }

  const wazeBtn = document.getElementById("wazeBtn");
  if (wazeBtn) {
    if (s.wazeUrl) {
      wazeBtn.href = s.wazeUrl;
      wazeBtn.style.display = "inline-block";
    } else {
      wazeBtn.style.display = "none";
    }
  }

  const depositEl = document.getElementById("termsDepositBody");
  if (depositEl) {
    const percent = s.depositPercent != null ? s.depositPercent : 40;
    depositEl.textContent = t("terms_deposit_body").replace("{percent}", percent);
  }
}

db.collection("settings").doc("site").onSnapshot(
  (doc) => {
    currentSettings = doc.exists ? doc.data() : {};
    applySettingsOverrides();
  },
  (err) => console.error("Settings listener error:", err)
);

document.addEventListener("langchange", applySettingsOverrides);
