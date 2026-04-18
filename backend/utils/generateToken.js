import jwt from "jsonwebtoken";

/**
 * Generates a signed JWT for the given user payload.
 * @param {{ id: string, email: string }} payload
 * @returns {string} signed JWT
 */
const generateToken = ({ id, email }) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export default generateToken;
