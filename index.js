import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";



const app = express();
const PORT = process.env.PORT || 3000;
const mongoDBCloudURL = 'mongodb+srv://admin-Nour:test1234@cluster0.wig7hnx.mongodb.net/todolistDB';
const monDBLocalURL = 'mongodb://127.0.0.1/todolistDB';


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(mongoDBCloudURL)
  .then(() => console.log('connection done'))
  .catch((err) => console.log('connection error'));


//TodayList Database
const todayItemSchema = new mongoose.Schema({
  name: String
});
const Todayitem = mongoose.model('TodayItem', todayItemSchema);
const defaultItem1 = new Todayitem({
  name: "Welcome to ToDoList-WebApp <3 "
});
const defaultItem2 = new Todayitem({
  name: "Enter + to add a new item"
});
const defaultItem3 = new Todayitem({
  name: "Click on the checkbox to delete the item"
});
const defaultItems = [defaultItem1, defaultItem2, defaultItem3];


//Costom List Schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [todayItemSchema]
});
const List = mongoose.model("List", listSchema);





//today list get request
app.get("/", async (req, res) => {
  let date = new Date().toUTCString().slice(5, 16);
  const todayCollection = await Todayitem.find();
  const renderes = {
    date: date,
    listTitle: "Today",
    list: todayCollection
  }
  if (todayCollection.length === 0) {
    await Todayitem.insertMany(defaultItems);
    res.redirect("/");
  } else {
    res.render("list.ejs", renderes);
  }
});

//Costom List get request
app.get("/:listName", async (req, res) => {
  let date = new Date().toUTCString().slice(5, 16);
  const listName = _.capitalize(req.params.listName);
  const costomList = await List.findOne({ name: listName });

  if (costomList) {
    const renderes = {
      date: date,
      listTitle: costomList.name,
      list: costomList.items
    }
    res.render("list.ejs", renderes);
  } else {
    const list = new List({
      name: listName,
      items: defaultItems
    });
    list.save();
    setTimeout(() => { res.redirect('/' + listName); }, 2000);
  }

});





//add new item post request
app.post("/add", async (req, res) => {
  const item = req.body.newItem;
  const currentListName = req.body.currentList;

  const newItem = new Todayitem({
    name: item
  });

  if (currentListName === "Today") {
    newItem.save();
    res.redirect('/');
  } else {
    const currentList = await List.findOne({ name: currentListName });
    currentList.items.push(newItem);
    currentList.save();
    res.redirect("/" + currentListName);
  }


});





//delete item post request
app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkboxName;
  const currentListName = req.body.listName;
  if (currentListName === "Today") {
    await Todayitem.findByIdAndDelete({ _id: checkedItemId });
    res.redirect('/');
  } else {
    await List.findOneAndUpdate({ name: currentListName }, { $pull: { items: { _id: checkedItemId } } });
    setTimeout(() => { res.redirect('/' + currentListName); }, 2000);
  }

});

//search or create list post request
app.post("/searchOrCreateList", async (req, res) => {
  const searchOrCreateText = _.capitalize(req.body.searchOrCreateText);
  const currentList = await List.findOne({ name: searchOrCreateText });
  if (searchOrCreateText === "Today") {
    res.redirect('/');
  } else if (currentList) {
    res.redirect("/" + searchOrCreateText);
  } else {
    const list = new List({
      name: searchOrCreateText,
      items: defaultItems
    });
    list.save();
    setTimeout(() => { res.redirect('/' + searchOrCreateText); }, 2000);
  }

});



//listen request
app.listen(PORT, () => {
  console.log(`Server listening on port : ${PORT}`);
});