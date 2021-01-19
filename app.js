//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const mongoose = require('mongoose');

const app = express();

app.set('view engine', 'ejs');

app.use(
	bodyParser.urlencoded({
		extended : true
	})
);
app.use(express.static('public'));

//mongoose connet string
mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
	useNewUrlParser    : true,
	useUnifiedTopology : true
});

const itemsSchema = {
	name : String
};

const listSchema = {
	name  : String,
	items : [ itemsSchema ]
};

const Item = mongoose.model('Item', itemsSchema);
const List = mongoose.model('List', listSchema);
// const first = new Item({
//   name: "Eat"
// });
// const second = new Item({
//   name: "Drink"
// });
// const third = new Item({
//   name: "Work"
// });

// const defaultItems = [first, second, third];

// Item.insertMany(defaultItems, function(err) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log("Successfully added 3 items");
//   }
// })

//If the list is the default list
app.get('/', function(req, res) {
	Item.find({}, function(err, items) {
		if (err) {
			console.log(err);
		} else {
			res.render('list', {
				listTitle    : 'Today',
				newListItems : items
			});
		}
	});
});

//Add a new item to the list, save it to DB.
app.post('/', function(req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.list;
	const itemToDB = new Item({
		name : itemName
	});
	//If it's the default list, save the item
	if (listName === 'Today') {
		itemToDB.save();
		res.redirect('/');
	} else {
		//If it's a custom list, save the item to the custom's list document
		List.findOne(
			{
				name : listName
			},
			function(err, foundList) {
				foundList.items.push(itemToDB);
				foundList.save();
				res.redirect('/' + listName);
			}
		);
	}
});

//Delete an item from to-do List
app.post('/delete', function(req, res) {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;
	//If the list is the default list, delete the item from the list
	if (listName === 'Today') {
		Item.findOneAndRemove(checkedItemId, function(err) {
			if (err) {
				console.log(err);
			} else {
				console.log('Successfully removed item');
				res.redirect('/');
			}
		});
	} else {
		//If the list is a custom list, delete the item from the custom list
		List.findOneAndUpdate(
			{
				name : listName
			},
			{
				$pull : {
					items : {
						_id : checkedItemId
					}
				}
			},
			function(err, foundList) {
				if (!err) {
					res.redirect('/' + listName);
				}
			}
		);
	}
});

//User creates a new to-do List with custom path
app.get('/:customeListName', function(req, res) {
	if (req.params.customeListName === 'about') {
		res.render('about');
	} else {
		const customeListName = _.capitalize(req.params.customeListName);
		//Find if a list is already existing
		List.findOne(
			{
				name : customeListName
			},
			function(err, foundList) {
				if (!err) {
					if (!foundList) {
						//Create a new list if there is no existing list
						const list = new List({
							name  : customeListName,
							items : []
						});
						list.save();
						res.redirect('/' + customeListName);
					} else {
						//show existing list
						res.render('list', {
							listTitle    : foundList.name,
							newListItems : foundList.items
						});
					}
				}
			}
		);
	}
});

app.get('/about', function(req, res) {
	res.render('about');
});

let port = process.env.PORT;
if (port == null || port == '') {
	port = 3000;
}

app.listen(port, function() {
	console.log('Server has started successfully');
});
