exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey
  let sorguTuru
  
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // updateMessages",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // updateMessages",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // updateMessages",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    if(!objHeader.hasOwnProperty('Sorgu-Turu')) return ({hata:true,hataYeri:"FONK // updateMessages",hataMesaj:"Gelen sorguda \"Sorgu-Turu\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    sorguTuru = objHeader["Sorgu-Turu"][0];
    if(sorguTuru.length == 0) return ({hata:true,hataYeri:"FONK // updateMessages",hataMesaj:"Gelen sorguda \"Sorgu-Turu\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})


  } catch (err){
    return ({hata:true,hataYeri:"FONK // updateMessages // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  let user;

  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("excelChat").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // updateMessages",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // updateMessages",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    // if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // updateMessages",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // updateMessages",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
  } catch(err) {
    return ({hata:true,hataYeri:"FONK // updateMessages // MONGO-2",hataMesaj:err.message})
  }
  
      
    
  // MONGO-4a - gelen veri işlemleri - body kısmında veri var mı?
  let gelenItems
  
  Fonk_gelenItems: try{
    if (sorguTuru !== "POST") break Fonk_gelenItems
    gelenItems = JSON.parse(request.body.text());
  } catch(err){
    return ({hata:true,hataYeri:"FONK // updateMessages // MONGO-4a",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
    
  
  // let zaman = Date(Date.now()).toString()

  // MONGO-5 - DEFINE (TANIMLAMA) METRAJ NODES YAPILACAKSA - (METRAJ / TUR (KEŞİF, HAKEDİŞTALEP / HAKEDİŞONAY - DEĞİL)
  Fonk_updateMessages: try {
    
    if (sorguTuru !== "POST") break Fonk_updateMessages;
    
    if (gelenItems.length === 0) break Fonk_updateMessages; // bir üstte bakıldı ama genelde burda olur, usulen kalsın
    
    // return "11"
    

    // let yazmaYetkisiProblemi_updateMessages = false
    // let isKayitYapilabilirProblemi_updateMessages = false
    
    
    // database deki collection belirleyelim
    const collectionMessages = context.services.get("mongodb-atlas").db("excelChat").collection("messages")
    
    let gelenItems_sil = []
    let gelenItems_ekle = []

    await gelenItems.map(item => {
      
      
      if (item.dbIslem == "ekle") {
        
        gelenItems_ekle.push({
          message:item.message,
          isDeleted:false,
          createdBy:kullaniciMail,
        });
        
      }
      
    })



    
    let bulk = []
    
    // DATABASE - silme - "tanimla"
    if (gelenItems_ekle.length) {
      
      await gelenItems_ekle.map(item =>{
        
        bulk.push({
          insertOne: {
            ...item
          }
        });

      });
      
    }
    

    await collectionMessages.bulkWrite(bulk, { ordered: false });
    
    return({ok:true,mesaj:"Kayıt işlemleri yapıldı."});
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // updateMessages // MONGO-5",hataMesaj:err.message});
  }
  
  

    
    
  // MONGO-6 - VERİLERİ DB DEN ALMA
  Fonk_GET: try {
    
    if (sorguTuru !== "GET") {
      return({ok:true,mesaj:"Get sorgusu değil"});
    }

    // DATABASEDEKİ VERİLERİ GÖNDERELİM
    const collectionMessages = context.services.get("mongodb-atlas").db("excelChat").collection("messages");
    const mongoReply = await collectionMessages.find(
      {isDeleted:false},
      {message:1,year:1,createdBy:1,createdAt: { $toDate: "$_id" }}
      // {_id:1,pozId:1,mahalId:1,"kesif.nodeMetraj":1,"hakedisTalep.nodeMetraj":1,"hakedisOnay.nodeMetraj":1}
    ).sort({ _id: 1 }).limit(100).toArray();
    
    // mongoReplyDivided en sona koymalısın, çünkü excelde bütün veri text olarak alınıyor mongoReplyDivided dan sonra ve en sondaki işaretler ile veri elde ediliyor
    return({ok:true,mesaj:"Veriler alındı.",mongoReply});
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // updateMessages // MONGO-6",hataMesaj:err.message});
  }        
  
    

    
};