exports = async function (request, response) {
  
  objHeader = request.headers
  
  let kullaniciMail;

  // 1 - gelen sorguda kontroller yapıyoruz varsa hata dönüyoruz
  try {
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // maileKodGonder",hataMesaj:"Mail adresi girilmemiş"})

    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    if(validateEmail == null) return ({hata:true,hataID:"002",hataYeri:"FONK // maileKodGonder",hataMesaj:"Mail adresinin doğruluğunu kontrol ediniz."})
    
  } catch (err){
    return ({hata:true,hataYeri:"FONK // maileKodGonder - // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım ve mail adresi doğrulanmış mı bakalım, doğrulanmamışsa yeniKodu ekleyelim
  mailTeyitKod = context.functions.execute("generateKod", 6);
  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail:kullaniciMail}).toArray()
    if(userArray.length === 0) return ({hata:true,hataID:"001",hataYeri:"FONK // maileKodGonder",hataMesaj:"Mail adresi sistemde kayıtlı değil, yeni üyelik başvurusu yapabilirsiniz."})
    const user = userArray[0]
    //her şifre yenilemede mailteyit kodu değiştiriliyor, bu sebeple mail teyit edilmiş olsa bile, mail teyit kodunu değiştirebiliriz, aşağıdaki kod iptal
    //if(user.mailTeyit) return ({hata:true,hataYeri:"FONK // maileKodGonder",hataMesaj:"Mail adresi zaten teyit edilmiş."})
    collectionUsers.updateOne( {kullaniciMail}, {$set: { mailTeyitKod:mailTeyitKod  }} );
  } catch(err) {
    return ({hata:true,hataYeri:"FONK // maileKodGonder // MONGO-2",hataMesaj:err.message})
  }
  
  // 3 - NODEMAİLER - MAİL GÖNDERME
  
  const MailMesaj = "Mail adresi doğrulama kodunuz - " + mailTeyitKod
  
  try {
    context.functions.execute('sendMail', kullaniciMail,"Mail Adresi Doğrulama Kodu",MailMesaj);
    return ({ok:true,mesaj:'Mail adresinize kod gönderildi, spam kısmını kontrol etmeyi unutmayınız.'})
  } catch (err){
    return ({hata:true,hataYeri:"FONK // userRegester // MONGO-3",hataMesaj:err.message})
  }

}