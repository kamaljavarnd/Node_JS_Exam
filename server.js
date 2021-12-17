var express = require('express');
var myParser = require("body-parser");
var session = require('express-session');
var mongoose = require('mongoose');
var md5 = require('md5');
const multer = require('multer');


var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads')
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + ".jpg")
    }
})

var upload = multer({ storage: storage })

var app = express();
app.use(express.static('public'));


mongoose.connect('mongodb://localhost:27017/assignment10', { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (!err) { console.log('MongoDB Connection Succeeded.') } else { console.log('Error in DB connection : ' + err) }
});



var userModel = mongoose.model('users', mongoose.Schema({ username: String, password: String, user_role: Number, name: String ,  contact: String, email: String }));
                                                                        
var productModel = mongoose.model('products', mongoose.Schema({ username: String, p_id: String, product_name: String, price: Number, vendor: String, quantity: String, waranty:String }));

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));


app.use(myParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.set('views', './views');


//// index page
app.get('/', function(req, res) {
    console.log('login page accessed');


    if (req.session.user && req.session.pass && req.session.user_role) {
        res.redirect('/home');
    } else {
        res.render('login');
    }
});




app.post('/auth', function(req, res) {
    console.log('auth start', req.body.user);

    var username = req.body.user;
    var password = md5(req.body.pass);
    var r = res;
    if (username && password) {
        userModel.find({ username: username, password: password }, function(err, reposnse) {
            if (err) throw err;
            if (reposnse.length == 1) {
                //// creating session
                req.session.user = reposnse[0].username;
                req.session.pass = reposnse[0].password;
                req.session.user_role = reposnse[0].user_role;
                req.session.name = reposnse[0].name;
                r.redirect('/home');
            } else {
                res.send("<script>alert('Invalid login or password!'); window.location.replace('/')</script>");
            }
        });
    }
});



app.get('/home', function(req, res) {
    console.log('home  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    var name = req.session.name;


    if (!username || !password || !user_role || !name) {
        res.redirect('/');
        res.end();

    }

    if (user_role == 1) {
        productModel.find({ username: username }, function(err, response) {
            if (err) throw err;
            
            
            res.render('product_page', { products: response });

        });
    }


});



app.get('/add-product', function(req, res) {
    console.log('add-product  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    var name = req.session.name;
    if (!username || !password || !user_role || !name) {
        res.redirect('/');
        res.end();

    }
    if (user_role == 1) {
        var p_id2 = 0
        productModel.find({ username: username }, function(err, response) {
            if (err) throw err;
            console.log(response)

            p_id2 = response.length
            p_id2 += 1
            console.log(p_id2)
            
            res.render('add_product', { p_id: p_id2 });
        });
        

    }
});


app.post('/add-product',  upload.none(), function(req, res) {
   console.log('add-product  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    var name = req.session.name;
    
    if (!username || !password || !user_role || !name) {
        res.redirect('/');
        res.end();

    }
     if (user_role == 1) {
        var data = req.body;
        console.log(req)
        
        var newProduct = new productModel({ username: username, p_id: data.p_id, product_name: data.pname, price: data.price, vendor: data.vendor, quantity: data.quantity, waranty: data.waranty });
        newProduct.save(function(err, result) {
            if (err) throw err;
            
            res.send("<script>alert('Product added!'); window.location.replace('/add-product')</script>");
        })
    }
   

   
});






app.get('/remove/:id', function(req, res) {
    console.log('remove  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    var name = req.session.name;
    if (!username || !password || !user_role || !name) {
        res.redirect('/');
        res.end();

    }
    if (user_role == 1) {
        var objID = req.params.id;
        console.log(objID);
        productModel.findById(objID, function(err, response) {
            console.log(response)
            if (response && username == response.username) {
                productModel.findByIdAndRemove(objID, function(err, r1) {
                    if (r1) {
                        res.send("<script>alert('Product removed!'); window.location.replace('/home')</script>");
                    } else {
                        res.send("<script>alert('Cannot remove product!'); window.location.replace('/home')</script>");
                    }
                });


            } else {
                res.send("<script>alert('Cannot remove product!'); window.location.replace('/home')</script>");
            }
        });
    }
});



app.get('/update/:id', function(req, res) {
    console.log('update  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    var name = req.session.name;
    if (!username || !password || !user_role || !name) {
        res.redirect('/');
        res.end();

    }
    if (user_role == 1) {
        var objID = req.params.id;
        console.log(objID);
        productModel.findById(objID, function(err, response) {
            console.log(response._id);
            if (response && username == response.username) {
                
                res.render('product_update', { products: response, id: response._id });
            } else {
                res.send("<script>alert('Cannot edit this product!'); window.location.replace('/home')</script>");
            }
        });
    }
});



app.post('/update_data', upload.none(), function(req, res) {
    console.log('update post  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    var name = req.session.name;
    if (!username || !password || !user_role || !name) {
        res.redirect('/');
        res.end();

    }

    if (user_role == 1) {
        var data = req.body;
            console.log(data)
            productModel.findByIdAndUpdate(data.product_id, { p_id: data.p_id, product_name: data.pname, price: data.price, vendor: data.vendor, quantity: data.quantity, waranty: data.waranty }, function(err, response) {
                res.redirect("/");
            });

        
    }
});



app.get('/add-user', function(req, res) {
    console.log('add-user  page accessed');
    
    res.render('add_user');

    
});


app.post('/add-user', function(req, res) {
    console.log('add-user  page accessed');
    
    
    var data = req.body;
    console.log(req.body)
    user_role = 1;
    var newUser = new userModel({ username: data.user, password: md5(data.pass), user_role: user_role, name: data.name , contact: data.contact, email: data.email  });
    newUser.save(function(err, result) {
        if (err) throw err;
        //res.send("<script>alert('User added!'); window.location.replace('/add-user')</script>");
        res.redirect('/');
        })

    
    
});




app.get('/logout', function(req, res) {
    console.log('logout  page accessed');
    delete req.session.user;
    delete req.session.pass;
    delete req.session.user_role;
    res.redirect('/');

});

app.listen(3000, '127.0.0.1');