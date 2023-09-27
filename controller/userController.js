// connect model and view with controller

const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const Products = require("../model/productModel");
const Addresses = require("../model/addressModel");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { getReferralCode } = require("../helpers/generator");
const { updateWallet } = require("../helpers/helpersFunctions");
const { setTimeout } = require("timers/promises");

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

const getOTP = () => Math.floor(Math.random() * 900000) + 100000;

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

// Load SignUp

const getSignup = async (req, res, next) => {
  try {
    const referral = req.query.referral;
    res.render("signup", { referral });
  } catch (error) {
    next(error.message);
  }
};

// Insert user details to the database

const postSignup = async (req, res, next) => {
  try {
    const { fname, lname, email, mobile, password, confirmPassword, referral } =
      req.body;

    if (password == confirmPassword) {
      const userData = await User.findOne({ email });
      if (userData) {
        return res.render("signUp", { message: "User already exists" });
      }
      const OTP = (req.session.OTP = getOTP());

      req.session.fname = fname;
      req.session.lname = lname;
      req.session.email = email;
      req.session.mobile = mobile;
      req.session.password = password;

      sendVerifyMail(fname, lname, email, OTP);
      res.render("otpVerification", {
        title: "Verification Page",
        fname,
        lname,
        email,
        mobile,
        password,
        referral,
        message: "OTP Sent!",
      });
    } else {
      res.render("signup");
    }
  } catch (error) {
    next(error.message);
  }
};

// For sending mail
const sendVerifyMail = async (fname, lname, email, OTP, next) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "sachinkp1997@gmail.com",
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: "sachinkp1997@gmail.com",
      to: email,
      subject: "For Verification of Mail",
      html: `<h1>  ${fname}!!! Look at ME! </h1> <h5>Your OTP for verification is,</h5> <p>OTP:${OTP}</p>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:- ", info.response);
      }
    });
  } catch (error) {
    next(error.message);
  }
};

const generateOtp = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "sachinkp1997@gmail.com",
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: "sachinkp1997@gmail.com",
      to: email,
      subject: "For Verification of Mail",
      html: `<h1>  !!! Look at ME! </h1> <h5>Your OTP for verification is,</h5> <p>OTP:${otp}</p>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:- ", info.response);
      }
    });
  } catch (error) {
    next(error.message);
  }
};
// Load Login

const getLogin = async (req, res, next) => {
  try {
    return res.render("login");
  } catch (error) {
    next(error);
  }
};

// User Logout

const userLogout = async (req, res, next) => {
  try {
    req.session.destroy(function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/user");
      }
    });
  } catch (error) {
    next(error.message);
  }
};

// Load Home Page

const loadHome = async (req, res, next) => {
  try {
    const isLoggedIn = Boolean(req.session.userId);
    let page = 1;
    if (req.query.page) page = req.query.page;
    const limit = 12;
    const pdtsData = await Products.find({ isListed: true })
      .populate("offer")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.render("home", { pdtsData, isLoggedIn });
  } catch (error) {
    next(error.message);
  }
};

const verifyMail = async (req, res, next) => {
  try {
    const updateInfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_verified: 1 } }
    );

    res.render("email-verified");
  } catch (error) {
    next(error.message);
  }
};

// For Otp Verification

