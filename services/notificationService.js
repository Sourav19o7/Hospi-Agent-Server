// services/notificationService.js
const { supabaseAdmin } = require('../config/supabase');
const axios = require('axios');

// Configuration for different notification channels
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const SMS_API_URL = process.env.SMS_API_URL;
const SMS_API_KEY = process.env.SMS_API_KEY;
const EMAIL_API_URL = process.env.EMAIL_API_URL;
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;

/**
 * Send a notification to a patient
 * @param {Object} params - Notification parameters
 * @param {string} params.type - Notification type
 * @param {string} params.patient_id - Patient ID
 * @param {string} params.campaign_id - Optional campaign ID
 * @param {Object} params.data - Notification data
 * @returns {Promise<Object>} Notification result
 */
const sendNotification = async ({ type, patient_id, campaign_id, data }) => {
  try {
    // Get patient contact information
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('name, contact, email')
      .eq('id', patient_id)
      .single();
      
    if (patientError) {
      throw new Error(`Failed to get patient information: ${patientError.message}`);
    }
    
    // Create notification record
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        patient_id,
        campaign_id: campaign_id || null,
        type,
        status: 'pending',
        data,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (notificationError) {
      throw new Error(`Failed to create notification record: ${notificationError.message}`);
    }
    
    // Generate notification content based on type
    const notificationContent = generateNotificationContent(type, patient.name, data);
    
    // Send via appropriate channels
    const channels = await getPatientPreferredChannels(patient_id);
    const results = await sendViaChannels(channels, patient, notificationContent);
    
    // Update notification status
    const { error: updateError } = await supabaseAdmin
      .from('notifications')
      .update({
        status: 'sent',
        sent_channels: results.successfulChannels,
        updated_at: new Date().toISOString()
      })
      .eq('id', notification.id);
      
    if (updateError) {
      console.error(`Failed to update notification status: ${updateError.message}`);
    }
    
    return {
      success: true,
      notification_id: notification.id,
      channels: results.successfulChannels
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Generate notification content based on type and data
 * @param {string} type - Notification type
 * @param {string} patientName - Patient name
 * @param {Object} data - Notification data
 * @returns {Object} Notification content for different channels
 */
const generateNotificationContent = (type, patientName, data) => {
  switch (type) {
    case 'appointment_update':
      return {
        subject: 'Appointment Time Updated',
        message: `Hello ${patientName}, your appointment scheduled for ${data.date} has been rescheduled from ${data.old_time} to ${data.new_time}. Please let us know if this new time doesn't work for you.`,
        whatsapp: `Hello ${patientName}, your appointment scheduled for ${data.date} has been rescheduled from ${data.old_time} to ${data.new_time}. Please let us know if this new time doesn't work for you.`
      };
      
    case 'follow_up_scheduled':
      return {
        subject: 'Follow-up Appointment Scheduled',
        message: `Hello ${patientName}, we've scheduled a follow-up appointment for you on ${data.date} at ${data.time} for ${data.reason}. Please confirm this appointment.`,
        whatsapp: `Hello ${patientName}, we've scheduled a follow-up appointment for you on ${data.date} at ${data.time} for ${data.reason}. Please confirm this appointment.`
      };
      
    case 'health_check_reminder':
      return {
        subject: 'Health Check Reminder',
        message: `Hello ${patientName}, this is a reminder that you're due for a ${data.check_type} by ${data.due_date}. Please schedule an appointment at your convenience.`,
        whatsapp: `Hello ${patientName}, this is a reminder that you're due for a ${data.check_type} by ${data.due_date}. Please schedule an appointment at your convenience.`
      };
      
    case 'billing_reminder':
      return {
        subject: 'Billing Reminder',
        message: data.message.replace('[NAME]', patientName),
        whatsapp: data.message.replace('[NAME]', patientName)
      };
      
    default:
      return {
        subject: 'Notification from HospiAgent',
        message: `Hello ${patientName}, this is a notification from your healthcare provider.`,
        whatsapp: `Hello ${patientName}, this is a notification from your healthcare provider.`
      };
  }
};

/**
 * Get patient's preferred notification channels
 * @param {string} patientId - Patient ID
 * @returns {Promise<Array<string>>} Array of preferred channels
 */
const getPatientPreferredChannels = async (patientId) => {
  try {
    const { data: preferences, error } = await supabaseAdmin
      .from('patient_preferences')
      .select('notification_preferences')
      .eq('patient_id', patientId)
      .single();
      
    if (error || !preferences) {
      // If no preferences are set, default to all channels
      return ['whatsapp', 'sms', 'email'];
    }
    
    return preferences.notification_preferences || ['whatsapp', 'sms', 'email'];
  } catch (error) {
    console.error(`Error getting patient preferences: ${error.message}`);
    // Default to all channels if there's an error
    return ['whatsapp', 'sms', 'email'];
  }
};

/**
 * Send notification via multiple channels
 * @param {Array<string>} channels - Channels to use
 * @param {Object} patient - Patient information
 * @param {Object} content - Notification content
 * @returns {Promise<Object>} Results of sending attempts
 */
const sendViaChannels = async (channels, patient, content) => {
  const results = {
    successfulChannels: [],
    failedChannels: []
  };
  
  // Send via WhatsApp if enabled
  if (channels.includes('whatsapp') && patient.contact) {
    try {
      await sendWhatsApp(patient.contact, content.whatsapp);
      results.successfulChannels.push('whatsapp');
    } catch (error) {
      console.error(`WhatsApp notification failed: ${error.message}`);
      results.failedChannels.push('whatsapp');
    }
  }
  
  // Send via SMS if enabled
  if (channels.includes('sms') && patient.contact) {
    try {
      await sendSMS(patient.contact, content.message);
      results.successfulChannels.push('sms');
    } catch (error) {
      console.error(`SMS notification failed: ${error.message}`);
      results.failedChannels.push('sms');
    }
  }
  
  // Send via Email if enabled
  if (channels.includes('email') && patient.email) {
    try {
      await sendEmail(patient.email, content.subject, content.message);
      results.successfulChannels.push('email');
    } catch (error) {
      console.error(`Email notification failed: ${error.message}`);
      results.failedChannels.push('email');
    }
  }
  
  return results;
};

/**
 * Send a WhatsApp message
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<Object>} WhatsApp API response
 */
const sendWhatsApp = async (phoneNumber, message) => {
  try {
    // Format the phone number as required by WhatsApp API
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // Send via WhatsApp Business API
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        phone: formattedPhone,
        message: message
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

/**
 * Send an SMS message
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<Object>} SMS API response
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Format the phone number as required by SMS API
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // Send via SMS API
    const response = await axios.post(
      SMS_API_URL,
      {
        to: formattedPhone,
        body: message
      },
      {
        headers: {
          'Authorization': `Bearer ${SMS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error sending SMS message:', error);
    throw error;
  }
};

/**
 * Send an email
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email body
 * @returns {Promise<Object>} Email API response
 */
const sendEmail = async (email, subject, message) => {
  try {
    // Send via Email API
    const response = await axios.post(
      EMAIL_API_URL,
      {
        to: email,
        subject: subject,
        text: message,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">${message.replace(/\n/g, '<br>')}</div>`
      },
      {
        headers: {
          'Authorization': `Bearer ${EMAIL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendNotification
};