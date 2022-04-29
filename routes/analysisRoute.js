const { default: axios } = require("axios")
const Prediction = require("../models/PredictionModel")
const router = require("express").Router()
const multer = require('multer')
var jwt = require('jsonwebtoken');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {

        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {

        cb(null,file.originalname )

    }
});

var upload = multer({ storage: storage });


router.get("/analysis-token", async (req,res) => {
    const {analysis_code} = req.query
    var responseObject = {}
    try{
        const analysis = await Prediction.findOne({analysis_code})
        if(analysis){            
            var token = jwt.sign({analysis_code:analysis.analysis_code, model_file_path:analysis.model_file_path}, 'secret');
            responseObject["data"] = token
            responseObject["error"] = null
            responseObject["success"] = true
            

        }
        else{
            responseObject["data"] = null
            responseObject["error"] = "Analiz bulunamadı"
            responseObject["success"] = false

        }
    }
    catch(e){
        responseObject["data"] = null
        responseObject["error"] = e.toString()
        responseObject["success"] = false

    }

    res.json(responseObject)
    

})

router.post("/get-prediction", async (req, res) => {
    
    var r_api_data_object = {}
    const { analysis_code } = req.query
    console.log(analysis_code)
    
   

    try {
        const analysis = await Prediction.findOne({ analysis_code })
        console.log(analysis)
        var independent_variables_names = []
        var independent_variables_values = []
        var numeric_type_column_names = []
        var categoric_type_column_names = []
        var response_predictions_list = []    


        analysis.independent_variables.forEach(ivar => {
            if (!ivar.is_categoric) {
                numeric_type_column_names.push(ivar.name)
            }
            else{
                categoric_type_column_names.push(ivar.name)
            }
            
            independent_variables_names.push(ivar.name)
            independent_variables_values.push(req.body.data[ivar.name])

        })
      
      
        r_api_data_object["independent_variable_names"] = independent_variables_names
        r_api_data_object["independent_variable_values"] = independent_variables_values
        r_api_data_object["numeric_variable_column_names"] = numeric_type_column_names
        r_api_data_object["categoric_variable_column_names"] = categoric_type_column_names                
        r_api_data_object["model_file_path"] = analysis.model_file_path




        const response = await axios({
            method: "post",
            url: "http://localhost:8000/predict",
            data: r_api_data_object,
            headers: { "Content-Type": "application/json" },
        })

        console.log(JSON.parse(response.data))
        var dependent_variable_categories = []

        analysis.dependent_variables[0].categories.forEach(category => {
            dependent_variable_categories.push(category)
        })
        JSON.parse(response.data).forEach(predicition => {
            
            Object.keys(predicition).forEach(key => {
                if(dependent_variable_categories.includes(key)){
                    var tmp_pred_list = []
                    tmp_pred_list.push(key.trim())
                    tmp_pred_list.push(predicition[key])
                    response_predictions_list.push(tmp_pred_list)
                }
              
            });
            
        })
        



        console.log("bura")
        console.log(response_predictions_list)
        res.json(response_predictions_list)

    } catch (e) {
        console.log(e.toString())
    }
})

router.post("/get-multiple-prediction", async (req,res) => {
    const {analysis_code} = req.query
    const data = req.body.data
    var numeric_variable_names = []
    var categoric_variable_names = []
    var independent_variable_names = []
    var request_data_object = {}
    var prediction_categories = []
    var response_object = {}

    

    try{       

        const analysis = await Prediction.findOne({ analysis_code })

        analysis.independent_variables.forEach(variable => {
            if(!variable.is_categoric){
                numeric_variable_names.push(variable.name)
            }  
            else{
                categoric_variable_names.push(variable.name)
            }
            independent_variable_names.push(variable.name)          
        })

        analysis.category_image_map_list.forEach(cim => {
          prediction_categories.push(cim.category)  
        })

     

        request_data_object["numeric_variable_names"] = numeric_variable_names
        request_data_object["independent_variable_names"] = independent_variable_names
        request_data_object["categoric_variable_names"] = categoric_variable_names
        request_data_object["data"] = data.inputs
        request_data_object["model_file_path"] = analysis.model_file_path




        const response = await axios({
            method: "post",
            url: "http://localhost:8000/predict-multiple",
            data: request_data_object,
            headers: { "Content-Type": "application/json" },
        })

        response_object["analysis"] = analysis
        response_object["predictions"] = JSON.parse(response.data[0])
        console.log(response_object)
        return res.json(response_object)
                                           
    }   
    catch(e){
        console.log(e)
    }
    
    

    
    
})


router.get("/get-analysis", async (req, res) => {
    const { analysis_code } = req.query
    const analysis = await Prediction.findOne({ analysis_code })

    res.json(analysis)
})

router.get("/analysis-ready", async (req, res) => {
    const { analysis_code, best_model, model_path, accuracy } = req.query
    console.log(analysis_code)
    try {
        await Prediction.findOneAndUpdate({ analysis_code }, { is_model_ready: true, best_model, model_file_path:model_path,accuracy:(parseFloat(accuracy)*100) })
    }
    catch (e) {
        console.log(e.toString())
    }
    res.json({ ok: "ok" })
})

router.get("/all-analysis", async (req, res) => {

    var responeObject = {}

    try {
        const analysis = await Prediction.find()
        responeObject["success"] = true
        responeObject["error"] = null
        responeObject["data"] = analysis


    }
    catch (e) {
        responeObject["success"] = false
        responeObject["error"] = e.toString()
        responeObject["data"] = null

    }

    res.json(responeObject)
})

router.get("/delete-analysis", async (req, res) => {
    const { id } = req.query
    var responseObject = {}

    try {
        await Prediction.findByIdAndDelete(id)
        responseObject["success"] = true
        responseObject["error"] = null
    }
    catch (e) {
        responseObject["success"] = false
        responseObject["error"] = e.toString()
    }


    res.json(responseObject)
})

router.post("/new-analysis", upload.array("images"), async (req, res) => {
    var responseObject = {}

    //R BACKEND DATA
    const data = JSON.parse(req.body["data"])
    const dependent_variable = JSON.parse(req.body["dependent_variable"])
    const categoric_variables = JSON.parse(req.body["categoric_variables"])
    const numeric_variables = JSON.parse(req.body["numeric_variables"])
    //R BACKEND DATA


    const analysis_code = req.body["analysis_code"]
    const variables = JSON.parse(req.body["variables"])
    const dependent_variables = JSON.parse(req.body["dependent_variables"])
    const independent_variables = JSON.parse(req.body["independent_variables"])
    const category_image_map_list = JSON.parse(req.body["category_image_map_list"])

    var categoric_variable_names = []
    console.log(independent_variables)
    console.log(data)

    if(independent_variables.length > 0){
        independent_variables.forEach(iv => {
            if(iv.is_categoric){
                categoric_variable_names.push(iv.name)
            }
            
        })     
    }   
    
    console.log(categoric_variable_names)

    axios.post("http://localhost:8000/train", { data, dependent_variable, numeric_variables, categoric_variables, analysis_code, categoric_variable_names })

    try {
        const newPrediction = new Prediction(
            {
                analysis_code,
                variables,
                dependent_variables,
                independent_variables,
                category_image_map_list,                
                is_model_ready: false
            }
        )

        await newPrediction.save()

        responseObject["succes"] = true
        responseObject["error"] = null

    }
    catch (e) {
        responseObject["succes"] = false
        responseObject["error"] = e.toString()
    }

    res.json(responseObject)


})

module.exports = router