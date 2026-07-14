//==================================================
// Tender-leaves
// script.js
//==================================================

let products = [];

let deliveryData = [];

let PRODUCT_PRICE = 0;

let selectedProduct = null;

//================================
// إنشاء Event ID
//================================
function createEventId() {

    if (window.crypto && crypto.randomUUID) {

        return crypto.randomUUID();

    }

    return "evt_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2);

}

//================================
// قراءة Cookie
//================================
function getCookie(name) {

    const value = "; " + document.cookie;

    const parts = value.split("; " + name + "=");

    if (parts.length === 2) {

        return parts.pop().split(";").shift();

    }

    return "";

}

//================================
// تحميل المنتجات
//================================
async function loadProducts() {

    try {

        const res = await fetch("/api/products");

        products = await res.json();

        let html = "";

        products.forEach((p, index) => {

            html += `
                <button
                    class="category-btn"
                    onclick="selectProduct(${index},this)">
                    ${p.name}
                </button>
            `;

        });

        document.getElementById("categories").innerHTML = html;

        if (products.length) {

            const firstBtn =
                document.querySelector(".category-btn");

            selectProduct(0, firstBtn);

        }

    }

    catch (err) {

        console.error(err);

        alert("تعذر تحميل المناسبات");

    }

}

//================================
// اختيار المنتج
//================================
function selectProduct(index, btn) {

    selectedProduct = products[index];

    PRODUCT_PRICE = Number(selectedProduct.price);

    //--------------------------------
    // تغيير الصورة
    //--------------------------------
    const img =
        document.getElementById("mainImage");

    img.style.opacity = "0";

    img.src =
        "images/" + selectedProduct.image;

    img.onload = function () {

        img.style.opacity = "1";

    };

    //--------------------------------
    // تحديث السعر
    //--------------------------------
    document.getElementById("productPrice").innerHTML =
        PRODUCT_PRICE;

    document.getElementById("priceValue").innerHTML =
        PRODUCT_PRICE;

    //--------------------------------
    // تحديث الزر النشط
    //--------------------------------
    document
        .querySelectorAll(".category-btn")
        .forEach(btn => {

            btn.classList.remove("active");

        });

    if (btn) {

        btn.classList.add("active");

    }

    //--------------------------------
    // Meta Pixel
    //--------------------------------
    const eventId = createEventId();

    if (typeof fbq !== "undefined") {

        fbq(

            "track",

            "ViewContent",

            {

                content_name: selectedProduct.name,

                content_category: "Tender-leaves",

                value: PRODUCT_PRICE,

                currency: "DZD"

            },

            {

                eventID: eventId

            }

        );

    }

    //--------------------------------
    // تحديث الإجمالي
    //--------------------------------
    updateTotal();

}
//================================
// تحميل الولايات
//================================
async function loadDelivery() {

    try {

        const res =
            await fetch("/api/delivery");

        deliveryData =
            await res.json();

        let html =
            '<option value="">اختر الولاية</option>';

        deliveryData.forEach(w => {

            html += `
                <option value="${w.name}">
                    ${w.name}
                </option>
            `;

        });

        document.getElementById("wilaya").innerHTML =
            html;

    }

    catch (err) {

        console.error(err);

        alert("تعذر تحميل أسعار التوصيل");

    }

}

//================================
// عند تغيير الولاية أو نوع التوصيل
//================================
document.addEventListener("change", function (e) {

    if (

        e.target.id === "wilaya"

        ||

        e.target.id === "deliveryType"

    ) {

        updateTotal();

    }

});

