const User = require("../model/userModel");
const Products = require("../model/productModel");
const Addresses = require("../model/addressModel");
const Admin = require("../model/adminModel")
const Orders = require("../model/orderModel");
const Coupons = require("../model/couponModel");
require("dotenv").config();
const Razorpay = require("razorpay");
const {updateWallet} = require('../helpers/helpersFunctions')


var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

const loadCheckout = async (req, res,next) => {
  try {
    const userId = req.session.userId;

    const userAddress = await Addresses.findOne({ userId: userId });
    const userData = await User.findById({ _id: userId }).populate("cart.productId");
    const cart = userData.cart;

    if (!cart) {
      return redirect("/shoppingCart");
    }

    const walletBalance = userData.wallet;

    const coupons = await Coupons.find({ isCancelled: false });
    

    res.render("checkout", {
      isLoggedIn: true,
      page: "Checkout",
      userAddress,
      cart,
      coupons,
      walletBalance,
      userId,
    });
  } catch (error) {
    next(error);
  }
};

const placeOrder = async(req, res, next) => {
  try {

      //getting details needed
      const addressId = req.body.address
      const paymentMethod = req.body.payment
      const isWalletSelected = req.body.walletCheckBox
      const userId = req.session.userId

      //getting selected address
      const userAddress = await Addresses.findOne({userId})
      const address = userAddress.addresses.find(obj => obj._id.toString() === addressId)
      req.session.deliveryAddress = address;

      //getting cart items
      const userData = await User.findById({_id:userId}).populate('cart.productId')
      const cart = userData.cart
      const walletAmount = req.session.walletAmount = parseInt(userData.wallet)
      console.log(walletAmount);
      req.session.cart = cart;

      let products = []
      // console.log(cart)

      cart.forEach((pdt) => {
          let discountPrice;
          let totalDiscount;
          if(pdt.productId.offerPrice){
              discountPrice =  pdt.productId.offerPrice
              totalDiscount = discountPrice*pdt.quantity
          }else{
              discountPrice = pdt.discountPrice,
              totalDiscount = (pdt.productPrice-pdt.discountPrice)*pdt.quantity
              // console.log(pdt.productPrice,"herere");
          }
          const product = {
              productId: pdt.productId._id,
              productName: pdt.productId.name,
              productPrice: pdt.productId.price,
              discountPrice,
              quantity: pdt.quantity,
              totalPrice: pdt.quantity*pdt.productId.price,
              totalDiscount,
              status: 'Order Confirmed'
          }

          // console.log(product,"123");
          products.push(product)
      })

      req.session.products = products;

      let totalPrice = 0;
      if(cart.length){

          //Finding total price
          for(let i=0; i<products.length; i++){
              totalPrice += (products[i].totalPrice - products[i].totalDiscount)
          }
          
          let couponCode = '';
          let couponDiscount = 0;
          let couponDiscountType;
          if(req.session.coupon){

              const coupon = req.session.coupon
              couponCode = coupon.code
              couponDiscount = coupon.discountAmount

              if(coupon.discountType === 'Percentage'){

                  couponDiscountType = 'Percentage';
                  const reducePrice =  totalPrice * (couponDiscount / 100)

                  if(reducePrice >= coupon.maxDiscountAmount){
                      totalPrice -= coupon.maxDiscountAmount
                  }else{
                      totalPrice -= reducePrice
                  }

              }else{
                  couponDiscountType = 'Fixed Amount';
                  totalPrice = totalPrice - couponDiscount
              }
              
          }

          req.session.isWalletSelected = isWalletSelected;
          req.session.totalPrice = totalPrice;

          // console.log("totalPrice:",totalPrice);
          
          if(paymentMethod === 'COD'){
              console.log('Payment method is COD');

              await new Orders({
                  userId, 
                  deliveryAddress: address,
                  totalPrice,
                  products, 
                  paymentMethod,
                  status: 'Order Confirmed',
                  couponCode,
                  date: new Date(),
                  couponDiscount,
                  couponDiscountType
              }).save()
  
              //Reducing quantity/stock of purchased products from Products Collection
              for (const { productId, quantity } of cart) {
                  await Products.updateOne(
                      { _id: productId._id },
                      { $inc: { quantity: -quantity } }
                  );
              }

              //Adding user to usedUsers list in Coupons collection
              if(req.session.coupon != null){
                  await Coupons.findByIdAndUpdate(
                      {_id:req.session.coupon._id},
                      {
                          $push:{
                              usedUsers: userId
                          }
                      }
                  )
              }
  
              //Deleting Cart from user collection
              await User.findByIdAndUpdate(
                  {_id:userId},
                  {
                      $set:{
                          cart: []
                      }
                  }
              );
  
              req.session.cartCount = 0;
              res.json({status : 'COD'})

          }else if(paymentMethod === 'Razorpay'){
              console.log('Payment method razorpay');

              if(isWalletSelected){
                  totalPrice = totalPrice - walletAmount
              }

              var options = {
                  amount: totalPrice*100,
                  currency:'INR',
                  receipt: "hello"
              }
              // console.log(options,"132123")


              instance.orders.create(options, (err, order) => {
                  if(err){
                      console.log(err);
                  }else{
                      res.json({ status: 'Razorpay', order:order })
                  }

              })
              // console.log('instance created :>');
          }else if(paymentMethod == 'Wallet'){

              await new Orders({
                  userId, 
                  deliveryAddress: address,
                  totalPrice,
                  products, 
                  paymentMethod,
                  status: 'Order Confirmed',
                   date: new Date(),
                  couponCode,
                  couponDiscount,
                  couponDiscountType
              }).save()
  
              //Reducing quantity/stock of purchased products from Products Collection
              for (const { productId, quantity } of cart) {
                  await Products.updateOne(
                      { _id: productId._id },
                      { $inc: { quantity: -quantity } }
                  );
              }
  
              //Deleting Cart from user collection
              await User.findByIdAndUpdate(
                  {_id:userId},
                  {
                      $set:{
                          cart: []
                      }
                  }
              );

              //Adding user to usedUsers list in Coupons collection
              if(req.session.coupon != null){
                  await Coupons.findByIdAndUpdate(
                      {_id:req.session.coupon._id},
                      {
                          $push:{
                              usedUsers: userId
                          }
                      }
                  )
              }
  
              req.session.cartCount = 0;

              const walletHistory = {
                  date: new Date(),
                  amount: -totalPrice,
                  message: 'Product Purchase'
              }

              // Decrementing wallet amount
              await User.findByIdAndUpdate(
                  { _id: userId },
                  {
                      $inc: {
                          wallet: -totalPrice
                      },
                      $push:{
                          walletHistory
                      }
                  }
              );

              res.json({status : 'Wallet'})
          }


      }else{
          console.log('Cart is empty');
          res.redirect('/shop')
      }


  } catch (error) {
      next(error);
  }
}

