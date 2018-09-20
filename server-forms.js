const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');



const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'mandeep',
    database : 'ecommerce'
  }
});


const app = express();

app.use(bodyParser.json());
app.use(cors());

/* 
Signin --> POST --> success/failure
Register --> POST --> success/failure
Payment --> POST --> success/failure 
*/


app.get('/', (req,res)=>{
	res.json('This application is working')
})


app.post('/signin', (req,res)=>{
	
	const { email, password } = req.body;

	db.select('email', 'hash').from('login')
	.where('email', '=', req.body.email)
	.then(data=>{
		const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
		if(isValid){
			return db.select('*').from('users')
			.where('email', '=', req.body.email)
			.then(user=>{
				res.json(user[0])
			})
			.catch(err=> res.status(400).json('unable to get user'))
		}
		else{
			res.status(400).json('Either the email or the password is incorrect!')
		}
	})
	.catch(err=>res.status(400).json('Either the email or the password is incorrect!'))
	})

app.post('/register', (req,res)=>{
	const { email, password, name } = req.body;
	const hash = bcrypt.hashSync(password);

	db.transaction(trx=>{
	trx.insert({
    	email: email,
    	hash:hash
    })
    .into('login')
    .returning('email')
    .then(loginEmail => {
      return  trx('users')
			.returning('*')
			.insert({
				email: loginEmail[0],
				name:name,
				joined: new Date()
			})
			.then(user=> {res.json(user[0])
				console.log(user)
			})
	    })
  		.then(trx.commit)
  		.catch(trx.rollback)
  	})
  	.catch(err=>res.status(400).json('the user already exist!!!'))
 })




app.post('/payment/:id', (req,res)=>{
	const { id } = req.params;
	const { name, number, expiryDate, securityCode, postalCode } = req.body;

	const hashNumber = bcrypt.hashSync(number);
	const hashSecurityCode = bcrypt.hashSync(securityCode);
	const hashExpiryDate = bcrypt.hashSync(expiryDate);


console.log(name, number, expiryDate)
		
	db.select('email','id').from('login')
	.where('id', '=', id)
	.then(user=>{
		db.select('*').from('payment')
		.where({
			email: user[0].email,
			name:name,
			number:number,
			securitycode:securityCode,
			expirydate:expiryDate,
			postalcode:postalCode
		})
		.then(userData =>{
			if(userData.length){
				res.json('success')
			}
			else{
			 db.transaction(trx=>{
				trx.insert({
				id:user[0].id,
				email:user[0].email,
				name:name,
				number:number,
				securitycode:securityCode,
				expirydate:expiryDate,
				postalcode:postalCode
				})
			.into('payment')
			.returning('*')
			.then(userData =>{
				if(userData.length){
					res.json('success');
				}
			})
			.then(trx.commit)
  			.catch(trx.rollback)
			})
			
			}
		})
		.catch(err=>res.status(400).json('error'))
		})

	})



app.listen(3002);