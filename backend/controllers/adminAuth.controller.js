import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ExpressError from "../utils/ExpressError.js";
import UserSchema from "../DB/models/userModel.js";
import wrapAsync from "../utils/wrapAsync.js";
import { getCookieOptions, getCookieClearOptions } from "../middlewares/authMiddleware.js";

// Generate Access Token
function signAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );
}

//Generate Refresh Token
function signRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  );
}

// set both cookies on the response and persist refresh token in DB
async function setAuthCookies(res, user, conn) {

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const opts = getCookieOptions();

  // Save refresh token in the user document
  const User = conn.model("User", UserSchema);
  await User.findByIdAndUpdate(user._id, { refreshToken });

  // access token cookie 15 min
  res.cookie("accessToken", accessToken, {
    ...opts,
    maxAge: 1000 * 60 * 15,//COOKIE EXPIRY
  });

  // refresh token cookie 7 days
  res.cookie("refreshToken", refreshToken, {
    ...opts,
    maxAge: 1000 * 60 * 60 * 24 * 7,//COOKIE EXPIRY
  });
}


export const login = wrapAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ExpressError("Email and password are required", 400);
  }

  const conn = req.dbConnection;
  const User = conn.model("User", UserSchema);

  const user = await User.findOne({ email });
  if (!user) throw new ExpressError("Invalid email or password", 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new ExpressError("Invalid email or password", 401);

  await setAuthCookies(res, user, conn);
  res.json({ success: true, message: "Login successful" });
});



export const refreshToken = wrapAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new ExpressError("No refresh token , please log in", 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    // Refresh token expired or corrupted
    res.clearCookie("accessToken", getCookieClearOptions());
    res.clearCookie("refreshToken", getCookieClearOptions());
    throw new ExpressError("Refresh token expired , please log in again", 401);
  }

  // Verify user still exists
  const conn = req.dbConnection;
  const User = conn.model("User", UserSchema);
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    res.clearCookie("accessToken", getCookieClearOptions());
    res.clearCookie("refreshToken", getCookieClearOptions());
    throw new ExpressError("User no longer exists", 401);
  }

  // Verify the refresh token matches what's stored in the DB
  if (user.refreshToken !== token) {
    res.clearCookie("accessToken", getCookieClearOptions());
    res.clearCookie("refreshToken", getCookieClearOptions());
    throw new ExpressError("please log in again", 401);
  }

  const newAccessToken = signAccessToken(user);
  
  const opts = getCookieOptions();
  res.cookie("accessToken", newAccessToken, {
    ...opts,
    maxAge: 1000 * 60 * 15,
  });

  res.json({ success: true, message: "Token refreshed" });
});


export const checkAuth = wrapAsync(async (req, res) => {
  const token = req.cookies?.accessToken;
  if (!token) return res.status(401).json({ ok: false });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const conn = req.dbConnection;
    if (conn) {
      const User = conn.model("User", UserSchema);
      const user = await User.findById(decoded.id).select("_id email");
      if (!user) {
        res.clearCookie("accessToken", getCookieClearOptions());
        return res.status(401).json({ ok: false });
      }
    }

    return res.json({ ok: true });
  } catch {
    // 401 triggers axios interceptor → auto-calls /admin/refresh
    return res.status(401).json({ ok: false });
  }
});


export const logout = wrapAsync(async (req, res) => {
  // Clear refresh token from DB (if user is identified)
  const token = req.cookies?.accessToken || req.cookies?.refreshToken;
  if (token) {
    try {
      const secret = req.cookies?.accessToken
        ? process.env.ACCESS_TOKEN_SECRET
        : process.env.REFRESH_TOKEN_SECRET;
      const decoded = jwt.verify(token, secret);
      const conn = req.dbConnection;
      if (conn) {
        const User = conn.model("User", UserSchema);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      }
    } catch {
      // Token invalid/expired — still clear cookies below
    }
  }

  res.clearCookie("accessToken", getCookieClearOptions());
  res.clearCookie("refreshToken", getCookieClearOptions());

  res.json({ success: true, message: "Logged out successfully" });
});
