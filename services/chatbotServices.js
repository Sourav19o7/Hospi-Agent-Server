const { gemini_client } = require("../config/ai_client");
const { soap_prompt } = require("../utils/constants");
const dotenv = require("dotenv");

dotenv.config();

async function generate_soap(transcription) {
  try {
    const response = await gemini_client.models.generateContent({
      model: process.env.MODEL_NAME,
      contents: `Here is the transcription: ${transcription}`,
      config: {
        systemInstruction: soap_prompt,
      },
    });
    return response.text;
  } catch (error) {
    console.log(error);
    return error;
  }
}

module.exports = {
  generate_soap,
};