const verifyPayment = async (req, res,next) => {
  try {
    const userId = req.session.userId;
    const details = req.body;
    console.log(details.response.razorpay_signature);
    const keys = Object.keys(details)
    console.log(keys);
    console.log('in verify payment');

    const crypto = require("crypto");
    let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);

    hmac.update(
      details.response.razorpay_order_id +
        "|" +
              details.response.razorpay_payment_id

    );
    hmac = hmac.digest("hex");
    // console.log(hmac);
    // console.log(typeof hmac);
    // console.log(typeof details.response.razorpay_signature);
    if (hmac === details.response.razorpay_signature) {
      let totalPrice = req.session.totalPrice;
      let couponCode = "";
      let couponDiscount = 0;

      if (req.session.coupon) {
        couponCode = req.session.coupon.code;
        couponDiscount = req.session.coupon.discount;
        totalPrice = totalPrice - totalPrice * (couponDiscount / 100);
      }

      
      await new Orders({
        userId,
        deliveryAddress: req.session.deliveryAddress,
        totalPrice,
        products: req.session.products,
        paymentMethod: "Razorpay",
        status: "Order Confirmed",
        date: new Date(),
        couponCode,
        couponDiscount,
      }).save();


      if(req.session.isWalletSelected){
        const userData = await User.findById({ _id: userId });
        userData.walletHistory.push(
            {
                date: new Date(),
                amount: userData.wallet,
                message: 'Product Purchase'
            }
        )

        userData.wallet = 0;
        await userData.save()
    }

      //Reducing quantity/stock of purchased products from Products Collection
      const cart = req.session.cart;
      for (const { productId, quantity } of cart) {
        await Products.updateOne(
          { _id: productId._id },
          { $inc: { quantity: -quantity } }
        );
      }

      //Deleting Cart from user collection
      await User.findByIdAndUpdate(
        { _id: userId },
        {
          $set: {
            cart: [],
          },
        }
      );

      req.session.cartCount = 0;

      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    next(error);
  }
};

const loadMyOrders = async (req, res,next) => {
  try {
    console.log("Loaded my orders");
    const userId = req.session.userId;
    const orderData = await Orders.find({ userId })
      .populate("products.productId")
      .sort({ date: -1 });
    // console.log(orderData);
    // if(orderData){
    //     const product = orderData[0].products
    // }
    // console.log('Products of first order : \n\n\n'+product);
    res.render("myOrders", {
      isLoggedIn: true,
      page: "My Orders",
      parentPage: "Profile",
      orderData,
    });
  } catch (error) {
    next(error);
  }
};

