// ================================
// Site Settings — shared by public pages (index/about/contact/terms)
// Reads: settings/site (live). Overrides specific elements when a field is
// filled in; falls back to the static i18n copy otherwise so the site works
// before the owner has set anything in Admin → Settings.
// ================================

let currentSettings = {};
const DEFAULT_LOGO_SRC = document.getElementById("brandLogo")?.getAttribute("src");

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

  const footerWhatsappLink = document.getElementById("footerWhatsappLink");
  if (footerWhatsappLink && s.contactWhatsapp) {
    footerWhatsappLink.href = `https://wa.me/${s.contactWhatsapp.replace(/\D/g, "")}`;
  }

  const floatingWhatsapp = document.getElementById("floatingWhatsapp");
  if (floatingWhatsapp && s.contactWhatsapp) {
    floatingWhatsapp.href = `https://wa.me/${s.contactWhatsapp.replace(/\D/g, "")}`;
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

  applyShopLocationMap(s.shopLatLng || extractLatLngFromUrl(s.wazeUrl) || extractLatLngFromUrl(s.googleMapsUrl));

  const logoImg = document.getElementById("brandLogo");
  const brandText = document.getElementById("brandText");
  if (logoImg && brandText) {
    if (s.logoUrl) {
      logoImg.src = s.logoUrl;
      brandText.style.display = "none";
    } else {
      logoImg.src = DEFAULT_LOGO_SRC;
      brandText.style.display = "inline";
    }
  }

  const depositEl = document.getElementById("termsDepositBody");
  if (depositEl) {
    const percent = s.depositPercent != null ? s.depositPercent : 40;
    depositEl.textContent = t("terms_deposit_body").replace("{percent}", percent);
  }

  // Low-stock threshold lives in site settings too; re-render the gallery
  // (if present on this page) so a changed threshold shows up without reload.
  if (typeof renderGallery === "function" && typeof allProducts !== "undefined" && allProducts.length) {
    renderGallery();
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

// Only present on contact.html; renders a free (Leaflet/OpenStreetMap, no API key)
// static map with a marker at the owner-set coordinates, replacing the plain link buttons.
let shopLocationMap = null;
// Best-effort fallback: the owner may not have filled in the dedicated
// coordinates field, but often already pasted a Waze or Google Maps link that
// has a lat,lng pair embedded in it — reuse that instead of showing nothing.
function extractLatLngFromUrl(url) {
  if (!url) return null;
  const decoded = decodeURIComponent(url);
  const match = decoded.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  return match ? `${match[1]},${match[2]}` : null;
}

function applyShopLocationMap(latLngRaw) {
  const container = document.getElementById("shopLocationMap");
  if (!container || typeof L === "undefined") return;

  const match = (latLngRaw || "").split(",").map(v => parseFloat(v.trim()));
  if (match.length !== 2 || match.some(isNaN)) {
    container.style.display = "none";
    return;
  }
  const [lat, lng] = match;
  container.style.display = "block";

  if (!shopLocationMap) {
    shopLocationMap = L.map("shopLocationMap", { scrollWheelZoom: false }).setView([lat, lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(shopLocationMap);
    shopLocationMap.marker = L.marker([lat, lng]).addTo(shopLocationMap);
  } else {
    shopLocationMap.setView([lat, lng], 14);
    shopLocationMap.marker.setLatLng([lat, lng]);
  }
  setTimeout(() => shopLocationMap.invalidateSize(), 50);
}
