const express = require("express");
const admin_route = express();
// const adminAuth = require("../middleware/adminAuth");

const upload = require("../config/multer");

const adminController = require("../controller/adminController");
const ctgryController = require("../controller/ctgryController");
const pdtController = require("../controller/productController");
const orderController = require("../controller/orderController")
const couponController = require("../controller/couponController")
const offerController = require("../controller/offerController")
 
const { isAdminLoggedIn, isAdminLoggedOut } = require('../middleware/adminAuth')


admin_route.set("views", "./views/admin");

// Load Dashboard
// admin_route.use('/',auth.isAdminLoggedIn)




// admin login
admin_route.get("/login",isAdminLoggedOut, adminController.loadAdminLogin);
admin_route.post("/login",isAdminLoggedOut, adminController.verifyLogin);

// Admin logout
admin_route.get("/logout", adminController.adminLogout);


admin_route.use('/',isAdminLoggedIn)

admin_route.get("/index", adminController.getDashboard);

admin_route.get("/users", adminController.userTab);
// Block / Unblock start
admin_route.get("/users/status/:id", adminController.postUserStatus);

// Category Route

admin_route.get("/category", ctgryController.loadCategory);
admin_route.post("/category", ctgryController.addCategory);
admin_route.post("/category/edit",upload.single("image"),ctgryController.editCategory);
admin_route.get("/category/list/:id", ctgryController.listCategory);

// Product Route
admin_route.get("/products", pdtController.loadProduct);
admin_route.get('/addProduct',pdtController.loadAddProduct)
admin_route.post('/addProduct',upload.array('image',3),pdtController.addProductDetails)
admin_route.get('/editProduct/:id',pdtController.loadEditProduct)
admin_route.post('/editProduct/',upload.array('image',3),pdtController.postEditProduct)
admin_route.get('/deleteProduct/:id',pdtController.deleteProduct)

admin_route.get('/imageDelete/:id',pdtController.deleteImage)

// Order Route

admin_route.get('/ordersList',orderController.loadOrdersList)
admin_route.post('/changeOrderStatus',orderController.changeOrderStatus)
admin_route.get('/cancelOrder/:orderId',orderController.cancelOrder)
admin_route.get('/approveReturn/:orderId',orderController.approveReturn)

// Coupon Route
admin_route.get('/coupons',couponController.loadCoupons)
admin_route.get('/coupons/addCoupon',couponController.loadAddCoupon)
admin_route.post('/coupons/addCoupon',couponController.postAddCoupon)
admin_route.get('/coupons/editCoupon/:couponId',couponController.loadEditCoupon)
admin_route.post('/coupons/editCoupon/:couponId',couponController.postEditCoupon)
admin_route.get('/coupons/cancelCoupon/:couponId',couponController.cancelCoupon)


// Offer Route
admin_route.get('/offers',offerController.loadOffer)
admin_route.get('/offers/addOffer', offerController.loadAddOffer)
admin_route.get('/offers/editOffer/:offerId',offerController.loadEditOffer)
admin_route.post('/offers/addOffer', offerController.postAddOffer)
admin_route.post('/offers/editOffer/:offerId',offerController.postEditOffer)
admin_route.get('/offers/cancelOffer/:offerId', offerController.cancelOffer)

//categoryOffer route
admin_route.post('/applyOfferToCategory',ctgryController.applyCategoryOffer)
admin_route.post('/removeCategoryOffer/:catId',ctgryController.removeCategoryOffer)

//productOffer Route
admin_route.post('/applyOfferToProduct',pdtController.applyProductOffer)
admin_route.post('/removeProductOffer/:productId',pdtController.removeProductOffer)

module.exports = admin_route;
