const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PanelUserSchema = new Schema(
  {
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    created_at:{
        type:Number
    }


  },
  
);

PanelUserSchema.pre('save', function(next) {
  var dt = new Date()        
  this.created_at = dt.getTime()
  next();
});




const PanelUser = mongoose.model('PanelUser' , PanelUserSchema);

module.exports = PanelUser;