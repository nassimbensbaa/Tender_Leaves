//==================================================
// Tender-leaves
// script.js
// Meta Pixel + Meta Conversions API
//==================================================

//==============================
// المتغيرات العامة
//==============================
let products = [];
let deliveryData = [];
let PRODUCT_PRICE = 0;
let selectedProduct = null;

//==============================
// إنشاء Event ID
//==============================
function createEventId() {

    if (window.crypto && crypto.randomUUID) {

        return crypto.randomUUID();

    }

    return "evt_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2);

}

//==============================
// قراءة Cookie
//==============================
function getCookie(name) {

    const value = "; " + document.cookie;

    const parts = value.split("; " + name + "=");

    if (parts.length === 2) {

        return parts.pop().split(";").shift();

    }

    return "";

}

//==============================
// إرسال حدث إلى Conversions API
//==============================
async function sendServerEvent(payload) {

    try {

        await fetch("/api/meta", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(payload)

        });

    }

    catch (err) {

        console.error("Meta CAPI Error:", err);

    }

}

//==============================
// إرسال حدث إلى Pixel + CAPI
//==============================
async function trackEvent(eventName, params = {}) {

    const eventId = createEventId();

    //--------------------------
    // Meta Pixel
    //--------------------------
    if (typeof fbq !== "undefined") {

        fbq(

            "track",

            eventName,

            params,

            {

                eventID: eventId

            }

        );

    }

    //--------------------------
    // Meta Conversions API
    //--------------------------
    await sendServerEvent({

        eventName,

        eventId,

        pageUrl: window.location.href,

        userAgent: navigator.userAgent,

        phone: params.phone || "",

        fbp: getCookie("_fbp"),

        fbc: getCookie("_fbc"),

        value: params.value || 0,

        currency: params.currency || "DZD",

        productName: params.content_name || ""

    });

}

//==============================
// تنسيق السعر
//==============================
function formatPrice(price) {

    return Number(price).toLocaleString("fr-DZ");

}
//==============================
// تحميل التصاميم
//==============================
async function loadProducts() {

    try {

        const res = await fetch("/api/products");

        if (!res.ok) {

            throw new Error("تعذر تحميل المنتجات");

        }

        products = await res.json();

        let html = "";

        products.forEach((product, index) => {

            html += `
                <button
                    class="category-btn"
                    onclick="selectProduct(${index}, this)">
                    ${product.name}
                </button>
            `;

        });

        document.getElementById("categories").innerHTML = html;

        //--------------------------------
        // اختيار أول تصميم تلقائياً
        //--------------------------------
        if (products.length > 0) {

            const firstButton =
                document.querySelector(".category-btn");

            await selectProduct(

                0,

                firstButton

            );

        }

    }

    catch (err) {

        console.error(err);

        alert("تعذر تحميل التصاميم");

    }

}

//==============================
// اختيار التصميم
//==============================
async function selectProduct(index, button) {

    //--------------------------------
    // حفظ المنتج الحالي
    //--------------------------------
    selectedProduct = products[index];

    PRODUCT_PRICE = Number(selectedProduct.price);

    //--------------------------------
    // تحديث الصورة
    //--------------------------------
    const image =
        document.getElementById("mainImage");

    image.style.opacity = "0";

    image.src =
        "images/" + selectedProduct.image;

    image.onload = function () {

        image.style.opacity = "1";

    };

    //--------------------------------
    // تحديث السعر
    //--------------------------------
    document.getElementById("productPrice").textContent =
        formatPrice(PRODUCT_PRICE);

    document.getElementById("priceValue").textContent =
        formatPrice(PRODUCT_PRICE);

    //--------------------------------
    // تفعيل الزر الحالي
    //--------------------------------
    document
        .querySelectorAll(".category-btn")
        .forEach(btn => {

            btn.classList.remove("active");

        });

    if (button) {

        button.classList.add("active");

    }

    //--------------------------------
    // تحديث الإجمالي
    //--------------------------------
    updateTotal();

    //--------------------------------
    // إرسال حدث ViewContent
    //--------------------------------
    await trackEvent(

        "ViewContent",

        {

            content_name:
                selectedProduct.name,

            content_category:
                "Tender-leaves",

            value:
                PRODUCT_PRICE,

            currency:
                "DZD"

        }

    );

}
//==============================
// تحميل أسعار التوصيل
//==============================
async function loadDelivery() {

    try {

        const res = await fetch("/api/delivery");

        if (!res.ok) {

            throw new Error("تعذر تحميل بيانات التوصيل");

        }

        deliveryData = await res.json();

        let html = '<option value="">اختر الولاية</option>';

        deliveryData.forEach(item => {

            html += `
                <option value="${item.name}">
                    ${item.name}
                </option>
            `;

        });

        document.getElementById("wilaya").innerHTML = html;

    }

    catch (err) {

        console.error(err);

        alert("تعذر تحميل بيانات التوصيل");

    }

}

//==============================
// تحديث السعر عند تغيير الولاية
//==============================
document.addEventListener(

    "change",

    function (e) {

        if (

            e.target.id === "wilaya"

            ||

            e.target.id === "deliveryType"

        ) {

            updateTotal();

        }

    }

);

