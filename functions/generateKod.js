// kaç karakter oluşturmak istiyorsak o sayıyı gönderiyoruz
exports = function(length){
  
    var result           = '';
    var characters       = '123456789';
    // var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() *  charactersLength));
   }
   return result;

};