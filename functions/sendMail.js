// exports('mmahmutkaya@gmail.com','başlık','bu da mesaj')
// kkiivcrjbsduexdy
exports = function(email,konu,mesaj){
  
  const validateEmail = context.functions.execute("validateEmail", email);
  if(validateEmail == null) return ({hata:true,hataYeri:"Fonksiyon - sendMail",hataMesaj:"Mail adresinin doğruluğunu kontrol ediniz."})
    
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: '360.taksim.360@gmail.com',
          pass: 'kkiivcrjbsduexdy'
      }
  });
  
  
  async function send() {
      const result = await transporter.sendMail({
          from: '360.taksim.360@gmail.com',
          to: email,
          subject: konu,
          text: mesaj
      });
  
      // console.log(JSON.stringify(result, null, 4));
      return (JSON.stringify(result, null, 4))
  }
  
  try{
    return send()
  } catch(err){
    return ({hata:true,hataYeri:"FONK // sendMail",hataMesaj:'sendMail --> ' + err.message})
  }
  
  
};