const Products = require("../model/productModel");
const Categories = require("../model/categoryModel");
const Admin = require("../model/adminModel");
const Offers = require("../model/offerModel");
const User = require("../model/userModel");
const Orders = require("../model/orderModel");
const fs = require("fs");
const path = require("path");

const loadProduct = async (req, res, next) => {
  try {
    const adminId = req.session.admin;
    const adminData = await Admin.findOne({ _id: adminId });
    let pageNum = 1;
    if (req.query.pageNum) {
      pageNum = parseInt(req.query.pageNum);
    }

    let limit = 10;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
    }

    const totalProductsCount = await Products.find({}).count();
    let pageCount = Math.ceil(totalProductsCount / limit);

    const searchQuery = req.query.searchQuery || "";
    const pdtsData = await Products.find({
      name: { $regex: "" + searchQuery, $options: "i" },
    })
      .populate("category")
      .populate("offer")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limit)
      .limit(limit);
    const offerData = await Offers.find({
      $or: [{ status: "Starting Soon" }, { status: "Available" }],
    });

    res.render("products", {
      pdtsData,
      offerData,
      pageCount,
      pageNum,
      limit,
      adminData,
    });
  } catch (error) {
    next(error);
  }
};

const loadAddProduct = async (req, res, next) => {
  try {
    const adminId = req.session.admin;
    const adminData = await Admin.findOne({ _id: adminId });
    const pdtsData = await Products.find().populate("category");
    const categories = await Categories.find({ isListed: true });
    res.render("addProducts", { categories, pdtsData, adminData });
  } catch (error) {
    next(error);
  }
};

const addProductDetails = async (req, res, next) => {
  try {
    const {
      brand,
      productName,
      category,
      size,
      quantity,
      price,
      dprice,
      description,
    } = req.body;

    let images = [];
    for (let file of req.files) {
      images.push(file.filename);
    }

    const catData = await Categories.find({ name: category });

    const prodData = await new Products({
      brand,
      name: productName,
      description,
      category: catData[0]._id,
      size,
      price,
      discountPrice: dprice,
      quantity,
      images,
    }).save();

    res.redirect("/admin/products");
  } catch (error) {
    next(error);
  }
};

const loadEditProduct = async (req, res, next) => {
  try {
    const adminId = req.session.admin;
    const adminData = await Admin.findOne({ _id: adminId });
    const _id = req.params.id;

    const pdtData = await Products.findById({ _id }).populate("category");
    const catData = await Categories.find({ isListed: true });

    res.render("editProducts", { pdtData, catData, adminData });
  } catch (error) {
    next(error);
  }
};

const postEditProduct = async (req, res, next) => {
  try {
    const {
      id,
      productName,
      category,
      quantity,
      price,
      size,
      dprice,
      description,
      shortDesc,
    } = req.body;

    const brand = req.body.brand.toUpperCase();

    if (req.files) {
      let newImages = [];

      for (let file of req.files) {
        newImages.push(file.filename);
      }

      await Products.findOneAndUpdate(
        { _id: id },
        { $push: { images: { $each: newImages } } }
      );
    }

    const catData = await Categories.findOne({ name: category });

    await Products.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          brand,
          name: productName,
          category: catData._id,
          size,
          quantity,

          price,
          discountPrice: dprice,
          shortDesc,
          description,
        },
      }
    );
    res.redirect("/admin/products");
  } catch (error) {
    next(error.message);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const prodData = await Products.findById({ _id: id });

    if (prodData.isListed) {
      await Products.findByIdAndUpdate(
        { _id: id },
        { $set: { isListed: false } }
      );
    } else {
      await Products.findByIdAndUpdate(
        { _id: id },
        { $set: { isListed: true } }
      );
    }
    res.redirect("/admin/products");
  } catch (error) {
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const id = req.params.id;
    const imageURL = req.query.imageURL;

    await Products.findOneAndUpdate(
      { _id: id },
      { $pull: { images: imageURL } }
    );

    const imgFolder = path.join(__dirname, "../public/admin/productImages");

    const files = fs.readdirSync(imgFolder);

    for (const file of files) {
      if (file === imageURL) {
        const filePath = path.join(imgFolder, file);
        fs.unlinkSync(filePath);

        break;
      }
    }
    res.redirect(`/admin/editProduct/${id}`);
  } catch (error) {
    next(error);
  }
};

