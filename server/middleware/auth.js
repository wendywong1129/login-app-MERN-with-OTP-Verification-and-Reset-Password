import jwt from "jsonwebtoken";
import User from "../model/userModel.js";

// auth user
export const authUsername = async (req, res, next) => {
  try {
    const { username } = req.method == "GET" ? req.query : req.body;
    const existingUser = await User.findOne({ username });
    if (!existingUser)
      return res.status(404).send({ error: "Cannot find the User!" });

    next();
  } catch (error) {
    return res.status(404).send({ error: "Username Authentication Failed!" });
  }
};

// authenticate token
export const authToken = async (req, res, next) => {
  try {
    const authorization = req.headers["authorization"];
    const token = authorization && authorization.split("Bearer ")[1];
    if (!token) {
      res.status(401).send({ error: "Cannot find the token!" });
    }
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;

    next();
  } catch (error) {
    res.status(401).send({ error: "Token Authentication Failed!" });
  }
};
