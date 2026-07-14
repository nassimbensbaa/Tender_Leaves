import crypto from "crypto";

export default async function handler(req, res) {

    //----------------------------------
    // CORS
    //----------------------------------

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    //----------------------------------
    // OPTIONS
    //----------------------------------

    if (req.method === "OPTIONS") {

        return res.status(200).end();

    }

    //----------------------------------
    // POST فقط
    //----------------------------------

    if (req.method !== "POST") {

        return res.status(405).json({

            ok: false,

            error: "Method Not Allowed"

        });

    }

    try {

        //----------------------------------
        // متغيرات البيئة
        //----------------------------------

        const PIXEL_ID =
            process.env.META_PIXEL_ID;

        const ACCESS_TOKEN =
            process.env.META_ACCESS_TOKEN;

        const TEST_EVENT_CODE =
            process.env.META_TEST_EVENT_CODE || "";

        if (!PIXEL_ID) {

            return res.status(500).json({

                ok: false,

                error: "META_PIXEL_ID is missing"

            });

        }

        if (!ACCESS_TOKEN) {

            return res.status(500).json({

                ok: false,

                error: "META_ACCESS_TOKEN is missing"

            });

        }

        //----------------------------------
        // قراءة البيانات القادمة من الموقع
        //----------------------------------

        const {

            eventName,
            eventId,
            productName,
            value,
            currency,
            phone,
            pageUrl,
            userAgent,
            fbp,
            fbc

        } = req.body;
                //----------------------------------
        // الحصول على عنوان IP
        //----------------------------------

        const clientIp =

            req.headers["x-forwarded-for"]?.split(",")[0].trim()

            ||

            req.headers["x-real-ip"]

            ||

            req.socket?.remoteAddress

            ||

            "";

        //----------------------------------
        // تشفير رقم الهاتف SHA256
        //----------------------------------

        let phoneHash = "";

        if (phone) {

            const normalizedPhone =

                String(phone)
                    .replace(/\s+/g, "")
                    .replace(/-/g, "");

            phoneHash = crypto
                .createHash("sha256")
                .update(normalizedPhone)
                .digest("hex");

        }

        //----------------------------------
        // إنشاء الحدث
        //----------------------------------

        const event = {

            event_name: eventName,

            event_time: Math.floor(Date.now() / 1000),

            event_id: eventId,

            action_source: "website",

            event_source_url: pageUrl,

            user_data: {

                client_ip_address: clientIp,

                client_user_agent: userAgent,

                ...(phoneHash && {

                    ph: [phoneHash]

                }),

                ...(fbp && {

                    fbp

                }),

                ...(fbc && {

                    fbc

                })

            },

            custom_data: {

                currency: currency || "DZD",

                value: Number(value || 0),

                content_name: productName || "",

                content_type: "product"

            }

        };
                //----------------------------------
        // تجهيز Body المرسل إلى Meta
        //----------------------------------

        const body = {

            data: [

                event

            ]

        };

        //----------------------------------
        // Test Event Code (اختياري)
        //----------------------------------

        if (TEST_EVENT_CODE) {

            body.test_event_code = TEST_EVENT_CODE;

        }

        //----------------------------------
        // إرسال الحدث إلى Meta
        //----------------------------------

        const response = await fetch(

            `https://graph.facebook.com/v23.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(body)

            }

        );

        //----------------------------------
        // قراءة استجابة Meta
        //----------------------------------

        const result = await response.json();

        console.log(

            "===== META RESPONSE ====="

        );

        console.log(

            JSON.stringify(result, null, 2)

        );
                //----------------------------------
        // إذا أعادت Meta خطأ
        //----------------------------------

        if (!response.ok) {

            console.error(

                "===== META API ERROR ====="

            );

            console.error(

                JSON.stringify(result, null, 2)

            );

            return res.status(response.status).json({

                ok: false,

                message: "Meta Graph API Error",

                meta: result

            });

        }

        //----------------------------------
        // نجاح الإرسال
        //----------------------------------

        return res.status(200).json({

            ok: true,

            message: "Event sent successfully",

            eventId: eventId,

            meta: result

        });

    }

    catch (err) {

        //----------------------------------
        // تسجيل الخطأ بالكامل
        //----------------------------------

        console.error(

            "===== META FUNCTION ERROR ====="

        );

        console.error(err);

        console.error(err.stack);

        return res.status(500).json({

            ok: false,

            error: err.message,

            stack: process.env.NODE_ENV === "development"
                ? err.stack
                : undefined

        });

    }
        catch (err) {

        console.error(
            "===== META FUNCTION ERROR ====="
        );

        console.error(err);

        console.error(err.stack);

        return res.status(500).json({

            ok: false,

            error: err.message,

            stack:
                process.env.NODE_ENV === "development"
                    ? err.stack
                    : undefined

        });

    }

}
