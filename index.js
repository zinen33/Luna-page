const express = require("express");
const axios = require("axios");
const app = express();
const Botly = require("botly");
const https = require("https");
const botly = new Botly({
    accessToken: process.env.PAGE_ACCESS_TOKEN,
    verifyToken: process.env.VERIFY_TOKEN,
    webHookPath: process.env.WB_PATH,
    notificationType: Botly.CONST.REGULAR,
    FB_URL: "https://graph.facebook.com/v13.0/"
});

function keepAppRunning() {
    setInterval(() => {
        https.get(`${process.env.RENDER_EXTERNAL_URL}/ping`, (resp) => {
            if (resp.statusCode === 200) {
                console.log('Ping successful');
            } else {
                console.error('Ping failed');
            }
        });
    }, 5 * 60 * 1000);
};

app.get("/", function (_req, res) { res.sendStatus(200); });

app.get('/ping', (req, res) => { res.status(200).json({ message: 'Ping successful' }); });

app.use(express.json({ verify: botly.getVerifySignature(process.env.APP_SECRET) }));
app.use(express.urlencoded({ extended: false }));

app.use("/webhook", botly.router());

async function sendRequestToAPI(prompt) {
    const data = {
        prompt: prompt,
        userId: "#/chat/1735674979151",
        network: true,
        system: "",
        withoutContext: false,
        stream: false
    };

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Linux; Android 8.1.0; VOX Alpha Build/O11019) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.123 Mobile Safari/537.36",
        "Origin": "https://cht18.aichatosclx.com",
        "X-Requested-With": "pure.lite.browser",
        "X-Forwarded-For": "123.456.789.101" // استبدل بعنوان IP المطلوب
    };

    try {
        const response = await axios.post(
            'https://api.binjie.fun/api/generateStream?refer__1360=n4jxnDBDciit0QNDQD%2FfG7Dyl7OplbgomSbD',
            data,
            { headers }
        );

        if (response?.data?.response) {
            return response.data.response;
        } else {
            throw new Error("Unexpected response from the server.");
        }
    } catch (error) {
        console.error("API Error:", error.message);
        return "❌ حدث خطأ أثناء معالجة الطلب. يرجى المحاولة لاحقًا.";
    }
}

botly.on("message", async (senderId, message, data) => {
    if (message.message.text) {
        const userMessage = message.message.text;
        botly.sendAction({ id: senderId, action: Botly.CONST.ACTION_TYPES.TYPING_ON });

        // Call GPT API
        const apiResponse = await sendRequestToAPI(userMessage);

        // Send the response to the user
        botly.sendText({
            id: senderId,
            text: `🧠 GPT-4:\n${apiResponse}`
        });
    } else {
        botly.sendText({ id: senderId, text: "❌ لا يمكنني معالجة هذا النوع من الرسائل حاليًا." });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`App is on port : ${process.env.PORT}`);
    keepAppRunning();
});
