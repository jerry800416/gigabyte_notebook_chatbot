// 導入restify => web server Framework
var restify = require('restify');
// 導入botbuilder => chatbot Framwork
var builder = require('botbuilder');
var config = require('config');


// 建立server to client端
var server = restify.createServer();
// 指定port3978
server.listen(process.env.port || process.env.PORT || "3978",function(){
    // 成功進入console.log()
    console.log('%s listening to %s',server.name,server.url);
});

// 設定微軟連線帳密(push到微軟虛擬機才需要此步驟)
var connector = new builder.ChatConnector({
    appId:"",
    appPassword:""
    // appId:process.env.MicrosoftAppId,
    // appPassword:process.env.MicrosoftAppPassword,
});
server.post('/api/messages',connector.listen());


var request = require('request');
var querystring = require('querystring');
// 導入uuid =>  建立唯一識別碼(訂單編號)
var uuid = require('node-uuid');
// 導入 azure-api bin地圖
// var locationDialog = require('botbuilder-location');
// 導入menuConfig.json資料檔
var menu = require("./menuConfig.json");
// 導入jquery、jsdom => 方便在node.js使用ajax
var jsdom = require('jsdom');
var $ = require('jquery')(require("jsdom/lib/old-api").jsdom().defaultView);
// 導入打開網頁/email套件
var open = require('openurl2');
////////////////////////////   menuConfig 選單細項   ///////////////////
// 導入大選單丟到變數mainMenu
var mainMenu = menu.main;
// 常見問答資料
var FnQ = menu.FnQ
// 服務據點資料
var serviceLocation = menu.serviceLocation
// 聯絡我們資料
var callMe = menu.callMe
// 筆電分類選單資料
var notebooks = menu.notebook;
// 筆電分類細項
var aorusMenu = menu.AORUS
var aeroMenu = menu.AERO
var sabreMenu = menu.SABRE
var pMenu = menu.P
//server端網址
var server_url = "https://700ea6d7.ngrok.io/"


// 定義一個變數給suggested卡片使用
var session;

var suggestedmsg = new builder.Message(session).suggestedActions(builder.SuggestedActions.create(
    session,[
        // (session,value,key) 
        // imback 會顯示在對話框中
        builder.CardAction.imBack(session,"查詢購物車","查詢購物車"),
        builder.CardAction.imBack(session,"清空購物車","清空購物車"),
        builder.CardAction.imBack(session,"結帳","結帳"),
    ]
));

var suggestedmsg1= new builder.Message(session).suggestedActions(builder.SuggestedActions.create(
    session,[
        // (session,value,key) 
        // imback 會顯示在對話框中
        builder.CardAction.imBack(session,"線上購買","線上購買"),
        builder.CardAction.imBack(session,"訂單查詢","訂單查詢"),
        builder.CardAction.imBack(session,"刪除訂單","刪除訂單"),
        builder.CardAction.imBack(session,"常見問答","常見問答"),
        builder.CardAction.imBack(session,"服務據點","服務據點"),
        builder.CardAction.imBack(session,"聯絡我們","聯絡我們"),
    ]
));



var suggestedmsg3= new builder.Message(session).suggestedActions(builder.SuggestedActions.create(
    session,[
        // (session,value,key) 
        // imback 會顯示在對話框中
        builder.CardAction.imBack(session,"清空購物車","清空購物車"),
        builder.CardAction.imBack(session,"返回","返回"),
    ]
));

// 聊天機器人流程開始
var bot = new builder.UniversalBot(connector,[
    function(session){
    session.send('歡迎光臨技嘉筆電');
    // 從mainMenu這個Dialog做起始
    session.beginDialog('mainMenu');
    }
]);


//bot流程選單default
bot.dialog('mainMenu',[
    function(session,){
        var promptText = '請問您需要什麼服務?';
        builder.Prompts.choice(session,promptText,mainMenu,{listStyle:builder.ListStyle.button});
    },
    function(session,results){
        session.replaceDialog(mainMenu[results.response.entity])
    }
]).triggerAction({matches:/^返回主選單$/});


