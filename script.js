let products = [];
let deliveryData = [];
let PRODUCT_PRICE = 0;
let selectedProduct = null;

//================================
// تحميل المناسبات
//================================
async function loadProducts(){

    try{

        const res = await fetch("/api/products");

        products = await res.json();

        let html = "";

        products.forEach((p,index)=>{

            html += `
                <button
                    class="category-btn"
                    onclick="selectProduct(${index},this)">
                    ${p.name}
                </button>
            `;

        });

        document.getElementById("categories").innerHTML = html;

        // اختيار أول مناسبة تلقائياً
        if(products.length){

            const firstBtn =
            document.querySelector(".category-btn");

            selectProduct(0,firstBtn);

        }

    }catch(err){

        console.log(err);

        alert("تعذر تحميل المناسبات");

    }

}

//================================
// اختيار المناسبة
//================================
function selectProduct(index,btn){

    selectedProduct = products[index];

    PRODUCT_PRICE = Number(selectedProduct.price);

    //==============================
    // Meta Pixel - ViewContent
    //==============================
    if(typeof fbq !== "undefined"){

        fbq("track","ViewContent",{

            content_name:selectedProduct.name,

            content_category:"Tender-leaves",

            value:PRODUCT_PRICE,

            currency:"DZD"

        });

    }

    const img =
    document.getElementById("mainImage");

    img.style.opacity="0";

    img.src =
    "images/" + selectedProduct.image;

    img.onload=function(){

        img.style.opacity="1";

    };

    document.getElementById("productPrice").innerHTML =
    PRODUCT_PRICE;

    document.getElementById("priceValue").innerHTML =
    PRODUCT_PRICE;

    document
    .querySelectorAll(".category-btn")
    .forEach(x=>x.classList.remove("active"));

    if(btn){

        btn.classList.add("active");

    }

    updateTotal();

}
//================================
// تحميل الولايات
//================================
async function loadDelivery(){

    try{

        const res =
        await fetch("/api/delivery");

        deliveryData =
        await res.json();

        let html =
        '<option value="">اختر الولاية</option>';

        deliveryData.forEach(w=>{

            html += `
                <option value="${w.name}">
                    ${w.name}
                </option>
            `;

        });

        document.getElementById("wilaya").innerHTML =
        html;

    }catch(err){

        console.log(err);

    }

}

//================================
// تحديث السعر عند تغيير الولاية
//================================
document.addEventListener("change",function(e){

    if(

        e.target.id=="wilaya"

        ||

        e.target.id=="deliveryType"

    ){

        updateTotal();

    }

});

//================================
// حساب المجموع
//================================
function updateTotal(){

    let deliveryPrice = 0;

    const wilaya =
    document.getElementById("wilaya").value;

    const deliveryType =
    document.getElementById("deliveryType").value;

    const row =
    deliveryData.find(x => x.name == wilaya);

    if(row){

        if(deliveryType=="home"){

            deliveryPrice = Number(row.home);

        }else{

            deliveryPrice = Number(row.office);

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
async function sendOrder(){

    if(selectedProduct==null){

        alert("اختر نوع المناسبة");

        return;

    }

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

    if(recipientName==""){

        alert("أدخل اسم المهدى إليه");

        return;

    }

    if(fullName==""){

        alert("أدخل الاسم الكامل");

        return;

    }

    if(phone==""){

        alert("أدخل رقم الهاتف");

        return;

    }

    const phoneRegex = /^(05|06|07)[0-9]{8}$/;

    if(!phoneRegex.test(phone)){

        alert("يرجى إدخال رقم هاتف صحيح");

        return;

    }

    if(wilaya==""){

        alert("اختر الولاية");

        return;

    }

    const row =
    deliveryData.find(x=>x.name==wilaya);

    const deliveryPrice =
    deliveryType=="home"
    ?
    Number(row.home)
    :
    Number(row.office);

    const total =
    PRODUCT_PRICE + deliveryPrice;

    const orderData={

        productName:selectedProduct.name,

        image:selectedProduct.image,

        recipientName,

        notes,

        fullName,

        phone,

        wilaya,

        deliveryType,

        officeName,

        productPrice:PRODUCT_PRICE,

        deliveryPrice,

        total

    };

    //==============================
    // Meta Pixel - InitiateCheckout
    //==============================
    if(typeof fbq !== "undefined"){

        fbq("track","InitiateCheckout",{

            value:total,

            currency:"DZD"

        });

    }

    try{

        const res = await fetch("/api/send",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify(orderData)

        });

        const result = await res.json();
                if(result.ok){

            //==============================
            // Meta Pixel - Purchase
            //==============================
            if(typeof fbq !== "undefined"){

                fbq("track","Purchase",{

                    value:total,

                    currency:"DZD",

                    content_name:selectedProduct.name

                });

            }

            document.getElementById("successModal").style.display="flex";

            document.getElementById("recipientName").value = "";

            document.getElementById("notes").value = "";

            document.getElementById("fullName").value = "";

            document.getElementById("phone").value = "";

            document.getElementById("officeName").value = "";

            document.getElementById("wilaya").selectedIndex = 0;

            document.getElementById("deliveryType").selectedIndex = 0;

            // العودة لأول مناسبة بعد نجاح الطلب
            if(products.length){

                const firstBtn =
                document.querySelector(".category-btn");

                selectProduct(0,firstBtn);

            }

        }else{

            alert("فشل إرسال الطلب");

        }

    }catch(err){

        console.log(err);

        alert("خطأ في الاتصال بالخادم");

    }

}

//================================
// إغلاق نافذة النجاح
//================================
function closeModal(){

    document.getElementById("successModal").style.display = "none";

}

//================================
// تشغيل التطبيق
//================================
window.onload = function(){

    //==============================
    // Meta Pixel - PageView
    //==============================
    if(typeof fbq !== "undefined"){

        fbq("track","PageView");

    }

    loadProducts();

    loadDelivery();

};