const loadShop = async (req, res, next) => {
  try {
    const isLoggedIn = req.session.userId;

    //taking category to an array for filters
    let categoryToArray = await Categories.aggregate([
      { $project: { _id: 0, name: 1 } },
      { $group: { _id: null, name: { $push: "$name" } } },
    ]);
    categoryToArray = categoryToArray[0].name;

    const page = req.query.page || 1;
    const limit = 9;
    const searchQuery = req.query.searchQuery || "";
    let sort = req.query.sort || { name: 1 };
    let cat = req.query.category || "all";
    let price = req.query.price;

    //category setting up
    let categoryToFront;
    cat === "all"
      ? ((cat = [...categoryToArray]), (categoryToFront = ""))
      : ((cat = cat), (categoryToFront = cat));
    const categoryNeed = await Categories.find(
      { name: { $in: cat } },
      { _id: 1 }
    );
    const categoryStrings = categoryNeed.map((category) =>
      category._id.toString()
    );

    //price setting up
    if (price == 10000) {
      minPrice = 0;
      maxPrice = price;
    } else if (price == 25001) {
      minPrice = price;
      maxPrice = 300000;
    } else if (price == undefined) {
      minPrice = 0;
      maxPrice = 999999;
    } else {
      if (typeof price === "string") {
        minPrice = price - 4999;
        maxPrice = parseInt(price);
      } else {
        maxPrice = Math.max(...price);
        minPrice = Math.min(...price) - 4999;
      }
    }

    price == undefined ? (price = "") : (price = price);

    //sort setting up
    let sortToFront = sort;

    if (sort == 1) {
      sort = { discountPrice: 1 };
    } else if (sort == -1) {
      sort = { discountPrice: -1 };
    }

    const pdtsData = await Products.find({
      // Your query conditions here
      category: categoryStrings,
      discountPrice: { $gt: minPrice, $lt: maxPrice },
      isListed: true,
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { brand: { $regex: searchQuery, $options: "i" } },
      ],
    })
      .populate("offer")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const productsCount = await Products.find({
      category: categoryStrings,
      discountPrice: { $gt: minPrice, $lt: maxPrice },
      isListed: true,
      name: { $regex: "" + searchQuery, $options: "i" },
    }).countDocuments();

    res.render("shop", {
      searchQuery,
      categoryToFront,
      price,
      sortToFront,
      productsCount,
      totalPages: Math.ceil(productsCount / limit),
      limit,
      page,
      categoryToArray,
      isLoggedIn,
      pdtsData,
    });
  } catch (error) {
    next(error);
  }
};

const loadProductOverview = async (req, res, next) => {
  try {
    const id = req.params.id;

    const pdtData = await Products.findById({ _id: id });
    res.render("detail", { isLoggedIn: true, pdtData });
  } catch (error) {
    next(error);
  }
};

const applyProductOffer = async (req, res, next) => {
  try {
    const { offerId, productId } = req.body;

    const product = await Products.findById({ _id: productId });
    const offerData = await Offers.findById({ _id: offerId });
    const actualPrice = product.price;

    let offerPrice = 0;
    if (offerData.status == "Available") {
      offerPrice = Math.round(
        actualPrice - (actualPrice * offerData.discount) / 100
      );
    }

    await Products.findByIdAndUpdate(
      { _id: productId },
      {
        $set: {
          offerPrice,
          offerType: "Offers",
          offer: offerId,
          offerAppliedBy: "Product",
        },
      }
    );

    res.redirect("/admin/products");
  } catch (error) {
    next(error);
  }
};

const removeProductOffer = async (req, res, next) => {
  try {
    const { productId } = req.params;
    await Products.findByIdAndUpdate(
      { _id: productId },
      {
        $unset: {
          offer: "",
          offerType: "",
          offerPrice: "",
          offerAppliedBy: "",
        },
      }
    );

    res.redirect("/admin/products");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadProduct,
  loadAddProduct,
  addProductDetails,
  loadEditProduct,
  postEditProduct,
  deleteProduct,
  deleteImage,
  loadShop,
  loadProductOverview,
  applyProductOffer,
  removeProductOffer,
};
