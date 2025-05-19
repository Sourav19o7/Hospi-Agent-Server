const { generate_soap } = require("../services/chatbotServices");
const asyncHandler = require("express-async-handler");

const getSOAP = asyncHandler(async (req, res) => {
  try {
    const { transcription } = req.body;
    const soap_result = await generate_soap(transcription);
    return res.status(200).send({ id: 1, data: soap_result });
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
