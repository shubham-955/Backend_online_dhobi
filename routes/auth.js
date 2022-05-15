const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const fetchUser = require("../middleware/fetchUser");

// ROUTE 1: For Register a users
router.post(
  "/register",
  [
    body("name", "Please enter a name"),
    body("email", "Please enter a valid email").isEmail(),
    body("password", "Password must be atleast 8 characters"),
    body("mobile_number", "Please enter a valid mobile number").isLength({
      min: 10,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await User.findOne({ mobile_number: req.body.mobile_number });
      if (user) {
        return res.status(400).json({ error: "Please enter unique mobile number" })
      }

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);
      user = await User.create({
        name: req.body.name,
        mobile_number: req.body.mobile_number,
        email: req.body.email,
        password: secPass,
      })

      const data = {
        user: {
          id: user.id
        }
      }

      const authToken = jwt.sign(data, process.env.JWT_SECRET_KEY);
      res.json({ status: 200, authToken })
    } catch (error) {
      console.log(error.message);
      res.status(500).json("Internal Server Error");
    }
  }
);

// ROUTE 2: For Login a user
router.post(
  "/login",
  [
    body("mobile_number", "Please enter a valid mobile number").isLength({
      min: 10,
    }),
    body("password", "Password can not be blank").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mobile_number, password } = req.body;
    try {
      let user = await User.findOne({ mobile_number });
      if (!user) {
        return res
          .status(400)
          .json({ status: 400, error: "Invalid Credentials" });
      }

      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res
          .status(400)
          .json({ status: 400, error: "Invalid Credentials" });
      }

      const data = {
        user: {
          id: user.id,
        },
      };

      const authToken = jwt.sign(data, process.env.JWT_SECRET_KEY);
      console.log(authToken);
      res.send({ status: 200, authToken });
    } catch (error) {
      console.log(error.message);
      res.status(500).json("Internal Server Error");
    }
  }
);

// ROUTE 3: For Get a user
router.get("/getuser", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send({ status: 200, user });
  } catch (error) {
    // console.log(error.message);
    res.send("Internal Server Error");
  }
});



// ROUTE 6: For Edit user details, Login required
router.put("/edituser", fetchUser, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
    });
    res.status(200).json({ status: 200, user });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});
//.select("-password")

module.exports = router;
