const express=require('express');
const router=express.Router();
const {campgroundSchema}=require('../schemas.js');
const catchAsync=require('../utils/catchAsync');
const methodOverride=require('method-override');
const Campground=require('../models/campGround');
const ExpressError=require('../utils/ExpressError');
const {isLoggedIn}=require('../middleware')

const validateCampground= (req,res,next) =>{
    const {error}=campgroundSchema.validate(req.body);
    if(error){
        const msg=error.details.map(el => el.message).join(',');
        throw new ExpressError(msg,400);
    }else{
        next();
    }
}

router.get('/', catchAsync(async(req,res)=>{
    const campgrounds=await Campground.find({});
    res.render('campgrounds/index',{campgrounds})

}));
router.get('/new',isLoggedIn,(req,res)=>{
    res.render('campgrounds/new',);
});
router.post('/',isLoggedIn,validateCampground, catchAsync(async(req,res,next)=>{
   
    const campground=new Campground(req.body.campground);
    campground.author=req.user._id;
    await campground.save();
    req.flash('success','Sucessfully created a campground');
    res.redirect(`/campgrounds/${campground.id}`);
   
}));
router.get('/:id',catchAsync(async(req,res)=>{
   
    const campground=await Campground.findById(req.params.id).populate('reviews').populate('author');
    //console.log(campground);
    if(!campground){
        req.flash('error','Cannot find that campground');
        res.redirect('/campgrounds');
    }
    res.render('campgrounds/show',{campground})
    
}));
router.get('/:id/edit',isLoggedIn,catchAsync(async(req,res)=>{
    const {id}=req.params;
    const campground=await Campground.findById(id);
    if(!campground){
        req.flash('error','Cannot find that campground');
        res.redirect('/campgrounds');
    }
    if(!campground.author.equals(req.user._id)){
        req.flash('error','You do not have access to it');
        return res.redirect(`/campgrounds/${id}`);
    }
    res.render('campgrounds/edit',{campground})
}));
router.put('/:id',isLoggedIn,catchAsync(async(req,res)=>{
    const {id}=req.params;
    const campground=await Campground.findById(id);
    if(!campground.author.equals(req.user._id)){
        req.flash('error','You do not have access to it');
        return res.redirect(`/campgrounds/${id}`);
    }
    const camp=await Campground.findByIdAndUpdate(id,{...req.body.campground});
    req.flash('success','Successfully updated campground!!!')
    res.redirect(`/campgrounds/${campground.id}`);
}));
router.delete('/:id',isLoggedIn,catchAsync(async(req,res)=>{
    const { id}=req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success','Successfully deleted campground!!!')
    res.redirect('/campgrounds');
}));



module.exports=router;