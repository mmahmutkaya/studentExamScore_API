exports = async function(arg){
  
  // var collectionLessons = context.services.get("mongodb-atlas").db("studentExamScore").collection("lessons");
  // await collectionLessons.deleteMany({})
  
  
  // var collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users");
  // await collectionUsers.deleteMany({ kullaniciMail: { $ne: "mmahmutkaya@gmail.com" } })


  // var collectionBranchs = context.services.get("mongodb-atlas").db("studentExamScore").collection("branchs");
  // await collectionBranchs.deleteMany({})


  // await collection.updateMany({ },{$set:{year:"2022-2023"}})
  
  
  var collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users");
  
  try {
    
     collectionUsers.updateOne( 
       
       {
         kullaniciMail: "admin@admin.com"
       },
       
       {
         $set: {
           
             sifre:"555555",
             name: "Admin A.Dündar", 
             isAdmin: true, 
             uyelikOnay: true, 
             mailTeyit: true,
         }
       }
       
    );
    
  } catch (e) {
     console.log(e);
  }
    
  
  
  
  /*
    Accessing application's values:
    var x = context.values.get("value_name");

    Accessing a mongodb service:
    var collection = context.services.get("mongodb-atlas").db("dbname").collection("coll_name");
    collection.findOne({ owner_id: context.user.id }).then((doc) => {
      // do something with doc
    });

    To call other named functions:
    var result = context.functions.execute("function_name", arg1, arg2);

    Try running in the console below.
  */
  
  // return {arg: arg};
  
};