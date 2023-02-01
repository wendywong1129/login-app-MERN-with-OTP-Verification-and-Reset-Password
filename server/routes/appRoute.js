import { Router } from "express";
import * as controller from "../controllers/appController.js";
import { registerMail } from "../controllers/mailController.js";
import { authUsername, authToken } from "../middleware/auth.js";
import localVariables from "../middleware/locals.js";

const router = Router();

// POST Methods
router.route("/register").post(controller.register); // register an user
router.route("/registerMail").post(registerMail); // send the email
router.route("/authenticate").post(authUsername, (req, res) => res.end()); // authenticate the user
router.route("/login").post(authUsername, controller.login); // login in app

// GET Methods
router.route("/user/:username").get(controller.getUser); // get user with username
router
  .route("/generateOTP")
  .get(authUsername, localVariables, controller.generateOTP); // generate generated OTP
router.route("/verifyOTP").get(authUsername, controller.verifyOTP); // verify generated OTP
router.route("/createResetSession").get(controller.createResetSession); // reset all of variables

// PUT Methods
router.route("/updateUser").put(authToken, controller.updateUser); // update user profile
router.route("/resetPassword").put(authUsername, controller.resetPassword); // reset password

export default router;