const postVerifyOtp = async (req, res, next) => {
  try {
    const enteredOtp = Number(req.body.otp);
    const sharedOtp = Number(req.session.OTP);
    const referral = req.body.referral.trim();

    const { fname, lname, email, mobile, password } = req.session;

    if (enteredOtp === sharedOtp) {
      const secPassword = await securePassword(password);
      const referralCode = await getReferralCode();
      const currDate = new Date();
      const day = String(currDate.getDate()).padStart(2, "0");
      const month = String(currDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
      const year = currDate.getFullYear();

      const formattedDate = `${day}-${month}-${year}`;
      const user = new User({
        fname,
        lname,
        email,
        dob: formattedDate,
        mobile: mobile,
        password: secPassword,
      });

      let newUserData;
      if (referral) {
        const isReferrerExist = await User.findOne({ referralCode: referral });
        if (isReferrerExist) {
          let referrerId = isReferrerExist._id;

          const walletHistory = {
            date: new Date(),
            amount: 100,
            message: "Joining Bonus",
          };

          newUserData = await new User({
            fname,
            lname,
            email,
            mobile,
            password: secPassword,
            referralCode,
            referredBy: referral,
            wallet: 100,
            walletHistory,
          }).save();

          updateWallet(referrerId, 100, "Refferal Reward");
        }
      } else {
        newUserData = await new User({
          fname,
          lname,
          email,
          mobile,
          password: secPassword,
        }).save();
      }
      req.session.userId = newUserData._id;
      res.redirect("/login");
    } else {
      res.render("otpVerification", {
        fname,
        lname,
        email,
        mobile,
        password,
        referral,
        message: "Incorrect OTP",
      });
    }
  } catch (error) {
    next(error);
  }
};

const VerifyOtp = async (req, res, next) => {
  try {
    const enteredOtp = Number(req.body.otp);
    const sharedOtp = Number(req.session.OTP);

    if (enteredOtp !== sharedOtp) {
      return res.render("verifyOtp", {
        message: "Invalid OTP",
        email: req.session.email,
      });
    }
    if (req.session.userData) {
      const { email } = req.session.userData;

      return res.render("update-password", { email });
    }

    if (req.session) {
      const { password, email } = req.session.userData;

      const user = await User.findOne({ email });

      if (user) {
        req.flash("error", "User with this email already exists");
        return res.redirect("/login");
      }

      if (!password) {
        return res.render("verify", { message: "Password required", email });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      await User.create({
        password: hashedPassword,
        email: email,
        blocked: FileSystemWritableFileStreame, // Mark the user as verified since OTP validation was successful
      });

      req.flash("success", "Account created Successfully");
      req.session.isLoggedIn = true;
      return res.redirect("/");
    }

    return res.render("verify", {
      message: "Session Expired",
      email: req.session.email,
    });
  } catch (error) {
    next(error);
  }
};
const postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (!userData.blocked) {
          req.session.userId = userData._id;
          req.session.cartCount = userData.cart.length;
          req.session.wishCount = userData.wishlist.length;

          res.redirect("/");
        } else {
          res.render("login", {
            message: "Sorry, You are blocked by the admin",
          });
          return;
        }
      } else {
        res.render("login", { message: "Invalid Password" });
      }
    } else {
      res.render("login", { message: "User does not exist" });
    }
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    next(error);
  }
};

// Shopping Cart Begin
const loadShoppingCart = async (req, res, next) => {
  try {
    const userId = req.session.userId;

    const userData = await User.findById({ _id: userId }).populate(
      "cart.productId"
    );
    const cartItems = userData.cart;

    for (const { productId } of cartItems) {
      await User.updateOne(
        { _id: userId, "cart.productId": productId._id },
        {
          $set: {
            "cart.$.productPrice": productId.price,
            "cart.$.discountPrice": productId.discountPrice,
          },
        }
      );
    }
    res.render("cart", { isLoggedIn: true, userData, cartItems });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const pdtId = req.params.id;
    const userId = req.session.userId;

    const userData = await User.findById({ _id: userId });

    const isproductExist = await userData.cart.findIndex(
      (pdt) => pdt.productId == pdtId
    );

    if (isproductExist === -1) {
      const pdtData = await Products.findById({ _id: pdtId });

      const cartItem = {
        productId: pdtId,
        quantity: 1,
        productPrice: pdtData.price,
        discountPrice: pdtData.discountPrice,
      };

      const userData = await User.findByIdAndUpdate(
        { _id: userId },
        {
          $push: {
            cart: cartItem,
          },
        }
      );
      req.session.cartCount++;
      res.redirect("/shoppingCart");
    } else {
      await User.updateOne(
        { _id: userId, "cart.productId": pdtId },
        {
          $inc: {
            "cart.$.quantity": 1,
          },
        }
      );

      res.redirect("/shoppingCart");
    }
  } catch (error) {
    next(error);
  }
};

