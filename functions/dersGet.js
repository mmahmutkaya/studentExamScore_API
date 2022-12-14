exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let isDerslerim = false
  
  let projeData
  
  const collectionUsers = context.services.get("mongodb-atlas").db("studentExamScore").collection("users")
  const userArray = await collectionUsers.find({}).toArray()
  
  const collectionLessons = context.services.get("mongodb-atlas").db("studentExamScore").collection("lessons")


  // MONGO-1 - Gelen Sorgu
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // dersGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // dersGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // dersGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    // Is-Derslerim Sorgusu
    if(objHeader.hasOwnProperty('Is-Derslerim')) {
      if (objHeader["Is-Derslerim"][0] = true) {
        isDerslerim = true
      }
    }


  } catch (err){
    return ({hata:true,hataYeri:"FONK // dersGet // MONGO-1",hataMesaj:err.message})
  }
  
  
  
  
  
  // MONGO-2 - AUTH_CHECK
  let user;

  AUTH_CHECK: try {
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    user = await userArray.find(x => x.kullaniciMail == kullaniciMail)
    if(!user) return ({hata:true,hataYeri:"FONK // dersGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // dersGet",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // dersGet",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // dersGet",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(user.hasOwnProperty("isAdmin")) {
      if(user.isAdmin) break AUTH_CHECK
    }
    
    if(user.hasOwnProperty("isOgretmen")) {
      if(user.isOgretmen) break AUTH_CHECK
    }
    
    return ({hata:true,hataYeri:"FONK // dersGet",hataMesaj:"Kayıtlı dersleri görmeye yetkiniz bulunmuyor."})
    
    // kontroller
    // if(tur == "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes["okuma"].includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // dersGet",hataMesaj:"İlgili ihalenin mahal-poz eşleşmelerini görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    // if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].okuma.includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // dersGet",hataMesaj:"İlgili pozun \"" + tur + "\" metrajlarını görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    // if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo > 0) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // dersGet",hataMesaj:"İlgili iş paketi \""+ tur +"\" metrajı girmek için kapalı durumda, program sorumlusu ile iletişime geçebilirsiniz."})
    // if (tur !== "tanimla") {
    //   guncelNo = projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo
    // }


  } catch(err) {
    return ({hata:true,hataYeri:"FONK // dersGet // MONGO-2",hataMesaj:err.message})
  }
  
  
  // MONGO-3 - GET DATA FROM DB
  try {
    
    let ogretmenler = {}
    
    var userArrayClone = JSON.parse(JSON.stringify(userArray));
    
    const ogretmenlerA = await userArrayClone.map(x=>{
      
      if(x.hasOwnProperty("isOgretmen")) {
      
        isOgretmen = x.isOgretmen
        
        if (isOgretmen && !ogretmenler.hasOwnProperty(x.kullaniciMail)) {

          return {
            no:x.ogretmenNo,
            name:x.name,
            surname:x.surname,
          }
          
        } 
      }
      
    })  
    
    // boş object leri kaldırma
    ogretmenler = ogretmenlerA.filter( x => {
      if (x !== null && x !== undefined) {
        if (Object.entries(x).length > 0) {
          return true
        } else {
          false
        }
      }
    })
            

    // burda da bitebilir
    if (isDerslerim) {
      const objArray = await collectionLessons.find({isDeleted:false, ogretmenNo:user.ogretmenNo}).toArray()
      return ({ok:true,mesaj:'Veriler alındı.',data:objArray, ogretmenler})
    }
    
    // yukarıda bitmezsse, yani   derslerim değilse buraya gelecek, burad bitecek - tüm dersler göderilecek
    const objArray = await collectionLessons.find({isDeleted:false}).toArray()
    return ({ok:true,mesaj:'Veriler alındı.',data:objArray,ogretmenler})

    

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // dersGet // MONGO-3",hataMesaj:err.message})
  }      
  

 
    
};