exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let year;

  
  const collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users")
  const userArray = await collectionUsers.find({}).toArray()
  const ogretmenler = await userArray.filter(x=>x.isOgretmen == true)
  
  const collectionLessons = context.services.get("mongodb-atlas").db("studentExamScore").collection("lessons")
  const lessonArray = await collectionLessons.find({}).toArray()
  
  const collectionBranchs = context.services.get("mongodb-atlas").db("studentExamScore").collection("branchs")
  const branchArray = await collectionBranchs.find({}).toArray()
  
  
  // MONGO-1 - Gelen Sorgu
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // noteGet // MONGO-1",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // noteGet // MONGO-1",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"Gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // noteGet // MONGO-1",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    // hataText = "\"gelen istekte \"ders no\" bulunamadı\""
    // if(!objHeader.hasOwnProperty('Dersno')) return ({hata:true,hataYeri:"FONK // noteGet // MONGO-1",hataMesaj:"Program yöneticisi ile iletişime geçmeniz gerekmektedir, (" + hataText +")"})
    // dersNo = objHeader["Dersno"][0];
    // ///
    // isLessonExist = await collectionLessons.findOne({dersNo})
    // hataText = "\"gelen istekteki \"ders\" sistemde bulunamadı\""
    // if(!isLessonExist) return ({hata:true,hataYeri:"FONK // noteGet // MONGO-1",hataMesaj:"Program yöneticisi ile iletişime geçmeniz gerekmektedir, (" + hataText +")"})
    

    hataText = "\"gelen istekte \"sene\" bilgisi bulunamadı\""
    if(!objHeader.hasOwnProperty('Year')) return ({hata:true,hataYeri:"FONK // noteGet // MONGO-1",hataMesaj:"Program yöneticisi ile iletişime geçmeniz gerekmektedir, (" + hataText +")"})
    year = objHeader["Year"][0];
    

  } catch (err){
    return ({hata:true,hataYeri:"FONK // noteGet // MONGO-1",hataMesaj:err.message})
  }
  
  
  
  
  
  // MONGO-2 - AUTH_CHECK
  let user = {};
  let userBranch;
  let branchLessons = [];

  AUTH_CHECK: try {
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    user = await userArray.find(x => x.kullaniciMail == kullaniciMail)
    if(!user) return ({hata:true,hataYeri:"FONK // noteGet // MONGO-2",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // noteGet // MONGO-2",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // noteGet // MONGO-2",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // noteGet // MONGO-2",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(!user.isOgrenci) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // noteGet // MONGO-2",hataMesaj:"Öğrenci olarak gözükmüyorsunuz."})
  
    userBranch = branchArray.find(x=> x.name == user.branch)
    if(!userBranch) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // noteGet // MONGO-2",hataMesaj:"Şubeniz sistemde tespit edilemedi."})
 
    branchLessons = lessonArray.filter(x=> x.branchName == userBranch.name)
    if(!branchLessons) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // noteGet // MONGO-2",hataMesaj:"Şubenize kayıtlı bir ders bulunamadı."})
 

    
    // kontroller
    // if(tur == "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes["okuma"].includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // noteGet",hataMesaj:"İlgili ihalenin mahal-poz eşleşmelerini görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    // if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].okuma.includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // noteGet",hataMesaj:"İlgili pozun \"" + tur + "\" metrajlarını görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    // if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo > 0) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // noteGet",hataMesaj:"İlgili iş paketi \""+ tur +"\" metrajı girmek için kapalı durumda, program sorumlusu ile iletişime geçebilirsiniz."})
    // if (tur !== "tanimla") {
    //   guncelNo = projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo
    // }


  } catch(err) {
    return ({hata:true,hataYeri:"FONK // noteGet // MONGO-2",hataMesaj:err.message})
  }
  
  
  
   
  
  // MONGO-3 - GET DATA FROM DB
  try {

    let note
    
    const userLessons2 = branchLessons.map(les=>{
      
      note = user.lessons.find(not=>not.dersNo == les.dersNo)
      if (note) {
        return {
          dersName : les.name,
          ogretmenName : ogretmenler.find(ogt=>ogt.ogretmenNo == les.ogretmenNo).name,
          note
        }
      } else {
        return {
          dersName : les.name,
          ogretmenName : ogretmenler.find(ogt=>ogt.ogretmenNo == les.ogretmenNo).name,
          note :{dersNo:"yok"}
        }
      }
      
    })
    
    // return branchLessons
    var userLessons3 = JSON.parse(JSON.stringify(userLessons2));
    return userLessons3
    
    
    // let isNote
    // // yukarıda bitmezsse burda bitecek - tüm dersler göderilecek
    // // const objArray = await collectionUsers.find({ "lessons.dersNo" : dersNo } ,{_id: 0, ogrenciNo:1, name:1, surname:1, lessons: {$elemMatch: { dersNo: dersNo }} } ).toArray()
    
    // var userArrayClone = JSON.parse(JSON.stringify(userArray));
    
    // const objArrayA = await userArrayClone.map(x=>{
      
    //   if (x.hasOwnProperty("lessons")) {
      
    //     if (x.kullaniciMail == x.kullaniciMail) {
          
    //       isNote = x.lessonArray.find(y=>y.dersNo == dersNo)
          
    //       if (isNote) {
    //         return {
    //           dersNo:isNote.dersNo,
    //           notes:isNote
    //         }
            
    //       } else {
    //         return {
    //           dersNo:isNote.dersNo,
    //           notes: {dersNo:"yok"}
    //         }
            
    //       }
    //     }
        
    //   }
      
    // })  
    
    // // boş object leri kaldırma
    // objArray = objArrayA.filter( x => {
    //   if (x !== null && x !== undefined) {
    //     if (Object.entries(x).length > 0) {
    //       return true
    //     } else {
    //       false
    //     }
    //   }
    // })
            
    // return ({ok:true,mesaj:'Veriler alındı.',data:objArray})

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // noteGet // MONGO-3",hataMesaj:err.message}) 
  }      
  

};