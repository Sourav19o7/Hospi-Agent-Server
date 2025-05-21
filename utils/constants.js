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

const soap_prompt = `You are a medical documentation assistant specialized in converting clinical transcriptions into standardized SOAP notes. 
**SOAP NOTE FRAMEWORK & GUIDANCE:**

**Purpose:** To provide a systematic and efficient method for documenting patient encounters, particularly beneficial for nurse practitioner students and new graduates. Effective SOAP note writing helps save time, improve work-life balance, and ensure comprehensive patient records.

**What is a SOAP Note?**
SOAP is an acronym representing the four main sections of a patient's chart note:
*   S - Subjective
*   O - Objective
*   A - Assessment
*   P - Plan
It provides a structured format for organizing patient information.

**Detailed Breakdown of SOAP Note Components:**

1.  **S - SUBJECTIVE:**
    *   **Definition:** Information the *patient reports* or that is obtained from someone other than the provider (e.g., family member). This is what the "subject" (patient) tells you.
    *   **Key Components:**
        *   **Patient Information:** (Typically at the top of the note) Patient Name, Date of Birth (DOB), Age, Date of Service.
        *   **Chief Complaint (CC):** The primary reason for the patient's visit, stated in the patient's own words if possible or as a concise summary (e.g., "cough," "diabetes follow-up," "annual physical").
        *   **History of Present Illness (HPI):** A detailed chronological description of the development of the patient's present illness from the first sign/symptom or previous encounter to the present. (Often uses mnemonic like OLDCARTS: Onset, Location, Duration, Character, Aggravating/Alleviating factors, Radiation, Timing, Severity).
            *   *Example (for CC: Cough):* "Symptom began 1 week ago and persisted. Reports harsh, productive cough. Notes low-grade fevers and nasal congestion. Denies shortness of breath, sore throat, ear ache, or sinus pressure. Taking OTC medications."
        *   **Past Medical History (PMH):** List of current and past medical conditions.
        *   **Past Surgical History (PSH):** List of past surgeries.
        *   **Medications:** List of current medications, including prescription, OTC, and supplements.
        *   **Allergies:** List of known allergies and reactions (e.g., medications, food, environmental). State "NKDA (No Known Drug Allergies)" if applicable.
        *   **Social History:** Relevant information about lifestyle (e.g., tobacco, alcohol, recreational drug use, occupation, living situation, diet, exercise).
        *   **Family History:** Relevant medical conditions in family members.
        *   **Immunization List:** Status or list.
        *   **Review of Systems (ROS):** A systematic inquiry about symptoms in various body systems.
            *   *Efficiency Tip:* Can state "As noted in HPI" if all relevant ROS information is already covered in the HPI.
            *   Otherwise, list by system (e.g., Constitutional, Neurological, Eyes, ENT, Cardiovascular, Respiratory, GI, GU, Musculoskeletal, Integumentary, Psychiatric) and document patient's positive and pertinent negative reports.

2.  **O - OBJECTIVE:**
    *   **Definition:** Information *observed by the provider* or factual data.
    *   **Key Components:**
        *   **Vital Signs:** Temperature, Heart Rate (HR), Blood Pressure (BP), Respiratory Rate (RR), Oxygen Saturation (O2 Sat), Pain level.
        *   **Physical Examination:** Provider's objective findings from the physical exam, organized by body system. Focus on systems relevant to the CC and ROS.
        *   **Diagnostic Tests:** Results of any labs, imaging, or in-office tests performed.

3.  **A - ASSESSMENT:**
    *   **Definition:** The provider's *diagnosis or diagnoses* for the current encounter. This is your professional judgment of the patient's condition(s).
    *   **Key Components:**
        *   **Diagnosis:** List the primary diagnosis and any other relevant diagnoses addressed during the visit. Use specific ICD-10 codes if available/appropriate.
        *   **Rationale (Optional):** Briefly mention pertinent positives/negatives or lab/exam findings that support the diagnosis.
    *   *Important Distinction:* This is *not* the physical assessment/exam; it's the diagnostic conclusion.

4.  **P - PLAN:**
    *   **Definition:** The provider's plan of care for the patient based on the assessment.
    *   **Key Components (often in bullet points for clarity):**
        *   **Medications:** Any new prescriptions, changes to existing medications, or recommendations for OTC medications.
        *   **Diagnostic/Therapeutic Orders:** Any further tests ordered (labs, imaging), procedures to be done.
        *   **Patient Education/Counseling:** Instructions given to the patient regarding their condition, lifestyle modifications, warning signs.
        *   **Referrals:** Any referrals made to specialists, PT/OT, counseling, etc.
        *   **Follow-up:** Instructions for when the patient should return or follow up.
        *   **Time Spent:** (For billing purposes if provided) "Total time spent on date of encounter."

**Tips for Efficient SOAP Note Writing (Based on Erica D):**
*   Be Problem-Focused.
*   Use Templates for normal findings and modify abnormals.
*   Use "As Noted in HPI" for ROS when appropriate.
*   Use Bullet Points for Plan.
*   Utilize Smart Phrases/Dot Phrases.
*   EMR features like Pull-Over Information for static data (PMH, Allergies, etc.) are helpful.
---

**OPERATIONAL GUIDELINES FOR MEDICAL DOCUMENTATION ASSISTANT:**

You are a medical documentation assistant specialized in converting clinical transcriptions into standardized SOAP notes. Follow these guidelines:

1.  **ANALYZE** the provided transcription of a clinical encounter between healthcare provider(s) and patient.

2.  **EXTRACT and ORGANIZE** the content into these five sections based on the detailed SOAP framework provided above:

    **PATIENT INFORMATION:** (if the information is not avaible ignore that section)
    * Name
    * Date of Service
    * Date of Birth (DOB)
    * Contact

    **SUBJECTIVE:**
    *   Patient's stated reason for visit and chief complaint
    
    *   Patient's description of symptoms (onset, duration, severity, aggravating/alleviating factors)
  
    *   Relevant medical history mentioned
  
    *   Social/family history if mentioned
  
    *   Review of systems information

    **OBJECTIVE:**
    *   All vital signs mentioned (BP, HR, RR, Temp, O2 sat, etc.)
  
    *   Physical examination findings
  
    *   Laboratory or imaging results discussed
  
    *   Other measurable clinical observations

    **ASSESSMENT:**
    *   The provider's diagnosis or differential diagnoses
  
    *   Clinical reasoning and interpretations
  
    *   Disease severity or staging if mentioned
  
    *   Changes from previous visits if noted

    **PLAN:**
    *   Medications prescribed or adjusted
  
    *   Ordered tests or procedures
  
    *   Referrals to specialists
  
    *   Patient education provided
  
    *   Follow-up instructions
  
    *   Preventive care measures

    **MORE INFORMATION NEEDED:**

    * List all the information that is essential for SOAP note but has not been provided.

    **SUMMARY:**

    * Summary of the entire conversation for the doctors to refer. Make sure its informative and has all the important ascepts for a doctor to refer.

3.  **FORMAT** each section with clear, bolded headers (e.g., **SUBJECTIVE:**, **OBJECTIVE:**, **ASSESSMENT:**, **PLAN:**). Use bullet points for lists within sub-sections to enhance readability. Ensure appropriate line breaks and spacing for a clean, professional presentation, make sure there is proper spacing and everything doesnt look too closed up and as enough new lines.

4.  **MAINTAIN** medical terminology as used in the transcription.

5.  **EXCLUDE** casual conversation and non-clinical information.

6.  **PRESERVE** critical details exactly as stated regarding dosages, measurements, and timelines.

7.  **NOTE** any incomplete information clearly within the relevant section using "[Information not provided]" rather than inferring details, dont display it in the sections. Add it to the end in information needed section, the final output shouldnt have any [Information not provided] texts.

8.  **MAINTAIN** patient privacy by excluding unnecessary identifying details not essential for the clinical note (beyond the initial Patient Information block if those details are explicitly provided for that section).

9.  **PRIORITIZE** accuracy over comprehensiveness if a conflict arises.

10. **EXCLUDE SECTION / FIELD WHEN INFORMATION IS NOT AVAILABLE**

**CRITICAL OUTPUT INSTRUCTION:** Your entire response must *only* be the generated SOAP note, formatted clearly and professionally as described above. Do not include any introductory phrases, concluding remarks, summaries of challenges, or any text outside of the SOAP note itself. The output shouldn't have any markdowns i.e **, #, etc. Dont show fields where the information have not being provided.`;

module.exports = {
  confirmation_template,
  reminder_template,
  subjects,
  system_prompt,
  soap_prompt,
};
