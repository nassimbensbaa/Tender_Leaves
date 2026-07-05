let products = [];
let deliveryData = [];
let PRODUCT_PRICE = 0;
let selectedProduct = null;

//============================
// تحميل المنتجات
//============================
async function loadProducts() {

    try {

        const res = await fetch("/api/products");

        products = await res.json();

        let html = '<option value="">اختر نوع المناسبة</option>';

        products.forEach(p => {

            html += `
            <option value="${p.id}">
                ${p.name}
            </option>`;

        });

        document.getElementById("product").innerHTML = html;

    } catch (err) {

        console.log(err);

        alert("تعذر تحميل المنتجات");

    }

}

//============================
// تحميل الولايات
//============================
async function loadDelivery() {

    try {

        const res = await fetch("/api/delivery");

        deliveryData = await res.json();

        let html = '<option value="">اختر الولاية</option>';

        deliveryData.forEach(w => {

            html += `
            <option value="${w.name}">
                ${w.name}
            </option>`;

        });

        document.getElementById("wilaya").innerHTML = html;

    } catch (err) {

        console.log(err);

    }

}

//============================
// اختيار المناسبة
//============================
document.addEventListener("change", function(e){

    if(e.target.id=="product"){

        const id=e.target.value;

        selectedProduct=products.find(x=>x.id==id);

        if(!selectedProduct)return;

        PRODUCT_PRICE=Number(selectedProduct.price);

        document.getElementById("mainImage").src=
        "images/"+selectedProduct.image;

        document.getElementById("productPrice").innerHTML=
        PRODUCT_PRICE;

        document.getElementById("priceValue").innerHTML=
        PRODUCT_PRICE;

        updateTotal();

    }

});

//============================
// تغيير الولاية أو نوع التوصيل
//============================
document.addEventListener("change",function(e){

    if(

        e.target.id=="wilaya"

        ||

        e.target.id=="deliveryType"

    ){

        updateTotal();

    }

});
//============================
// حساب المجموع
//============================
function updateTotal(){

    let deliveryPrice = 0;

    const wilaya =
    document.getElementById("wilaya").value;

    const deliveryType =
    document.getElementById("deliveryType").value;

    const row =
    deliveryData.find(x=>x.name==wilaya);

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

//============================
// إرسال الطلب
//============================
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

        alert("أدخل الاسم");

        return;

    }

    if(phone==""){

        alert("أدخل رقم الهاتف");

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

    const orderData = {

        productName : selectedProduct.name,

        image : selectedProduct.image,

        recipientName,

        notes,

        fullName,

        phone,

        wilaya,

        deliveryType,

        officeName,

        productPrice : PRODUCT_PRICE,

        deliveryPrice,

        total

    };
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

            document.getElementById("successModal").style.display="flex";

            document.getElementById("recipientName").value="";

            document.getElementById("notes").value="";

            document.getElementById("fullName").value="";

            document.getElementById("phone").value="";

            document.getElementById("officeName").value="";

            document.getElementById("product").selectedIndex=0;

            document.getElementById("mainImage").src="images/no-image.jpg";

            document.getElementById("productPrice").innerHTML="0";

            document.getElementById("priceValue").innerHTML="0";

            document.getElementById("deliveryPrice").innerHTML="0";

            document.getElementById("totalPrice").innerHTML="0";

            PRODUCT_PRICE=0;

            selectedProduct=null;

        }else{

            alert("فشل إرسال الطلب");

        }

    }catch(err){

        console.log(err);

        alert("خطأ في الاتصال بالخادم");

    }

}

//============================
// إغلاق نافذة النجاح
//============================
function closeModal(){

    document.getElementById("successModal").style.display="none";

}

//============================
// بدء التشغيل
//============================
loadProducts();

loadDelivery();