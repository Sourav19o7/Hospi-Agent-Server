// services/insightApplicationService.js
const { supabaseAdmin } = require('../config/supabase');
const { sendNotification } = require('./notificationService');

/**
 * Apply a scheduling insight - rearranges appointments based on the insight recommendation
 * @param {Object} insight - The scheduling insight to apply
 * @returns {Promise<Object>} Result of the application
 */
const applySchedulingInsight = async (insight) => {
  try {
    const insightData = insight.data;
    const changes = [];
    
    // Get the date for which schedule changes are recommended
    const scheduleDate = insightData.date;
    
    // Get current appointments for that date
    const { data: currentAppointments, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('date', scheduleDate);
      
    if (fetchError) {
      throw new Error(`Failed to fetch appointments: ${fetchError.message}`);
    }
    
    // Apply changes from the suggested schedule to current appointments
    for (const suggestedSlot of insightData.suggestedSchedule) {
      const { time, appointments } = suggestedSlot;
      
      // Find appointments that need to be moved to this time slot
      const appointmentsToUpdate = currentAppointments.filter(apt => 
        appointments.includes(apt.id) && apt.time !== time
      );
      
      // Update each appointment's time
      for (const apt of appointmentsToUpdate) {
        const oldTime = apt.time;
        
        const { data: updatedAppointment, error: updateError } = await supabaseAdmin
          .from('appointments')
          .update({ time })
          .eq('id', apt.id)
          .select()
          .single();
          
        if (updateError) {
          throw new Error(`Failed to update appointment ${apt.id}: ${updateError.message}`);
        }
        
        changes.push({
          appointment_id: apt.id,
          patient_name: apt.patients?.name || 'Unknown Patient',
          old_time: oldTime,
          new_time: time
        });
        
        // Notify patient about the schedule change
        try {
          await sendNotification({
            type: 'appointment_update',
            patient_id: apt.patient_id,
            data: {
              appointment_id: apt.id,
              old_time: oldTime,
              new_time: time,
              date: scheduleDate
            }
          });
        } catch (notifyError) {
          console.error(`Failed to send notification for appointment ${apt.id}:`, notifyError);
        }
      }
    }
    
    return {
      success: true,
      date: scheduleDate,
      changes,
      message: `Applied scheduling changes for ${scheduleDate}`
    };
  } catch (error) {
    console.error('Error applying scheduling insight:', error);
    throw error;
  }
};

/**
 * Apply an inventory insight - creates purchase orders for recommended items
 * @param {Object} insight - The inventory insight to apply
 * @returns {Promise<Object>} Result of the application
 */
const applyInventoryInsight = async (insight) => {
  try {
    const insightData = insight.data;
    const { itemsToRestock, suggestedDate, totalCost } = insightData;
    
    // Create a new purchase order
    const { data: purchaseOrder, error: createError } = await supabaseAdmin
      .from('purchase_orders')
      .insert({
        order_date: new Date().toISOString(),
        expected_delivery: suggestedDate,
        total_amount: totalCost,
        status: 'pending',
        created_by: insight.created_by || null,
        notes: `Auto-generated from inventory insight #${insight.id}`
      })
      .select()
      .single();
      
    if (createError) {
      throw new Error(`Failed to create purchase order: ${createError.message}`);
    }
    
    // Add items to the purchase order
    const orderItems = itemsToRestock.map(item => ({
      purchase_order_id: purchaseOrder.id,
      inventory_item_id: item.id,
      quantity: item.suggestedStock,
      unit_price: item.unitPrice,
      total_price: item.suggestedStock * item.unitPrice
    }));
    
    const { data: orderItemsResult, error: itemsError } = await supabaseAdmin
      .from('purchase_order_items')
      .insert(orderItems)
      .select();
      
    if (itemsError) {
      throw new Error(`Failed to add items to purchase order: ${itemsError.message}`);
    }
    
    return {
      success: true,
      purchase_order_id: purchaseOrder.id,
      items_count: orderItems.length,
      total_amount: totalCost,
      message: `Created purchase order #${purchaseOrder.id} with ${orderItems.length} items`
    };
  } catch (error) {
    console.error('Error applying inventory insight:', error);
    throw error;
  }
};

/**
 * Apply a revenue insight - implements pricing changes, billing adjustments, etc.
 * @param {Object} insight - The revenue insight to apply
 * @returns {Promise<Object>} Result of the application
 */
const applyRevenueInsight = async (insight) => {
  try {
    const insightData = insight.data;
    const changes = [];
    
    // Apply price adjustments if included in recommendations
    if (insightData.priceAdjustments) {
      for (const adjustment of insightData.priceAdjustments) {
        const { service_id, old_price, new_price } = adjustment;
        
        // Update service price
        const { data: updatedService, error: updateError } = await supabaseAdmin
          .from('services')
          .update({ price: new_price })
          .eq('id', service_id)
          .select()
          .single();
          
        if (updateError) {
          throw new Error(`Failed to update service ${service_id}: ${updateError.message}`);
        }
        
        changes.push({
          service_id,
          service_name: updatedService.name,
          old_price,
          new_price
        });
      }
    }
    
    // Apply billing campaigns if included
    if (insightData.billingCampaign) {
      const { campaign_name, target_patients, message_template } = insightData.billingCampaign;
      
      // Create a new campaign
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('campaigns')
        .insert({
          name: campaign_name,
          type: 'billing',
          status: 'active',
          target_count: target_patients.length,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (campaignError) {
        throw new Error(`Failed to create billing campaign: ${campaignError.message}`);
      }
      
      // Queue notifications for target patients
      for (const patientId of target_patients) {
        try {
          await sendNotification({
            type: 'billing_reminder',
            patient_id: patientId,
            campaign_id: campaign.id,
            data: {
              message: message_template
            }
          });
        } catch (notifyError) {
          console.error(`Failed to queue notification for patient ${patientId}:`, notifyError);
        }
      }
      
      changes.push({
        campaign_id: campaign.id,
        campaign_name,
        target_count: target_patients.length
      });
    }
    
    return {
      success: true,
      changes,
      message: `Applied revenue changes: ${changes.length} modifications made`
    };
  } catch (error) {
    console.error('Error applying revenue insight:', error);
    throw error;
  }
};

/**
 * Apply a patient insight - sends follow-up reminders, schedules check-ups, etc.
 * @param {Object} insight - The patient insight to apply
 * @returns {Promise<Object>} Result of the application
 */
const applyPatientInsight = async (insight) => {
  try {
    const insightData = insight.data;
    const changes = [];
    
    // Apply follow-up scheduling if included
    if (insightData.followUps) {
      for (const followUp of insightData.followUps) {
        const { patient_id, reason, suggested_date } = followUp;
        
        // Create a follow-up appointment
        const { data: appointment, error: appointmentError } = await supabaseAdmin
          .from('appointments')
          .insert({
            patient_id,
            date: suggested_date,
            time: '10:00', // Default time, can be adjusted
            type: 'follow-up',
            notes: `Auto-scheduled follow-up for: ${reason}`,
            status: 'pending',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (appointmentError) {
          throw new Error(`Failed to create follow-up appointment: ${appointmentError.message}`);
        }
        
        // Get patient details for the notification
        const { data: patient, error: patientError } = await supabaseAdmin
          .from('patients')
          .select('name')
          .eq('id', patient_id)
          .single();
          
        if (patientError) {
          throw new Error(`Failed to fetch patient details: ${patientError.message}`);
        }
        
        changes.push({
          appointment_id: appointment.id,
          patient_id,
          patient_name: patient.name,
          reason,
          date: suggested_date
        });
        
        // Notify patient about the follow-up
        try {
          await sendNotification({
            type: 'follow_up_scheduled',
            patient_id,
            data: {
              appointment_id: appointment.id,
              date: suggested_date,
              time: '10:00',
              reason
            }
          });
        } catch (notifyError) {
          console.error(`Failed to send notification for patient ${patient_id}:`, notifyError);
        }
      }
    }
    
    // Apply health check reminders if included
    if (insightData.healthCheckReminders) {
      for (const reminder of insightData.healthCheckReminders) {
        const { patient_id, check_type, due_date } = reminder;
        
        // Create a reminder in the system
        const { data: healthReminder, error: reminderError } = await supabaseAdmin
          .from('health_reminders')
          .insert({
            patient_id,
            reminder_type: check_type,
            due_date,
            status: 'pending',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (reminderError) {
          throw new Error(`Failed to create health reminder: ${reminderError.message}`);
        }
        
        changes.push({
          reminder_id: healthReminder.id,
          patient_id,
          check_type,
          due_date
        });
        
        // Send reminder notification
        try {
          await sendNotification({
            type: 'health_check_reminder',
            patient_id,
            data: {
              reminder_id: healthReminder.id,
              check_type,
              due_date
            }
          });
        } catch (notifyError) {
          console.error(`Failed to send reminder notification for patient ${patient_id}:`, notifyError);
        }
      }
    }
    
    return {
      success: true,
      changes,
      message: `Applied patient insight changes: ${changes.length} actions taken`
    };
  } catch (error) {
    console.error('Error applying patient insight:', error);
    throw error;
  }
};

module.exports = {
  applySchedulingInsight,
  applyInventoryInsight,
  applyRevenueInsight,
  applyPatientInsight
};