exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  
  let projeData
  
  const collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users")
  const userArray = await collectionUsers.find({isDeleted:false}).toArray()
  
  const collectionBranchs = context.services.get("mongodb-atlas").db("studentExamScore").collection("branchs")
  const branchArray = await collectionBranchs.find({isDeleted:false}).toArray()
  
  const collectionLessons = context.services.get("mongodb-atlas").db("studentExamScore").collection("lessons")
  const lessonArray = await collectionLessons.find({isDeleted:false}).toArray()
  
  
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
  
  
  
  
  
  // MONGO-2 - AUTH_CHECK
  let user;

  AUTH_CHECK: try {
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    user = await userArray.find(x => x.kullaniciMail == kullaniciMail)
    if(!user) return ({hata:true,hataYeri:"FONK // ogrenciSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // ogrenciSave",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // ogrenciSave",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // ogrenciSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(user.hasOwnProperty("isAdmin")) {
      if(user.isAdmin) break AUTH_CHECK
    }
    
    // öğretmene öğrenci kaydetme hakkı vermedik - ya da verelim, silme hakkı vermeyelim, iş paylaşılmış olur
    if(user.hasOwnProperty("isOgretmen")) {
      if(user.isOgretmen) break AUTH_CHECK
    }
    
    return ({hata:true,hataYeri:"FONK // ogrenciSave",hataMesaj:"Öğrenci kaydetmeeye yetkiniz bulunmuyor."})
    
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
    
  





  // MONGO-4 - SAVE DATABASE

  let zaman = Date.now()
  
  let is_ogrenciNo_Violation = false
  let violation_ogrenciNo_ExcelRows = []
  
  let is_mail_Violation = false
  let violation_mail_ExcelRows = []
  
  let is_name_Violation = false
  let violation_name_ExcelRows = []

  // let is_surname_Violation = false
  // let violation_surname_ExcelRows = []

  // let is_year_Violation = false
  // let violation_year_ExcelRows = []



  let is_ogrenciNo_Exist = false
  let exist_ogrenciNo_ExcelRows = []
  
  let is_mail_Exist = false
  let exist_mail_ExcelRows = []


  let is_ogrenciNo_Exist_inCame = false
  let exist_ogrenciNo_ExcelRows_inCame = []
  
  let is_mail_Exist_inCame = false
  let exist_mail_ExcelRows_inCame = []


  let is_branch_Absent = false
  let absent_branch_ExcelRows = []

  
  let cameItems_Add = []
  let studentLessonArray = []
  let studentLessons = []
  let geciciUser = null

  
  try {
    
    await cameItems.map(item => {
      
      
      if(item.ogrenciNo.length !== 8) {
        is_ogrenciNo_Violation = true
        violation_ogrenciNo_ExcelRows.push(item.siraNo)
      }

      validateEmail = context.functions.execute("validateEmail", item.mail);
      if(!validateEmail) {
        is_mail_Violation = true
        violation_mail_ExcelRows.push(item.siraNo)
      }

      if(item.name.length < 2) {
        is_name_Violation = true
        violation_name_ExcelRows.push(item.siraNo)
      }

      // if(item.surname.length < 2) {
      //   is_surname_Violation = true
      //   violation_surname_ExcelRows.push(item.siraNo)
      // }
      
      // if(item.year.length !== 9) {
      //   is_year_Violation = true
      //   violation_year_ExcelRows.push(item.siraNo)
      // }
      


      if(userArray.find(x=> x.ogrenciNo == item.ogrenciNo)) {
        is_ogrenciNo_Exist = true
        exist_ogrenciNo_ExcelRows.push(item.siraNo)
      }

      if(userArray.find(x=> x.kullaniciMail == item.mail)) {
        is_mail_Exist = true
        exist_mail_ExcelRows.push(item.siraNo)
      }


      
      geciciUser = null
      geciciUser = cameItems_Add.find(x=> x.ogrenciNo == item.ogrenciNo)
      if(geciciUser) {
        is_ogrenciNo_Exist_inCame = true
        exist_ogrenciNo_ExcelRows_inCame.push(geciciUser.siraNo)
        exist_ogrenciNo_ExcelRows_inCame.push(item.siraNo)
        exist_ogrenciNo_ExcelRows_inCame.push("---")
      }
      
      geciciUser = null
      geciciUser = cameItems_Add.find(x=> x.kullaniciMail == item.mail)
      if(geciciUser) {
        is_mail_Exist_inCame = true
        exist_mail_ExcelRows_inCame.push(geciciUser.siraNo)
        exist_mail_ExcelRows_inCame.push(item.siraNo)
        exist_mail_ExcelRows_inCame.push("---")
      }

      

      if(!branchArray.find(x=> x.name == item.branch)) {
        is_branch_Absent = true
        absent_branch_ExcelRows.push(item.siraNo)
      }


      cameItems_Add.push({
        
        siraNo:item.siraNo,
        ogrenciNo:item.ogrenciNo,
        kullaniciMail:item.mail,
        name:item.name.toUpperCase(),
        // surname:item.surname.toUpperCase(),
        branch:item.branch.toUpperCase(),
        year:item.year,
        isOgrenci:true,
        
        lessons:[],
        
        sifre:"degisecek_gecici",
        mailTeyitKod:"degisecek_gecici",
        mailTeyit:false,
        uyelikOnay:true,
        geciciKey:"degisecek_gecici",
        isDeleted:false,
        createdAt:zaman,
        createdBy:user.kullaniciMail
        
        // if (gecici_lessonArray) {
        //   gecici_lessonArray.map(x=> {
            
        //   })
        // }

      })
      

    });
    
    
    
    

    
    // await cameItems.map(item => {
      
    //   geciciUser = null
    //   geciciUser = cameItems_Add.find(x=> x.ogrenciNo == item.ogrenciNo)
    //   if(geciciUser) {
    //     is_ogrenciNo_Exist_inCame = true
    //     exist_ogrenciNo_ExcelRows_inCame.push(item.siraNo)
    //     exist_ogrenciNo_ExcelRows_inCame.push(geciciUser.siraNo)
    //   }
      
    //   geciciUser = null
    //   geciciUser = cameItems_Add.find(x=> x.kullaniciMail == item.mail)
    //   if(geciciUser) {
    //     is_mail_Exist_inCame = true
    //     exist_mail_ExcelRows_inCame.push(item.siraNo)
    //     exist_mail_ExcelRows_inCame.push(geciciUser.siraNo)
    //   }
      
    // });
        
    
    
    
    
    
    
    
    let satirNumaralariArray = []
    let currentCondition = ""
    
    if (is_ogrenciNo_Violation) {
      satirNumaralariArray = violation_ogrenciNo_ExcelRows
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"ogrenci numarası\" 8 haneden oluşmuyor."});
    }
    //
    if (is_mail_Violation) {
      satirNumaralariArray = violation_mail_ExcelRows
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"mail adresi\" bilgisi kontrol edilmeli."});
    }
    //
    if (is_name_Violation) {
      satirNumaralariArray = violation_name_ExcelRows
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"isim\" bilgisi kontrol edilmeli."});
    }
    //
    // if (is_surname_Violation) {
    //   satirNumaralariArray = violation_surname_ExcelRows
    //   satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
    //   return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"soyisim\" bilgisi kontrol edilmeli."});
    // }
    //
    // if (is_year_Violation) {
    //   satirNumaralariArray = violation_year_ExcelRows
    //   satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
    //   return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"sene\" bilgisi kontrol edilmeli."});
    // }
    
    
    
    if (is_ogrenciNo_Exist) {
      satirNumaralariArray = exist_ogrenciNo_ExcelRows
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"öğrenci numarası\" sistemde mevcut."});
    }
    
    if (is_mail_Exist) {
      satirNumaralariArray = exist_mail_ExcelRows
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"mail adresi\" sistemde mevcut."});
    }
    
    
    
    if (is_ogrenciNo_Exist_inCame) {
      satirNumaralariArray = exist_ogrenciNo_ExcelRows_inCame
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"öğrenci numarası\" bilgilerinde mükerrerlik var, kontrol ediniz."});
    }
    
    if (is_mail_Exist_inCame) {
      satirNumaralariArray = exist_mail_ExcelRows_inCame
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"mail adresi\" bilgilerinde mükerrerlik var, kontrol ediniz."});
    }
    
    
    
    if (is_branch_Absent) {
      satirNumaralariArray = absent_branch_ExcelRows
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"şube\" bilgisi sistemde mevcut değil."});
    }
    
    
    
    
    
    
    
    
    
    
    
    
    let bulk = []
    
    // DATABASE - silme - "tanimla"
    if (cameItems_Add.length) {
      await cameItems_Add.map(item =>{
        bulk.push({
          updateOne: {
            filter: {kullaniciMail:item.kullaniciMail,ogrenciNo:item.ogrenciNo},
            update: { $set: {...item}}, // içeriği yukarıda ayarlandı
            upsert: true
          }
        });
      });
    }
    await collectionUsers.bulkWrite(bulk, { ordered: false });
    
    
    return ({ok:true,mesaj:'Öğrenciler sisteme kaydedildi.'})



    
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
    return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-4",hataMesaj:err.message});
  }
    
};