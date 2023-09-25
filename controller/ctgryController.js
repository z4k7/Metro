const Categories = require("../model/categoryModel");
const Products = require("../model/productModel")
const Offers = require("../model/offerModel")
const Admin = require("../model/adminModel")

const loadCategory = async (req, res,next) => {
  try {
    const adminId = req.session.admin
 const adminData= await Admin.findOne({_id:adminId})
    const category = await Categories.find({}).populate('offer');
    
    const offerData = await Offers.find({ $or: [
      {status : 'Starting Soon'},
      {status : 'Available' }
  ]});
        res.render('category',{category,offerData,adminData});
    
  } catch (error) {
    next(error);
  }
};

const addCategory = async (req, res,next) => {
  try {
    const categoryName = req.body.categoryName.toUpperCase();
    console.log(categoryName);
    if (categoryName) {
      const isExistCategory = await Categories.findOne({ name: categoryName });

      if (isExistCategory) {
        const message = "Category already exists"
        res.redirect('/admin/category?status=success&message='+ encodeURIComponent(message));
        console.log("Category Already Exists");
        
      } else {
        await new Categories({ name: categoryName }).save();
        res.redirect("/admin/category");
      }
    } else {
      console.log("Enter Category Name");
      res.redirect("/admin/category");
    }
  } catch (error) {
    next(error);
  }
};

const editCategory = async (req, res,next) => {
  try {
    const id = req.body.categoryId;
    console.log("id : " + id);
    const newName = req.body.categoryName.toUpperCase();
    // console.log(req);
    // console.log('file '+ req.file);

    console.log(newName);
    const isCategoryExist = await Categories.findOne({ name: newName });
    // console.log('iscategory exist'+isCategoryExist);
    // console.log(req.file.filename);

    if (req.file && req.file.filename) {
      console.log(req.file.filename);
      // const image = req.file.filename
      if(!isCategoryExist || isCategoryExist._id == id){
          // console.log('Category name and image changed');
          // await Categories.findByIdAndUpdate({_id:id},{$set: {name: newName, image:image}})
      }
    } else {
      if (!isCategoryExist) {
        console.log("Category name changed");
        await Categories.findByIdAndUpdate(
          { _id: id },
          { $set: { name: newName } }
        );
      }
    }
    res.redirect("/admin/category");
  } catch (error) {
    next(error);
  }
};

const listCategory = async (req, res, next) => {
  try {
    const id = req.params.id;
    const categoryData = await Categories.findById({ _id: id });

    if (categoryData) {
      if (categoryData.isListed === true) {
        await Categories.findByIdAndUpdate(
          { _id: id },
          { $set: { isListed: false } }
        );
      } else {
        await Categories.findByIdAndUpdate(
          { _id: id },
          { $set: { isListed: true } }
        );
      }
      res.redirect("/admin/category");
    }
  } catch (error) {
    next(error);
  }
};

const applyCategoryOffer = async(req, res, next)=> {
  try {
    
    const { offerId, categoryId, override }= req.body

    //Setting offerId to offer field of category
    await Categories.findByIdAndUpdate(
      {_id:categoryId},
      {
        $set:{
          offer: offerId
        }
      }
    )

    const offerData = await Offers.findById({_id:offerId})
    const products = await Products.find({category: categoryId})
    
    //applying offer to every product in the same category
      for(const pdt of products){
        const actualPrice = pdt.price

        let offerPrice = 0
        if(offerData.status == 'Available'){
          offerPrice = Math.round(actualPrice - ( (actualPrice*offerData.discount)/100 ))
        }

        if(override){
          await Products.updateOne(
            {_id: pdt._id},
            {
              $set:{
                offerPrice,
                offerType: 'Offers',
                offer: offerId,
                offerAppliedBy:'Category'
              }
            }
          )
        }else{
          await Products.updateOne(
            {
              _id: pdt._id,
              offer: { $exists: false}
            },
            {
              $set:{
                offerPrice,
                offerType: 'Offers',
                offer:offerId,
                offerAppliedBy:'Category'
              }
            }
          )
        }
      }
      res.redirect('/admin/category')
  } catch (error) {
   next(error)
  }
}


const removeCategoryOffer = async(req,res,next)=>{
  try {
    const {catId} = req.params

    await Categories.findByIdAndUpdate(
      {_id:catId},
      {
        $unset: {
          offer:''
        }
      }
    )
    //Unsetting every product that matches catId
    await Products.updateMany(
      {
        category: catId,
        offerAppliedBy: 'Category'
      },
      {
        $unset:{
          offer:'',
          offerType: '',
          offerPrice: '',
          offerAppliedBy: ''
        }
      }
    )
    res.redirect('/admin/category')
  } catch (error) {
    next(error)
  }
}


module.exports = {
  loadCategory,
  addCategory,
  editCategory,
  listCategory,
  applyCategoryOffer,
  removeCategoryOffer
};
