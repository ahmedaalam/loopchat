const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { getAllUsers } = require("../controllers/userController");

router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Protected route working",
    userId: req.user,
  });
});

router.get("/", protect, getAllUsers);

module.exports = router;