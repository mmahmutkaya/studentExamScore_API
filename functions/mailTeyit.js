exports = async function (request, response) {
  
  
  
  objHeader = request.headers
  
  let kullaniciMail;
  let mailTeyitKodu;

  
  // 1 - gelen bilgilerin analizi yapılıyor
  try {
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // mailTeyit",hataMesaj:"Mail adresi girilmemiş"})
    if(!objHeader.hasOwnProperty('Mail-Teyit-Kodu')) return ({hata:true,hataYeri:"FONK // mailTeyit",hataMesaj:"Mail teyit kodu girilmemiş"})
    
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // mailTeyit",hataMesaj:"Mail adresinin doğruluğunu kontrol ediniz."})
    
    mailTeyitKodu = objHeader["Mail-Teyit-Kodu"][0];
    mailTeyitKodu = mailTeyitKodu.replace(' ','')
    if(mailTeyitKodu.split("").length !== 6) return ({hata:true,hataYeri:"FONK // mailTeyit",hataMesaj:"Mail teyit kodu 6 karakterden oluşmaktadır."})
  } catch (err){
    return ({hata:true,hataYeri:"FONK // mailTeyit // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail:kullaniciMail}).toArray()
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // mailTeyit",hataMesaj:"Mail adresi sistemde kayıtlı değil, yeni üyelik başvurusu yapabilirsiniz."})
    const user = userArray[0]
    if(user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // mailTeyit",hataMesaj:"Mail adresi zaten teyit edilmiş."})
    if (mailTeyitKodu == user.mailTeyitKod) {
      collectionUsers.updateOne({"_id":user._id},{ $set: { mailTeyit: true,mailTeyitKodu:"" } })
      return ({ok:true,mesaj:"Mail adresiniz doğrulandı."})
    } else {
      return ({hata:true,hataYeri:"FONK // mailTeyit",hataMesaj:"Mail adresi doğrulama kodunuz sistemdeki ile uyuşmuyor, kontrol ediniz veya tekrar kod göndermek için ilgili linke tıklayınız."})
    }
  } catch(err) {
    return ({hata:true,hataYeri:"FONK // mailTeyit // MONGO-2",hataMesaj:err.message})
  }
  
  
  // try {
  //   const userArray = await collectionUsers.find({kullaniciMail}).toArray()
  //   if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // login2",hataMesaj:"Mail adresi sistemde kayıtlı değil, yeni üyelik başvurusu yapabilirsiniz."})
  //   // if(!userArray.find(user => user.firma === firma)) return ({hata:true,hataYeri:"FONK // login2",hataMesaj:"firma adı hatalı"})
  //   // if((userArray.find(user => user.firma === firma).sifre) === sifre) return (userArray.find(user => user.firma === firma))
  //   return ({hata:true,hataYeri:"FONK // login2",hataMesaj:"Şifre hatalı!"})
  // } catch (err){
  //   return ({hata:true,hataYeri:"FONK // login2 // MONGO-2",hataMesaj:err.message})
  // }

}