//==============================
// الحصول على سعر التوصيل
//==============================
function getDeliveryPrice() {

    const wilaya =
        document.getElementById("wilaya").value;

    const deliveryType =
        document.getElementById("deliveryType").value;

    if (!wilaya) {

        return 0;

    }

    const row =
        deliveryData.find(

            item => item.name === wilaya

        );

    if (!row) {

        return 0;

    }

    if (deliveryType === "home") {

        return Number(row.home);

    }

    return Number(row.office);

}

//==============================
// تحديث الأسعار
//==============================
function updateTotal() {

    const deliveryPrice =
        getDeliveryPrice();

    const total =
        PRODUCT_PRICE + deliveryPrice;

    document.getElementById("deliveryPrice").textContent =
        formatPrice(deliveryPrice);

    document.getElementById("totalPrice").textContent =
        formatPrice(total);

}

//==============================
// إعادة تعيين النموذج
//==============================
function resetForm() {

    document.getElementById("recipientName").value = "";

    document.getElementById("fullName").value = "";

    document.getElementById("phone").value = "";

    document.getElementById("officeName").value = "";

    document.getElementById("notes").value = "";

    document.getElementById("wilaya").selectedIndex = 0;

    document.getElementById("deliveryType").selectedIndex = 0;

    updateTotal();

}
//==============================
// إرسال الطلب
//==============================
async function sendOrder() {

    //--------------------------------
    // التأكد من اختيار تصميم
    //--------------------------------
    if (!selectedProduct) {

        alert("اختر نوع التصميم");

        return;

    }

    //--------------------------------
    // قراءة البيانات
    //--------------------------------
    const recipientName =
        document.getElementById("recipientName").value.trim();

    const fullName =
        document.getElementById("fullName").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const wilaya =
        document.getElementById("wilaya").value;

    const deliveryType =
        document.getElementById("deliveryType").value;

    const officeName =
        document.getElementById("officeName").value.trim();

    const notes =
        document.getElementById("notes").value.trim();

    //--------------------------------
    // التحقق من الحقول
    //--------------------------------
    if (recipientName === "") {

        alert("أدخل اسم الناجح / الناجحة");

        return;

    }

    if (fullName === "") {

        alert("أدخل اسم طالب المنتج");

        return;

    }

    if (phone === "") {

        alert("أدخل رقم الهاتف");

        return;

    }

    const phoneRegex = /^(05|06|07)[0-9]{8}$/;

    if (!phoneRegex.test(phone)) {

        alert("يرجى إدخال رقم هاتف صحيح");

        return;

    }

    if (wilaya === "") {

        alert("اختر الولاية");

        return;

    }

    //--------------------------------
    // حساب الأسعار
    //--------------------------------
    const deliveryPrice =
        getDeliveryPrice();

    const total =
        PRODUCT_PRICE + deliveryPrice;

    //--------------------------------
    // إرسال حدث InitiateCheckout
    //--------------------------------
    await trackEvent(

        "InitiateCheckout",

        {

            content_name:
                selectedProduct.name,

            value:
                total,

            currency:
                "DZD",

            phone:
                phone

        }

    );

    //--------------------------------
    // تجهيز بيانات الطلب
    //--------------------------------
    const orderData = {

        productName:
            selectedProduct.name,

        image:
            selectedProduct.image,

        recipientName,

        fullName,

        phone,

        wilaya,

        deliveryType,

        officeName,

        notes,

        productPrice:
            PRODUCT_PRICE,

        deliveryPrice,

        total,

        pageUrl:
            window.location.href,

        userAgent:
            navigator.userAgent,

        fbp:
            getCookie("_fbp"),

        fbc:
            getCookie("_fbc")

    };

    //--------------------------------
    // إرسال الطلب إلى API
    //--------------------------------
    try {

        const response =
            await fetch(

                "/api/send",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(orderData)

                }

            );

        const result =
            await response.json();
                //--------------------------------
        // نجاح إرسال الطلب
        //--------------------------------
        if (result.ok) {

            //--------------------------------
            // إرسال Purchase
            //--------------------------------
            await trackEvent(

                "Purchase",

                {

                    content_name:
                        selectedProduct.name,

                    value:
                        total,

                    currency:
                        "DZD",

                    phone:
                        phone

                }

            );

            //--------------------------------
            // نافذة النجاح
            //--------------------------------
            document.getElementById("successModal").style.display =
                "flex";

            //--------------------------------
            // إعادة تعيين النموذج
            //--------------------------------
            resetForm();

            //--------------------------------
            // العودة لأول تصميم
            //--------------------------------
            if (products.length > 0) {

                const firstButton =
                    document.querySelector(".category-btn");

                await selectProduct(

                    0,

                    firstButton

                );

            }

        }

        else {

            alert("فشل إرسال الطلب");

        }

    }

    catch (err) {

        console.error(err);

        alert("خطأ في الاتصال بالخادم");

    }

}

//==============================
// إغلاق نافذة النجاح
//==============================
function closeModal() {

    document.getElementById("successModal").style.display =
        "none";

}

//==============================
// تشغيل الموقع
//==============================
window.onload = async function () {

    //--------------------------------
    // تحميل بيانات التوصيل أولاً
    //--------------------------------
    await loadDelivery();

    //--------------------------------
    // تحميل المنتجات
    //--------------------------------
    await loadProducts();

    //--------------------------------
    // تحديث الأسعار
    //--------------------------------
    updateTotal();

    //--------------------------------
    // إرسال PageView
    //--------------------------------
    await trackEvent(

        "PageView",

        {

            value: 0,

            currency: "DZD"

        }

    );

};
