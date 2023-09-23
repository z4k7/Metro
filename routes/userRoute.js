const express = require("express");
const user_router = express();

const auth = require("../middleware/auth");

const userController = require("../controller/userController");
const pdtController = require("../controller/productController");
const orderController = require("../controller/orderController");
const addressController = require("../controller/addressController");
const couponController = require("../controller/couponController");

user_router.set("views", "./views/user");

// cart and wishlist count
user_router.use(async (req, res, next) => {
  res.locals.cartCount = req.session.cartCount;
  res.locals.wishCount = req.session.wishCount;
  next();
});

user_router.get("/forgot-password", userController.getForgotPassword);

user_router.post("/forgot-password", userController.postForgotPassword);
user_router.post("/update-password", userController.updatePassword);

user_router.get("/signup", auth.isLoggedOut, userController.getSignup);
user_router.post("/signup", auth.isLoggedOut, userController.postSignup);

user_router.get("/login", auth.isLoggedOut, userController.getLogin);
user_router.post("/login", auth.isLoggedOut, userController.postLogin);
user_router.get("/logout", userController.logoutUser);

user_router.post("/verifyotp", userController.postVerifyOtp); // For User Creation
user_router.post("/verify-Otp", userController.VerifyOtp); //

// Resend OTP

user_router.get("/resendOTP", userController.resendOTP);

user_router.get("/", userController.loadHome);

// shop
user_router.get("/shop", pdtController.loadShop);
user_router.get("/detail/:id", pdtController.loadProductOverview);

//to check if User is LoggedIn
user_router.use("/", auth.isLoggedIn);

// shoppingCart
user_router.get("/shoppingCart", userController.loadShoppingCart);
user_router.get("/shop/addToCart/:id", userController.addToCart);
user_router.post("/shoppingCart/removeItem/:id", userController.removeCartItem);
user_router.put("/updateCart", userController.updateCart);
user_router.get(
  "/shoppingCart/proceedToCheckout",
  orderController.loadCheckout
);
user_router.post("/shoppingCart/placeOrder", orderController.placeOrder);

// wishlist
user_router.get("/wishlist", userController.loadWishlist);
user_router.get("/addToWishlist", userController.addToWishlist);
user_router.get(
  "/removeWishlistItem/:productId",
  userController.removeWishlistItem
);

// Order
user_router.get("/orderSuccess", orderController.loadOrderSuccess);
user_router.post("/verifyPayment", orderController.verifyPayment);

// Profile
user_router.get("/profile", userController.loadProfile);
user_router.get("/profile/edit", userController.loadEditProfile);
user_router.post("/profile/edit", userController.postEditProfile);

// Address
user_router.get("/profile/addAddress", addressController.loadAddAddress);
user_router.post(
  "/profile/addAddress/:returnPage",
  addressController.postAddAddress
);
user_router.get("/profile/editAddress/:id", addressController.loadEditAddress);
user_router.post("/profile/editAddress/:id", addressController.postEditAddress);
user_router.get("/profile/deleteAddress/:id", addressController.deleteAddress);

// User Profile Password
user_router.get("/profile/changePassword", userController.loadChangePassword);
user_router.post("/profile/changePassword", userController.postChangePassword);

// wallet
user_router.get("/profile/walletHistory", userController.loadWalletHistory);
user_router.post("/profile/addMoneyToWallet", userController.addMoneyToWallet);
user_router.post("/verifyWalletPayment", userController.verifyWalletPayment);

// Orders
user_router.get("/profile/myOrders", orderController.loadMyOrders);
user_router.get(
  "/viewOrderDetails/:orderId",
  orderController.loadViewOrderDetails
);
user_router.get("/cancelOrder/:orderId", orderController.cancelOrder);
user_router.get(
  "/cancelSinglePrdt/:orderId/:pdtId",
  orderController.cancelSinglePdt
);
user_router.get("/returnOrder/:orderId", orderController.returnOrder);
user_router.get(
  "returnSinglePrdt/:orderId/:pdtId",
  orderController.returnSinglePdt
);
user_router.get("/downloadInvoice/:orderId", orderController.loadInvoice);

// coupon
user_router.post("/applyCoupon", couponController.applyCoupon);
user_router.get("/removeCoupon", couponController.removeCoupon);

module.exports = user_router;
