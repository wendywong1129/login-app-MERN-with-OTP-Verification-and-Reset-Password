import jwt from "jsonwebtoken";

const generateToken = (userId, username) => {
  return jwt.sign({ userId, username }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

export default generateToken;