const loadViewOrderDetails = async (req, res,next) => {
  try {
    console.log("loaded view order details page");
    const orderId = req.params.orderId;
    const userId = req.session.userId;

    const orderData = await Orders.findById({ _id: orderId }).populate(
      "products.productId"
    );
    // console.log(orderData);

    let status;
    switch (orderData.status) {
      case "Order Confirmed":
        status = 1;
        break;
      case "Shipped":
        status = 2;
        break;
      case "Out For Delivery":
        status = 3;
        break;
      case "Delivered":
        status = 4;
        break;
      case "Cancelled":
        status = 5;
        break;
      case "Cancelled By Admin":
        status = 6;
        break;
      case "Pending Return Approval":
        status = 7;
        break;
      case "Returned":
        status = 8;
        break;
    }

    res.render("orderDetails", {
      isLoggedIn: true,
      page: "Order Details",
      parentPage: "My Orders",
      orderData,
      status,
    });
  } catch (error) {
    next(error);
  }
};

const loadOrderSuccess = async (req, res,next) => {
  try {
    const result = req.query.result;
    console.log("loaded Order Success");
    const isLoggedIn = Boolean(req.session.userId);

    res.render("orderSuccess", { isLoggedIn, result });
  } catch (error) {
    next(error);
  }
};



const loadOrdersList = async (req, res,next) => {
  try {
    const adminId = req.session.admin
 const adminData= await Admin.findOne({_id:adminId})
    let pageNum = 1;
        if(req.query.pageNum){
            pageNum = parseInt(req.query.pageNum) 
        }

        let limit = 10;
        if(req.query.limit){
            limit = parseInt(req.query.limit);
        }

        const totalOrderCount = await Orders.find({}).count()
        let pageCount = Math.ceil( totalOrderCount / limit)

        console.log(Orders);
    const searchQuery=req.query.searchQuery || ''

    const ordersData = await Orders.find({'deliveryAddress.userName':{$regex:''+ searchQuery,$options:'i'}}).populate("userId").populate("products.productId").sort({ createdAt: -1 }).skip( (pageNum - 1)*limit ).limit(limit);
       
    // const userData = await Orders.findOne({}).populate("userId")
  //  console.log(userData);

    res.render("ordersList", { ordersData, page: "Orders List",pageCount, pageNum, limit,adminData });
  } catch (error) {
    next(error);
  }
};

// admin side

const changeOrderStatus = async(req,res, next) => {
  try {
      // console.log('loaded change order status');
      const orderId = req.body.orderId
      const status = req.body.status
      const orderData = await Orders.findById({_id: orderId})
      // console.log(status);
      for (const pdt of orderData.products){

          if(pdt.status !== 'Delivered' && 
              pdt.status !== 'Pending Return Approval' &&
              pdt.status !== 'Cancelled' && 
              pdt.status !== 'Cancelled By Admin' && 
              pdt.status !== 'Returned'
          ){
              pdt.status = status
          }

      };
      console.log('orderData saving');
      await orderData.save();
      await updateOrderStatus(orderId, next);

      res.redirect('/admin/ordersList')

  } catch (error) {
      next(error);
  }
}

