exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  
  let projeData
  
  const collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users")
  const collectionBranchs = context.services.get("mongodb-atlas").db("studentExamScore").collection("branchs")
  const userArray = await collectionUsers.find({}).toArray()
  
  
  // MONGO-1 - Gelen Sorgu
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
  
  
  
  
  
  // MONGO-2 - kullanıcının bilgilerini database den alalım
  let user;

  try {
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    user = await userArray.find(x => x.kullaniciMail == kullaniciMail)
    if(!user) return ({hata:true,hataYeri:"FONK // ogrenciSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
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
  
      
      
      
    
  // MONGO-3 - gelen veri işlemleri - body kısmında veri var mı?
  let cameItems
  
  try{
    cameItems = JSON.parse(request.body.text());
  } catch(err){
    return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-3",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
    
  



  let zaman = Date.now()
  
  let is_ogrenciNo_Violation = false
  let violation_ogrenciNo_ExcelRows = []
  
  let is_ogrenciNo_Exist = false
  let exist_ogrenciNo_ExcelRows = []
  
  let is_mail_Violation = false
  let violation_mail_ExcelRows = []
  
  let is_mail_Exist = false
  let exist_mail_ExcelRows = []

  let is_name_Violation = false
  let violation_name_ExcelRows = []

  let is_surname_Violation = false
  let violation_surname_ExcelRows = []


  const branchObjects = await collectionBranchs.find({},{name:1,_id:false}).toArray()
  const branchArray = branchObjects.map(x =>{
    return x.name
  })
  let is_branch_Violation = false
  let violation_branch_ExcelRows = []

  


  // MONGO-5 - GELEN VERİ KONTROL
  try {
    
    
    await cameItems.map(item => {
      
      if(item.ogrenciNo.length !== 8) {
        is_ogrenciNo_Violation = true
        violation_ogrenciNo_ExcelRows.push(item.siraNo)
      }

      if(userArray.find(x=> x.ogrenciNo == item.ogrenciNo)) {
        is_ogrenciNo_Exist = true
        exist_ogrenciNo_ExcelRows.push(item.siraNo)
      }



      validateEmail = context.functions.execute("validateEmail", item.mail);
      if(!validateEmail) {
        is_mail_Violation = true
        violation_mail_ExcelRows.push(item.siraNo)
      }

      if(userArray.find(x=> x.kullaniciMail == item.mail)) {
        is_mail_Exist = true
        exist_mail_ExcelRows.push(item.siraNo)
      }



      if(item.name.length < 2) {
        is_name_Violation = true
        violation_name_ExcelRows.push(item.siraNo)
      }



      if(item.surname.length < 2) {
        is_surname_Violation = true
        violation_surname_ExcelRows.push(item.siraNo)
      }
      
      
      if(!branchArray.find(x=> x == item.branch)) {
        is_branch_Violation = true
        violation_branch_ExcelRows.push(item.siraNo)
      }


      // if (typeof item.sira === "string") {
      //   if (item.sira.length === 0) {
      //     checkSira_Ekle = true
      //   }
      // }
        

    });
    
    
    if (is_ogrenciNo_Violation) return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: violation_ogrenciNo_ExcelRows +  " numaralı kayıtlardaki \"ogrenci numaraları\" 8 haneden oluşmuyor."});
    if (is_ogrenciNo_Exist) return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: exist_ogrenciNo_ExcelRows +  " numaralı kayıtlardaki \"ogrenci numaraları\" sistemde kayıtlı."});
    
    if (is_mail_Violation) return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: violation_mail_ExcelRows +  " numaralı kayıtlardaki \"mail\" adreslerinin doğruluğunu kontrol ediniz."});
    if (is_mail_Exist) return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: exist_mail_ExcelRows +  " numaralı kayıtlardaki \"mail adresleri\" sistemde kayıtlı."});
    
    if (is_name_Violation) return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: violation_name_ExcelRows +  " numaralı kayıtlardaki \"isim\" bilgilerinin doğruluğunu kontrol ediniz."});
    
    if (is_surname_Violation) return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: violation_surname_ExcelRows +  " numaralı kayıtlardaki \"soyisim\" bilgilerinin doğruluğunu kontrol ediniz."});
    
    if (is_branch_Violation) return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: violation_branch_ExcelRows +  " numaralı kayıtlardaki \"şube\" bilgileri, sistemdeki kayıtlı şubeler ile eşleşmiyor."});
    
    
    
    
    
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