//bot 選擇選項
bot.dialog('choose',[
    function(session,args){
    var promptText;
     // 要先判定args再判定args.reprompt,因為若是args沒有賦值,會直接報錯
     if(args && args.reprompt){
        var promptText = '請選擇筆電分類,如沒有要繼續購買請點選/輸入"結帳"'
        builder.Prompts.choice(session,promptText,notebooks,{listStyle:builder.ListStyle.button});
        session.send(suggestedmsg);
    }else{
        var promptText = '請選擇筆電分類'
        // 初始化conversationData(資料會在對話結束才消失)
        builder.Prompts.choice(session,promptText,notebooks,{listStyle:builder.ListStyle.button});
        session.conversationData.orders = new Array();
        session.send(suggestedmsg1);
        }
    },
    function(session,results){
            session.replaceDialog(notebooks[results.response.entity])
    }
]).triggerAction({matches:/^線上購買$/});


// AORUS
bot.dialog('aorus',function(session){
    var msg = new builder.Message(session)
    msg.attachmentLayout(builder.AttachmentLayout.carousel);
    var heroCards = new Array();
    aorusMenu.forEach(aorus => {
            var postBackValue = {
                dialog:"addToCart",
                item:{
                    "name":aorus.name,
                    "prices":aorus.prices
                }
            }
        var heroCard = new builder.HeroCard(session)
                        .title(aorus.name)
                        .subtitle(`${aorus.Introduction}`)
                        .images([builder.CardImage.create(session,aorus.picture)]) 
                        // 因為單一品項沒有多個規格可以選,故按鈕直接寫死
                        .buttons([
                            new builder.CardAction.postBack(
                                session,JSON.stringify(postBackValue),`購買--$${aorus.prices}`
                            )
                        ]);
        heroCards.push(heroCard);
    });
    msg.attachments(heroCards);
    msg.suggestedActions(builder.SuggestedActions.create(
        session,[
            builder.CardAction.imBack(session,"AERO輕薄電競","AERO輕薄電競"),
            builder.CardAction.imBack(session,"SABRE高效電競","SABRE高效電競"),
            builder.CardAction.imBack(session,"P系列便攜商務","P系列便攜商務"),
            builder.CardAction.imBack(session,"返回主選單","返回主選單"),
            builder.CardAction.imBack(session,"結帳","結帳")
        ]
    ));
    session.endDialog(msg);
}).triggerAction({matches:/^AORUS極致效能$/});


//AERO
bot.dialog('aero',function(session){
    var msg = new builder.Message(session)
    msg.attachmentLayout(builder.AttachmentLayout.carousel);
    var heroCards = new Array();
    aeroMenu.forEach(aero => {
            var postBackValue = {
                dialog:"addToCart",
                item:{
                    "name":aero.name,
                    "prices":aero.prices
                }
            }
        var heroCard = new builder.HeroCard(session)
                        .title(aero.name)
                        .subtitle(`${aero.Introduction}`)
                        .images([builder.CardImage.create(session,aero.picture)]) 
                        // 因為單一品項沒有多個規格可以選,故按鈕直接寫死
                        .buttons([
                            new builder.CardAction.postBack(
                                session,JSON.stringify(postBackValue),`購買--$${aero.prices}`
                            )
                        ]);
        heroCards.push(heroCard);
    });
    msg.attachments(heroCards);
    msg.suggestedActions(builder.SuggestedActions.create(
        session,[
            builder.CardAction.imBack(session,"AORUS極致效能","AORUS極致效能"),
            builder.CardAction.imBack(session,"SABRE高效電競","SABRE高效電競"),
            builder.CardAction.imBack(session,"P系列便攜商務","P系列便攜商務"),
            builder.CardAction.imBack(session,"返回主選單","返回主選單"),
            builder.CardAction.imBack(session,"結帳","結帳")
        ]
    ));
    session.endDialog(msg);
}).triggerAction({matches:/^AERO輕薄電競$/});


