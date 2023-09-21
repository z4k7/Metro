const Addresses= require('../model/addressModel')
const Users = require('../model/userModel')
const { logoutUser } = require('./userController')

const loadAddAddress = async(req,res,next)=>{
    try {
        const returnPage = req.query.returnPage
        console.log('returnPage:' +returnPage);
        res.render('addAddress', {isLoggedIn:true, returnPage})
    } catch (error) {
    next(error)        
    }
}

const postAddAddress = async(req,res,next)=>{
    try {
        const userId = req.session.userId
        const  {name, email, mobile, town, state, country, zip, address}= req.body
        const returnPage = req.params.returnPage

        const newAddress = {userName:name, email, mobile, town, state, country, zip, address}

        const isUserHasAddress = await Addresses.findOne({userId:userId})

        if(isUserHasAddress){
            await Addresses.updateOne({userId:userId},
                {
                    $addToSet:{
                        addresses: newAddress
                    }
                }
                )
                console.log('Address added to database');

                switch(returnPage){
                    case 'profile':
                        res.redirect('/profile')
                        break;
                        case 'checkout':
                            res.redirect('/shoppingCart/proceedToCheckout')
                            break;
                }
        }else{
            await new Addresses({
                userId,
                addresses : [newAddress]
            }).save()

            console.log('Address Saved on Database');

            switch(returnPage){
                case 'profile':
                    res.redirect('/profile')
                    break;
                    case 'checkout':
                        res.redirect('/shoppingCart/proceedToCheckout')
                        break;
            }
        }
    } catch (error) {
        next(error) ;
    }
}

const loadEditAddress = async(req,res,next)=>{
    try {

        console.log("edit address called");
        const addressId = req.params.id;
        console.log("session", req.session)
        const userId = req.session.userId;
        console.log("userid", userId)

        const addressData = await Addresses.findOne({userId, 'addresses._id':addressId})
        const address = addressData.addresses.find(obj => obj._id.toString()===addressId)

        res.render('editAddress',{address, isLoggedIn:true,userId})
    } catch (error) {
        next(error) ;
    }
}

const postEditAddress = async(req,res,next)=>{
    try {
        const addressId = req.params.id;
        const userId = req.session.userId
        const {name, email, mobile, town, state, country, zip, address} = req.body

        await Addresses.updateOne(
            {userId,'addresses._id':addressId},
            {
                $set:{
                    'addresses.$.userName': name,
                    'addresses.$.email': email,
                    'addresses.$.mobile': mobile,
                    'addresses.$.town': town,
                    'addresses.$.state': state,
                    'addresses.$.country': country,
                    'addresses.$.zip': zip,
                    'addresses.$.address': address
                }
            }
        )
        console.log('Address Edited');
        res.redirect('/profile')
    } catch (error) {
        next(error) ;
    }
}

const deleteAddress = async(req,res,next)=>{
    try {
        const addressId = req.params.id;
        const userId = req.session.userId;

        console.log('loaded delete address')

        await Addresses.updateOne(
            {userId, 'addresses._id': addressId},
            {
                $pull:{
                    addresses: {_id: addressId}
                }
            }
        )
        console.log('address deleted');
        res.redirect('/profile')
    } catch (error) {
        next(error) ;
    }
}

module.exports = {
    loadAddAddress,
    postAddAddress,
    loadEditAddress,
    postEditAddress,
    deleteAddress
}