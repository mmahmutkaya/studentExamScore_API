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
  let gelenItems
  
  try{
    gelenItems = JSON.parse(request.body.text());
  } catch(err){
    return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-4a",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
    
  

  
  
  // MONGO 4b - sorgu yaparken kullanacağız, yukarıda okuma yetkisine bakılmıştı
  let mahalIds = [] 
  try {
    
    if (gelenItems.length === 0) return ({hata:true,hataTanim:"bosSorgu",hataYeri:"FONK // ogrenciSave",hataMesaj:"Mahal poz elşetirmesi için en az bir mahal adı vermeniz gerekiyor fakat sorgunuz herhangi bir mahal adı içermiyor, ekranınızda mahal olduğu halde bu uyarıyı alıyorsanız program sorumlusu ile irtibata geçiniz."})
    
    await gelenItems.map(item => {
      if (item.dbIslem === "tumMahaller") {
          mahalIds.push(
          new BSON.ObjectId(item.mahalId)
        );
      }
    })
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-4b",hataMesaj:err.message})
  }
  
  
  
  let zaman = Date.now()

  // MONGO-5 - DEFINE (TANIMLAMA) METRAJ NODES YAPILACAKSA - (METRAJ / TUR (KEŞİF, HAKEDİŞTALEP / HAKEDİŞONAY - DEĞİL)
  Fonk_Define: try {
    
    if (sorguTuru !== "POST") break Fonk_Define;
    
    if (gelenItems.length === 0) break Fonk_Define; // bir üstte bakıldı ama genelde burda olur, usulen kalsın
    
    if (tur !== "tanimla") break Fonk_Define
    
    // return "11"
    

    let yazmaYetkisiProblemi_define = false
    let isKayitYapilabilirProblemi_define = false
    
    
    // database deki collection belirleyelim
    const collection = context.services.get("mongodb-atlas").db("studentExamScore").collection("metrajNodes")
    
    let gelenItems_sil = []
    let gelenItems_ekle = []

    await gelenItems.map(item => {
      
      
      if (item.tur == "tanimla" && item.dbIslem === "sil") {
        
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes["yazma"].includes(kullaniciMail)) {
          yazmaYetkisiProblemi_define = true;
        }
        
        // genel olarak kayıt izni var mı?
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes.isKayitYapilabilir) {
          isKayitYapilabilirProblemi_define = true
        }
        
        gelenItems_sil.push({
          mahalId:item.mahalId,
          pozId:item.pozId,
          isDeleted:zaman,
          deletedAt:zaman,
          deletedBy:kullaniciMail,
        });
        
      }
      
      
      if (item.tur == "tanimla" && item.dbIslem === "ekle") {
        
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes["yazma"].includes(kullaniciMail)) {
          yazmaYetkisiProblemi_define = true
        }
        
        // genel olarak kayıt izni var mı?
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes.isKayitYapilabilir) {
          isKayitYapilabilirProblemi_define = true
        }
        

        // if (typeof item.sira === "string") {
        //   if (item.sira.length === 0) {
        //     checkSira_Ekle = true
        //   }
        // }
        
        // if (typeof item.sira === "number") {
        //   if (!item.sira > 0) {
        //     checkSira_Ekle = true
        //   }
        // }

        // if (typeof item.isim === "string") {
        //   if (item.isim.length === 0) {
        //     checkIsim_Ekle = true
        //   }
        // }
        
        // if (typeof item.isim === "string") {
        //   if (item.isim === "...") {
        //     checkIsim_Ekle = true
        //   }
        // }
        
        // if (typeof item.isim === "number") {
        //   if (!item.isim > 0) {
        //     checkIsim_Ekle = true
        //   }
        // }
        
        
        gelenItems_ekle.push({
          ...item,
          mahalId:new BSON.ObjectId(item.mahalId),
          pozId:new BSON.ObjectId(item.pozId),
          ihaleId:new BSON.ObjectId(ihaleId),
          kesif:{mevcutVersiyonlar:[],nodeMetraj:0}, //silinemezler sorgusunda bu object properties var mı yok mu diye bakıyoruz
          hakedisTalep:{mevcutVersiyonlar:[],nodeMetraj:0},  //silinemezler sorgusunda bu object properties var mı yok mu diye bakıyoruz
          hakedisOnay:{mevcutVersiyonlar:[],nodeMetraj:0},  //silinemezler sorgusunda bu object properties var mı yok mu diye bakıyoruz
          proje,
          versiyon,
          isDeleted:false,
          createdAt:zaman,
          createdBy:kullaniciMail,
        });

      }
      
    });
    
    
 
    if (isKayitYapilabilirProblemi_define) return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj:"İlgili ihalenin şu anda mahal-poz eşleştirmesi veri güncellemesine açık değil fakat \"YENİLE\" tuşuna basarak mevcut eşleştirmeleri görebilirsiniz."});
    if (yazmaYetkisiProblemi_define) return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj:"İlgili alana keşif metraj kaydetme yetkiniz bulunmuyor."});



    // METRAJ SATIRI VARSA SİLİNMESİN
    // Silinemeycek dolu MetrajNodes ları tespit etme
    const collectionMetrajNodes = context.services.get("mongodb-atlas").db("studentExamScore").collection("metrajNodes")
    let silinemezler1 = []
    if (gelenItems_sil.length) {
      silinemezler1 = await collectionMetrajNodes.find(
        // {ihaleId:new BSON.ObjectId(ihaleId),isDeleted:false },
        // {ihaleId:new BSON.ObjectId(ihaleId),isDeleted:false,["hakedisTalep.mevcutVersiyonlar"]:{$ne: []},["hakedisOnay.mevcutVersiyonlar"]:{$ne: []},["kesif.mevcutVersiyonlar"]:{$ne: []} },
        {ihaleId:new BSON.ObjectId(ihaleId), $or: [{"kesif.mevcutVersiyonlar":{ $gt: -Infinity }},{"hakedisTalep.mevcutVersiyonlar":{ $gt: -Infinity }},{"hakedisOnay.mevcutVersiyonlar":{ $gt: -Infinity }}]},
        {pozId:1,mahalId:1,mahalParentName:1,mahalKod:1,pozNo:1,'_id': false}
      ).toArray();
    }
    
    // return({ok:true,mesaj:"Güncellemeler yapıldı.",silinemezler1});
    
    let silinemezler =[]
    if (gelenItems_sil.length) {
      await gelenItems_sil.map(item => {
        if (silinemezler1.find(x => x.mahalId == item.mahalId && x.pozId == item.pozId)) {
          silinemezler.push(item)
        }
      })
    }
    // return silinemezler
    // örnek olarak db bir tane silinemez bilgileri alalım
    
    if (silinemezler.length) {
      const silinemez = await collectionMetrajNodes.findOne({mahalId:new BSON.ObjectId(silinemezler[0].mahalId),pozId:new BSON.ObjectId(silinemezler[0].pozId)})
      return ({hata:true,hataYeri:"FONK // ogrenciSave",hataMesaj:silinemez.pozNo + " - numaralı poz ile " + silinemez.mahalParentName + " - " + silinemez.mahalKod + " nolu mahalin eşleştirmesini kaldırmak için öncelikle bu eşleşmeye ait mevcut metrajları silmelisiniz."}) 
    }


    // // DATABASE - silme - "tanimla"
    // if (gelenItems_sil.length) {
    //   await gelenItems_sil.map(item =>{
    //     collection.findOneAndUpdate(
    //       {mahalId:new BSON.ObjectId(item.mahalId),pozId:new BSON.ObjectId(item.pozId)},
    //       { $set: {isDeleted:zaman, isDeletedBy:user.kullaniciMail}},
    //       { upsert: false, new: true }
    //     );
    //   });
    // }
    
    let bulk = []
    
    // DATABASE - silme - "tanimla"
    if (gelenItems_sil.length) {
      await gelenItems_sil.map(item =>{
        bulk.push({
          updateOne: {
            filter: {mahalId:new BSON.ObjectId(item.mahalId),pozId:new BSON.ObjectId(item.pozId)},
            update: { $set: {isDeleted:zaman, isDeletedBy:user.kullaniciMail}}
          }
        });
      });
    }
    // await collection.bulkWrite(bulk, { ordered: false });
    
    // DATABASE - ekleme - "tanimla"
    if (gelenItems_ekle.length) {
      await gelenItems_ekle.map(item =>{
        
        bulk.push({
          updateOne: {
            filter: {mahalId:item.mahalId,pozId:item.pozId},
            update: { $set: {...item}}, // içeriği yukarıda ayarlandı
            upsert: true
          }
        });
        
        // collection.findOneAndUpdate(
        //   {mahalId:item.mahalId,pozId:item.pozId},
        //   { $set: {...item}}, // içeriği yukarıda ayarlandı
        //   { upsert: true, new: true }
        // );
        
      });
    }
    await collection.bulkWrite(bulk, { ordered: false });
    
    
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj:err.message});
  }
  
  

  
  

  // MONGO-6 - TUR (KEŞİF, HAKEDİŞTALEP / HAKEDİŞONAY) YAPILACAKSA  --  YUKARIDA DEFINE (TANIMLAMA) METRAJ NODES YAPILMIŞTI
  Fonk_Tur: try {
    
    if (sorguTuru !== "POST") break Fonk_Tur;
    
    if (gelenItems.length === 0) break Fonk_Tur; // bir üstte bakıldı ama genelde burda olur, usulen kalsın
    
    if (tur == "tanimla") break Fonk_Tur
    
    // return "11"
    
    const collectionPozlar = context.services.get("mongodb-atlas").db("studentExamScore").collection("pozlar")
    const mahal_poz_pozIds = await collectionPozlar.find({ihaleId:new BSON.ObjectId(ihaleId),metrajTip:"mahal_poz",isDeleted:false},{"_id":1}).toArray()

    const collectionMetrajNodes = context.services.get("mongodb-atlas").db("studentExamScore").collection("metrajNodes")

    let yazmaYetkisiProblemi_tur = false
    let isKayitYapilabilirProblemi_tur = false
    
    
    // database deki collection belirleyelim
    const collection = context.services.get("mongodb-atlas").db("studentExamScore").collection("metrajNodes")
    
    let gelenItems_sil_mahal_poz = []
    let gelenItems_ekle_mahal_poz = []
    let gelenItems_pozMetrajGuncelle = []
    
    await gelenItems.map(item => {
      
      

      if (item.tur == tur && item.dbIslem === "pozMetrajGuncelle") {
        const collectionPozlar = context.services.get("mongodb-atlas").db("studentExamScore").collection("pozlar")
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur]["yazma"].includes(kullaniciMail)) {
          yazmaYetkisiProblemi_tur = true
        }
        
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].isKayitYapilabilir) {
          isKayitYapilabilirProblemi_tur = true
        }
        
        gelenItems_pozMetrajGuncelle.push({
          pozId:item.pozId,
          pozMetraj:item.pozMetraj
        });

      }
      

      if (item.tur == tur && item.dbIslem === "sil") {
        
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur]["yazma"].includes(kullaniciMail)) {
          yazmaYetkisiProblemi_tur = true
        }
        
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].isKayitYapilabilir) {
          isKayitYapilabilirProblemi_tur = true
        }
        
        gelenItems_sil_mahal_poz.push({
          mahalId:item.mahalId,
          pozId:item.pozId,
          ihaleId:ihaleId,
          pozNo:item.pozNo
        });

      }
      


      if (item.tur == tur && item.dbIslem === "ekle") {
        
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur]["yazma"].includes(kullaniciMail)) {
          yazmaYetkisiProblemi_tur = true
        }
        
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].isKayitYapilabilir) {
          isKayitYapilabilirProblemi_tur = true
        }
        
        gelenItems_ekle_mahal_poz.push({
          // mahalId:new BSON.ObjectId(item.mahalId),
          // pozId:new BSON.ObjectId(item.pozId),
          // ihaleId:new BSON.ObjectId(ihaleId),
          mahalId:item.mahalId,
          pozId:item.pozId,
          ihaleId:ihaleId,
          nodeMetraj:item.nodeMetraj,
          pozNo:item.pozNo
        });

      }
      
      
      
    });
    
    

    if (isKayitYapilabilirProblemi_tur) return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj:"İlgili ihale şu anda \"" + tur + "\" metraj girişine açık değil fakat \"YENİLE\" tuşuna basarak varsa mevcut \"" + tur + "\" metrajlarını görebilirsiniz."});
    if (yazmaYetkisiProblemi_tur) return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-5",hataMesaj:"İlgili alana  \"" + tur + "\" metraj kaydetme yetkiniz bulunmuyor."});
    
    
     
    
    // kontrol - poz uygun mu mahal_poz ile metraj girmeye
    let silinemez_mahal_pozIds = []
    if (gelenItems_sil_mahal_poz.length) {
      await gelenItems_sil_mahal_poz.map(item => {
        if (!mahal_poz_pozIds.find(x => x._id.toString() == item.pozId )) {
        // if (!mahal_poz_pozIds.find(x => x._id == item.pozId )) {
          silinemez_mahal_pozIds.push(item)
        }
      })
    }
    
    if (silinemez_mahal_pozIds.length) {
      return ({hata:true,hataYeri:"FONK // ogrenciSave",hataMesaj: silinemez_mahal_pozIds[0].pozNo + " - numaralı pozun metranısı silmek için \"standart\" metraj sayfalarını kullanmalısınız."}) 
    }
    
    // return gelenItems_sil_mahal_poz
    
    
    // kontrol - poz uygun mu mahal_poz ile işlenmeye
    let eklenemez_mahal_pozIds = []
    if (gelenItems_ekle_mahal_poz.length) {
      await gelenItems_ekle_mahal_poz.map(item => {
        if (!mahal_poz_pozIds.find(x => x._id.toString() == item.pozId )) {
        // if (!mahal_poz_pozIds.find(x => x._id == item.pozId )) {
          eklenemez_mahal_pozIds.push(item)
        }
      })
    }
    
    if (eklenemez_mahal_pozIds.length) {
      return ({hata:true,hataYeri:"FONK // ogrenciSave",hataMesaj: eklenemez_mahal_pozIds[0].pozNo + " - numaralı poza metraj eklemek için \"standart\" metraj sayfalarını kullanmalısınız."}) 
    }



    let bulk = []
    
    // DATABASE - poz Metraj Güncelleme
    if (gelenItems_pozMetrajGuncelle.length) {
      
      gelenItems_pozMetrajGuncelle.map(x =>{
        
        bulk.push({
          updateOne: {
            filter: {_id:new BSON.ObjectId(x.pozId)},
            update: { $set: { ["metraj." + tur ]: x.pozMetraj } },
            // upsert: true
          }
        });

        // collectionPozlar.findOneAndUpdate(
        //   {_id:new BSON.ObjectId(x.pozId)},
        //   { $set: { ["metraj." + tur ]: x.pozMetraj } }
        //   // {upsert:true} - bu poz zaten var olmalı
        //   // { $addToSet: { ["metrajSatirlari"]: {$each : eklenecekObjeler2} } }
        //   // { $set: {[objArrayName]:item.objeler}}
        //   // {$addToSet: { [objArrayName]: item.objeler} }
        //   // { $push: { [objArrayName]: {$each : item.objeler} } }
        // );
        
      });
    }
    
    await collectionPozlar.bulkWrite(bulk, { ordered: false });
    
    bulk = []
    
    // DATABASE - silme - tur metrajları
    if (gelenItems_sil_mahal_poz.length) {
      await gelenItems_sil_mahal_poz.map(item =>{
        
        
        bulk.push({
          updateOne: {
            filter: {mahalId:new BSON.ObjectId(item.mahalId), pozId:new BSON.ObjectId(item.pozId),ihaleId:new BSON.ObjectId(item.ihaleId)},
            update: { $unset: { [tur + "." + guncelNo] :""}, $set: { [tur + ".nodeMetraj"]:0},$pull:{[tur +".mevcutVersiyonlar"]: guncelNo  } },
            // upsert: true
          }
        });

        // collectionMetrajNodes.updateOne(
        //   {mahalId:new BSON.ObjectId(item.mahalId), pozId:new BSON.ObjectId(item.pozId),ihaleId:new BSON.ObjectId(item.ihaleId)},
        //   // {mahalId:item.mahalId, pozId:item.pozId,ihaleId:ihaleId},
        //   { $unset: { [tur + "." + guncelNo] :""}, $set: { [tur + ".nodeMetraj"]:0},$pull:{[tur +".mevcutVersiyonlar"]: guncelNo  } },
        // );
          
      });
    }
    
          
    // return gelenItems_ekle_mahal_poz
    
    
    // DATABASE - ekleme - tur metrajları
    if (gelenItems_ekle_mahal_poz.length) {
      await gelenItems_ekle_mahal_poz.map(item => {
        
        
        bulk.push({
          updateOne: {
            filter: {mahalId:new BSON.ObjectId(item.mahalId), pozId:new BSON.ObjectId(item.pozId),ihaleId:new BSON.ObjectId(ihaleId)},
            update: { $set: { [tur + "." + guncelNo] : item.nodeMetraj, [tur + ".nodeMetraj"]:item.nodeMetraj}, $push:{[tur +".mevcutVersiyonlar"]: guncelNo }},
            // upsert: true
          }
        });
        
        
        // collectionMetrajNodes.updateOne(
        //   {mahalId:new BSON.ObjectId(item.mahalId), pozId:new BSON.ObjectId(item.pozId),ihaleId:new BSON.ObjectId(ihaleId)},
        //   // {mahalId:item.mahalId, pozId:item.pozId,ihaleId:ihaleId},
        //   // { $set: { [tur + "." + guncelNo] : item.eklenecekObjeler}, $push:{[tur +".mevcutVersiyonlar"]: guncelNo }
        //   { $set: { [tur + "." + guncelNo] : item.nodeMetraj, [tur + ".nodeMetraj"]:item.nodeMetraj}, $push:{[tur +".mevcutVersiyonlar"]: guncelNo }}
        //   // {upsert:true}
        //   // { $addToSet: { ["metrajSatirlari"]: {$each : eklenecekObjeler2} } }
        //   // { $set: {[objArrayName]:item.objeler}}
        //   // {$addToSet: { [objArrayName]: item.objeler} }
        //   // { $push: { [objArrayName]: {$each : item.objeler} } }
        // )
        
      })
    }
    
    await collection.bulkWrite(bulk, { ordered: false });
    
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-6",hataMesaj:err.message});
  }
  
  

    
    
    
  // MONGO-7 - VERİLERİ DB DEN ALMA
  Fonk_GET: try {
    
    if (sorguTuru !== "GET") {
      return({ok:true,mesaj:"Kayıt işlemleri yapıldı."});
    }
    // return mahalIds
    
    // boş objelerden arındırmak için
    // var mahalIds2 = await mahalIds.filter(value => Object.keys(value).length !== 0);
    // var mahalIds2 = await mahalIds.filter(value => JSON.stringify(value) !== '{}');
    
    // const mahalIds2 = [
    //     new BSON.ObjectId("63270b97935be48edfa00744"),
    //     new BSON.ObjectId("63270b97935be48edfa00743"),
    // ]
    
    // DATABASEDEKİ VERİLERİ GÖNDERELİM
    const collection = context.services.get("mongodb-atlas").db("studentExamScore").collection("metrajNodes");
    const mongoReply = await collection.find(
      {isDeleted:false,proje,versiyon,mahalId : {"$in" : mahalIds}}, // mahalIds - yukarıda gelen sorgu analiz edilirken yapıldı
      {_id:1,pozId:1,mahalId:1,"kesif.nodeMetraj":1,"hakedisTalep.nodeMetraj":1,"hakedisOnay.nodeMetraj":1}
    ).toArray();
    
    // function sliceIntoChunks(arr, chunkSize) {
    //   const res = [];
    //   for (let i = 0; i < arr.length; i += chunkSize) {
    //       const chunk = arr.slice(i, i + chunkSize);
    //       res.push(chunk);
    //   }
    //   return res;
    // }
    
    
    // const sliceIntoChunks = (arr, chunkSize) => {
    //     const res = [];
    //     for (let i = 0; i < arr.length; i += chunkSize) {
    //         const chunk = arr.slice(i, i + chunkSize);
    //         res.push(chunk);
    //     }
    //     return res;
    // }
    
    // const mongoReplyDivided = await sliceIntoChunks(mongoReply, 100)
    
    // mongoReplyDivided en sona koymalısın, çünkü excelde bütün veri text olarak alınıyor mongoReplyDivided dan sonra ve en sondaki işaretler ile veri elde ediliyor
    return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply});
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // ogrenciSave // MONGO-7",hataMesaj:err.message});
  }        
  
    

    
};