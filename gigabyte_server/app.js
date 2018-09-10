//導入express框架
var express = require('express')
var bodyParser = require('body-parser')
//導入request模擬http請求
var request = require('request')
var path = require('path')
//導入email發送模組
var nodeMailer = require('nodemailer')
var app = express()
//導入MySQL模組 => 連接資料庫寫入訂單
var mysql = require('mysql');
// 導入打開網頁/email套件
var open = require('openurl2');
// 建立資料庫連接池
var connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'gigabyte_notebook_chatbot',
  waitForConnections: true,
  // 最大連接數量
  connectionLimit: 10
});

// 測試DB連接是否成功
connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is:', results[0].solution);
});
// 釋放連線回連接池
connection.releaseConnection
//設定email發送
var transporter = nodeMailer.createTransport({
  service: 'gmail',
  // host: 'smtp.gmail.com',
  // secure: true,
  // port:465,
  auth: {
    user: 'aien.aicoco0206@gmail.com',
    pass: 'aicoco0206'
  },
  tls: {
    rejectUnauthorized: false
}
});

//使用視圖引擎(views) HTML檔案格式為ejs檔 =>express 不支持靜態HTML檔 所以必須轉換
app.set('view engine', 'ejs')
// 設定接收client端request為JSON物件格式
app.use(bodyParser.json())
// 'Content-Type': 'application/x-www-form-urlencoded' => 跨網域請求
app.use(bodyParser.urlencoded({ extended: false }))
app.use(require('serve-static')(path.join(__dirname, 'public')))


//DEMO主頁
app.get('/', function (req, res) {
  res.render('GIGABYTE Store')
})

//流程圖表
app.get('/flow', function (req, res) {
  res.render('Flow chart')
})


// 資料庫新增資料
app.get('/add', function (req, res) {
  var shipmentid = Object.values(req.query)[0]
  var ordertime = Object.values(req.query)[1]
  var name = Object.values(req.query)[2]
  var tel = Object.values(req.query)[3]
  var address = Object.values(req.query)[4]
  var item = Object.values(req.query)[5]
  var email = Object.values(req.query)[6]
  var price = Object.values(req.query)[7]
  var addSql = 'INSERT INTO shipment(shipmentid,ordertime,name,tel,address,item,price,email) VALUES(?,?,?,?,?,?,?,?)';
  var addSqlParams = [shipmentid, ordertime, name, tel, address, item, price, email];
  connection.getConnection(function (err, conn) {
    if (err) {
      console.log("新增資料失敗")
      // sendError(res,503,'error','connection',err)
    } else {
      sendEmail(name,shipmentid,tel,address,item,price,email)
      conn.query(addSql, addSqlParams)
      // 釋放連線回連接池
      connection.releaseConnection
    }
  })
});


// 資料庫查詢資料
app.get('/sql/:data', function (req, res) {
  // console.log(req.params)
  var data = req.params.data
  var sql = `SELECT * FROM shipment WHERE shipmentid = '${data}'`
  connection.getConnection(function (err, conn) {
    if (err) {
      console.log("取得資料庫連線失敗", err.message)
    } else {
      connection.query(sql, function (err, result) {
        if (err) {
          console.log('查詢資料失敗', err.message);
          return;
        }
        else if (result.length == 0) {
          // console.log(result);
          res.json({ msg: 'nodata' })
        } else {
          console.log("查詢資料成功")
          time = result[0].ordertime
          address = result[0].address
          item = result[0].item
          price = result[0].price
          res.json({ msg: 'data', time: time, address: address, item: item, price: price })
        }
      });
      // 釋放連線回連接池
      connection.releaseConnection
    }
  })
})


//資料庫刪除資料
app.get('/Delsql/:data', function (req, res) {
  // console.log(req.params)
  var data = req.params.data
  var sql = `DELETE FROM shipment WHERE shipmentid = '${data}'`
  connection.getConnection(function (err, conn) {
    if (err) {
      console.log("取得資料庫連線失敗", err.message)
    } else {
      connection.query(sql, function (err, result) {
        if (err) {
          console.log('刪除資料失敗', err.message);
          return;
        }
        else if (result.affectedRows == 0) {
          // console.log(result);
          res.json({ msg: 'nodata' })
        } else {
          console.log("刪除資料成功")
          // console.log(result);
          res.json({ msg: 'data'})
        }
      });
      // 釋放連線回連接池
      connection.releaseConnection
    }
  })
})


//user開啟EMAIL
app.get('/url/:data', function (req, res) {
  var data = req.params.data
  if(data == 1){
    console.log(data)
    open.mailto(["gigabyte@sample.com"],
                  { subject: "TO技嘉:問題詢問", body: "請詳述您的問題!!我們將會盡快答覆"});
  }else{
    if(data == 2){
      var url = "https://www.gigabyte.com/tw"
    }else if(data == 3){
      var url = "https://service.gigabyte.tw/"
    }else if(data == 4){
      var url =  "https://www.gigabyte.com/tw/Support/Technical-Support#"
    }
    console.log(url)
    open.open(url)
  }
})


//寄送訂單EMAIL
function sendEmail(name,shipmentid,tel,address,item,price,email){
  var eachItem =""
  var orderitem = item.split(".");
  orderitem.forEach(each =>{
     var space = each+"<br>"
      eachItem += space
    });
  var mailOptions = {
    from: 'aien.aicoco0206@gmail.com',
    to: `${email}`,
    subject: 'Gigabyte 訂單成立通知!!',
    html: `<html>
        <head></head>
        <body>
            <p>Gigabyte會員---${name}---您好!
                <br>
                <br>
                請記住您的訂單編號以方便日後查閱訂單內容
                <br>
                <br>
                <br>
                您的訂單編號:<b>${shipmentid}</b>
                <br>
                您的連絡電話:${tel}
                <br>
                您的訂單地址:${address}
                <br>
                您購買的項目:
                <br>
                ${eachItem}
                <br>
                <br>
                總金額為:${price}
                <br>
                <br>
                <br>
                <br>
                <br>
                此為系統主動發送信函，請勿直接回覆此封信件。
                <br>
                <br>
                Gigabyte-----<a href='https://www.gigabyte.com/tw'>請點擊回到gigabyte首頁</a>
                <br>
                <br>
                請記住您的訂單編號以方便日後查閱訂單內容
                <br>
                <br>
                感謝您的訂購，運送時間依地區不同約兩到三天，到貨日起算您享有7天購買猶豫期，退貨問題請洽客服
                <br>
                <br>
            </p>
        </body>
    </html> `
  }

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log("EMAILERROR"+error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}


app.listen(3000, function () {
  console.log('App listening on port 3000!')
})