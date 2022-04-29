const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PredictionSchema = new Schema(
  {
    analysis_code:{
      type:String
    },
    category_image_map_list:[

    ], 
    is_model_ready:{
        type:Boolean
    },
    variables:[],
    dependent_variables:[],
    independent_variables:[],
    model_file_path:{
      type:String
    },
    created_at_shown:{
      type:String
    },
    created_at:{
      type:Number
    },
    accuracy:{
      type:Number
    },
    best_model:{
      type:String
    }
  },
  
);

PredictionSchema.pre('save', function(next) {
  var dt = new Date()
  var day = dt.getDay();
  var month = dt.getMonth();
  var year = dt.getFullYear();
  this.created_at_shown = `${day}/${month}/${year}`
  this.created_at = dt.getTime()
  next();
});




const Prediction = mongoose.model('Prediction' , PredictionSchema);

module.exports = Prediction;