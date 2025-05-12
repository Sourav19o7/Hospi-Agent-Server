const confirmation_template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Appointment Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4285f4;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            padding: 20px;
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
        }
        .appointment-details {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #4285f4;
        }
        .footer {
            text-align: center;
            padding: 15px;
            font-size: 12px;
            color: #666666;
        }
        .button {
            display: inline-block;
            background-color: #4285f4;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }
        .contact {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Appointment Confirmation</h1>
        <p>Your upcoming visit with Dr. Johnson</p>
    </div>
    
    <div class="content">
        <p>Dear $PATIENT$,</p>
        
        <p>This email confirms your upcoming appointment with Dr. Sarah Johnson at Healthway Medical Center.</p>
        
        <div class="appointment-details">
            <p><strong>Date:</strong>$DATE$</p>
            <p><strong>Time:</strong>$TIME$</p>
            <p><strong>Location:</strong> Healthway Medical Center<br>
            123 Medical Drive, Suite 205<br>
            Kalyān, Maharashtra</p>
            <p><strong>Appointment Type:</strong>$TYPE$</p>
            <p><strong>Patient ID:</strong> P12345678</p>
        </div>
        
        <p>Please arrive 15 minutes before your scheduled appointment time to complete any necessary paperwork. Remember to bring:</p>
        <ul>
            <li>Your valid photo ID</li>
            <li>Your insurance card</li>
            <li>List of current medications</li>
            <li>Any relevant medical records or test results</li>
        </ul>
        
        <p style="text-align: center; margin: 25px 0;">
            <a href="#" class="button">Manage Your Appointment</a>
        </p>
        
        <div class="contact">
            <p><strong>Need to reschedule?</strong> Please contact us at least 24 hours in advance:</p>
            <p>📞 Phone: (555) 123-4567<br>
            📧 Email: appointments@healthwaymedical.com</p>
        </div>
    </div>
    
    <div class="footer">
        <p>This is an automated message, please do not reply directly to this email.</p>
        <p>Healthway Medical Center | 123 Medical Drive | Kalyān, Maharashtra | 421301</p>
        <p><a href="#">Privacy Policy</a> | <a href="#">Unsubscribe</a></p>
    </div>
</body>
</html>`;

const reminder_template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Appointment Reminder</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #ff7043;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            padding: 20px;
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
        }
        .appointment-details {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #ff7043;
        }
        .footer {
            text-align: center;
            padding: 15px;
            font-size: 12px;
            color: #666666;
        }
        .button {
            display: inline-block;
            background-color: #ff7043;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }
        .contact {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
        }
        .reminder-box {
            background-color: #fff3e0;
            border: 1px dashed #ff7043;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
        .calendar-icon {
            font-size: 24px;
            margin-right: 10px;
            color: #ff7043;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Appointment Reminder</h1>
        <p>Your visit with Dr. Johnson is approaching</p>
    </div>
    
    <div class="content">
        <p>Dear $PATIENT$,</p>
        
        <div class="reminder-box">
            <p><span class="calendar-icon">📅</span> <strong>This is a friendly reminder about your upcoming appointment</strong></p>
        </div>
        
        <p>We're looking forward to seeing you at Healthway Medical Center. Here are the details of your scheduled appointment:</p>
        
        <div class="appointment-details">
            <p><strong>Date:</strong>$DATE$</p>
            <p><strong>Time:</strong>$TIME$</p>
            <p><strong>Doctor:</strong> Dr. Sarah Johnson</p>
            <p><strong>Location:</strong> Healthway Medical Center<br>
            123 Medical Drive, Suite 205<br>
            Kalyān, Maharashtra</p>
            <p><strong>Appointment Type:</strong>$TYPE$</p>
        </div>
        
        <p>To ensure a smooth appointment experience, please remember to:</p>
        <ul>
            <li>Arrive 15 minutes early to complete any paperwork</li>
            <li>Bring your valid photo ID and insurance card</li>
            <li>Bring a list of current medications</li>
            <li>Bring any relevant medical records or test results</li>
            <li>Fast for 8 hours prior to appointment (water is permitted)</li>
        </ul>
        
        <p style="text-align: center; margin: 25px 0;">
            <a href="#" class="button">Confirm Attendance</a>
        </p>
        
        <div class="contact">
            <p><strong>Need to reschedule?</strong> Please contact us at least 24 hours in advance:</p>
            <p>📞 Phone: (555) 123-4567<br>
            📧 Email: appointments@healthwaymedical.com</p>
        </div>
    </div>
    
    <div class="footer">
        <p>This is an automated reminder. Please do not reply directly to this email.</p>
        <p>Healthway Medical Center | 123 Medical Drive | Kalyān, Maharashtra | 421301</p>
        <p><a href="#">Privacy Policy</a> | <a href="#">Unsubscribe from reminders</a></p>
    </div>
</body>
</html>`;

const subjects = {
  confirmation: "Confirmation for your Appointment",
  reminder: "Reminder for your Appointment",
};

module.exports = {
  confirmation_template,
  reminder_template,
  subjects,
};