const updateCart = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const quantity = parseInt(req.body.amt);
    const prodId = req.body.prodId;

    const pdtData = await Products.findById({ _id: prodId });

    const stock = pdtData.quantity;

    let totalSingle;
    if (pdtData.offerPrice) {
      totalSingle = quantity * pdtData.offerPrice;
    } else {
      totalSingle = quantity * pdtData.price;
    }

    if (stock >= quantity) {
      await User.updateOne(
        { _id: userId, "cart.productId": prodId },
        {
          $set: {
            "cart.$.quantity": quantity,
          },
        }
      );
      const userData = await User.findById({ _id: userId }).populate(
        "cart.productId"
      );

      let totalPrice = 0;
      let totalDiscount = 0;
      userData.cart.forEach((pdt) => {
        totalPrice += pdt.productPrice * pdt.quantity;

        if (pdt.productId.offer) {
          totalDiscount +=
            (pdt.productPrice - pdt.productId.offerPrice) * quantity;
        } else {
          totalDiscount +=
            (pdt.productPrice - pdt.discountPrice) * pdt.quantity;
        }
      });
      res.json({
        status: true,
        data: { totalSingle, totalPrice, totalDiscount },
      });
    } else {
      res.json({
        status: false,
        data: "Sorry the product stock has been exceeded",
      });
    }
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const pdtId = req.params.id;
    const userId = req.session.userId;

    const userData = await User.findOneAndUpdate(
      { _id: userId, "cart.productId": pdtId },
      {
        $pull: {
          cart: {
            productId: pdtId,
          },
        },
      }
    );
    req.session.cartCount--;

    res.redirect("/shoppingCart");
  } catch (error) {
    next(error);
  }
};
// Shopping Cart End

// profile Start

const loadProfile = async (req, res, next) => {
  try {
    const userId = req.session.userId;

    const userData = await User.findById({ _id: userId });
    const userAddress = await Addresses.findOne({ userId: userId });

    res.render("profileAddress", { userData, userAddress, isLoggedIn: true });
  } catch (error) {
    next(error);
  }
};

const loadEditProfile = async (req, res, next) => {
  try {
    id = req.session.userId;

    const userData = await User.findById({ _id: id });

    res.render("editProfile", { userData, isLoggedIn: true });
  } catch (error) {
    next(error);
  }
};

const postEditProfile = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { fname, lname, mobile, dob } = req.body;
    const newUserData = await User.findByIdAndUpdate(
      { _id: userId },
      {
        $set: {
          fname,
          lname,
          mobile,
          dob,
        },
      }
    );

    res.redirect("/profile");
  } catch (error) {
    next(error);
  }
};

// Change Password
const loadChangePassword = async (req, res, next) => {
  try {
    res.render("changePass", { isLoggedIn: true });
  } catch (error) {
    next(error);
  }
};

const postChangePassword = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.redirect("/profile/changePassword");
    }

    const userData = await User.findById({ _id: userId });

    const passwordMatch = await bcrypt.compare(oldPassword, userData.password);

    if (passwordMatch) {
      const sPassword = await securePassword(newPassword);
      await User.findByIdAndUpdate(
        { _id: userId },
        {
          $set: {
            password: sPassword,
          },
        }
      );

      return res.redirect("/profile");
    } else {
      return res.redirect("/profile/changePassword");
    }
  } catch (error) {
    next(error);
  }
};
// Change Password End

// Wallet Start

const loadWalletHistory = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const userData = await User.findById({ _id: userId });
    const walletHistory = userData.walletHistory.reverse();
    res.render("walletHistory", { isLoggedIn: true, userData, walletHistory });
  } catch (error) {
    next(error);
  }
};

const addMoneyToWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const id = crypto.randomBytes(8).toString("hex");

    var options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "hello" + id,
    };
    instance.orders.create(options, (err, order) => {
      if (err) {
        res.json({ status: false });
      } else {
        res.json({ status: true, payment: order });
      }
    });
  } catch (error) {
    next(error);
  }
};

