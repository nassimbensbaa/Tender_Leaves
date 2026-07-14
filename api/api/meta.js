import crypto from "crypto";

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

        const PIXEL_ID = process.env.META_PIXEL_ID;
        const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

        if (!PIXEL_ID || !ACCESS_TOKEN) {

            return res.status(500).json({

                ok: false,

                error: "META_PIXEL_ID or META_ACCESS_TOKEN is missing"

            });

        }

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
        // تشفير الهاتف SHA256
        //----------------------------------
        let phoneHash = undefined;

        if (phone) {

            const normalizedPhone =
                phone.replace(/\s+/g, "");

            phoneHash = crypto
                .createHash("sha256")
                .update(normalizedPhone)
                .digest("hex");

        }

        //----------------------------------
        // بيانات الحدث
        //----------------------------------
        const event = {

            event_name: eventName,

            event_time: Math.floor(Date.now() / 1000),

            event_id: eventId,

            action_source: "website",

            event_source_url: pageUrl,

            user_data: {

                client_user_agent: userAgent,

                ...(phoneHash && { ph: phoneHash }),

                ...(fbp && { fbp }),

                ...(fbc && { fbc })

            },

            custom_data: {

                currency: currency || "DZD",

                value: Number(value || 0),

                content_name: productName || ""

            }

        };

        //----------------------------------
        // إرسال إلى Meta
        //----------------------------------
        const response = await fetch(

            `https://graph.facebook.com/v23.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    data: [event]

                })

            }

        );

        const result = await response.json();

        if (!response.ok) {

            return res.status(500).json({

                ok: false,

                meta: result

            });

        }

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
