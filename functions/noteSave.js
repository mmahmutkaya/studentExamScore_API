exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  
  let fullName;

  let projeData
  
  const collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users")
  const userArray = await collectionUsers.find({isDeleted:false}).toArray()
  
  const collectionLessons = context.services.get("mongodb-atlas").db("studentExamScore").collection("lessons")

  
  // MONGO-1 - Gelen Sorgu
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // noteSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // noteSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // noteSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    
    hataText = "\"gelen istekte \"ders fullName\" bulunamadı\""
    if(!objHeader.hasOwnProperty('Fullname')) return ({hata:true,hataYeri:"FONK // noteGet",hataMesaj:"Program yöneticisi ile iletişime geçmeniz gerekmektedir, (" + hataText +")"})
    fullName = objHeader["Fullname"][0];
    ///
    isLesson = await collectionLessons.findOne({fullName})
    hataText = "\"gelen istekteki \"ders\" sistemde bulunamadı\""
    if(!isLesson) return ({hata:true,hataYeri:"FONK // noteGet",hataMesaj:"Program yöneticisi ile iletişime geçmeniz gerekmektedir, (" + hataText +")"})
    
  } catch (err){
    return ({hata:true,hataYeri:"FONK // noteSave // MONGO-1",hataMesaj:err.message})
  }
  
  
  
  
  
  // MONGO-2 - AUTH_CHECK
  let user;

  AUTH_CHECK: try {
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    user = await userArray.find(x => x.kullaniciMail == kullaniciMail)
    if(!user) return ({hata:true,hataYeri:"FONK // ogrenciGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // ogrenciGet",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // ogrenciGet",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // ogrenciGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(user.hasOwnProperty("isAdmin")) {
      if(user.isAdmin) break AUTH_CHECK
    }
    
    // öğretmene öğrenci kaydetme hakkı vermedik - ya da verelim, silme hakkı vermeyelim, iş paylaşılmış olur
    if(user.hasOwnProperty("isOgretmen")) {
      if(user.isOgretmen) break AUTH_CHECK
    }
    
    return ({hata:true,hataYeri:"FONK // ogrenciGet",hataMesaj:"Not kaydetmeeye yetkiniz bulunmuyor."})
    
    // kontroller
    // if(tur == "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes["okuma"].includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // ogrenciGet",hataMesaj:"İlgili ihalenin mahal-poz eşleşmelerini görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    // if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].okuma.includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // ogrenciGet",hataMesaj:"İlgili pozun \"" + tur + "\" metrajlarını görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    // if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo > 0) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // ogrenciGet",hataMesaj:"İlgili iş paketi \""+ tur +"\" metrajı girmek için kapalı durumda, program sorumlusu ile iletişime geçebilirsiniz."})
    // if (tur !== "tanimla") {
    //   guncelNo = projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo
    // }


  } catch(err) {
    return ({hata:true,hataYeri:"FONK // ogrenciGet // MONGO-2",hataMesaj:err.message})
  }
  
  
  
      
      
    
  // MONGO-3 - gelen veri işlemleri - body kısmında veri var mı?
  let cameItems
  
  try{
    cameItems = JSON.parse(request.body.text());
  } catch(err){
    return ({hata:true,hataYeri:"FONK // noteSave // MONGO-3",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
    
  





  // MONGO-4 - SAVE DATABASE

  let zaman = Date.now()
  
  let is_A_quiz1_Violation = false
  let violation_A_quiz1_ExcelRows = []
  
  // let is_mail_Violation = false
  // let violation_mail_ExcelRows = []
  
  // let is_name_Violation = false
  // let violation_name_ExcelRows = []

  // let is_surname_Violation = false
  // let violation_surname_ExcelRows = []

  // let is_year_Violation = false
  // let violation_year_ExcelRows = []



  // let is_ogrenciNo_Exist = false
  // let exist_ogrenciNo_ExcelRows = []
  
  // let is_mail_Exist = false
  // let exist_mail_ExcelRows = []


  // let is_ogrenciNo_Exist_inCame = false
  // let exist_ogrenciNo_ExcelRows_inCame = []
  
  // let is_mail_Exist_inCame = false
  // let exist_mail_ExcelRows_inCame = []


  // let is_branch_Absent = false
  // let absent_branch_ExcelRows = []

  
  let cameItems_Add = []
  let studentLessonObject = {}

  
  try {
    
    await cameItems.map(item => {
      
      
      if(typeof parseFloat(item.A_quiz1) !== "number") {
        is_A_quiz1_Violation = true
        violation_A_quiz1_ExcelRows.push(item.siraNo)
      }

      // validateEmail = context.functions.execute("validateEmail", item.mail);
      // if(!validateEmail) {
      //   is_mail_Violation = true
      //   violation_mail_ExcelRows.push(item.siraNo)
      // }

      // if(item.name.length < 2) {
      //   is_name_Violation = true
      //   violation_name_ExcelRows.push(item.siraNo)
      // }

      // if(item.surname.length < 2) {
      //   is_surname_Violation = true
      //   violation_surname_ExcelRows.push(item.siraNo)
      // }
      
      // if(item.year.length !== 9) {
      //   is_year_Violation = true
      //   violation_year_ExcelRows.push(item.siraNo)
      // }
      


      // if(userArray.find(x=> x.ogrenciNo == item.ogrenciNo)) {
      //   is_ogrenciNo_Exist = true
      //   exist_ogrenciNo_ExcelRows.push(item.siraNo)
      // }

      // if(userArray.find(x=> x.kullaniciMail == item.mail)) {
      //   is_mail_Exist = true
      //   exist_mail_ExcelRows.push(item.siraNo)
      // }


      
      // geciciUser = null
      // geciciUser = cameItems_Add.find(x=> x.ogrenciNo == item.ogrenciNo)
      // if(geciciUser) {
      //   is_ogrenciNo_Exist_inCame = true
      //   exist_ogrenciNo_ExcelRows_inCame.push(geciciUser.siraNo)
      //   exist_ogrenciNo_ExcelRows_inCame.push(item.siraNo)
      //   exist_ogrenciNo_ExcelRows_inCame.push("---")
      // }
      
      // geciciUser = null
      // geciciUser = cameItems_Add.find(x=> x.kullaniciMail == item.mail)
      // if(geciciUser) {
      //   is_mail_Exist_inCame = true
      //   exist_mail_ExcelRows_inCame.push(geciciUser.siraNo)
      //   exist_mail_ExcelRows_inCame.push(item.siraNo)
      //   exist_mail_ExcelRows_inCame.push("---")
      // }

      

      // if(!branchArray.find(x=> x.name == item.branch)) {
      //   is_branch_Absent = true
      //   absent_branch_ExcelRows.push(item.siraNo)
      // }

      studentLessonObject = {

        A_quiz1 : item.A_quiz1,
        A_quiz2 : item.A_quiz2,
        A_quiz3 : item.A_quiz3,
        A_ara1 : item.A_ara1,
        A_yazili : item.A_yazili,
        A_sozlu : item.A_sozlu,
        A_ara2 : item.A_ara2,
        A_odev : item.A_odev,
        A_sinifici : item.A_sinifici,
        A_ortalama : item.A_ortalama,

        B_quiz1 : item.B_quiz1,
        B_quiz2 : item.B_quiz2,
        B_quiz3 : item.B_quiz3,
        B_ara1 : item.B_ara1,
        B_yazili : item.B_yazili,
        B_sozlu : item.B_sozlu,
        B_ara2 : item.B_ara2,
        B_odev : item.B_odev,
        B_sinifici : item.B_sinifici,
        B_ortalama : item.B_ortalama,

        AB_ort : item.AB_ort,
        AB_sonuc : item.AB_sonuc,
        AB_final : item.AB_final,

        G_ort : item.G_ort,
        G_sonuc : item.G_sonuc,
        G_but : item.G_but,
        G_ort2 : item.G_ort2,
        G_sonuc2 : item.G_sonuc2,

        updatedAt:zaman,
        updatedBy:user.kullaniciMail     
        
      }
      


      cameItems_Add.push({

        ogrenciNo:item.ogrenciNo,
        studentLessonObject:studentLessonObject,
        
      })
      

    });
    
    

    let satirNumaralariArray = []
    let currentCondition = ""
    
    if (is_A_quiz1_Violation) {
      satirNumaralariArray = violation_A_quiz1_ExcelRows
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // noteSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"ogrenci numarası\" kontrol edilmeli."});
    }

    
    
    // if (is_ogrenciNo_Exist) {
    //   satirNumaralariArray = exist_ogrenciNo_ExcelRows
    //   satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
    //   return ({hata:true,hataYeri:"FONK // noteSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"öğrenci numarası\" sistemde mevcut."});
    // }
    
    // if (is_mail_Exist) {
    //   satirNumaralariArray = exist_mail_ExcelRows
    //   satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
    //   return ({hata:true,hataYeri:"FONK // noteSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"mail adresi\" sistemde mevcut."});
    // }
    
    
    
    // if (is_ogrenciNo_Exist_inCame) {
    //   satirNumaralariArray = exist_ogrenciNo_ExcelRows_inCame
    //   satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
    //   return ({hata:true,hataYeri:"FONK // noteSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"öğrenci numarası\" bilgilerinde mükerrerlik var, kontrol ediniz."});
    // }
    
    // if (is_mail_Exist_inCame) {
    //   satirNumaralariArray = exist_mail_ExcelRows_inCame
    //   satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
    //   return ({hata:true,hataYeri:"FONK // noteSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"mail adresi\" bilgilerinde mükerrerlik var, kontrol ediniz."});
    // }
    
    
    
    // if (is_branch_Absent) {
    //   satirNumaralariArray = absent_branch_ExcelRows
    //   satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
    //   return ({hata:true,hataYeri:"FONK // noteSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"şube\" bilgisi sistemde mevcut değil."});
    // }
    
    
    
    
    
    
    
    
    
            // update: { $set: { "lessons.$[fullName]" :item.studentLessonObject } }, // içeriği yukarıda ayarlandı
            
            // update: { $set : { "degrees.$[degree].gradcampaign" : 1 } },
    
    
    
    let bulk = []
    
    if (cameItems_Add.length) {
      await cameItems_Add.map(item =>{
        bulk.push({
          updateOne: {
            filter: { ogrenciNo : item.ogrenciNo },
            update: { $set: { "lessons.$[elem]": item.studentLessonObject }  },
            arrayFilters : [{"elem.fullName" : fullName }],
          }
        });
      });
    }
    await collectionUsers.bulkWrite(bulk, { ordered: false });
    
    
    return ({ok:true,mesaj:'Notlar sisteme kaydedildi.'})



    
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
    //   return ({hata:true,hataYeri:"FONK // noteSave",hataMesaj:silinemez.pozNo + " - numaralı poz ile " + silinemez.mahalParentName + " - " + silinemez.mahalKod + " nolu mahalin eşleştirmesini kaldırmak için öncelikle bu eşleşmeye ait mevcut metrajları silmelisiniz."}) 
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
    return ({hata:true,hataYeri:"FONK // noteSave // MONGO-4",hataMesaj:err.message});
  }
    
};