exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let fullName;
  let branch;
  let year;

  let projeData
  
  const collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users")
  const userArray = await collectionUsers.find({}).toArray()
  
  const collectionLessons = context.services.get("mongodb-atlas").db("studentExamScore").collection("lessons")
  
  
  let isLesson = null
  

  // MONGO-1 - Gelen Sorgu
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // noteGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // noteGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"Gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // noteGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    hataText = "\"gelen istekte \"ders fullName\" bulunamadı\""
    if(!objHeader.hasOwnProperty('Fullname')) return ({hata:true,hataYeri:"FONK // noteGet",hataMesaj:"Program yöneticisi ile iletişime geçmeniz gerekmektedir, (" + hataText +")"})
    fullName = objHeader["Fullname"][0];
    ///
    isLesson = await collectionLessons.findOne({fullName})
    hataText = "\"gelen istekteki \"ders\" sistemde bulunamadı\""
    if(!isLesson) return ({hata:true,hataYeri:"FONK // noteGet",hataMesaj:"Program yöneticisi ile iletişime geçmeniz gerekmektedir, (" + hataText +")"})
    
    hataText = "\"gelen istekte \"şube adı\" bulunamadı\""
    if(!objHeader.hasOwnProperty('Branch')) return ({hata:true,hataYeri:"FONK // noteGet",hataMesaj:"Program yöneticisi ile iletişime geçmeniz gerekmektedir, (" + hataText +")"})
    branch = objHeader["Branch"][0];
    
    hataText = "\"gelen istekte \"sene\" bilgisi bulunamadı\""
    if(!objHeader.hasOwnProperty('Year')) return ({hata:true,hataYeri:"FONK // noteGet",hataMesaj:"Program yöneticisi ile iletişime geçmeniz gerekmektedir, (" + hataText +")"})
    year = objHeader["Year"][0];
    

  } catch (err){
    return ({hata:true,hataYeri:"FONK // noteGet // MONGO-1",hataMesaj:err.message})
  }
  
  
  
  
  
  // MONGO-2 - AUTH_CHECK
  let user;

  AUTH_CHECK: try {
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    user = await userArray.find(x => x.kullaniciMail == kullaniciMail)
    if(!user) return ({hata:true,hataYeri:"FONK // noteGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // noteGet",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // noteGet",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // noteGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(user.hasOwnProperty("isAdmin")) {
      if(user.isAdmin) break AUTH_CHECK
    }
    
    if(user.hasOwnProperty("isOgretmen")) {
      if(user.isOgretmen) break AUTH_CHECK
    }
    
    return ({hata:true,hataYeri:"FONK // noteGet",hataMesaj:"Talep ettiğiniz derse ait notları görmeye yetkiniz bulunmuyor."})
    
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
    

    // yukarıda bitmezsse burda bitecek - tüm dersler göderilecek
    // const objArray = await collectionUsers.find({ "lessons.fullName": fullName } ,{_id: 0, ogrenciNo:1, name:1, surname:1, lessons: {$elemMatch: { fullName: fullName }} } ).toArray()
    const objArray = await collectionUsers.find({ "lessons.fullName" : fullName } ,{_id: 0, ogrenciNo:1, name:1, surname:1, lessons: {$elemMatch: { fullName: fullName }} } ).toArray()
    return ({ok:true,mesaj:'Veriler alındı.',data:objArray})

    

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // noteGet // MONGO-3",hataMesaj:err.message}) 
  }      
  

 
    
};