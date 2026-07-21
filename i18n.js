// ================================
// i18n — Arabic (default) / English
// Shared by index.html (public site) and admin.html (dashboard)
// Usage: elements get data-i18n="key" (sets textContent),
//        data-i18n-html="key" (sets innerHTML, for strings with <em> etc.),
//        data-i18n-placeholder="key" (sets placeholder attr),
//        or data-i18n-aria-label="key" (sets aria-label attr).
// ================================

const I18N = {
  ar: {
    // Public nav / header
    nav_collection: "الكولكشن",
    nav_how: "الطلب بيتم إزاي",
    nav_contact: "تواصلي معانا",
    brand_suffix: "كوتور",

    // Hero
    hero_eyebrow: "تفصيل حسب الطلب — الإسكندرية",
    hero_title_html: "كل قطعة <em>بتتولد</em><br/>من طلب، مش من رف.",
    hero_sub: "تفرجي على الكولكشن، اختاري التصميم اللي عجبك، وابعتيلنا تفاصيلك. هنكلمك بنفسنا نأكد المقاس والقماش والميعاد.",
    btn_view_collection: "شوفي الكولكشن",
    spec_process_label: "الخطوات",
    spec_process_value: "الطلب ← الاستشارة ← القياس ← التسليم",
    spec_turnaround_label: "المدة",
    spec_turnaround_value: "غالبًا من ٢ لـ ٤ أسابيع",
    spec_reach_label: "كلمينا",
    spec_reach_value: "من نموذج الطلب أو واتساب",

    // Collection
    collection_eyebrow: "الكولكشن",
    collection_title: "القطع المتاحة دلوقتي",
    filter_all: "الكل",
    filter_all_collections: "كل الكولكشنات",
    search_placeholder: "دوّري على قطعة...",
    empty_state: "بنجهز قطع جديدة للأتيليه — تابعينا هيبقى فيه كل حاجة حلوة قريب.",
    empty_state_error: "معلش، حصلت مشكلة في تحميل الكولكشن دلوقتي. جربي تاني بعد شوية.",
    piece_category_fallback: "كوتور",

    // How it works
    how_eyebrow: "الطلب بيتم إزاي",
    how_title: "من الطلب للإطلالة",
    step1_title: "١. الطلب",
    step1_desc: "اختاري قطعة وقوليلنا اللي في بالك",
    step2_title: "٢. الاستشارة",
    step2_desc: "بنتفق على القماش والمقاس والسعر تليفون أو واتساب",
    step3_title: "٣. القياس",
    step3_desc: "بنظبط التصميم على مقاسك",
    step4_title: "٤. التسليم",
    step4_desc: "قطعتك جاهزة تستلميها أو تتشحن لك",

    // Footer
    footer_tagline: "حبيبه موسي كوتور — قطع مفصلة خصيصي ليكِ، حسب الطلب.",
    footer_contact_prefix: "عايزة تكلمينا على طول؟",
    footer_whatsapp: "راسلينا على واتساب",
    footer_staff: "دخول الموظفين",

    // Request modal
    modal_title: "اطلبي التصميم ده",
    label_name: "اسمك",
    label_phone: "رقم الموبايل / واتساب",
    label_date: "الميعاد المطلوب (اختياري)",
    label_notes: "ملاحظات — المقاس، اللون، القماش اللي بتحبيه، المناسبة",
    notes_placeholder: "قوليلنا أي تفاصيل هتساعدنا نجهز لاستشارتك",
    form_note: "هنكلمك على طول نأكد التفاصيل والسعر — ده طلب مش دفع.",
    submit_btn: "ابعتي الطلب",
    submit_btn_sending: "جاري الإرسال...",
    submit_success: "تسلمي — وصلنا طلبك وهنكلمك قريب.",
    submit_error: "حصلت مشكلة وإحنا بنبعت الطلب. جربي تاني أو كلمينا على واتساب.",

    // Admin — login
    admin_eyebrow: "دخول الموظفين",
    admin_brand: "حبيبه موسي كوتور",
    admin_email: "الإيميل",
    admin_password: "الباسورد",
    admin_signin: "دخول",
    admin_signin_loading: "بيتم الدخول...",
    admin_signin_fail: "الدخول مش ظابط — راجعي الإيميل والباسورد.",
    admin_no_access: "الحساب ده لسه مش متفعّل على لوحة التحكم. اطلبي من الأدمن يضيفك في الموظفين.",
    admin_verify_fail: "معرفناش نتأكد من الصلاحية. جربي تاني.",

    // Admin — shell
    admin_nav_requests: "الطلبات",
    admin_nav_products: "المنتجات",
    admin_nav_collections: "الكولكشنات",
    admin_nav_settings: "الإعدادات",
    admin_nav_staff: "الموظفين",
    admin_signout: "تسجيل خروج ←",
    admin_requests_title: "الطلبات والاستفسارات",
    admin_th_client: "العميلة",
    admin_th_piece: "القطعة",
    admin_th_contact: "التواصل",
    admin_th_needed: "الميعاد المطلوب",
    admin_th_notes: "ملاحظات",
    admin_th_status: "الحالة",
    admin_th_received: "تاريخ الاستلام",
    admin_th_address: "العنوان",
    admin_th_material: "القماش",
    admin_requests_search_ph: "دوّري بالاسم، الرقم، أو القطعة...",
    admin_requests_empty: "لسه مفيش طلبات.",

    admin_products_title: "كتالوج المنتجات",
    admin_add_piece: "+ إضافة قطعة",
    admin_products_search_ph: "دوّري بالاسم، الكود، أو النوع...",
    admin_new_piece: "قطعة جديدة",
    admin_edit_piece: "تعديل القطعة",
    admin_p_name: "الاسم",
    admin_p_category: "النوع",
    admin_p_category_ph: "زي: فستان سهرة، عباية، فستان فرح",
    admin_p_price: "نطاق السعر",
    admin_p_price_ph: "مثال: ١٬٨٠٠ – ٢٬٦٠٠ جنيه",
    admin_p_status: "الحالة",
    admin_p_status_active: "شغالة — ظاهرة في الموقع",
    admin_p_status_archived: "متأرشفة — مخفية",
    admin_p_description: "الوصف",
    admin_p_image: "رابط الصورة",
    admin_p_image_note: "حطي رابط صورة مرفوعة (زي رابط من Firebase Storage أو إنستجرام). ممكن نضيف رفع مباشر للصور بعدين.",
    admin_save_piece: "حفظ القطعة",
    admin_cancel: "إلغاء",
    admin_th_piece2: "القطعة",
    admin_th_category: "النوع",
    admin_th_price: "نطاق السعر",
    admin_edit: "تعديل",
    admin_delete: "مسح",
    admin_delete_confirm: "تمسحي القطعة دي من الكتالوج؟ مش هينفع ترجعيها.",

    admin_staff_title: "صلاحيات الموظفين",
    admin_staff_intro_html: "حساب الموظف بيتعمل على خطوتين: (١) تعملي login للشخص في <strong>Firebase Console ← Authentication</strong>، وبعدين (٢) تضيفي سجل مطابق تحت عشان يقدر يدخل لوحة التحكم.",
    admin_staff_email: "إيميل الموظف (لازم يطابق الـ login بتاعه في Firebase Auth)",
    admin_staff_name: "الاسم",
    admin_staff_role: "الصلاحية",
    admin_staff_role_staff: "موظف — يدير الطلبات والمنتجات",
    admin_staff_role_admin: "أدمن — صلاحية كاملة",
    admin_add_staff: "إضافة موظف",
    admin_th_name: "الاسم",
    admin_th_email: "الإيميل",
    admin_th_role: "الصلاحية",
    admin_remove: "إزالة",
    admin_remove_confirm: "تشيلي صلاحية الدخول بتاعت الشخص ده؟",
    admin_staff_email_required: "الإيميل مطلوب.",
    admin_staff_note: "ملحوظة: ده بيعمل سجل للموظف بس، لسه محتاجة تعملي الـ login المطابق في Firebase Console ← Authentication بنفس الإيميل — وبعدين تنسخي الـ UID بتاعه هنا كمعرّف المستند. (شوفي ملف README للتفاصيل كاملة).",

    // Site nav — new pages
    nav_about: "قصتنا",
    nav_faq: "الأسئلة اللي بتتكرر",
    nav_terms: "الشروط والأحكام",
    nav_menu_label: "القايمة",
    theme_toggle_label: "تبديل المظهر",

    // Client account
    account_signin: "دخول",
    account_my_requests: "طلباتي",
    account_signout: "تسجيل خروج",
    account_modal_title_signin: "دخول",
    account_modal_title_signup: "عمل حساب",
    account_tab_signin: "عندي حساب",
    account_tab_signup: "حساب جديد",
    account_name: "اسمك",
    account_email: "الإيميل",
    account_password: "الباسورد",
    account_signup_btn: "اعملي حساب",
    account_signup_btn_loading: "بيتعمل الحساب...",
    account_signin_btn: "دخول",
    account_signin_btn_loading: "بيتم الدخول...",
    account_signup_error: "معرفناش نعمل الحساب. راجعي البيانات وجربي تاني.",
    account_signin_error: "الدخول مش ظابط — راجعي الإيميل والباسورد.",
    account_switch_to_signup: "معندكيش حساب؟ اعمليه دلوقتي",
    account_switch_to_signin: "عندك حساب خلاص؟ سجلي دخول",
    account_or_divider: "أو",
    account_google_signin: "الدخول بحساب جوجل",
    account_google_error: "معرفناش نسجل دخولك بجوجل. جربي تاني.",
    account_phone: "رقم الموبايل",
    account_profile_title: "أكملي بياناتك",
    account_profile_intro: "محتاجين رقم موبايلك عشان نقدر نكلمك بخصوص طلباتك.",
    account_profile_save: "حفظ",
    account_profile_save_loading: "جاري الحفظ...",
    account_profile_error: "معرفناش نحفظ بياناتك. جربي تاني.",

    // My Requests (client-side tracking)
    my_requests_title: "طلباتي",
    my_requests_empty: "لسه مبعتيش أي طلب.",
    my_requests_signed_out: "سجلي دخول عشان تتابعي حالة طلباتك.",
    my_requests_piece: "القطعة",
    my_requests_status: "الحالة",
    my_requests_date: "تاريخ الطلب",
    status_new: "جديد",
    status_contacted: "تم التواصل",
    status_confirmed: "مؤكَّد",
    status_in_progress: "شغالين عليه",
    status_delivered: "اتسلم",
    status_cancelled: "ملغي",

    // Product detail modal
    detail_cta_request: "اطلبي التصميم ده",
    detail_back: "→ رجوع",
    detail_img_prev: "الصورة اللي قبلها",
    detail_img_next: "الصورة اللي بعدها",
    sale_badge: "خصم",

    // Request form — address & material
    label_address: "العنوان (المحافظة، المدينة، الشارع)",
    label_material: "القماش المفضل",
    material_silk: "حرير",
    material_chiffon: "شيفون",
    material_satin: "ساتان",
    material_lace: "دانتيل",
    material_cotton: "قطن",
    material_crepe: "كريب",
    material_tulle: "تول",
    material_organza: "أورجانزا",
    material_velvet: "قطيفة",
    material_brocade: "بروكار",
    material_unspecified: "مش متأكدة لسه",

    // About page
    about_eyebrow: "قصتنا",
    about_title: "حبيبه موسي كوتور",
    about_intro: "أتيليه صغير مؤمن إن كل قطعة لازم تتعمل لواحدة بس، مش لرف عرض. بنشتغل معاكِ خطوة خطوة — من الفكرة الأولانية لحد آخر غرزة — عشان نديكِ إطلالة بصمتها إنتِ بس.",
    about_story_title: "بدأنا إزاي",
    about_story_body: "حبيبه موسي كوتور بدأت من شغف بالتفصيل والخياطة اليدوي، وكبرت لحد ما بقت وجهة لكل وحدة بتدور على قطعة مميزة لمناسبة تستاهل — من فستان السهرة لفستان الفرح.",
    about_values_title: "بنتميز بإيه",
    about_value1_title: "شغل إيد",
    about_value1_body: "كل قطعة بتتفصل بإيد وبعناية، من اختيار القماش لحد آخر تفصيلة.",
    about_value2_title: "استشارة شخصية",
    about_value2_body: "بنكلمك بنفسنا عشان نفهم ذوقك ومقاسك قبل ما نبدأ الشغل.",
    about_value3_title: "حسب الطلب بس",
    about_value3_body: "مفيش تخزين قطع جاهزة — كل قطعة بتتعمل خصيصي ليكِ بعد ما نأكد الطلب.",

    // FAQ page
    faq_eyebrow: "الأسئلة اللي بتتكرر",
    faq_title: "كل حاجة عايزة تعرفيها",
    faq_q1: "القطعة بكام؟",
    faq_a1: "السعر بيختلف حسب التصميم والقماش والتفاصيل. نطاق السعر التقريبي موجود جنب كل قطعة في الكولكشن، وبنأكد السعر النهائي بعد الاستشارة.",
    faq_q2: "التنفيذ بياخد قد إيه؟",
    faq_a2: "غالبًا من ٢ لـ ٤ أسابيع من تأكيد الطلب، وممكن ياخد أكتر شوية حسب صعوبة التصميم أو الموسم.",
    faq_q3: "لازم عربون؟",
    faq_a3: "نموذج الطلب في الموقع مفيهوش أي دفع — ده مجرد استفسار أولي. بنتفق على تفاصيل الدفع معاكِ مباشرة وقت الاستشارة.",
    faq_q4: "ينفع نظبط المقاس بعد الطلب؟",
    faq_a4: "أكيد، بنعمل جلسة قياس ونظبط التصميم على مقاسك قبل التسليم النهائي.",
    faq_q5: "التسليم أو الاستلام بيتم إزاي؟",
    faq_a5: "تقدري تستلمي قطعتك من الأتيليه أو نرتب شحن، وهنأكد التفاصيل معاكِ قبل ميعاد التسليم.",
    faq_q6: "ينفع ألغي الطلب؟",
    faq_a6: "أيوه، ينفع تلغي الطلب في أول مراحله لو كلمتينا على طول — شوفي صفحة الشروط والأحكام للتفاصيل.",

    // Contact page
    contact_eyebrow: "تواصلي معانا",
    contact_title: "تواصلك يسعدنا",
    contact_intro: "أي استفسار برا نموذج الطلب، احنا هنا نسمعك بأي وسيلة من دول.",
    contact_whatsapp_label: "واتساب",
    contact_phone_label: "التليفون",
    contact_email_label: "الإيميل",
    contact_hours_label: "مواعيد الشغل",
    contact_hours_value: "من السبت للخميس، من ١٠ الصبح لـ ٦ المغرب",
    contact_location_label: "العنوان",
    contact_location_value: "الإسكندرية، مصر (بميعاد مسبق)",

    // Terms & policies page
    terms_eyebrow: "الشروط والسياسات",
    terms_title: "الشروط والسياسات",
    terms_intro: "نشارككِ هنا الأساسيات التي تحكم طلبكِ، حرصًا على الوضوح منذ اللحظة الأولى.",
    terms_orders_title: "الطلبات",
    terms_orders_body: "نموذج الطلب على الموقع هو استفسار أولي وليس التزامًا بالدفع. يتم تأكيد التفاصيل والسعر والموعد بعد التواصل المباشر معكِ.",
    terms_cancellation_title: "الإلغاء والتعديل",
    terms_cancellation_body: "يمكن إلغاء الطلب أو تعديله قبل بدء التنفيذ الفعلي بالتواصل معنا. بعد بدء التفصيل، قد لا يكون الإلغاء ممكنًا حسب مرحلة العمل.",
    terms_privacy_title: "الخصوصية",
    terms_privacy_body: "نستخدم بياناتكِ (الاسم، رقم التواصل، تفاصيل الطلب) فقط للتواصل معكِ بخصوص طلبكِ، ولا نشاركها مع أي طرف ثالث.",
    terms_deposit_title: "العربون",
    terms_deposit_body: "يُطلب دفع عربون بنسبة {percent}% من إجمالي السعر لتأكيد الطلب وبدء التنفيذ، ويُستحق باقي المبلغ عند التسليم.",
    terms_protection_title: "حماية العميلة",
    terms_protection_body: "نلتزم بتسليم القطعة وفق المواصفات المتفق عليها معكِ. إذا لم تُطابق القطعة التفاصيل المؤكدة، يحق لكِ طلب التعديل اللازم قبل الاستلام النهائي. في حال تعذّر التنفيذ لسبب راجع إلينا، يُرد العربون بالكامل.",
  },

  en: {
    nav_collection: "Collection",
    nav_how: "How It Works",
    nav_contact: "Contact",
    brand_suffix: "Couture",

    hero_eyebrow: "Made to order — Alexandria, Egypt",
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
    filter_all_collections: "All Collections",
    search_placeholder: "Search for a piece...",
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
    admin_nav_collections: "Collections",
    admin_nav_settings: "Settings",
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
    admin_th_address: "Address",
    admin_th_material: "Material",
    admin_requests_search_ph: "Search by name, phone, piece...",
    admin_requests_empty: "No requests yet.",

    admin_products_title: "Product Catalog",
    admin_add_piece: "+ Add Piece",
    admin_products_search_ph: "Search by name, code, category...",
    admin_new_piece: "New Piece",
    admin_edit_piece: "Edit Piece",
    admin_p_name: "Name",
    admin_p_category: "Category",
    admin_p_category_ph: "e.g. Evening Gown, Abaya, Bridal",
    admin_p_price: "Price range",
    admin_p_price_ph: "e.g. 1,800 – 2,600 EGP",
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

    // Site nav — new pages
    nav_about: "Our Story",
    nav_faq: "FAQ",
    nav_terms: "Terms & Policies",
    nav_menu_label: "Menu",
    theme_toggle_label: "Toggle theme",

    // Client account
    account_signin: "Sign In",
    account_my_requests: "My Requests",
    account_signout: "Sign Out",
    account_modal_title_signin: "Sign In",
    account_modal_title_signup: "Create Account",
    account_tab_signin: "I have an account",
    account_tab_signup: "New account",
    account_name: "Your name",
    account_email: "Email",
    account_password: "Password",
    account_signup_btn: "Create Account",
    account_signup_btn_loading: "Creating...",
    account_signin_btn: "Sign In",
    account_signin_btn_loading: "Signing in...",
    account_signup_error: "Couldn't create your account. Check your details and try again.",
    account_signin_error: "Sign in failed — check your email and password.",
    account_switch_to_signup: "Don't have an account? Sign up",
    account_switch_to_signin: "Already have an account? Sign in",
    account_or_divider: "or",
    account_google_signin: "Continue with Google",
    account_google_error: "Couldn't sign you in with Google. Please try again.",
    account_phone: "Phone number",
    account_profile_title: "Complete your profile",
    account_profile_intro: "We need your phone number so we can reach you about your requests.",
    account_profile_save: "Save",
    account_profile_save_loading: "Saving...",
    account_profile_error: "Couldn't save your details. Please try again.",

    // My Requests (client-side tracking)
    my_requests_title: "My Requests",
    my_requests_empty: "You haven't sent any requests yet.",
    my_requests_signed_out: "Sign in to track the status of your requests.",
    my_requests_piece: "Piece",
    my_requests_status: "Status",
    my_requests_date: "Requested",
    status_new: "New",
    status_contacted: "Contacted",
    status_confirmed: "Confirmed",
    status_in_progress: "In Progress",
    status_delivered: "Delivered",
    status_cancelled: "Cancelled",

    // Product detail modal
    detail_cta_request: "Request This Design",
    detail_back: "← Back",
    detail_img_prev: "Previous image",
    detail_img_next: "Next image",
    sale_badge: "Sale",

    // Request form — address & material
    label_address: "Address (Governorate, City, Street)",
    label_material: "Preferred Material",
    material_silk: "Silk",
    material_chiffon: "Chiffon",
    material_satin: "Satin",
    material_lace: "Lace",
    material_cotton: "Cotton",
    material_crepe: "Crepe",
    material_tulle: "Tulle",
    material_organza: "Organza",
    material_velvet: "Velvet",
    material_brocade: "Brocade",
    material_unspecified: "Not sure yet",

    // About page
    about_eyebrow: "Our Story",
    about_title: "Habiba Mousa Couture",
    about_intro: "A small atelier built on the belief that every piece should be made for one woman, not a rack. We work with you step by step — from the first idea to the last stitch — to give you a look that's entirely yours.",
    about_story_title: "How it started",
    about_story_body: "Habiba Mousa Couture began as a passion for traditional Khaleeji tailoring and handcrafted detail, and grew into a destination for anyone seeking an exceptional piece for an occasion worth it — from evening gowns to bridal wear.",
    about_values_title: "What sets us apart",
    about_value1_title: "Handcrafted detail",
    about_value1_body: "Every piece is tailored by hand with care, from fabric selection to the final finish.",
    about_value2_title: "Personal consultation",
    about_value2_body: "We speak with you directly to understand your taste and measurements before work begins.",
    about_value3_title: "Made to order only",
    about_value3_body: "No ready stock — every piece is made specifically for you once a request is confirmed.",

    // FAQ page
    faq_eyebrow: "FAQ",
    faq_title: "Everything you'd want to know",
    faq_q1: "How much does a piece cost?",
    faq_a1: "Price depends on the design, fabric, and detail work. An approximate range is shown with each piece in the collection, and we confirm the final price after consultation.",
    faq_q2: "How long does it take?",
    faq_a2: "Typically 2–4 weeks from confirming the request, sometimes longer depending on the design's complexity or the season.",
    faq_q3: "Is a deposit required?",
    faq_a3: "The request form on this site involves no payment — it's an initial inquiry only. Payment details are arranged directly with you during consultation.",
    faq_q4: "Can measurements be adjusted after the request?",
    faq_a4: "Yes — we hold a fitting session and adjust the design to your measurements before final delivery.",
    faq_q5: "How does delivery or pickup work?",
    faq_a5: "You can collect your piece from the atelier or arrange shipping; we'll confirm the details with you as delivery approaches.",
    faq_q6: "Can I cancel my request?",
    faq_a6: "Yes, a request can be cancelled in its early stages by contacting us directly — see the Terms & Policies page for details.",

    // Contact page
    contact_eyebrow: "Contact",
    contact_title: "We'd love to hear from you",
    contact_intro: "For anything outside the request form, reach us directly through any of the following.",
    contact_whatsapp_label: "WhatsApp",
    contact_phone_label: "Phone",
    contact_email_label: "Email",
    contact_hours_label: "Hours",
    contact_hours_value: "Saturday – Thursday, 10am – 6pm",
    contact_location_label: "Location",
    contact_location_value: "Alexandria, Egypt (by appointment)",

    // Terms & policies page
    terms_eyebrow: "Terms & Policies",
    terms_title: "Terms & Policies",
    terms_intro: "Here are the basics that govern your request, for clarity from the very first step.",
    terms_orders_title: "Orders",
    terms_orders_body: "The request form on this site is an initial inquiry, not a payment commitment. Details, pricing, and timeline are confirmed after we speak with you directly.",
    terms_cancellation_title: "Cancellation & Changes",
    terms_cancellation_body: "A request can be cancelled or changed before work actually begins by contacting us. Once tailoring has started, cancellation may not be possible depending on the stage of work.",
    terms_privacy_title: "Privacy",
    terms_privacy_body: "We use your details (name, contact number, request notes) only to communicate with you about your request, and never share them with any third party.",
    terms_deposit_title: "Deposit",
    terms_deposit_body: "A deposit of {percent}% of the total price is required to confirm the order and begin work; the remaining balance is due at delivery.",
    terms_protection_title: "Buyer Protection",
    terms_protection_body: "We commit to delivering the piece as agreed with you. If it doesn't match the confirmed details, you're entitled to request the necessary adjustment before final handover. If we're unable to complete the order for a reason on our end, the deposit is refunded in full.",
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
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
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
