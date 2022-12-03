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
  const ogretmenArray = await userArray.filter(x=> x.isOgretmen == true)
  
  const collectionLessons = context.services.get("mongodb-atlas").db("studentExamScore").collection("lessons")
  const lessonArray = await collectionLessons.find({isDeleted:false},{fullName:1,_id:false}).toArray()
  
  const collectionBranchs = context.services.get("mongodb-atlas").db("studentExamScore").collection("branchs")
  const branchArray = await collectionBranchs.find({isDeleted:false},{name:1,_id:false}).toArray()
  


  // MONGO-1 - Gelen Sorgu
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // dersSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // dersSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // dersSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    

  } catch (err){
    return ({hata:true,hataYeri:"FONK // dersSave // MONGO-1",hataMesaj:err.message})
  }
  
  
  
  
  
  // MONGO-2 - AUTH_CHECK
  let user;

  AUTH_CHECK: try {
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    user = await userArray.find(x => x.kullaniciMail == kullaniciMail)
    if(!user) return ({hata:true,hataYeri:"FONK // dersSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // dersSave",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // dersSave",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // dersSave",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    

    if(user.hasOwnProperty("isAdmin")) {
      if(user.isAdmin) break AUTH_CHECK
    }
    
    // // öğretmene öğretmen kaydetme hakkı verelim, silme hakkı vermeyelim, iş paylaşımı olur
    // if(user.hasOwnProperty("isOgretmen")) {
    //   if(user.isOgretmen) break AUTH_CHECK
    // }
    
    return ({hata:true,hataYeri:"FONK // dersSave",hataMesaj:"Öğretmen kaydetmeye yetkiniz bulunmuyor."})
    
    // kontroller
    // if(tur == "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes["okuma"].includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // dersSave",hataMesaj:"İlgili ihalenin mahal-poz eşleşmelerini görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    // if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].okuma.includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // dersSave",hataMesaj:"İlgili pozun \"" + tur + "\" metrajlarını görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    // if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo > 0) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // dersSave",hataMesaj:"İlgili iş paketi \""+ tur +"\" metrajı girmek için kapalı durumda, program sorumlusu ile iletişime geçebilirsiniz."})
    // if (tur !== "tanimla") {
    //   guncelNo = projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo
    // }


  } catch(err) {
    return ({hata:true,hataYeri:"FONK // dersSave // MONGO-2",hataMesaj:err.message})
  }
  
  
  
      
      
    
  // MONGO-3 - gelen veri işlemleri - body kısmında veri var mı?
  let cameItems
  
  try{
    cameItems = JSON.parse(request.body.text());
  } catch(err){
    return ({hata:true,hataYeri:"FONK // dersSave // MONGO-3",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
    
  




  // MONGO-4 - SAVE DATABASE

  let zaman = Date.now()
  
  
  // VIOLATION - IN CAME
  
  // let is_mail_Violation = false
  // let violation_mail_ExcelRows = []
  
  let is_year_Violation = false
  let violation_year_ExcelRows = []

  let is_name_Violation = false
  let violation_name_ExcelRows = []


  
  // EXIST - IN DB
  
  let is_fullName_Exist = false
  let exist_fullName_ExcelRows = []
  


  // EXIST - IN CAME
  
  let is_fullName_Exist_inCame = false
  let exist_fullName_ExcelRows_inCame = []
  
  
  
  
  // ABSENT - IN DB
  
  let is_branchName_Absent = false
  let absent_branchName_ExcelRows = []

  let is_ogretmenMail_Absent = false
  let absent_ogretmenMail_ExcelRows = []



  let cameItems_Add = [] 
  let lessonsToStudents = []
  let itemFullName = null
  let loopObj = null
  
  
  try {
    
    await cameItems.map(item => {
      
      
      
      // VIOLATION - IN CAME
      
      // validateEmail = context.functions.execute("validateEmail", item.mail);
      // if(!validateEmail) {
      //   is_mail_Violation = true
      //   violation_mail_ExcelRows.push(item.siraNo)
      // }

      if(item.year.length !== 9) {
        is_year_Violation = true
        violation_year_ExcelRows.push(item.siraNo)
      }

      if(item.name.length < 2) {
        is_name_Violation = true
        violation_name_ExcelRows.push(item.siraNo)
      }
      
      
      
      
      
      
      // EXIST - IN DB
      
      itemFullName = item.year + "-" + item.name + "-" + item.branchName + "-" + item.ogretmenMail
      if(lessonArray.find(x=> x.fullName == itemFullName)) {
        is_fullName_Exist = true
        exist_fullName_ExcelRows.push(item.siraNo)
      }



      
      
      // EXIST - IN CAME
      
      loopObj = null
      loopObj = cameItems_Add.find(x=> x.fullName == itemFullName) // item fullName yukarıda belirlendi
      if(loopObj) {
        is_fullName_Exist_inCame = true
        exist_fullName_ExcelRows_inCame.push(loopObj.siraNo)
        exist_fullName_ExcelRows_inCame.push(item.siraNo)
        exist_fullName_ExcelRows_inCame.push("---")
      }
      
      
      
      

      // ABSENT - IN DB
      
      if(!branchArray.find(x=> x.name == item.branchName)) {
        is_branchName_Absent = true
        absent_branchName_ExcelRows.push(item.siraNo)
      }
      
      if(!ogretmenArray.find(x=> x.kullaniciMail == item.ogretmenMail)) {
        is_ogretmenMail_Absent = true
        absent_ogretmenMail_ExcelRows.push(item.siraNo)
      }
      
      

      
      
      cameItems_Add.push({
        
        siraNo:item.siraNo,
        
        fullName:itemFullName,
        
        year:item.year,
        name:item.name,
        ogretmenMail:item.ogretmenMail,
        branchName:item.branchName,
        
        isDeleted:false,
        createdAt:zaman,
        createdBy:user.kullaniciMail
        
      })

      lessonsToStudents.push({
        year:item.year,
        branchName:item.branchName,
        fullName:itemFullName,
        
        A_quiz1 : 0,
        A_quiz2 : 0,
        A_quiz3 : 0,
        A_ara1 : 0,
        A_yazili : 0,
        A_sozlu : 0,
        A_ara2 : 0,
        A_odev : 0,
        A_sinifici : 0,
        A_ortalama : 0,

        B_quiz1 : 0,
        B_quiz2 : 0,
        B_quiz3 : 0,
        B_ara1 : 0,
        B_yazili : 0,
        B_sozlu : 0,
        B_ara2 : 0,
        B_odev : 0,
        B_sinifici : 0,
        B_ortalama : 0,

        AB_ort : 0,
        AB_sonuc : 0,
        AB_final : 0,

        G_ort : 0,
        G_sonuc : 0,
        G_but : 0,
        G_ort2 : 0,
        G_sonuc2 : 0,

        isDeleted:false,
        createdAt:zaman,
        createdBy:user.kullaniciMail
      })

    });
    
    let satirNumaralariArray = []
    let currentCondition = ""
    
    
    // VIOLATION - IN CAME
    
    // if (is_mail_Violation) {
    //   satirNumaralariArray = violation_mail_ExcelRows
    //   satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
    //   return ({hata:true,hataYeri:"FONK // dersSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"mail adresi\" bilgisi kontrol edilmeli."});
    // }
    
    if (is_year_Violation) {
      satirNumaralariArray = violation_year_ExcelRows
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // dersSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"yıl\" bilgisi kontrol edilmeli, örn: \"2022-2023\""});
    }

    if (is_name_Violation) {
      satirNumaralariArray = violation_name_ExcelRows
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // dersSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"ders isim\" bilgisi kontrol edilmeli."});
    }

    
    
    
    // EXIST - IN DB
    
    if (is_fullName_Exist) {
      satirNumaralariArray = exist_fullName_ExcelRows
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // dersSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"ders\" sistemde mevcut."});
    }
    
    
    

    // EXIST - IN CAME
    
    if (is_fullName_Exist_inCame) {
      satirNumaralariArray = exist_fullName_ExcelRows_inCame
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // dersSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"ders\" bilgilerinde mükerrerlik var, kontrol ediniz."});
    }
    
    
    

    
    // ABSENT - IN DB
    
    if (is_branchName_Absent) {
      satirNumaralariArray = absent_branchName_ExcelRows
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // dersSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"şube\" bilgisi sistemde bulunamadı."});
    }

    if (is_ogretmenMail_Absent) {
      satirNumaralariArray = absent_ogretmenMail_ExcelRows
      satirNumaralariArray.length > 1 ? currentCondition = "kayıtlardaki" : currentCondition = "kayıttaki"
      return ({hata:true,hataYeri:"FONK // dersSave // MONGO-5",hataMesaj: satirNumaralariArray +  " numaralı " + currentCondition + " \"öğretmen mail\" bilgisi sistemde bulunamadı."});
    }


    
    let bulk = []
    
    if (cameItems_Add.length) {
      await cameItems_Add.map(item =>{
        bulk.push({
          updateOne: {
            filter: {fullName:item.fullName},
            update: { $set: {...item}}, // içeriği yukarıda ayarlandı
            upsert: true
          }
        });
      });
    }
    
    await collectionLessons.bulkWrite(bulk, { ordered: false });
    
    bulk2 = []
    
    // update: { $push: { lessons: {...item} }}, // içeriği yukarıda ayarlandı
            
    if (lessonsToStudents.length) {
      await lessonsToStudents.map(item =>{
        bulk2.push({
          updateMany: {
            filter: {year:item.year,isOgrenci:true,branch:item.branchName},
            // update: {  $set:  { [`lessons.${item.fullName}`] : {...item}  }}, // içeriği yukarıda ayarlandı
            update: { $push: { lessons: {...item} }}, // içeriği yukarıda ayarlandı
            upsert: false
          }
        });
      });
    }
    
    await collectionUsers.bulkWrite(bulk2, { ordered: false });
    
    
    return ({ok:true,mesaj:'Dersler sisteme kaydedildi.'})


    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // dersSave // MONGO-4",hataMesaj:err.message});
  }
    
};