//================================
// حساب السعر الإجمالي
//================================
function updateTotal() {

    let deliveryPrice = 0;

    const wilaya =
        document.getElementById("wilaya").value;

    const deliveryType =
        document.getElementById("deliveryType").value;

    const row =
        deliveryData.find(x => x.name === wilaya);

    if (row) {

        if (deliveryType === "home") {

            deliveryPrice =
                Number(row.home);

        }

        else {

            deliveryPrice =
                Number(row.office);

        }

    }

    document.getElementById("deliveryPrice").innerHTML =
        deliveryPrice;

    document.getElementById("totalPrice").innerHTML =
        PRODUCT_PRICE + deliveryPrice;

}
//================================
// إرسال الطلب
//================================
async function sendOrder() {

    if (selectedProduct == null) {

        alert("اختر نوع المناسبة");

        return;

    }

    //--------------------------------
    // قراءة البيانات
    //--------------------------------
    const recipientName =
        document.getElementById("recipientName").value.trim();

    const notes =
        document.getElementById("notes").value.trim();

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

    //--------------------------------
    // التحقق من البيانات
    //--------------------------------
    if (recipientName === "") {

        alert("أدخل اسم الناجح");

        return;

    }

    if (fullName === "") {

        alert("أدخل الاسم الكامل");

        return;

    }

    if (phone === "") {

        alert("أدخل رقم الهاتف");

        return;

    }

    const phoneRegex =
        /^(05|06|07)[0-9]{8}$/;

    if (!phoneRegex.test(phone)) {

        alert("يرجى إدخال رقم هاتف صحيح");

        return;

    }

    if (wilaya === "") {

        alert("اختر الولاية");

        return;

    }

    //--------------------------------
    // حساب سعر التوصيل
    //--------------------------------
    const row =
        deliveryData.find(x => x.name === wilaya);

    const deliveryPrice =
        deliveryType === "home"

            ? Number(row.home)

            : Number(row.office);

    const total =
        PRODUCT_PRICE + deliveryPrice;

    //--------------------------------
    // إنشاء Event ID
    //--------------------------------
    const eventId =
        createEventId();

    //--------------------------------
    // بيانات الطلب
    //--------------------------------
    const orderData = {

        productName:
            selectedProduct.name,

        image:
            selectedProduct.image,

        recipientName,

        notes,

        fullName,

        phone,

        wilaya,

        deliveryType,

        officeName,

        productPrice:
            PRODUCT_PRICE,

        deliveryPrice,

        total,

        //--------------------------------
        // بيانات Meta
        //--------------------------------
        eventId,

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
    // Meta Pixel
    //--------------------------------
    if (typeof fbq !== "undefined") {

        fbq(

            "track",

            "InitiateCheckout",

            {

                value: total,

                currency: "DZD"

            },

            {

                eventID: eventId

            }

        );

    }
        //--------------------------------
    // إرسال الطلب إلى الخادم
    //--------------------------------
    try {

        const res = await fetch("/api/send", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(orderData)

        });

        const result = await res.json();

        if (result.ok) {

            //--------------------------------
            // Meta Pixel - Purchase
            //--------------------------------
            if (typeof fbq !== "undefined") {

                fbq(

                    "track",

                    "Purchase",

                    {

                        value: total,

                        currency: "DZD",

                        content_name: selectedProduct.name,

                        content_category: "Tender-leaves"

                    },

                    {

                        eventID: eventId

                    }

                );

            }

            //--------------------------------
            // نافذة النجاح
            //--------------------------------
            document.getElementById("successModal").style.display = "flex";

            //--------------------------------
            // تفريغ النموذج
            //--------------------------------
            document.getElementById("recipientName").value = "";

            document.getElementById("notes").value = "";

            document.getElementById("fullName").value = "";

            document.getElementById("phone").value = "";

            document.getElementById("officeName").value = "";

            document.getElementById("wilaya").selectedIndex = 0;

            document.getElementById("deliveryType").selectedIndex = 0;

            //--------------------------------
            // إعادة الأسعار
            //--------------------------------
            document.getElementById("deliveryPrice").innerHTML = 0;

            document.getElementById("totalPrice").innerHTML = PRODUCT_PRICE;

            //--------------------------------
            // العودة لأول تصميم
            //--------------------------------
            if (products.length) {

                const firstBtn =
                    document.querySelector(".category-btn");

                selectProduct(0, firstBtn);

            }

        }

        else {

            alert(result.error || "فشل إرسال الطلب");

        }

    }

    catch (err) {

        console.error(err);

        alert("خطأ في الاتصال بالخادم");

    }

}
//================================
// إغلاق نافذة النجاح
//================================
function closeModal() {

    document.getElementById("successModal").style.display = "none";

}

//================================
// تشغيل التطبيق
//================================
window.addEventListener("load", async function () {

    //--------------------------------
    // تحميل المنتجات
    //--------------------------------
    await loadProducts();

    //--------------------------------
    // تحميل الولايات
    //--------------------------------
    await loadDelivery();

});
