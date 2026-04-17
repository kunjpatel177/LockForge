const express = require("express");
const router = express.Router();

const isAuth = require("../middleware/auth");

const {
    addCredential,
    getEditPage,
    updateCredential,
    deleteCredential
} = require("../controllers/credentialController");


// ADD (AJAX)
router.post("/add", isAuth, addCredential);

// EDIT PAGE
router.get("/edit/:id", isAuth, getEditPage);

// UPDATE
router.post("/edit/:id", isAuth, updateCredential);

// DELETE
router.post("/delete/:id", isAuth, deleteCredential);


module.exports = router;