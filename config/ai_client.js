const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");

dotenv.config();

const gemini_client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

module.exports = {
  gemini_client,
};
