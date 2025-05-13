const { SES } = require("@aws-sdk/client-ses");
const dotenv = require("dotenv");

dotenv.config();

const SESConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const sesClient = new SES(SESConfig);

module.exports = {
  sesClient,
};
