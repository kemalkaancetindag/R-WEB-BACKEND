const { default: axios } = require("axios")
const router = require("express").Router()
var jwt = require('jsonwebtoken');
const crypto = require('crypto')
const PanelUser = require("../models/PanelUser");


router.get("/get-user",async (req,res) => {
    const {username,password} = req.query
    var responseObject = {}

    try{
        const hashed_password = crypto.createHmac('sha256', "secret")
                   .update(password)
                   .digest('hex');
        const panel_user = await PanelUser.findOne({username,hashed_password})

        if(panel_user){
            var token = jwt.sign({username:panel_user.username},"secret")
            responseObject["data"] = token
            responseObject["error"] = null
            responseObject["success"] = true
        }
        else{
            responseObject["data"] = null
            responseObject["error"] = "Kullanıcı Bulunamadı"
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

router.post("/create-user", async (req,res) => {
    const {username,password} = req.body
    const hashed_password = crypto.createHmac('sha256', "secret")
                   .update(password)
                   .digest('hex');
    

    try{
        const newPanelUser = new PanelUser({
            username,
            password:hashed_password
        })

        await newPanelUser.save()
    }
    catch(e){
        console.log(e.toString())
    }

    res.json({ok:"ok"})
})

router.get("/delete-user", async (req,res) => {

})



module.exports = router