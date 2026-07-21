// ================================
// i18n — Arabic (default) / English
// Shared by index.html (public site) and admin.html (dashboard)
// Usage: elements get data-i18n="key" (sets textContent),
//        data-i18n-html="key" (sets innerHTML, for strings with <em> etc.),
//        or data-i18n-placeholder="key" (sets placeholder attr).
// ================================

const I18N = {
  ar: {
    // Public nav / header
    nav_collection: "المجموعة",
    nav_how: "كيف تتم العملية",
    nav_contact: "تواصلي معنا",
    brand_suffix: "كوتور",

    // Hero
    hero_eyebrow: "حسب الطلب — دبي والقاهرة",
    hero_title_html: "كل قطعة <em>تبدأ</em><br/>بطلب، لا برف عرض.",
    hero_sub: "استعرضي المجموعة، اختاري تصميمًا يلامس ذوقكِ، وأرسلي لنا تفاصيلكِ. سنتواصل معكِ شخصيًا لتأكيد المقاس والقماش والموعد.",
    btn_view_collection: "استعرضي المجموعة",
    spec_process_label: "المراحل",
    spec_process_value: "الطلب ← الاستشارة ← القياس ← التسليم",
    spec_turnaround_label: "المدة",
    spec_turnaround_value: "عادةً من ٢ إلى ٤ أسابيع",
    spec_reach_label: "تواصلي معنا",
    spec_reach_value: "عبر نموذج الطلب أو واتساب",

    // Collection
    collection_eyebrow: "المجموعة",
    collection_title: "القطع الحالية",
    filter_all: "الكل",
    empty_state: "يتم إضافة قطع جديدة إلى الأتيليه — تابعينا قريبًا.",
    empty_state_error: "تعذّر تحميل المجموعة حاليًا. يرجى المحاولة لاحقًا.",
    piece_category_fallback: "كوتور",

    // How it works
    how_eyebrow: "كيف تتم العملية",
    how_title: "من الطلب إلى الإطلالة",
    step1_title: "١. الطلب",
    step1_desc: "اختاري قطعة وأخبرينا بما تتخيلينه",
    step2_title: "٢. الاستشارة",
    step2_desc: "نؤكد القماش والمقاس والسعر عبر الهاتف أو واتساب",
    step3_title: "٣. القياس",
    step3_desc: "تُجرى التعديلات حسب مقاساتكِ",
    step4_title: "٤. التسليم",
    step4_desc: "قطعتكِ جاهزة للاستلام أو الشحن",

    // Footer
    footer_tagline: "هبة موسى كوتور — قطع مصممة خصيصًا لكِ، حسب الطلب.",
    footer_contact_prefix: "تفضلين التواصل المباشر؟",
    footer_whatsapp: "راسلينا على واتساب",
    footer_staff: "دخول الموظفين",

    // Request modal
    modal_title: "اطلبي هذا التصميم",
    label_name: "اسمكِ",
    label_phone: "رقم الهاتف / واتساب",
    label_date: "الموعد المطلوب (اختياري)",
    label_notes: "ملاحظات — المقاس، اللون، القماش المفضل، المناسبة",
    notes_placeholder: "أخبرينا بأي تفاصيل تساعدنا في تحضير استشارتكِ",
    form_note: "سنتواصل معكِ مباشرة لتأكيد التفاصيل والسعر — هذا طلب وليس دفعًا.",
    submit_btn: "إرسال الطلب",
    submit_btn_sending: "جارٍ الإرسال...",
    submit_success: "شكرًا لكِ — تم استلام طلبكِ وسنتواصل معكِ قريبًا.",
    submit_error: "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى أو التواصل عبر واتساب.",

    // Admin — login
    admin_eyebrow: "دخول الموظفين",
    admin_brand: "هبة موسى كوتور",
    admin_email: "البريد الإلكتروني",
    admin_password: "كلمة المرور",
    admin_signin: "تسجيل الدخول",
    admin_signin_loading: "جارٍ تسجيل الدخول...",
    admin_signin_fail: "فشل تسجيل الدخول — تحقّقي من البريد الإلكتروني وكلمة المرور.",
    admin_no_access: "هذا الحساب غير مُفعّل للوصول إلى لوحة التحكم بعد. اطلبي من المسؤول إضافتكِ ضمن الموظفين.",
    admin_verify_fail: "تعذّر التحقق من الصلاحية. حاولي مرة أخرى.",

    // Admin — shell
    admin_nav_requests: "الطلبات",
    admin_nav_products: "المنتجات",
    admin_nav_staff: "الموظفون",
    admin_signout: "تسجيل الخروج ←",
    admin_requests_title: "الاستفسارات والطلبات",
    admin_th_client: "العميلة",
    admin_th_piece: "القطعة",
    admin_th_contact: "التواصل",
    admin_th_needed: "الموعد المطلوب",
    admin_th_notes: "ملاحظات",
    admin_th_status: "الحالة",
    admin_th_received: "تاريخ الاستلام",
    admin_requests_empty: "لا توجد طلبات بعد.",

    admin_products_title: "كتالوج المنتجات",
    admin_add_piece: "+ إضافة قطعة",
    admin_new_piece: "قطعة جديدة",
    admin_edit_piece: "تعديل القطعة",
    admin_p_name: "الاسم",
    admin_p_category: "الفئة",
    admin_p_category_ph: "مثال: فستان سهرة، عباية، فستان زفاف",
    admin_p_price: "نطاق السعر",
    admin_p_price_ph: "مثال: ١٬٨٠٠ – ٢٬٦٠٠ درهم",
    admin_p_status: "الحالة",
    admin_p_status_active: "مفعّلة — ظاهرة على الموقع",
    admin_p_status_archived: "مؤرشفة — مخفية",
    admin_p_description: "الوصف",
    admin_p_image: "رابط الصورة",
    admin_p_image_note: "الصقي رابط صورة مستضافة (مثل رابط من Firebase Storage أو إنستغرام). يمكن إضافة رفع مباشر للصور لاحقًا.",
    admin_save_piece: "حفظ القطعة",
    admin_cancel: "إلغاء",
    admin_th_piece2: "القطعة",
    admin_th_category: "الفئة",
    admin_th_price: "نطاق السعر",
    admin_edit: "تعديل",
    admin_delete: "حذف",
    admin_delete_confirm: "إزالة هذه القطعة من الكتالوج؟ لا يمكن التراجع عن هذا الإجراء.",

    admin_staff_title: "صلاحيات الموظفين",
    admin_staff_intro_html: "تُنشأ حسابات الموظفين على خطوتين: (١) إنشاء بيانات دخول الشخص في <strong>Firebase Console ← Authentication</strong>، ثم (٢) إضافة سجل مطابق أدناه ليتمكّن من الدخول إلى لوحة التحكم.",
    admin_staff_email: "بريد الموظف (يجب أن يطابق بيانات دخوله في Firebase Auth)",
    admin_staff_name: "الاسم",
    admin_staff_role: "الصلاحية",
    admin_staff_role_staff: "موظف — إدارة الطلبات والمنتجات",
    admin_staff_role_admin: "مسؤول — صلاحية كاملة",
    admin_add_staff: "إضافة موظف",
    admin_th_name: "الاسم",
    admin_th_email: "البريد الإلكتروني",
    admin_th_role: "الصلاحية",
    admin_remove: "إزالة",
    admin_remove_confirm: "إزالة صلاحية الوصول لهذا الشخص؟",
    admin_staff_email_required: "البريد الإلكتروني مطلوب.",
    admin_staff_note: "ملاحظة: هذا ينشئ سجلًا للموظف، لكن ما زلتِ بحاجة لإنشاء بيانات الدخول المطابقة في Firebase Console ← Authentication أولًا، بنفس البريد الإلكتروني — ثم نسخ معرّف المستخدم (UID) هنا كمعرّف المستند. (راجعي ملف README للخطوات الكاملة).",
  },

  en: {
    nav_collection: "Collection",
    nav_how: "How It Works",
    nav_contact: "Contact",
    brand_suffix: "Couture",

    hero_eyebrow: "Made to order — Dubai &amp; Cairo",
    hero_title_html: "Every piece <em>begins</em><br/>with a request, not a rack.",
    hero_sub: "Browse the collection, choose a design that speaks to you, and send us your details. We'll follow up personally to confirm fit, fabric, and timeline.",
    btn_view_collection: "View the Collection",
    spec_process_label: "Process",
    spec_process_value: "Request → Consultation → Fitting → Delivery",
    spec_turnaround_label: "Turnaround",
    spec_turnaround_value: "Typically 2–4 weeks",
    spec_reach_label: "Reach us",
    spec_reach_value: "By request form or WhatsApp",

    collection_eyebrow: "The Collection",
    collection_title: "Current Pieces",
    filter_all: "All",
    empty_state: "New pieces are being added to the atelier — check back soon.",
    empty_state_error: "Unable to load the collection right now. Please check back shortly.",
    piece_category_fallback: "Couture",

    how_eyebrow: "How It Works",
    how_title: "From Request to Reveal",
    step1_title: "1. Request",
    step1_desc: "Pick a piece and tell us what you have in mind",
    step2_title: "2. Consultation",
    step2_desc: "We confirm fabric, sizing, and price by phone or WhatsApp",
    step3_title: "3. Fitting",
    step3_desc: "Adjustments made to your measurements",
    step4_title: "4. Delivery",
    step4_desc: "Your piece, ready to collect or ship",

    footer_tagline: "Habiba Mousa Couture — bespoke pieces, made to order.",
    footer_contact_prefix: "Prefer to reach us directly?",
    footer_whatsapp: "Message on WhatsApp",
    footer_staff: "Staff Login",

    modal_title: "Request This Design",
    label_name: "Your name",
    label_phone: "Phone / WhatsApp number",
    label_date: "Needed by (optional)",
    label_notes: "Notes — sizing, color, fabric preference, occasion",
    notes_placeholder: "Tell us anything that helps us prepare for your consultation",
    form_note: "We'll contact you directly to confirm details and pricing — this is a request, not a payment.",
    submit_btn: "Send Request",
    submit_btn_sending: "Sending...",
    submit_success: "Thank you — your request has been received. We'll be in touch shortly.",
    submit_error: "Something went wrong sending your request. Please try again or reach us on WhatsApp.",

    admin_eyebrow: "Staff Access",
    admin_brand: "Habiba Mousa Couture",
    admin_email: "Email",
    admin_password: "Password",
    admin_signin: "Sign In",
    admin_signin_loading: "Signing in...",
    admin_signin_fail: "Sign in failed — check your email and password.",
    admin_no_access: "This account isn't set up for dashboard access yet. Ask an admin to add you under Staff.",
    admin_verify_fail: "Couldn't verify access. Try again.",

    admin_nav_requests: "Requests",
    admin_nav_products: "Products",
    admin_nav_staff: "Staff",
    admin_signout: "Sign Out →",
    admin_requests_title: "Inquiries & Requests",
    admin_th_client: "Client",
    admin_th_piece: "Piece",
    admin_th_contact: "Contact",
    admin_th_needed: "Needed By",
    admin_th_notes: "Notes",
    admin_th_status: "Status",
    admin_th_received: "Received",
    admin_requests_empty: "No requests yet.",

    admin_products_title: "Product Catalog",
    admin_add_piece: "+ Add Piece",
    admin_new_piece: "New Piece",
    admin_edit_piece: "Edit Piece",
    admin_p_name: "Name",
    admin_p_category: "Category",
    admin_p_category_ph: "e.g. Evening Gown, Abaya, Bridal",
    admin_p_price: "Price range",
    admin_p_price_ph: "e.g. AED 1,800 – 2,600",
    admin_p_status: "Status",
    admin_p_status_active: "Active — visible on site",
    admin_p_status_archived: "Archived — hidden",
    admin_p_description: "Description",
    admin_p_image: "Image URL",
    admin_p_image_note: "Paste a hosted image link (e.g. from Firebase Storage or Instagram CDN link). Direct image upload can be added later.",
    admin_save_piece: "Save Piece",
    admin_cancel: "Cancel",
    admin_th_piece2: "Piece",
    admin_th_category: "Category",
    admin_th_price: "Price Range",
    admin_edit: "Edit",
    admin_delete: "Delete",
    admin_delete_confirm: "Remove this piece from the catalog? This can't be undone.",

    admin_staff_title: "Staff Access",
    admin_staff_intro_html: "Staff accounts are created in two steps: (1) create the person's login in <strong>Firebase Console → Authentication</strong>, then (2) add a matching record below so they can access this dashboard.",
    admin_staff_email: "Staff email (must match their Firebase Auth login)",
    admin_staff_name: "Name",
    admin_staff_role: "Role",
    admin_staff_role_staff: "Staff — manage requests & products",
    admin_staff_role_admin: "Admin — full access",
    admin_add_staff: "Add Staff Member",
    admin_th_name: "Name",
    admin_th_email: "Email",
    admin_th_role: "Role",
    admin_remove: "Remove",
    admin_remove_confirm: "Remove this person's dashboard access?",
    admin_staff_email_required: "Email is required.",
    admin_staff_note: "Note: this creates a staff record, but you still need the matching login created in Firebase Console → Authentication first, using the same email — then copy that user's UID here as the document ID. (See README for the step-by-step.)",
  }
};

const LANG_KEY = "hmc_lang";

function getLang() {
  return localStorage.getItem(LANG_KEY) || "ar"; // Arabic is the default language
}

function t(key) {
  const lang = getLang();
  return (I18N[lang] && I18N[lang][key]) || (I18N.en[key]) || key;
}

function applyLanguage(lang) {
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.getAttribute("data-i18n-html"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  document.querySelectorAll(".lang-toggle [data-lang]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
  });

  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

function initLanguageToggle() {
  document.querySelectorAll(".lang-toggle [data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => applyLanguage(btn.getAttribute("data-lang")));
  });
  applyLanguage(getLang());
}

document.addEventListener("DOMContentLoaded", initLanguageToggle);
