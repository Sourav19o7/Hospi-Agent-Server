// services/insightGenerationService.js
const { supabaseAdmin } = require('../config/supabase');
const mcpService = require('./mcpIntegrationService');

/**
 * Generate scheduling insights based on appointment data
 * @returns {Promise<Array>} Array of scheduling insights
 */
const generateSchedulingInsights = async () => {
  try {
    // Get appointment data from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
      
    if (appointmentsError) {
      throw new Error(`Error fetching appointments: ${appointmentsError.message}`);
    }
    
    // Get current scheduling information
    const { data: doctors, error: doctorsError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'doctor');
      
    if (doctorsError) {
      throw new Error(`Error fetching doctors: ${doctorsError.message}`);
    }
    
    // Send data to MCP for analysis
    const insights = await mcpService.analyzeSchedulingData(appointments, doctors);
    
    // Add creation timestamp
    const timestampedInsights = insights.map(insight => ({
      ...insight,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    return timestampedInsights;
  } catch (error) {
    console.error('Error generating scheduling insights:', error);
    // Return empty array in case of error to prevent blocking other insights
    return [];
  }
};

/**
 * Generate inventory insights based on inventory and appointment data
 * @returns {Promise<Array>} Array of inventory insights
 */
const generateInventoryInsights = async () => {
  try {
    // Get current inventory data
    const { data: inventory, error: inventoryError } = await supabaseAdmin
      .from('inventory')
      .select('*');
      
    if (inventoryError) {
      throw new Error(`Error fetching inventory: ${inventoryError.message}`);
    }
    
    // Get upcoming appointments to predict usage
    const { data: upcomingAppointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0]);
      
    if (appointmentsError) {
      throw new Error(`Error fetching upcoming appointments: ${appointmentsError.message}`);
    }
    
    // Send data to MCP for analysis
    const insights = await mcpService.analyzeInventoryData(inventory, upcomingAppointments);
    
    // Add creation timestamp
    const timestampedInsights = insights.map(insight => ({
      ...insight,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    return timestampedInsights;
  } catch (error) {
    console.error('Error generating inventory insights:', error);
    return [];
  }
};

/**
 * Generate revenue insights based on billing and appointments data
 * @returns {Promise<Array>} Array of revenue insights
 */
const generateRevenueInsights = async () => {
  try {
    // Get billing data from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(*)')
      .gte('invoice_date', ninetyDaysAgo.toISOString().split('T')[0]);
      
    if (invoicesError) {
      throw new Error(`Error fetching invoices: ${invoicesError.message}`);
    }
    
    // Get appointment types and patterns
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .gte('date', ninetyDaysAgo.toISOString().split('T')[0]);
      
    if (appointmentsError) {
      throw new Error(`Error fetching appointments: ${appointmentsError.message}`);
    }
    
    // Send data to MCP for analysis
    const insights = await mcpService.analyzeRevenueData(invoices, appointments);
    
    // Add creation timestamp
    const timestampedInsights = insights.map(insight => ({
      ...insight,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    return timestampedInsights;
  } catch (error) {
    console.error('Error generating revenue insights:', error);
    return [];
  }
};

/**
 * Generate patient insights based on patient data and appointments
 * @returns {Promise<Array>} Array of patient insights
 */
const generatePatientInsights = async () => {
  try {
    // Get patient data
    const { data: patients, error: patientsError } = await supabaseAdmin
      .from('patients')
      .select('*');
      
    if (patientsError) {
      throw new Error(`Error fetching patients: ${patientsError.message}`);
    }
    
    // Get patient appointment history
    const { data: patientAppointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('*');
      
    if (appointmentsError) {
      throw new Error(`Error fetching patient appointments: ${appointmentsError.message}`);
    }
    
    // Send data to MCP for analysis
    const insights = await mcpService.analyzePatientData(patients, patientAppointments);
    
    // Add creation timestamp
    const timestampedInsights = insights.map(insight => ({
      ...insight,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    return timestampedInsights;
  } catch (error) {
    console.error('Error generating patient insights:', error);
    return [];
  }
};

module.exports = {
  generateSchedulingInsights,
  generateInventoryInsights,
  generateRevenueInsights,
  generatePatientInsights,

};