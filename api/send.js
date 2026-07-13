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

        const GOOGLE_URL = process.env.GOOGLE_SCRIPT_URL;

        if (!GOOGLE_URL) {

            return res.status(500).json({
                ok: false,
                error: "GOOGLE_SCRIPT_URL is missing"
            });

        }

        const response = await fetch(GOOGLE_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(req.body)

        });

        if (!response.ok) {

            throw new Error(`Google Script Error : ${response.status}`);

        }

        const result = await response.json();

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
