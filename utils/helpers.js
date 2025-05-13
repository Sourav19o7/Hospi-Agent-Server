const {
  confirmation_template,
  subjects,
  reminder_template,
} = require("./constants");
const dotenv = require("dotenv");
const { sesClient } = require("../config/aws");
const sendgrid = require("@sendgrid/mail");
const schedule = require("node-schedule");

dotenv.config();
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

function formatTime(timeString) {
  // Parse the time components
  const [hours, minutes] = timeString.split(":");

  // Convert hours to number for comparison
  let hour = parseInt(hours, 10);

  // Determine AM/PM
  const period = hour >= 12 ? "PM" : "AM";

  // Convert hours to 12-hour format
  hour = hour % 12;
  hour = hour === 0 ? 12 : hour; // Convert 0 to 12 for 12 AM

  // Format the output
  return `${hour}:${minutes} ${period}`;
}

async function sendEmail(
  date,
  time,
  type,
  patient_name,
  email,
  email_type = "confirmation"
) {
  const ap_date = formatDate(date);
  const ap_time = formatTime(time);
  const template =
    email_type == "confirmation" ? confirmation_template : reminder_template;
  const body = template
    .replace("$PATIENT$", patient_name)
    .replace("$DATE$", ` ${ap_date}`)
    .replace("$TIME$", ` ${ap_time}`)
    .replace("$TYPE$", ` ${type}`);
  const params = {
    Source: "HospiAgent <hey@levelsupermind.com>",
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: subjects[email_type],
      },
      Body: {
        Html: {
          Data: body,
        },
      },
    },
  };
  const ses_response = await sesClient
    .sendEmail(params)
    .then(async () => {
      return {
        id: 1,
        status: 200,
        message: "Email sent successfully, sent by SES",
      };
    })
    .catch((err) => {
      return { id: 0, status: 400, error: err.message };
    });
  return ses_response;
}

async function sendEmailSendGrid(
  date,
  time,
  type,
  patient_name,
  email,
  email_type = "confirmation"
) {
  const ap_date = formatDate(date);
  const ap_time = formatTime(time);
  const template =
    email_type == "confirmation" ? confirmation_template : reminder_template;
  const body = template
    .replace("$PATIENT$", patient_name)
    .replace("$DATE$", ` ${ap_date}`)
    .replace("$TIME$", ` ${ap_time}`)
    .replace("$TYPE$", ` ${type}`);
  const params = {
    to: [email],
    from: "HospiAgent <sourav.dey0147@gmail.com>",
    subject: subjects[email_type],
    html: body,
  };
  const sendgrid_response = await sendgrid
    .send(params)
    .then(() => {
      return {
        id: 1,
        status: 200,
        message: "Email sent successfully, sent by Sendgrid",
      };
    })
    .catch((error) => {
      console.log(error);
      return { id: 0, status: 400, error: error.message };
    });
  if (sendgrid_response.status != 200) {
    console.log(sendgrid_response.error);
    return { id: 0, status: 400, error: sendgrid_response.error };
  }
  return sendgrid_response;
}
// Define getCurrentDateIST() function first
function getCurrentDateIST() {
  const options = { timeZone: "Asia/Kolkata" };
  return new Date(new Date().toLocaleString("en-US", options));
}

async function scheduleReminders(date, time, type, patient_name, email) {
  try {
    const appointmentDateTime = new Date(date + " " + time);
    const now = getCurrentDateIST();

    const diff_mins =
      (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);
    console.log(`Appointment is in ${diff_mins} minutes`);

    // Calculate when reminders should be sent
    const reminder24h = new Date(
      appointmentDateTime.getTime() - 24 * 60 * 60 * 1000
    );
    const reminder1h = new Date(
      appointmentDateTime.getTime() - 1 * 60 * 60 * 1000
    );

    // Handle 24h reminder
    if (diff_mins < 1440) {
      // If appointment is less than 24h away, schedule for 5 mins from now
      const fiveMinFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      // Only schedule the 24h reminder if it's at least 30 minutes before the 1h reminder
      // or if the 1h reminder has already passed
      if (diff_mins > 60) {
        schedule.scheduleJob(
          `24hr-${patient_name}-${Date.now()}`,
          fiveMinFromNow,
          async function () {
            console.log(`Sending 24-hour reminder for ${patient_name}`);
            await sendEmailSendGrid(
              date,
              time,
              type,
              patient_name,
              email,
              "reminder"
            );
          }
        );
        console.log(
          `Scheduled 24-hour reminder for ${patient_name} at ${fiveMinFromNow}`
        );
      } else {
        console.log(
          `Skipping 24-hour reminder for ${patient_name} to avoid duplicate emails`
        );
      }
    } else {
      // Schedule for exactly 24h before appointment
      schedule.scheduleJob(
        `24hr-${patient_name}-${Date.now()}`,
        reminder24h,
        async function () {
          console.log(`Sending 24-hour reminder for ${patient_name}`);
          await sendEmailSendGrid(
            date,
            time,
            type,
            patient_name,
            email,
            "reminder"
          );
        }
      );
      console.log(
        `Scheduled 24-hour reminder for ${patient_name} at ${reminder24h}`
      );
    }

    // Handle 1h reminder
    if (diff_mins > 60) {
      // Schedule for exactly 1h before appointment
      schedule.scheduleJob(
        `1hr-${patient_name}-${Date.now()}`,
        reminder1h,
        async function () {
          console.log(`Sending 1-hour reminder for ${patient_name}`);
          await sendEmailSendGrid(
            date,
            time,
            type,
            patient_name,
            email,
            "reminder"
          );
        }
      );
      console.log(
        `Scheduled 1-hour reminder for ${patient_name} at ${reminder1h}`
      );
    } else {
      // If appointment is less than 1h away, send immediately
      console.log(`Sending immediate 1-hour reminder for ${patient_name}`);
      await sendEmailSendGrid(
        date,
        time,
        type,
        patient_name,
        email,
        "reminder"
      );
    }

    return { success: true, message: "Reminders scheduled successfully" };
  } catch (error) {
    console.log("Error scheduling reminders:", error);
    return { success: false, error: error.message };
  }
}

function extractOutput(message) {
  const answerRegex = /<output>(.*?)<\/output>/gs;
  const answerTexts = [];

  let match;

  while ((match = answerRegex.exec(message)) !== null) {
    answerTexts.push(match[1].trim());
  }
  return JSON.parse(answerTexts[0]);
}

// // Solution: Wrap the await call in an async function and execute it
// async function main() {
//   await sendEmailSendGrid(
//     "2025-05-16",
//     "11:30:00",
//     "Root Canal",
//     "Devesh",
//     "deveshshetty66@gmail.com"
//   );
// }

// main().catch((err) => console.error(err));

module.exports = {
  sendEmail,
  scheduleReminders,
  extractOutput,
};