const verifyWalletPayment = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const details = req.body;
    const amount = parseInt(details.order.amount) / 100;

    let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);

    hmac.update(
      details.response.razorpay_order_id +
        "|" +
        details.response.razorpay_payment_id
    );
    hmac = hmac.digest("hex");
    if (hmac === details.response.razorpay_signature) {
      const walletHistory = {
        date: new Date(),
        amount,
        message: "Deposited via Razorpay",
      };

      await User.findByIdAndUpdate(
        { _id: userId },
        {
          $inc: {
            wallet: amount,
          },
          $push: {
            walletHistory,
          },
        }
      );

      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    next(error);
  }
};

// Wishlist Start

const loadWishlist = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const isLoggedIn = Boolean(req.session.userId);
    const userData = await User.findById({ _id: userId }).populate("wishlist");
    const wishlist = userData.wishlist;
    res.render("wishlist", { isLoggedIn, wishlist });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const productId = req.query.id;
    const userId = req.session.userId;
    const userData = await User.findOne({ _id: userId });

    if (!userData.wishlist.includes(productId)) {
      userData.wishlist.push(productId);
      await userData.save();
      req.session.wishCount++;
    }

    res.redirect("/shop");
  } catch (error) {
    next(error);
  }
};

const removeWishlistItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { userId } = req.session;
    await User.findByIdAndUpdate(
      { _id: userId },
      {
        $pull: {
          wishlist: productId,
        },
      }
    );
    req.session.wishCount--;
    const { returnPage } = req.query;
    if (returnPage == "shop") {
      res.redirect("/shop");
    } else if (returnPage == "productOverview") {
      res.redirect(`/shop/productOverview/${productId}`);
    } else if (returnPage == "wishlist") {
      res.redirect("/wishlist");
    }
  } catch (error) {
    next(error);
  }
};
// Wishlist End

const getForgotPassword = (req, res) => {
  // Render the forgot password form
  try {
    res.render("forgotPassword", { error: req.flash("error") });
  } catch (err) {}
};

const postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (email.trim() === "") {
      req.flash("error", "Email  is required");
      return res.redirect("/forgot-password");
    }
    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "No user found with this email address.");
      return res.redirect("/forgot-password");
    }
    req.session.OTP = getOTP();

    const otp = req.session.OTP;

    req.session.userData = { email, otp }; // Store email and OTP in the session

    await generateOtp(email, otp);
    setTimeout(() => {
      req.session.OTP = null;
    }, 60000);
    res.render("verifyOtp", { email, message: "" });
  } catch (error) {
    req.flash("error", "An error occurred during password reset");
    res.redirect("/forgot-password");
  }
};

const updatePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/forgot-password");
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    // Clear the resetUserData from the session
    delete req.session.userData;

    req.flash("success", "Password updated successfully.");
    res.redirect("/login"); // Redirect to the login page
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred during password update");
    res.redirect("/forgot-password");
  }
};

const resendOTP = async (req, res, next) => {
  try {
    let email;
    const referral = req.body.referral;
    if (req.session.userData) {
      email = req.session.userData.email;
      const otp = getOTP();

      req.session.OTP = otp;

      await generateOtp(email, otp);
      setTimeout(() => {
        req.session.OTP = null; // Or delete req.session.otp;
      }, 60000);
      return res.render("verifyOtp", {
        message: "",
        email: req.session.userData,
      });
    } else if (req.session.email) {
      email = req.session.email;
      const otp = getOTP();

      req.session.OTP = otp;

      await generateOtp(email, otp);
      setTimeout(() => {
        req.session.OTP = null; // Or delete req.session.otp;
      }, 60000);
      return res.render("otpVerification", {
        message: "",
        email: req.session.email,
        referral,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLogin,
  postSignup,
  postLogin,
  getSignup,
  userLogout,
  loadHome,
  verifyMail,
  postVerifyOtp,
  logoutUser,
  loadShoppingCart,
  addToCart,
  updateCart,
  removeCartItem,
  loadChangePassword,
  postChangePassword,
  loadProfile,
  loadEditProfile,
  postEditProfile,
  loadWishlist,
  addToWishlist,
  removeWishlistItem,
  loadWalletHistory,
  addMoneyToWallet,
  verifyWalletPayment,
  getForgotPassword,
  updatePassword,
  postForgotPassword,
  VerifyOtp,
  resendOTP,
};
