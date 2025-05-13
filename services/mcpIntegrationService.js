const { gemini_client } = require("../config/ai_client");
const { system_prompt } = require("../utils/constants");
const dotenv = require("dotenv");

dotenv.config();

async function generate_insights(type, data) {
  try {
    const response = await gemini_client.models.generateContent({
      model: process.env.MODEL_NAME,
      contents: `Here is the data regarding: ${type} - ${JSON.stringify(data)}. The current datetime is ${new Date().toISOString()}`,
      config: {
        systemInstruction: system_prompt,
      },
    });
    return response.text;
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  generate_insights,
};
