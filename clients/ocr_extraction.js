// clients/geminiClient.js
// require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // Load .env file from the root

// import dotenv from 'dotenv';
// import path from 'path';

// dotenv.config({ path: path.resolve(__dirname, '../.env') });
const API_KEY = process.env.GOOGLE_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

/**
 * A private, reusable function to call the Google Gemini API with retry logic.
 */
async function _callGeminiApi(systemPrompt, userInput, jsonSchema) {
    if (!API_KEY) {
        console.error("ERROR: GOOGLE_API_KEY not found. Please check your .env file.");
        return null;
    }

    const payload = {
        contents: [{ parts: [{ text: userInput }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
        },
    };
    const headers = { "Content-Type": "application/json" };

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                if (response.status >= 500) { throw new Error(`Server Error: ${response.status}`); }
                const errorBody = await response.json();
                console.error("API Call Failed (Client Error):", errorBody);
                return null;
            }
            
            const responseData = await response.json();
            const content = responseData.candidates[0].content.parts[0].text;
            return JSON.parse(content);

        } catch (error) {
            if (attempt < 2) {
                const waitTime = Math.pow(2, attempt) * 1000;
                console.log(`API Error: ${error.message}. Retrying in ${waitTime / 1000}s...`);
                await new Promise(res => setTimeout(res, waitTime));
            } else {
                console.error("API Call Failed after multiple retries:", error);
                return null;
            }
        }
    }
}

export const ocr_extraction = async (text)=>{

    system_prompt = `You are an expert data analyst. List out the key  health factors  `
     const jsonSchema = {
        type: "OBJECT",
        properties: { factors: {type:"ARRAY",  items:{type:"STRING"}} },
        required: ["factors"],
    };

    const response = await _callGeminiApi(system_prompt, text, jsonSchema);
    if(response && response.factors){
        console.log("--- [AI Client] Successfully retrieved factors from input text")
        return response.factors;
    }
    res.json(500, { error: 'AI analysis did not return any factors from text.' })
    return {};
}