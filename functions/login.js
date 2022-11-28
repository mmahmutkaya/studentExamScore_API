exports = async function (request, response) {
  

  objHeader = request.headers
  
  // let firma;
  let kullaniciMail;
  let sifre;
  
  
  // 1 - gelen bilgilerin analizi yapılıyor
  try {
    
    // if(!objHeader.hasOwnProperty('Firma')) return ({hata:true,hataYeri:"FONK // login",hataMesaj:"Firma ismi girilmemiş"})
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // login",hataMesaj:"Mail adresi girilmemiş"})
    if(!objHeader.hasOwnProperty('Sifre')) return ({hata:true,hataYeri:"FONK // login",hataMesaj:"Şifre girilmemiş"})
    
    // firma = objHeader["Firma"][0]
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    sifre = objHeader["Sifre"][0];
    sifre = sifre.replace(' ', '')
    
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // login",hataMesaj:"Mail adresinin doğruluğunu kontrol ediniz."})
    
  } catch (err){
    return ({hata:true,hataYeri:"FONK // login // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail:kullaniciMail}).toArray()
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // login",hataMesaj:"Mail adresi sistemde kayıtlı değil, yeni üyelik başvurusu yapabilirsiniz."})
    const user = userArray[0]
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // login",hataMesaj:"Mail adresi teyit edilmemiş."})
    // if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // login",hataMesaj:"Üyeliğiniz onay bekliyor."})
    var text = "\"şifremi unuttum\"";
    if(sifre !== user.sifre ) return ({hata:true,hataTanim:"sifreEslesme",hataYeri:"FONK // login",hataMesaj:"Hatalı şifre, şifrenizi unuttuysanız " + text  + " linkine tıklayınız."})
    const geciciKey = Date.now()
    
    let admin = false
    if (user.hasOwnProperty("admin")) {
      if (user.admin) userAdmin = true
    }
    
    let isOgrenci = false
    if (user.hasOwnProperty("isOgrenci")) {
      if (user.isOgrenci) isOgrenci = true
    }
    
    let isOgretmen = false
    if (user.hasOwnProperty("isOgretmen")) {
      if (user.isOgretmen) isOgretmen = true
    }
    
    collectionUsers.updateOne({"_id":user._id},{ $set: { geciciKey: geciciKey } })
    
    return ({ok:true,mesaj:"Giriş yapıldı",geciciKey,admin,isOgretmen,isOgrenci })
    
  } catch(err) {
    return ({hata:true,hataYeri:"FONK // login // MONGO-2",hataMesaj:err.message})
  }
  
  

}