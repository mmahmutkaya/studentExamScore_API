exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  
  let projeData
  
  const collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users")
  const userArray = await collectionUsers.find({}).toArray()
  

  // MONGO-1 - Gelen Sorgu
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // ogretmenGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // ogretmenGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // ogretmenGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    

  } catch (err){
    return ({hata:true,hataYeri:"FONK // ogretmenGet // MONGO-1",hataMesaj:err.message})
  }
  
  
  
  
  
  // MONGO-2 - AUTH_CHECK
  let user;

  AUTH_CHECK: try {
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    user = await userArray.find(x => x.kullaniciMail == kullaniciMail)
    if(!user) return ({hata:true,hataYeri:"FONK // ogretmenGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // ogretmenGet",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // ogretmenGet",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // ogretmenGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(user.hasOwnProperty("admin")) {
      if(user.admin) break AUTH_CHECK
    }
    
    if(user.hasOwnProperty("isOgretmen")) {
      if(user.isOgretmen) break AUTH_CHECK
    }
    
    return ({hata:true,hataYeri:"FONK // ogretmenGet",hataMesaj:"Kayıtlı öğretmenleri görmeye yetkiniz bulunmuyor."})
    
    // kontroller
    // if(tur == "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes["okuma"].includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // ogretmenGet",hataMesaj:"İlgili ihalenin mahal-poz eşleşmelerini görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    // if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].okuma.includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // ogretmenGet",hataMesaj:"İlgili pozun \"" + tur + "\" metrajlarını görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    // if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo > 0) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // ogretmenGet",hataMesaj:"İlgili iş paketi \""+ tur +"\" metrajı girmek için kapalı durumda, program sorumlusu ile iletişime geçebilirsiniz."})
    // if (tur !== "tanimla") {
    //   guncelNo = projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo
    // }


  } catch(err) {
    return ({hata:true,hataYeri:"FONK // ogretmenGet // MONGO-2",hataMesaj:err.message})
  }
  
  
  // MONGO-3 - GET DATA FROM DB
  try {
    
    const objArray = await collectionUsers.find({isOgretmen:true, isDeleted:false}).toArray()
    return ({ok:true,mesaj:'Veriler alındı.',data:objArray})

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // ogretmenGet // MONGO-3",hataMesaj:err.message})
  }      
  

 
    
};