//SABRE
bot.dialog('sabre',function(session){
    var msg = new builder.Message(session)
    msg.attachmentLayout(builder.AttachmentLayout.carousel);
    var heroCards = new Array();
    sabreMenu.forEach(sabre => {
            var postBackValue = {
                dialog:"addToCart",
                item:{
                    "name":sabre.name,
                    "prices":sabre.prices
                }
            }
        var heroCard = new builder.HeroCard(session)
                        .title(sabre.name)
                        .subtitle(`${sabre.Introduction}`)
                        .images([builder.CardImage.create(session,sabre.picture)]) 
                        // 因為單一品項沒有多個規格可以選,故按鈕直接寫死
                        .buttons([
                            new builder.CardAction.postBack(
                                session,JSON.stringify(postBackValue),`購買--$${sabre.prices}`
                            )
                        ]);
        heroCards.push(heroCard);
    });
    msg.attachments(heroCards);
    msg.suggestedActions(builder.SuggestedActions.create(
        session,[
            builder.CardAction.imBack(session,"AORUS極致效能","AORUS極致效能"),
            builder.CardAction.imBack(session,"AERO輕薄電競","AERO輕薄電競"),
            builder.CardAction.imBack(session,"P系列便攜商務","P系列便攜商務"),
            builder.CardAction.imBack(session,"返回主選單","返回主選單"),
            builder.CardAction.imBack(session,"結帳","結帳")
        ]
    ));
    session.endDialog(msg);
}).triggerAction({matches:/^SABRE高效電競$/});


//P系列
bot.dialog('p',function(session){
    var msg = new builder.Message(session)
    msg.attachmentLayout(builder.AttachmentLayout.carousel);
    var heroCards = new Array();
    pMenu.forEach(p => {
            var postBackValue = {
                dialog:"addToCart",
                item:{
                    "name":p.name,
                    "prices":p.prices
                }
            }
        var heroCard = new builder.HeroCard(session)
                        .title(p.name)
                        .subtitle(`$${p.Introduction}`)
                        .images([builder.CardImage.create(session,p.picture)]) 
                        // 因為單一品項沒有多個規格可以選,故按鈕直接寫死
                        .buttons([
                            new builder.CardAction.postBack(
                                session,JSON.stringify(postBackValue),`購買--$${p.prices}`
                            )
                        ]);
        heroCards.push(heroCard);
    });
    msg.attachments(heroCards);
    msg.suggestedActions(builder.SuggestedActions.create(
        session,[
            builder.CardAction.imBack(session,"AORUS極致效能","AORUS極致效能"),
            builder.CardAction.imBack(session,"AERO輕薄電競","AERO輕薄電競"),
            builder.CardAction.imBack(session,"SABRE高效電競","SABRE高效電競"),
            builder.CardAction.imBack(session,"返回主選單","返回主選單"),
            builder.CardAction.imBack(session,"結帳","結帳")
        ]
    ));
    session.endDialog(msg);
}).triggerAction({matches:/^P系列便攜商務$/});


