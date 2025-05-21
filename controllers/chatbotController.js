const { generate_soap } = require("../services/chatbotServices");
const asyncHandler = require("express-async-handler");

function cleanHtml(htmlString) {
  // Option 1: Remove all literal \n characters
  return htmlString.replace(/\\n/g, "").replace(/\n/g, "");
}

const getSOAP = asyncHandler(async (req, res) => {
  try {
    const { transcription } = req.body;
    const soap_result = await generate_soap(transcription);
    const final_result = cleanHtml(soap_result);
    return res.status(200).send({ id: 1, data: final_result });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ id: 0, message: `The following error occured: ${error}` });
  }
});

module.exports = {
  getSOAP,
};
