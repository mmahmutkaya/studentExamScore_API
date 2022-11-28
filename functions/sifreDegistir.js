exports = async function (request, response) {
  
   objHeader = request.headers
  
  let kullaniciMail;
  let mailTeyitKodu;
  let sifre;
  let sifre2;

  
  // 1 - gelen bilgilerin analizi yapılıyor
  try {
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // sifreDegistir",hataMesaj:"Mail adresi girilmemiş"})
    if(!objHeader.hasOwnProperty('Mail-Teyit-Kodu')) return ({hata:true,hataYeri:"FONK // sifreDegistir",hataMesaj:"Mail teyit kodu girilmemiş"})
    
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    if(validateEmail == null) return ({hata:true,hataID:"002",hataYeri:"FONK // sifreDegistir",hataMesaj:"Mail adresinin doğruluğunu kontrol ediniz."})
    
    mailTeyitKodu = objHeader["Mail-Teyit-Kodu"][0];
    mailTeyitKodu = mailTeyitKodu.replace(' ','')
    if(mailTeyitKodu.split("").length !== 6) return ({hata:true,hataYeri:"FONK // sifreDegistir",hataMesaj:"Mail teyit kodu 6 karakterden oluşmaktadır."})
    
    
    sifre = objHeader["Sifre"][0];
    sifre2 = objHeader["Sifre2"][0];
    if(sifre !== sifre2) return ({hata:true,hataYeri:"FONK // sifreDegistir",hataMesaj:"Girilen şifreler birbirinden farklı."})
    sifre2 = sifre.replace(' ','')
    if(sifre.split("").length !== sifre2.split("").length) return ({hata:true,hataYeri:"FONK // sifreDegistir",hataMesaj:"Şifre alanında boşluk kullanmayınız"})
    if(sifre.split("").length < 6) return ({hata:true,hataYeri:"FONK // sifreDegistir",hataMesaj:"Şifre 6 karakterden az olamaz"})
    if(sifre.split("").length > 12) return ({hata:true,hataYeri:"FONK // sifreDegistir",hataMesaj:"Şifre 12 karakterden fazla olamaz"})

  } catch (err){
    return ({hata:true,hataYeri:"FONK // sifreDegistir // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım, mailTeyitKodu uyuşuyorsa şifreleri değiştirelim
  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail:kullaniciMail}).toArray()
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // sifreDegistir",hataMesaj:"Mail adresi sistemde kayıtlı değil, yeni üyelik başvurusu yapabilirsiniz."})
    const user = userArray[0]
    if (mailTeyitKodu == user.mailTeyitKod) {
      collectionUsers.updateOne({"_id":user._id},{ $set: { sifre: sifre, mailTeyitKodu:"" } })
      return ({ok:true,mesaj:"Şifreniz değiştirildi."})
    } else {
      return ({hata:true,hataYeri:"FONK // sifreDegistir",hataMesaj:"Mail adresi doğrulama kodunuz sistemdeki ile uyuşmuyor, kontrol ediniz veya tekrar kod göndermek için ilgili linke tıklayınız."})
    }
  } catch(err) {
    return ({hata:true,hataYeri:"FONK // sifreDegistir // MONGO-2",hataMesaj:err.message})
  }
  
  
  
}