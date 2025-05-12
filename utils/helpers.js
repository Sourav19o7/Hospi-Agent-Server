const {
  confirmation_template,
  subjects,
  reminder_template,
} = require("./constants");
const { sesClient } = require("../config/aws");

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

    if (diff_mins < 1440) {
      setTimeout(
        async () => {
          console.log(
            `Sending 24-hour reminder (delayed to 5 mins from now) for ${patient_name}`
          );
          await sendEmail(date, time, type, patient_name, email, "reminder");
        },
        5 * 60 * 1000
      );
    } else {
      const timeUntil24HrReminder = diff_mins - 1440;

      setTimeout(
        async () => {
          console.log(`Sending 24-hour reminder for ${patient_name}`);
          await sendEmail(date, time, type, patient_name, email, "reminder");
        },
        timeUntil24HrReminder * 60 * 1000
      );
    }

    if (diff_mins > 60) {
      const timeUntil1HrReminder = diff_mins - 60;

      setTimeout(
        async () => {
          console.log(`Sending 1-hour reminder for ${patient_name}`);
          await sendEmail(date, time, type, patient_name, email, "reminder");
        },
        timeUntil1HrReminder * 60 * 1000
      ); // convert minutes to milliseconds
    } else {
      // If appointment is less than 1 hour away, send 1hr reminder immediately
      console.log(`Sending immediate 1-hour reminder for ${patient_name}`);
      await sendEmail(date, time, type, patient_name, email, "reminder");
    }

    return { success: true, message: "Reminders scheduled successfully" };
  } catch (error) {
    console.log("Error scheduling reminders:", error);
    return { success: false, error: error.message };
  }
}

// // Solution: Wrap the await call in an async function and execute it
// async function main() {
//   const response = await sendEmail(
//     "2025-05-16",
//     "11:30:00",
//     "Root Canal",
//     "Devesh",
//     "deveshshetty66@gmail.com"
//   );
//   console.log(response);
// }

// main().catch((err) => console.error(err));

module.exports = {
  sendEmail,
  scheduleReminders,
};
