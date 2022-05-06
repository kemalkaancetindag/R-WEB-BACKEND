const express = require('express')
const app = express()
const port = 3002
const mongoose = require("mongoose");
const cors = require("cors")
const analysisRoute = require("./routes/analysisRoute")
const panelUserRoute = require("./routes/panelUserRoutes")
var bodyParser = require('body-parser');







mongoose.connect("mongodb://localhost:27017/RDB", { useNewUrlParser: true , useUnifiedTopology: true });

const connection = mongoose.connection;

connection.once("open", () => {
  console.log("MongoDB Database Connection Established Succesfully");
});


app.use(cors())
app.use(bodyParser())
app.use("/api/analysis",analysisRoute)
app.use("/api/user",panelUserRoute)

app.use("/uploads",express.static(`${process.cwd()}/uploads`)); 







app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
