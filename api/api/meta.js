import crypto from "crypto";

function sha256(value) {

    if (!value) return "";

    return crypto
        .createHash("sha256")
        .update(value.trim().toLowerCase())
        .digest("hex");

}

export default async function handler(req, res) {

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

        const ACCESS_TOKEN =
            process.env.META_ACCESS_TOKEN;

        const PIXEL_ID =
            process.env.META_PIXEL_ID;

        if (!ACCESS_TOKEN || !PIXEL_ID) {

            return res.status(500).json({

                ok: false,

                error: "Meta variables are missing"

            });

        }

        const body = req.body;
              //----------------------------------
        // بيانات العميل
        //----------------------------------
        const userData = {

            client_ip_address:

                req.headers["x-forwarded-for"]?.split(",")[0] ||

                req.socket?.remoteAddress ||

                "",

            client_user_agent:

                body.userAgent ||

                req.headers["user-agent"] ||

                ""

        };

        if (body.phone) {

            userData.ph = [

                sha256(body.phone)

            ];

        }

        if (body.fbp) {

            userData.fbp = body.fbp;

        }

        if (body.fbc) {

            userData.fbc = body.fbc;

        }

        //----------------------------------
        // إنشاء الحدث
        //----------------------------------
        const event = {

            event_name:

                body.eventName,

            event_time:

                Math.floor(Date.now() / 1000),

            event_id:

                body.eventId,

            action_source:

                "website",

            event_source_url:

                body.pageUrl,

            user_data:

                userData,

            custom_data: {

                currency:

                    "DZD",

                value:

                    Number(body.value || 0),

                content_name:

                    body.productName || ""

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

                    ]

                })

            }

        );

        const result = await response.json();

        if (!response.ok) {

            console.error(result);

            return res.status(500).json({

                ok: false,

                result

            });

        }

        return res.status(200).json({

            ok: true,

            result

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

