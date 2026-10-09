const express = require("express");
const router = express.Router();
const { 
    getSuKien, 
    createSuKien, 
    updateSuKien, 
    deleteSuKien 
} = require("../Controller/api/suKienController");
const authMiddleware = require("../Middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", getSuKien);
router.post("/", createSuKien);
router.put("/:id", updateSuKien);
router.delete("/:id", deleteSuKien);

module.exports = router;
