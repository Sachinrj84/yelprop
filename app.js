const express=require('express');
const Review=require('./models/review');
const session=require('express-session');
const flash=require('connect-flash');
const path=require('path');
const mongoose=require('mongoose');
const ejsMate=require('ejs-mate');
const Joi=require('joi');
const {campgroundSchema,reviewSchema}=require('./schemas.js');
const ExpressError=require('./utils/ExpressError');
const catchAsync=require('./utils/catchAsync');
const methodOverride=require('method-override');
const Campground=require('./models/campGround');
const { nextTick } = require('process');

const exp = require('constants');
const passport=require('passport');
const localStrategy=require('passport-local');
const User=require('./models/user');
const { serializeUser } = require('passport');

const userRoutes=require('./routes/user');
const campgroundRoutes=require('./routes/campground');
const reviewRoutes=require('./routes/review');



mongoose.connect('mongodb://localhost:27017/yelp-camp',{
    useNewUrlParser:true,
    //  useCreateIndex:true,
    useUnifiedTopology:true
    // useFindAndModify:false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app=express();

app.engine('ejs',ejsMate);
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));

const validateCampground= (req,res,next) =>{
    const {error}=campgroundSchema.validate(req.body);
    if(error){
        const msg=error.details.map(el => el.message).join(',');
        throw new ExpressError(msg,400);
    }else{
        next();
    }
}

const validateReview=(req,res,next)=>{
    const {error}=reviewSchema.validate(req.body);
    if(error){
        const msg=error.details.map(el => el.message).join(',');
        throw new ExpressError(msg,400);
    }else{
        next();
    }
};



app.use(express.static(path.join(__dirname,'public')));

const sessionConfig={
    secret:'thisbetterbeaSceret',
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        expires:Date.now()+ 100*60*60*24*7,
        maxAge:100*60*60*24*7
    }
}

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    res.locals.currentUser=req.user;
    res.locals.success=req.flash('success');
    res.locals.error=req.flash('error');
    next();
});

app.get('/fakeUser',async(req,res)=>{
    const user=new User({email:'sachin@gmail.com',username:'sachin'});
    const newUser= await User.register(user,'sachin');
    res.send(newUser);
})

app.use('/',userRoutes);
app.use('/campgrounds',campgroundRoutes);
app.use('/campgrounds/:id/reviews',reviewRoutes);

app.get('/',(req,res)=>{
    res.render('home');
});
app.get('/makeCampground', catchAsync(async(req,res)=>{
    const camp=new Campground({title:'my backyard',price:'$40',description:'cheap camping!'});
    await camp.save();
    res.send(camp);
}));




app.all('*',(req,res,next)=>{
    next(new ExpressError('page not found',404));
})


app.use((err,req,res,next)=>{
    const {statusCode=500}=err;
    if(!err.message) err.message='Something Went Wrong';
    res.status(statusCode).render('error',{err});
})


app.listen(3000,()=>{
    console.log('serving on port');
});