// order
bot.dialog("addToCart",[
    function(session){
        var item = JSON.parse(session.message.text).item;
        var order = session.dialogData.order = {
            Name:item.name,
            Prices:item.prices
        }
        builder.Prompts.number(session,`請問<${order.Name}>要訂購幾台?`);
        session.send(suggestedmsg1);
    },
    function(session,results){
        var order = session.dialogData.order
        order.Number = results.response;
        var total = order.Prices * order.Number;
        var orderDetail = `${order.Name} x ${order.Number}台 小計$${total}元\n`
        session.send(`品項:\n${orderDetail}\n已加入購物車`);
        session.conversationData.orders.push(order);
        session.replaceDialog('choose',{reprompt:true});
    }
]).triggerAction({matches:/^{"dialog":"addToCart".*/});


//檢查購物車
bot.dialog('shoppngCart',[
    function(session){
        if(session.conversationData.orders.length == 0){
            session.send('您的購物車沒有東西喔');
            session.replaceDialog("choose",{reprompt:false});
        }else{
        var orders = session.conversationData.orders;
        var msg = new builder.Message(session);
        var items = [];
        var total = 0 ;

        orders.forEach(order => {
                var subtotal = order.Prices * order.Number;
                var item = builder.ReceiptItem.create(
                    session,`$${subtotal}`,`${order.Name}-------x${order.Number}台`
                );
                items.push(item);
                total += subtotal;
        });

        var receipt = new builder.ReceiptCard(session)
        .title("您的購物車:") 
        // .items品項
        .items(items)
        .total(`$${total}`)
    // receipt 資料丟到msg變數
    msg.addAttachment(receipt);
    //顯示msg內容並結束對話
    msg.suggestedActions(builder.SuggestedActions.create(
        session,[
            // (session,value,key) 
            // imback 會顯示在對話框中
            builder.CardAction.imBack(session,"結帳","結帳"),
            builder.CardAction.imBack(session,"清空購物車","清空購物車"),
            builder.CardAction.imBack(session,"返回筆電選單","返回筆電選單"),
        ]
    ));
    session.endDialog(msg);
    }}
]).triggerAction({matches:/^查詢購物車$/});


//查詢完返回choose
bot.dialog('returnTO',function(session){
    session.replaceDialog("choose",{reprompt:true});
}).triggerAction({matches:/^返回筆電選單$/})


//返回主選單for 線上購買
bot.dialog('returnTOmainFORorder',[
    function(session){
        builder.Prompts.choice(session,"返回主選單將清空您的購物車,確定返回?","Yes|No",{listStyle:builder.ListStyle.button});
    },
    function(session,results){
        if(results.response.entity == "Yes"){
            session.replaceDialog("mainMenu",{reprompt:false});
        }else{
            session.replaceDialog("choose",{reprompt:true})
        }
    }
])


// 返回主選單
bot.dialog('returnTOmain',function(session){
        session.replaceDialog("mainMenu",{reprompt:false});
}).triggerAction({matches:/^返回$/})


//清空購物車
bot.dialog('cleanCart',function(session){
        session.conversationData.orders = new Array();
        session.send('您的購物車已清空');
        session.replaceDialog("choose",{reprompt:false});
}).triggerAction({matches:/^清空購物車$/});


//運送資訊 
bot.dialog('shipments',[
    function(session){
        session.dialogData.shipments = {};
        builder.Prompts.text(session,"請問您的姓名?");
        session.send(suggestedmsg3);
    },
    function(session,results){
        session.dialogData.shipments.name = results.response;
        builder.Prompts.text(session,"請問電子郵件信箱?");
        session.send(suggestedmsg3);
    },
    function(session,results){
        session.dialogData.shipments.email = results.response;
        builder.Prompts.text(session,"請問連絡電話?");
        session.send(suggestedmsg3);
    },
    function(session,results){
        session.dialogData.shipments.tel = results.response;
        builder.Prompts.text(session,"請問宅配的地址?");
        session.send(suggestedmsg3);
    },
    function(session,results){
        session.dialogData.shipments.address = results.response;
        session.endDialogWithResult({
            response:session.dialogData.shipments
           })
      },   
])


//結帳 => DB新增訂單資料
bot.dialog('checkOut',[
    function(session){
        if(session.conversationData.orders.length > 0){
            session.beginDialog("shipments");
        }else{
            session.send('您的購物車沒有東西喔!');
            session.replaceDialog("choose",{reprompt:false});
        }
    },
    function(session,results){
        var shipment = results.response;
        var orders = session.conversationData.orders;
        var msg = new builder.Message(session);
        var items = [];
        var total = 0 ;
        //建立uuid
        var shipmentid = uuid.v4().split('-')[0];
        var orderDetail = ""

        orders.forEach(order => {
                var subtotal = order.Prices * order.Number;
                var orderdetail = `${order.Name}-------${order.Number}台-------$${subtotal}.`;
                var item = builder.ReceiptItem.create(
                    session,`$${subtotal}`,`${order.Name}-------${order.Number}台`
                );
                orderDetail += orderdetail
                items.push(item);
                total += subtotal;
                
        });
        var today= new Date();
        var ordertime = today.getFullYear()+'/'+(today.getMonth()+1)+'/'+today.getDate()+'('+today.getHours()+':'+today.getMinutes()+')';
        var data = ({
            shipmentid: shipmentid, 
            ordertime: ordertime,
            name: shipment.name,
            tel: shipment.tel,
            address: shipment.address,
            item: orderDetail,
            email:shipment.email,
            price: total
            });
        $.ajax({
            type: "GET",
            //async為false -> 同步
            async: true,   
            dataType: "json",
            url: server_url+"add",
            contentType: 'application/json; charset=UTF-8',
            data: data,
            // success:function(res){
            //     result = res
            //     console.log("hihihi")
            //     console.log(result)
            //     console.log("@@@@@@"+XMLHttpRequest)
            //     console.log("@@@@@@@@@@@"+textStatus)
            //    },
            })
        var receipt = new builder.ReceiptCard(session)
        .title(`您的訂單編號(請詳記):${shipmentid}`) 
        .facts([
            builder.Fact.create(session,ordertime,"訂單成立時間"),
            builder.Fact.create(session,shipment.name,"訂購人姓名"),
            builder.Fact.create(session,shipment.tel,"訂購人電話"),
            builder.Fact.create(session,shipment.address,"配送地址"),
        ])
        // .items品項
        .items(items)
        .total(`$${total}`)
    // receipt 資料丟到msg變數
    msg.addAttachment(receipt);
    //顯示msg內容並結束對話
    session.send(msg)
    session.endConversation("請詳記您的訂單編號,感謝您的購買");
    session.replaceDialog("mainMenu");
    }
]).triggerAction({matches:/^結帳$/});


//查詢訂單 => DB查詢訂單資料
bot.dialog('checkOrder',[
    function(session){
        session.dialogData.checkorder = {};
        builder.Prompts.text(session,"請輸入您的訂單編號,若要返回主選單請輸入'返回主選單");
        session.send(suggestedmsg1);
    },
    function(session,results){
        shipmentid = results.response;
        var options = {
            method: 'GET',
            // headers: {
            //     'Content-Type': 'application/x-www-form-urlencoded'
            //   },
            url: `${server_url}sql/${shipmentid}`
        };
        request(options,function(error,response,body){
            if(!error){
                console.log("成功傳送到server")
                // 將傳回的JSON字串轉為JSON物件以方便操作
                var data = JSON.parse(body)              
                  // console.log(data.item)
                if(data.msg != 'nodata'){
                    var eachItem =""
                    var orderitem = data.item.split(".");
                    orderitem.forEach(each =>{
                    var space = each+"\n"
                    eachItem += space
                })
                var detail = `訂單時間:${data.time}\n運送地點:${data.address}\n品項:\n${eachItem}\n訂單金額:$${data.price}\n\n`
                console.log(data)
                session.send(detail)
                session.endDialog(suggestedmsg1)
                }else{
                    session.send("未查詢到您輸入的訂單,您可在Email信箱查看您的訂單編號")
                    session.replaceDialog("checkOrder");
                }
            }else{
                session.send("伺服器發生錯誤,請稍後再執行查詢")
                session.endDialog(suggestedmsg1)
            }
        });
      },
]).triggerAction({matches:/^訂單查詢$/});


//刪除訂單
bot.dialog('DelOrder',[
    function(session){
        session.dialogData.checkorder = {};
        builder.Prompts.text(session,"請輸入您的訂單編號,若要返回主選單請輸入'返回主選單'");
        // session.send(suggestedmsg1);
    },
    function(session,results){
        shipmentid = results.response;
        var options = {
            method: 'GET',
            // headers: {
            //     'Content-Type': 'application/x-www-form-urlencoded'
            //   },
            url: `${server_url}Delsql/${shipmentid}`
        };
        request(options,function(error,response,body){
            if(!error){
                console.log("成功傳送到server")
                // 將傳回的JSON字串轉為JSON物件以方便操作
                var data = JSON.parse(body)              
                  // console.log(data.item)
                if(data.msg != 'nodata'){
                    session.send("訂單已刪除")
                    session.endDialog(suggestedmsg1)
                    session.replaceDialog("mainMenu")
                }else{
                    session.send("未查詢到您輸入的訂單,您可在Email信箱查看您的訂單編號")
                    session.endDialog(suggestedmsg1)
                    session.replaceDialog("mainMenu");
                }
            }else{
                session.send("伺服器發生錯誤,請稍後再執行查詢")
                session.endDialog(suggestedmsg1)
            }
        });
    },
]).triggerAction({matches:/^刪除訂單$/});


//常見問答
bot.dialog('FnQ',[
    function(session){
        builder.Prompts.choice(session,"請選擇您要詢問的問題",FnQ,{listStyle:builder.ListStyle.button})
        session.send(suggestedmsg1); 
    },
    function(session,results){
        if(FnQ[results.response.entity] != 'returnTOmain'){
            session.send(FnQ[results.response.entity])
            session.endDialog(suggestedmsg1);
            session.replaceDialog('FnQ')
        }else{
            session.replaceDialog('mainMenu')
        }
    }
]).triggerAction({matches:/^常見問答$/});


//服務據點
bot.dialog('serviceLocation',[
    function(session){
        builder.Prompts.choice(session,"請選擇您所在的地區",serviceLocation,{listStyle:builder.ListStyle.button})
        session.send(suggestedmsg1);
    },
    function(session,results){
        if(serviceLocation[results.response.entity] != 'returnTOmain'){
             session.send(serviceLocation[results.response.entity])
             session.replaceDialog('serviceLocation')
        }else{
            session.replaceDialog('mainMenu')
        }
    }
]).triggerAction({matches:/^服務據點$/});


//聯絡我們
bot.dialog('callMe',[
    function(session){
        builder.Prompts.choice(session,"請選擇您希望的聯絡方式",callMe,{listStyle:builder.ListStyle.button})
        session.send(suggestedmsg1);
    },
    function(session,results){
        if(serviceLocation[results.response.entity] != 'returnTOmain'){
            var open_url = callMe[results.response.entity]
            if(results.response.entity =='來電諮詢'){
                session.send(callMe[results.response.entity])
                session.replaceDialog('callMe')
            }else if(results.response.entity =='寫信給我'){
                // open.mailto(["gigabyte@sample.com"],
                // { subject: "TO技嘉:問題詢問", body: "請詳述您的問題!!我們將會盡快答覆"});
                var options = {
                    method: 'GET',
                    url: `${server_url}url/1`
                };
                request(options,function(error,response,body){
                    console.log("開啟EMAIL成功")
                })
                session.replaceDialog('callMe')
            }else if(results.response.entity =='技嘉官方網站'){
                var options = {
                    method: 'GET',
                    url: `${server_url}url/2`
                };
                request(options,function(error,response,body){
                    console.log("開啟URL成功")
            })
            session.replaceDialog('callMe')
            }else if(results.response.entity =='台灣區服務網網站'){
                var options = {
                    method: 'GET',
                    url: `${server_url}url/3`
                };
                request(options,function(error,response,body){
                    console.log("開啟URL成功")
            })
            session.replaceDialog('callMe')
            }else if(results.response.entity =='線上表單諮詢'){
                var options = {
                    method: 'GET',
                    url: `${server_url}url/4`
                };
                request(options,function(error,response,body){
                    console.log("開啟URL成功")
            })
            session.replaceDialog('callMe')
            }
        }else{
            session.replaceDialog('mainMenu')
        }
    }
]).triggerAction({matches:/^聯絡我們$/});