// user side and admin side
const updateOrderStatus = async function (orderId, next) {
  try {

          let statusCounts = []
          const orderData = await Orders.findById({ _id: orderId })
          orderData.products.forEach((pdt) => {
              let eachStatusCount = {
                  status: pdt.status,
                  count: 1,
              };
          
              let existingStatusIndex = statusCounts.findIndex(
                  (item) => item.status === pdt.status
              );
          
              if (existingStatusIndex !== -1) {
                  // Increment the count of an existing status
                  statusCounts[existingStatusIndex].count += 1;
              } else {
                  statusCounts.push(eachStatusCount);
              }
          });

          if(statusCounts.length === 1){
              orderData.status = statusCounts[0].status
              await orderData.save()
              return
          }

          let isOrderConfirmedExists = false;
          let isShippedExists = false;
          let isOutForDeliveryExists = false;
          let isDeliveredExists = false;
          let cancelledByUserCount; 
          let cancelledByAdminCount;
          let returnApprovalCount;
          let returnedCount;
          statusCounts.forEach((item) => {

              if(item.status === 'Order Confimed'){
                  isOrderConfirmedExists = true
              }

              if(item.status === 'Shipped'){
                  isShippedExists = true
              }

              if(item.status === 'Out For Delivery'){
                  isOutForDeliveryExists = true
              }

              if(item.status === 'Delivered'){
                  isDeliveredExists = true
              }

              if(item.status === 'Cancelled'){
                  cancelledByUserCount = item.count
              }

              if(item.status === 'Cancelled By Admin'){
                  cancelledByAdminCount = item.count
              }

              if(item.status === 'Pending Return Approval'){
                  returnApprovalCount = item.count
              }

              if(item.status === 'Returned'){
                  returnedCount = item.count
              }
              
          });


          if(isOrderConfirmedExists){
              orderData.status = 'Order Confirmed'
              await orderData.save()
              return
          }
          
          if(isShippedExists){
              orderData.status = 'Shipped'
              await orderData.save()
              return
          }
  
          if(isOutForDeliveryExists){
              orderData.status = 'Out For Delivery'
              await orderData.save()
              return
          }
  
  
          if(isDeliveredExists){
              orderData.status = 'Delivered'
              await orderData.save()
              return
          }

          let cancelledCount = 0;
          if(cancelledByUserCount){
              cancelledCount += cancelledByUserCount
          }
          if(cancelledByAdminCount){
              cancelledCount += cancelledByAdminCount
          }

          if(cancelledByUserCount === orderData.products.length || cancelledCount === orderData.products.length){
              orderData.status = 'Cancelled'
              await orderData.save()
              return;
          }
          
          if(cancelledByAdminCount === orderData.products.length){
              orderData.status = 'Cancelled By Admin'
              await orderData.save()
              return;
          }

          if( cancelledCount + returnApprovalCount + returnedCount === orderData.products.length){
              orderData.status = 'Pending Return Approval'
              await orderData.save()
              return;
          }
  
          if( cancelledCount + returnedCount === orderData.products.length){
              orderData.status = 'Returned'
              await orderData.save()
              return;
          }

  } catch (error) {
      next(error)
  }
}



const cancelOrder = async(req,res, next) => {
  try {
      const orderId = req.params.orderId
      const cancelledBy = req.query.cancelledBy
      const orderData = await Orders.findById({_id:orderId})
      const userId = orderData.userId


      // console.log(cancelledBy);
      let refundAmount = 0;
      if(cancelledBy == 'user'){

          for (const pdt of orderData.products){

              if(pdt.status !== 'Delivered' && 
                  pdt.status !== 'Pending Return Approval' &&
                  pdt.status !== 'Cancelled' && 
                  pdt.status !== 'Cancelled By Admin' && 
                  pdt.status !== 'Returned'
              ){
                  pdt.status = 'Cancelled'
                  refundAmount = refundAmount + (pdt.totalPrice - pdt.totalDiscount)

                  //Incrementing Product Stock
                  await Products.findByIdAndUpdate(
                      {_id: pdt.productId},
                      {
                          $inc:{
                              quantity: pdt.quantity
                          }
                      }
                  );

                  console.log('pdt.status set to Cancelled');
              }

          };

          await orderData.save();
          await updateOrderStatus(orderId, next);


      }else if(cancelledBy == 'admin'){

          for (const pdt of orderData.products){

              if(pdt.status !== 'Delivered' && 
                  pdt.status !== 'Pending Return Approval' &&
                  pdt.status !== 'Cancelled' && 
                  pdt.status !== 'Cancelled By Admin' && 
                  pdt.status !== 'Returned'
              ){
                  pdt.status = 'Cancelled By Admin'
                  refundAmount = refundAmount + (pdt.totalPrice - pdt.totalDiscount)

                  //Incrementing Product Stock
                  await Products.findByIdAndUpdate(
                      {_id: pdt.productId},
                      {
                          $inc:{
                              quantity: pdt.quantity
                          }
                      }
                  );

              }

          };

      }

      await orderData.save();
      await updateOrderStatus(orderId, next);

      //Updating wallet if order not COD
      if(orderData.paymentMethod !== 'COD'){
          await updateWallet(userId, refundAmount, 'Refund of Order Cancellation' )
      }

      if(cancelledBy == 'user'){
          res.redirect(`/viewOrderDetails/${orderId}`)
      }else if(cancelledBy == 'admin'){
          res.redirect('/admin/ordersList')
      }

  } catch (error) {
              next(error);
  }
}

