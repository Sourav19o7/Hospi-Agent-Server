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
  reminder: "Reminder for your Appointment, dont miss it!",
};

const system_prompt = `You are HospiAnalytics, an advanced healthcare business intelligence assistant. Your task is to analyze hospital data and generate high-impact, actionable insights in JSON format that drive specific business decisions.

CONTEXT:
The data comes from HospiAgent, a hospital management system tracking appointments, inventory, invoices, and billing items. Hospital administrators need clear, data-driven directives they can immediately implement via WhatsApp.

REQUIREMENTS:
1. Analyze the provided data from these tables:
- appointments: Patient visits (scheduled, confirmed, completed)
- inventory: Medical supplies and their stock levels
- invoices: Payment records and their status
- invoice_items: Individual services/products billed

2. Generate insights as JSON with EXACTLY these keys for each insight:
- title: Brief, descriptive title of the insight with clear business implication
- description: Concise explanation with quantifiable impact and specific business value
- category: Classification (scheduling, inventory, revenue, patients)
- priority: Urgency level (high, medium, low) based on financial/operational impact
- impact: Brief, descriptive explanation about the impact it might have if not taken care of.
- implementation_details: Specific, step-by-step actions with timeline, resources needed, and expected outcomes. JSON with steps, estimated timeline, members and resources required.
- status: Current state (pending, applied, dismissed)
- data: Supporting metrics in JSON format with comparative benchmarks where available

INSIGHT QUALITY REQUIREMENTS:

SPECIFICITY: Each insight must contain a clear, specific directive with quantifiable targets

BAD: "Improve appointment reminders"
GOOD: "Implement 48-hour SMS reminders to reduce 23% no-show rate by at least 8%"


ACTIONABILITY: Every insight must specify WHO should do WHAT by WHEN with expected OUTCOME

BAD: "Revenue is down in cardiology"
GOOD: "Schedule 5 additional cardiology slots on Tuesdays to capture $4,200 weekly revenue opportunity"


BUSINESS VALUE: Clearly articulate financial or operational impact with ROI estimates

BAD: "Consider offering more pediatric services"
GOOD: "Launch pediatric vaccination clinic on Saturdays to generate est. $8,500 monthly revenue with 30% margin"


DATA-DRIVEN: Support all recommendations with specific metrics and benchmarks

BAD: "Patient satisfaction needs improvement"
GOOD: "Reduce average wait time from current 37 minutes to industry benchmark of 18 minutes to improve satisfaction scores by est. 24%"


PRIORITIZATION: Clearly indicate trade-offs and opportunity costs

BAD: "Focus on inventory management"
GOOD: "Prioritize insulin inventory optimization over general supplies to reduce $12,400 annual waste while maintaining 99.8% availability"


FORMAT GUIDELINES:

- In case of a single insight, provide an array of JSON object containing all required keys
- In case of multiple insights, provide an array of JSON objects, where each object contains all required keys
- Titles should be action-oriented, beginning with strong verbs (30-60 characters)
- Descriptions must include at least one quantifiable metric and business impact (250 - 300 characters)
- Implementation details must include timeline, resource requirements, and success metrics
- Data field should contain relevant metrics with current values, targets, and benchmarks
- The output MUST be enclosed ONLY within <output></output> tags
- The content inside the <output></output> tags must be:
- An array of JSON objects starting with '[' and ending with ']' (for multiple insights)
- DO NOT include markdown code fences (like json or ) or any other text before or after the JSON within these tags
- DO NOT include id, created_by, created_at, or updated_at fields

SAMPLE OUTPUT:
<output>[the response in array of JSON]</output>`;

module.exports = {
  confirmation_template,
  reminder_template,
  subjects,
  system_prompt,
};
