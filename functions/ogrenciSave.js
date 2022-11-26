exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  
  let projeData
  
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // ogrenciSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // ogrenciSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // ogrenciSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    

  } catch (err){
    return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  let user;

  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // ogrenciSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // ogrenciSave",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // ogrenciSave",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // ogrenciSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(!user.admin) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // ogrenciSave",hataMesaj:"Öğrenci kayıt etmeye yetkiniz bulunmuyor."})
    
    // kontroller
    // if(tur == "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes["okuma"].includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // ogrenciSave",hataMesaj:"İlgili ihalenin mahal-poz eşleşmelerini görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    // if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].okuma.includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // ogrenciSave",hataMesaj:"İlgili pozun \"" + tur + "\" metrajlarını görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    // if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo > 0) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // ogrenciSave",hataMesaj:"İlgili iş paketi \""+ tur +"\" metrajı girmek için kapalı durumda, program sorumlusu ile iletişime geçebilirsiniz."})
    // if (tur !== "tanimla") {
    //   guncelNo = projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo
    // }


  } catch(err) {
    return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-2",hataMesaj:err.message})
  }
  
      
    
  // MONGO-4a - gelen veri işlemleri - body kısmında veri var mı?
  let cameItems
  
  try{
    cameItems = JSON.parse(request.body.text());
  } catch(err){
    return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-4a",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
    
  

  let zaman = Date.now()
  
  let is_Mail_Violation = false
  
  let violationExcelRows = []


  // MONGO-5 - ÖĞRENCİ KAYIT
  FONK_ogrenciSave: try {
    
    // database deki collection belirleyelim
    const collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users")
    
    await cameItems.map(item => {
      
      validateEmail = context.functions.execute("validateEmail", item.mail);
      if(!validateEmail) {
        is_Mail_Violation = true
        violationExcelRows.push(item.siraNo)
      }

      
      // if (typeof item.sira === "string") {
      //   if (item.sira.length === 0) {
      //     checkSira_Ekle = true
      //   }
      // }
        


    
      // if (item.tur == "tanimla" && item.dbIslem === "ekle") {
        
      //   // madem yazma yapıcaz yetki var mı? 
      //   if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes["yazma"].includes(kullaniciMail)) {
      //     yazmaYetkisiProblemi_define = true
      //   }
        
      //   // genel olarak kayıt izni var mı?
      //   if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes.isKayitYapilabilir) {
      //     isKayitYapilabilirProblemi_define = true
      //   }
        

      //   // if (typeof item.sira === "string") {
      //   //   if (item.sira.length === 0) {
      //   //     checkSira_Ekle = true
      //   //   }
      //   // }
        
      //   // if (typeof item.sira === "number") {
      //   //   if (!item.sira > 0) {
      //   //     checkSira_Ekle = true
      //   //   }
      //   // }

      //   // if (typeof item.isim === "string") {
      //   //   if (item.isim.length === 0) {
      //   //     checkIsim_Ekle = true
      //   //   }
      //   // }
        
      //   // if (typeof item.isim === "string") {
      //   //   if (item.isim === "...") {
      //   //     checkIsim_Ekle = true
      //   //   }
      //   // }
        
      //   // if (typeof item.isim === "number") {
      //   //   if (!item.isim > 0) {
      //   //     checkIsim_Ekle = true
      //   //   }
      //   // }
        
        
      //   cameItems_ekle.push({
      //     ...item,
      //     mahalId:new BSON.ObjectId(item.mahalId),
      //     pozId:new BSON.ObjectId(item.pozId),
      //     ihaleId:new BSON.ObjectId(ihaleId),
      //     kesif:{mevcutVersiyonlar:[],nodeMetraj:0}, //silinemezler sorgusunda bu object properties var mı yok mu diye bakıyoruz
      //     hakedisTalep:{mevcutVersiyonlar:[],nodeMetraj:0},  //silinemezler sorgusunda bu object properties var mı yok mu diye bakıyoruz
      //     hakedisOnay:{mevcutVersiyonlar:[],nodeMetraj:0},  //silinemezler sorgusunda bu object properties var mı yok mu diye bakıyoruz
      //     proje,
      //     versiyon,
      //     isDeleted:false,
      //     createdAt:zaman,
      //     createdBy:kullaniciMail,
      //   });

      // }
      
    });
    
    
    if (is_Mail_Violation) return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: violationExcelRows +  " numaralı kayıtlardaki \"mail\" adreslerinin doğruluğunu kontrol ediniz."});
    
    
    // // METRAJ SATIRI VARSA SİLİNMESİN
    // // Silinemeycek dolu MetrajNodes ları tespit etme
    // const collectionMetrajNodes = context.services.get("mongodb-atlas").db("studentExamScore").collection("metrajNodes")
    // let silinemezler1 = []
    // if (cameItems_sil.length) {
    //   silinemezler1 = await collectionMetrajNodes.find(
    //     // {ihaleId:new BSON.ObjectId(ihaleId),isDeleted:false },
    //     // {ihaleId:new BSON.ObjectId(ihaleId),isDeleted:false,["hakedisTalep.mevcutVersiyonlar"]:{$ne: []},["hakedisOnay.mevcutVersiyonlar"]:{$ne: []},["kesif.mevcutVersiyonlar"]:{$ne: []} },
    //     {ihaleId:new BSON.ObjectId(ihaleId), $or: [{"kesif.mevcutVersiyonlar":{ $gt: -Infinity }},{"hakedisTalep.mevcutVersiyonlar":{ $gt: -Infinity }},{"hakedisOnay.mevcutVersiyonlar":{ $gt: -Infinity }}]},
    //     {pozId:1,mahalId:1,mahalParentName:1,mahalKod:1,pozNo:1,'_id': false}
    //   ).toArray();
    // }
    
    // // return({ok:true,mesaj:"Güncellemeler yapıldı.",silinemezler1});
    
    // let silinemezler =[]
    // if (cameItems_sil.length) {
    //   await cameItems_sil.map(item => {
    //     if (silinemezler1.find(x => x.mahalId == item.mahalId && x.pozId == item.pozId)) {
    //       silinemezler.push(item)
    //     }
    //   })
    // }
    // // return silinemezler
    // // örnek olarak db bir tane silinemez bilgileri alalım
    
    // if (silinemezler.length) {
    //   const silinemez = await collectionMetrajNodes.findOne({mahalId:new BSON.ObjectId(silinemezler[0].mahalId),pozId:new BSON.ObjectId(silinemezler[0].pozId)})
    //   return ({hata:true,hataYeri:"FONK // ogrenciSave",hataMesaj:silinemez.pozNo + " - numaralı poz ile " + silinemez.mahalParentName + " - " + silinemez.mahalKod + " nolu mahalin eşleştirmesini kaldırmak için öncelikle bu eşleşmeye ait mevcut metrajları silmelisiniz."}) 
    // }


    // // // DATABASE - silme - "tanimla"
    // // if (cameItems_sil.length) {
    // //   await cameItems_sil.map(item =>{
    // //     collection.findOneAndUpdate(
    // //       {mahalId:new BSON.ObjectId(item.mahalId),pozId:new BSON.ObjectId(item.pozId)},
    // //       { $set: {isDeleted:zaman, isDeletedBy:user.kullaniciMail}},
    // //       { upsert: false, new: true }
    // //     );
    // //   });
    // // }
    
    // let bulk = []
    
    // // DATABASE - silme - "tanimla"
    // if (cameItems_sil.length) {
    //   await cameItems_sil.map(item =>{
    //     bulk.push({
    //       updateOne: {
    //         filter: {mahalId:new BSON.ObjectId(item.mahalId),pozId:new BSON.ObjectId(item.pozId)},
    //         update: { $set: {isDeleted:zaman, isDeletedBy:user.kullaniciMail}}
    //       }
    //     });
    //   });
    // }
    // // await collection.bulkWrite(bulk, { ordered: false });
    
    // // DATABASE - ekleme - "tanimla"
    // if (cameItems_ekle.length) {
    //   await cameItems_ekle.map(item =>{
        
    //     bulk.push({
    //       updateOne: {
    //         filter: {mahalId:item.mahalId,pozId:item.pozId},
    //         update: { $set: {...item}}, // içeriği yukarıda ayarlandı
    //         upsert: true
    //       }
    //     });
        
    //     // collection.findOneAndUpdate(
    //     //   {mahalId:item.mahalId,pozId:item.pozId},
    //     //   { $set: {...item}}, // içeriği yukarıda ayarlandı
    //     //   { upsert: true, new: true }
    //     // );
        
    //   });
    // }
    // await collection.bulkWrite(bulk, { ordered: false });
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj:err.message});
  }
    
};