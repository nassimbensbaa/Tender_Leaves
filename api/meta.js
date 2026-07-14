import crypto from "crypto";

export default async function handler(req, res) {

    //----------------------------------
    // CORS
    //----------------------------------

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {

        return res.status(200).end();

    }

    if (req.method !== "POST") {

        return res.status(405).json({

            ok: false,

            error: "Method Not Allowed"

        });

    }

    try {

        //----------------------------------
        // Variables
        //----------------------------------

        const PIXEL_ID =
            process.env.META_PIXEL_ID;

        const ACCESS_TOKEN =
            process.env.META_ACCESS_TOKEN;

        if (!PIXEL_ID || !ACCESS_TOKEN) {

            return res.status(500).json({

                ok: false,

                error: "META_PIXEL_ID or META_ACCESS_TOKEN is missing"

            });

        }

        //----------------------------------
        // Request Body
        //----------------------------------

        const {

            eventName,
            eventId,
            pageUrl,
            userAgent,
            phone,
            fbp,
            fbc,
            value,
            currency,
            productName

        } = req.body;
                //----------------------------------
        // Client IP
        //----------------------------------

        const clientIp =
            (req.headers["x-forwarded-for"] || "")
                .split(",")[0]
                .trim()
            ||
            req.socket?.remoteAddress
            ||
            "";

        //----------------------------------
        // SHA256 Phone
        //----------------------------------

        let phoneHash = undefined;

        if (phone) {

            const normalizedPhone =
                phone
                    .replace(/\s+/g, "")
                    .replace(/-/g, "");

            phoneHash = crypto
                .createHash("sha256")
                .update(normalizedPhone)
                .digest("hex");

        }

        //----------------------------------
        // Meta Event
        //----------------------------------

        const event = {

            event_name:
                eventName,

            event_time:
                Math.floor(Date.now() / 1000),

            event_id:
                eventId,

            action_source:
                "website",

            event_source_url:
                pageUrl,

            user_data: {

                client_ip_address:
                    clientIp,

                client_user_agent:
                    userAgent,

                ...(phoneHash && {

                    ph: phoneHash

                }),

                ...(fbp && {

                    fbp

                }),

                ...(fbc && {

                    fbc

                })

            },

            custom_data: {

                currency:
                    currency || "DZD",

                value:
                    Number(value || 0),

                content_name:
                    productName || "",

                content_type:
                    "product"

            }

        };
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

body: JSON.stringify({

    data: [

        event

    ],

    ...(process.env.META_TEST_EVENT_CODE && {

        test_event_code:
            process.env.META_TEST_EVENT_CODE

    })

})

        //----------------------------------
        // قراءة رد Meta
        //----------------------------------

        const result = await response.json();

        console.log(

            "Meta Response:",

            JSON.stringify(result, null, 2)

        );

        //----------------------------------
        // في حالة وجود خطأ
        //----------------------------------

        if (!response.ok) {

            return res.status(500).json({

                ok: false,

                meta: result

            });

        }

        //----------------------------------
        // نجاح الإرسال
        //----------------------------------

        return res.status(200).json({

            ok: true,

            meta: result

        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            ok: false,

            error: err.message

        });

    }

}

