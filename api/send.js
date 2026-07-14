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

        const GOOGLE_URL =
            process.env.GOOGLE_SCRIPT_URL;

        const ACCESS_TOKEN =
            process.env.META_ACCESS_TOKEN;

        const PIXEL_ID =
            process.env.META_PIXEL_ID;

        if (!GOOGLE_URL) {

            return res.status(500).json({

                ok: false,

                error: "GOOGLE_SCRIPT_URL is missing"

            });

        }

        const order = req.body;

        //----------------------------------
        // إرسال الطلب إلى Google Sheet
        //----------------------------------
        const googleResponse = await fetch(

            GOOGLE_URL,

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(order)

            }

        );

        if (!googleResponse.ok) {

            throw new Error(

                "Google Script Error : " +

                googleResponse.status

            );

        }

        const googleResult =
            await googleResponse.json();
                //----------------------------------
        // إرسال الحدث إلى Meta Conversions API
        //----------------------------------
        if (ACCESS_TOKEN && PIXEL_ID) {

            try {

                const metaBody = {

                    data: [

                        {

                            event_name: "Purchase",

                            event_time: Math.floor(Date.now() / 1000),

                            action_source: "website",

                            event_source_url: order.pageUrl,

                            event_id: order.eventId,

                            user_data: {

                                ph: order.phone
                                    ? [sha256(order.phone)]
                                    : undefined,

                                client_user_agent:
                                    order.userAgent,

                                fbp:
                                    order.fbp || undefined,

                                fbc:
                                    order.fbc || undefined

                            },

                            custom_data: {

                                currency: "DZD",

                                value: Number(order.total),

                                content_name:
                                    order.productName

                            }

                        }

                    ]

                };

                const metaResponse = await fetch(

                    `https://graph.facebook.com/v23.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,

                    {

                        method: "POST",

                        headers: {

                            "Content-Type": "application/json"

                        },

                        body: JSON.stringify(metaBody)

                    }

                );

                const metaResult =
                    await metaResponse.json();

                console.log("META:", metaResult);

            }

            catch (metaError) {

                console.error(

                    "Meta API Error:",

                    metaError

                );

            }

        }

        //----------------------------------
        // نجاح العملية
        //----------------------------------
        return res.status(200).json({

            ok: true,

            result: googleResult

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

