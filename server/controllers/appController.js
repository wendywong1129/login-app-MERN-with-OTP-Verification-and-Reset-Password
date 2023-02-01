import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";
import otpGenerator from "otp-generator";

/** POST: http://localhost:8070/api/register 
  @param : 
  {
    "username" : "summer",
    "password" : "12345!",
    "email": "summer@gmail.com",
    "profile": ""
  }
*/
export const register = async (req, res) => {
  try {
    const { profile, email, username, password } = req.body;

    const existingUsername = new Promise((resolve, reject) => {
      User.findOne({ username }, function (err, user) {
        if (err) reject(new Error(err));
        if (user) reject({ error: "Please use a unique username" });

        resolve();
      });
    });

    const existingEmail = new Promise((resolve, reject) => {
      User.findOne({ email }, function (err, email) {
        if (err) reject(new Error(err));
        if (email) reject({ error: "Please use a unique Email" });

        resolve();
      });
    });

    Promise.all([existingUsername, existingEmail])
      .then(() => {
        if (password) {
          bcrypt
            .hash(password, 10)
            .then((hashedPassword) => {
              const newUser = new User({
                username,
                password: hashedPassword,
                profile: profile || "",
                email,
              });
              newUser
                .save()
                .then((result) =>
                  res.status(201).send({ msg: "User Register Successfully" })
                )
                .catch((error) => res.status(500).send({ error }));
            })
            .catch((error) => {
              return res
                .status(500)
                .send({ error: "Enable to hashed password" });
            });
        }
      })
      .catch((error) => {
        return res.status(500).send({ error });
      });
  } catch (error) {
    return res.status(500).send({ error });
  }
};

/** POST: http://localhost:8070/api/login 
  @param: 
  {
    "username" : "",
    "password" : ""
  }
*/
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    User.findOne({ username })
      .then((user) => {
        bcrypt
          .compare(password, user.password)
          .then((passwordCheck) => {
            if (!passwordCheck)
              return res
                .status(400)
                .send({ error: "Do not have the Password" });

            // const token = jwt.sign(
            //   {
            //     userId: user._id,
            //     username: user.username,
            //   },
            //   process.env.JWT_SECRET,
            //   { expiresIn: "24h" }
            // );

            return res.status(200).send({
              msg: "Login Successfully",
              username: user.username,
              token: generateToken(user._id, user.username),
            });
          })
          .catch((error) => {
            return res.status(400).send({ error: "Password does not Match" });
          });
      })
      .catch((error) => {
        return res.status(404).send({ error: "Username not Found" });
      });
  } catch (error) {
    return res.status(500).send({ error });
  }
};

/** GET: http://localhost:8070/api/user/:username */
export const getUser = async (req, res) => {
  try {
    const { username } = req.params;

    User.findOne({ username }, function (err, user) {
      if (err) return res.status(500).send({ err });
      if (!user) return res.status(501).send({ error: "Cannot Find the User" });

      // remove password from user data
      const { password, ...rest } = Object.assign({}, user.toJSON());

      return res.status(201).send(rest);
    });
  } catch (error) {
    return res.status(404).send({ error: "Cannot Find the User" });
  }
};

/** PUT: http://localhost:8070/api/updateUser 
  @param: 
  {
    "header" : "<token>"
  }
  body: {
    firstName: '',
    address : '',
    profile : ''
  }
*/
export const updateUser = async (req, res) => {
  try {
    // const id = req.query.id;
    // if (id) {
    //   const body = req.body;

    //   User.updateOne({ _id: id }, body, function (err, data) {
    const { userId } = req.user;
    if (userId) {
      const body = req.body;
      User.updateOne({ _id: userId }, body, function (err, data) {
        if (err) throw err;

        return res.status(201).send({ msg: "Record Updated!" });
      });
    } else {
      return res.status(401).send({ error: "User not Found!" });
    }
  } catch (error) {
    return res.status(401).send({ error });
  }
};

/** GET: http://localhost:8070/api/generateOTP */
export const generateOTP = async (req, res) => {
  // let OTP = await otpGenerator.generate(6, {
  req.app.locals.OTP = await otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  res.status(201).send({ code: req.app.locals.OTP });
};

/** GET: http://localhost:8070/api/verifyOTP */
export const verifyOTP = async (req, res) => {
  const { code } = req.query;
  if (parseInt(req.app.locals.OTP) === parseInt(code)) {
    req.app.locals.OTP = null; // reset the OTP value
    req.app.locals.resetSession = true; // start session for reset password
    return res.status(201).send({ msg: "OTP Verify Successfully!" });
  }
  return res.status(400).send({ error: "Invalid OTP!" });
};

/** GET: http://localhost:8070/api/createResetSession */
export const createResetSession = async (req, res) => {
  if (req.app.locals.resetSession) {
    // req.app.locals.resetSession = false; // allow access to this route only once
    // return res.status(201).send({ msg: "Access Granted!" });
    return res.status(201).send({ flag: req.app.locals.resetSession });
  }
  return res.status(440).send({ error: "Session expired!" });
};

/** PUT: http://localhost:8070/api/resetPassword */
export const resetPassword = async (req, res) => {
  try {
    if (!req.app.locals.resetSession)
      return res.status(440).send({ error: "Session expired!" });

    const { username, password } = req.body;
    try {
      User.findOne({ username })
        .then((user) => {
          bcrypt
            .hash(password, 10)
            .then((hashedPassword) => {
              User.updateOne(
                { username: user.username },
                { password: hashedPassword },
                function (err, data) {
                  if (err) throw err;
                  req.app.locals.resetSession = false; // reset session
                  return res.status(201).send({ msg: "Record Updated!" });
                }
              );
            })
            .catch((error) => {
              return res.status(500).send({
                error: "Enable to hashed password",
              });
            });
        })
        .catch((error) => {
          return res.status(404).send({ error: "Username not Found" });
        });
    } catch (error) {
      return res.status(500).send({ error });
    }
  } catch (error) {
    return res.status(401).send({ error });
  }
};
