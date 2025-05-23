const express = require('express');
const router = express.Router();
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  storePatientMedicalDocument,
} = require("../controllers/patientController");
const { protect } = require("../middlewares/authMiddleware");

// All routes are protected
router.use(protect);

// Route: /api/patients

router.route("/").get(getPatients).post(createPatient);
  
// Route: /api/patients/:id
router
  .route("/:id")
  .get(getPatientById)
  .put(updatePatient)
  .delete(deletePatient);

router.route("/store-report/:id").post(storePatientMedicalDocument);

module.exports = router;