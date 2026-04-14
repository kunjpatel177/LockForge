const express = require("express");
const router = express.Router();

const isAuth = require("../middleware/auth");

const {
    addCredential,
    getCredentials,
    deleteCredential,
    renderEditPage,
    updateCredential
} = require("../controllers/credentialController");

// Dashboard + Search
router.get("/dashboard", isAuth, getCredentials);

// Add
router.post("/add", isAuth, addCredential);

// Edit
router.get("/edit/:id", isAuth, renderEditPage);
router.post("/edit/:id", isAuth, updateCredential);

// Delete
router.post("/delete/:id", isAuth, deleteCredential);

module.exports = router;