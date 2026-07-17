const router = require("express").Router();
const protect = require("../middleware/authMiddleware");

router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Protected route working",
    userId: req.user,
  });
});

module.exports = router;