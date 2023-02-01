export default function localVariables(req, res, next) {
  req.app.locals = {
    // create this variable only when call generateOTP()
    OTP: null,
    resetSession: false,
  };
  next();
}