const cancelSinglePdt = async(req, res, next) => {
  try {
      const { orderId, pdtId } = req.params
      const { cancelledBy } = req.query
      const orderData = await Orders.findById({_id: orderId})
      const userId = orderData.userId
      
      let refundAmount;
      for( const pdt of orderData.products){

          if(pdt._id == pdtId){

              if(cancelledBy == 'admin'){
                  pdt.status = 'Cancelled By Admin'
              }else if(cancelledBy == 'user'){
                  pdt.status = 'Cancelled'
              }
              
              refundAmount = pdt.totalPrice - pdt.totalDiscount;

              //Incrementing Product Stock
              await Products.findByIdAndUpdate(
                  {_id: pdt.productId},
                  {
                      $inc:{
                          quantity: pdt.quantity
                      }
                  }
              );

              break;
          }
      }

      await orderData.save()
      await updateOrderStatus(orderId, next);
      await updateWallet(userId, refundAmount, 'Refund of Order Cancellation')

      if(cancelledBy == 'admin'){
          res.redirect(`/admin/ordersList`)
      }else if(cancelledBy == 'user'){
          res.redirect(`/viewOrderDetails/${orderId}`)

      }

  } catch (error) {
      next(error)
  }
}




const returnOrder = async(req, res, next) => {
  try {

      const orderId = req.params.orderId
      const orderData = await Orders.findById({ _id: orderId })

      for (const pdt of orderData.products){

          if(pdt.status === 'Delivered' ){
              pdt.status = 'Pending Return Approval'
          }
      };

      await orderData.save()
      await updateOrderStatus(orderId, next);

      
      res.redirect(`/viewOrderDetails/${orderId}`)
      
  } catch (error) {
              next(error);
  }
}

const returnSinglePdt = async(req, res, next) => {
  try {
      const { orderId, pdtId } = req.params
      const orderData = await Orders.findById({_id: orderId})
      
      for( const pdt of orderData.products){
          if(pdt._id == pdtId){
              pdt.status = 'Pending Return Approval'
              break;
          }
      }

      await orderData.save()
      await updateOrderStatus(orderId, next);

      res.redirect(`/viewOrderDetails/${orderId}`)

  } catch (error) {
      next(error)
  }
}




const approveReturn = async(req,res,next) => {
  try {
      const orderId = req.params.orderId;

      const orderData = await Orders.findById({ _id: orderId })

      let refundAmount = 0;
      for (const pdt of orderData.products){

          if(pdt.status === 'Pending Return Approval' ){
              pdt.status = 'Returned'

              refundAmount = refundAmount + (pdt.totalPrice - pdt.totalDiscount)

              //Incrementing Product Stock
              await Products.findByIdAndUpdate(
                  {_id: pdt.productId},
                  {
                      $inc:{
                          quantity: pdt.quantity
                      }
                  }
              );

          }
      };

      await orderData.save()
      await updateOrderStatus(orderId, next);


      const userId = orderData.userId;

      //Adding amount into users wallet
      await updateWallet(userId, refundAmount, 'Refund of Returned Order')

      res.redirect('/admin/ordersList')
  } catch (error) {
      next(error)
  }
}


const approveReturnForSinglePdt = async(req, res, next) => {
  try {
      const { orderId, pdtId } = req.params
      const orderData = await Orders.findById({_id: orderId})
      const userId = orderData.userId;

      let refundAmount;
      for( const pdt of orderData.products){
          if(pdt._id == pdtId){

              pdt.status = 'Returned'

              refundAmount = pdt.totalPrice - pdt.totalDiscount;

              //Incrementing Product Stock
              await Products.findByIdAndUpdate(
                  {_id: pdt.productId},
                  {
                      $inc:{
                          quantity: pdt.quantity
                      }
                  }
              );

              break;
          }
      }

      await orderData.save()
      await updateOrderStatus(orderId, next);
      await updateWallet(userId, refundAmount, 'Refund of Retrned Product')


      res.redirect(`/admin/ordersList`)

  } catch (error) {
      next(error)
  }
}


const loadInvoice = async(req,res, next) => {
  try {
      const { orderId } = req.params
      const isLoggedIn = Boolean(req.session.userId)
      const order = await Orders.findById({_id: orderId})
      var discount;
      console.log('order:',order);
      if(order.couponCode){
          // discount = Math.floor(order.totalPrice/( 1- (order.couponDiscount/100)))
          discount= order.couponDiscount
      }

      res.render('invoice',{order, isLoggedIn, page:'Invoice', discount})
  } catch (error) {
      next(error)
  }
}


module.exports = {
  loadCheckout,
  placeOrder,
  loadOrderSuccess,
  loadMyOrders,
  loadViewOrderDetails,
  loadOrdersList,
  changeOrderStatus,
  cancelOrder,
  verifyPayment,
  returnOrder,
  approveReturn,
  cancelSinglePdt,
  returnSinglePdt,
  approveReturnForSinglePdt,
  loadInvoice,
};
