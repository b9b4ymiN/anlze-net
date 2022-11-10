"use strict";
const express = require("express");
const path = require("path");
const cors = require("cors");
const serverless = require("serverless-http");
const app = express();
const bodyParser = require("body-parser");
const firebase = require("firebase/app");
const yahooFinance = require("yahoo-finance");
const yahoo2 = require("../yahoo2");
const mathData = require("../util");
const { default: axios } = require("axios");
require("firebase/database");

//Setting FireBase
const firebaseConfig = {
  apiKey: "AIzaSyByNpKtYQHHHpNtylYURYVrwUB-fFayYvY",
  authDomain: "bstock-8d4cd.firebaseapp.com",
  databaseURL: "https://bstock-8d4cd-default-rtdb.firebaseio.com",
  projectId: "bstock-8d4cd",
  storageBucket: "bstock-8d4cd.appspot.com",
  messagingSenderId: "50475280652",
  appId: "1:50475280652:web:77401341af190464e10129",
};

firebase.initializeApp(firebaseConfig);

//Setting cors on server
const whitelist = [
  "https://anlze.vercel.app",
  "https://anlze-b9b4ymin.vercel.app",
  "https://anlze-git-main-b9b4ymin.vercel.app",
  "https://bfinance.vercel.app",
  "https://bfinance-b9b4ymin.vercel.app",
  "https://bfinance-git-main-b9b4ymin.vercel.app",
  "https://bfinance-qs54ndpfs-b9b4ymin.vercel.app",
  "http://localhost:3000",
  "http://localhost:3000/",
  "http://192.168.1.104:3000",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
const router = express.Router();

router.get("/", (req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write("<h1>Hello from Express.js!</h1>");
  res.end();
});
router.get("/another", (req, res) => res.json({ route: req.originalUrl }));
router.get("/testv1", (req, res) => res.json({ value: "test01" }));
router.post("/", (req, res) => res.json({ postBody: req.body }));

// API
router.get("/api/chartsec", (req, res) => {
  const sumV2Ref = firebase.database().ref("stock/sumV2");
  sumV2Ref.on("value", (snapshot) => {
    const chartData = {
      label: [],
      data: [],
      pDayVALUE: [],
    };
    const mainData = [];
    snapshot.forEach((snapDate) => {
      chartData.label.push(snapDate.key);
      let sumDay = 0;
      snapDate.forEach((snapKey) => {
        const rawData = snapKey.val();
        const index = mainData.findIndex((object) => {
          return object.name === rawData.SYS;
        });
        if (index != -1) {
          mainData[index].data.push(rawData.VALUE);
        } else {
          let series = {
            name: rawData.SYS,
            data: [],
          };
          series.data.push(rawData.VALUE);
          mainData.push(series);
        }
        sumDay += rawData.VALUE;
      });
      mainData.forEach((x) => {
        x.data[x.data.length - 1] = parseFloat(
          ((x.data[x.data.length - 1] / sumDay) * 100).toFixed(2)
        );
      });
      chartData.pDayVALUE.push(sumDay);
      sumDay = 0;
    });
    chartData.data = mainData.sort(compare);
    res.json(chartData);
    console.log(chartData);
  });
});

router.get("/api/getgroup/:group", function (req, res) {
  var yesterdayDt = new Date();
  let yesKeys =
    formatDate(yesterdayDt.setDate(yesterdayDt.getDate() - 1)) +
    "-" +
    req.params.group.toUpperCase();
  console.log(yesKeys);
  var stockSumSector = firebase
    .database()
    .ref("stock/rawData")
    .orderByChild("dategroup")
    .equalTo(yesKeys);
  stockSumSector.on("value", (snapshot) => {
    console.log("getgroup data : ", snapshot.val());
    let dataJson = [];
    snapshot.forEach((snapData) => {
      dataJson.push(snapData);
    });
    res.json(dataJson);
  });
});

router.get("/api/getgroupV2", function (req, res) {
  let yesKeys = req.query.date + "-" + req.query.group.toUpperCase();
  console.log(yesKeys);
  var stockSumSector = firebase
    .database()
    .ref("stock/rawData")
    .orderByChild("dategroup")
    .equalTo(yesKeys);
  stockSumSector.on("value", (snapshot) => {
    console.log("getgroup data : ", snapshot.val());
    let dataJson = [];
    snapshot.forEach((snapData) => {
      dataJson.push(snapData);
    });
    res.json(dataJson);
  });
});

router.get("/api/chartsecV2", (req, res) => {
  const sumV2Ref = firebase.database().ref("stock/sumV2");
  sumV2Ref.on("value", (snapshot) => {
    const chartData = {
      label: [],
      data: [],
      pDayVALUE: [],
    };
    const mainData = [];
    snapshot.forEach((snapDate) => {
      chartData.label.push(snapDate.key);
      let sumDay = 0;
      snapDate.forEach((snapKey) => {
        const rawData = snapKey.val();
        const rawDataLength = rawData.length;
        const index = mainData.findIndex((object) => {
          return object.name === rawData.SYS;
        });
        if (index != -1) {
          mainData[index].data.push(rawData.VALUE);
          mainData[index].vol.push(rawData.VOL);
          mainData[index].val.push(rawData.VALUE);
          mainData[index].lastvol = rawData.VOL;
          mainData[index].lastvalue = rawData.VALUE;
        } else {
          let series = {
            name: rawData.SYS,
            data: [],
            vol: [],
            val: [],
            lastvol: 0,
            lastvalue: 0,
          };
          series.data.push(rawData.VALUE);
          series.vol.push(rawData.VOL);
          series.val.push(rawData.VALUE);
          mainData.push(series);
        }
        sumDay += rawData.VALUE;
      });
      mainData.forEach((x) => {
        x.data[x.data.length - 1] = parseFloat(
          ((x.data[x.data.length - 1] / sumDay) * 100).toFixed(2)
        );
      });
      chartData.pDayVALUE.push(sumDay);
      sumDay = 0;
    });
    chartData.data = mainData.sort(compare);
    res.json(chartData);
    console.log(chartData);
  });
});

router.get("/api/incomeQ", (req, res) => {
  let sys = req.query.stock.toUpperCase();
  var incomeQuery = firebase
    .database()
    .ref("stock/incomeQuarter")
    .orderByChild("symbol")
    .equalTo(sys);
  incomeQuery.on("value", (snapshot) => {
    snapshot.forEach((element) => {
      console.log("element : ", element.key);
      const rawData = element.val();
      res.json(rawData.data);
    });
  });
});

router.get("/api/thbChart", (req, res) => {
  try {
    var d = new Date();
    yahooFinance.historical(
      {
        symbol: "THB%3DX",
        from: formatDate(d.addDays(-60)),
        to: formatDate(d),
        period: "d", // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
      },
      function (err, quotes) {
        const rawData = {
          labels: [],
          datasets: [
            {
              data: [],
              borderWidth: 2,
              fill: true,
              backgroundColor: ["rgba(0, 204, 212, .2)"],
              borderColor: ["rgb(0, 204, 212)"],
            },
          ],
        };
        //console.log(quotes);
        //element.sort(compareValue);
        quotes.sort(compareDateAsc).forEach((element) => {
          rawData.labels.push(element.date);
          rawData.datasets[0].data.push(element.close);
        });
        res.json(rawData);
      }
    );
  } catch (ex) {
    res.json({ catch: ex });
  }
});

router.get("/api/stockPrice/:stock", (req, res) => {
  try {
    const stock = req.params.stock.toUpperCase() + ".BK";
    var d = new Date();
    yahooFinance.historical(
      {
        symbol: stock,
        from: formatDate(d.addDays(-1560)),
        to: formatDate(d),
        period: "d", // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
      },
      function (err, quotes) {
        res.json(quotes);
      }
    );
  } catch (ex) {
    res.json({ catch: ex });
  }
});

router.get("/api/stockPrice/apex/:stock", (req, res) => {
  try {
    const stock = req.params.stock.toUpperCase() + ".BK";
    console.log("stockPrice user cakk : " + stock);
    var d = new Date();
    yahooFinance.historical(
      {
        symbol: stock,
        from: formatDate(d.addDays(-800)),
        to: formatDate(d),
        period: "d", // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
      },
      function (err, quotes) {
        const rawData = [];
        //console.log("quotes : ", quotes);
        quotes.forEach((element) => {
          let priceData = [];
          priceData.push(element.open);
          priceData.push(element.high);
          priceData.push(element.low);
          priceData.push(element.close);
          rawData.push({
            x: Date.parse(element.date),
            y: priceData,
            volume: element.volume,
          });
        });
        res.json(rawData);
      }
    );
  } catch (ex) {
    res.json({ catch: ex });
  }
});

router.get("/api/stockProfile/:stock", (req, res) => {
  try {
    const stock = req.params.stock.toUpperCase() + ".BK";
    yahooFinance.quote(
      {
        symbol: stock,
        modules: [
          "summaryDetail",
          "summaryProfile",
          "earnings",
          "financialData",
        ], // earnings => earnings
      },
      function (err, quotes) {
        res.json(quotes);
      }
    );
  } catch (ex) {
    res.json({ catch: ex });
  }
});

router.get("/api/stockProfileV2", (req, res) => {
  try {
    const stock = req.query.stock.toUpperCase() + ".BK";
    yahooFinance.quote(
      {
        symbol: stock,
        modules: [
          "summaryDetail",
          "summaryProfile",
          "earnings",
          "financialData",
        ], // earnings => earnings
      },
      function (err, quotes) {
        res.json(quotes);
      }
    );
  } catch (ex) {
    res.json({ catch: ex });
  }
});

router.get("/api/priceMath", (req, res) => {
  try {
    const keys = req.query.keys;
    console.log("mathData : ", mathData);
    console.log(
      "call priceMath : " + keys + " = " + mathData.mathPriceKey[keys]
    );
    var d = new Date();
    yahooFinance.historical(
      {
        symbol: mathData.mathPriceKey[keys],
        from: formatDate(d.addDays(-60)),
        to: formatDate(d.addDays(1)),
        period: "d", // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
      },
      function (err, quotes) {
        const rawData = {
          labels: [],
          data: [],
          title: mathData.mathPriceTitle[keys],
          titleTH: mathData.mathPriceTitleTH[keys],
        };
        quotes.sort(compareDateAsc).forEach((element) => {
          rawData.labels.push(element.date);
          rawData.data.push(element.close);
        });
        res.json(rawData);
      }
    );
  } catch (ex) {
    res.json({ catch: ex });
  }
});

router.get("/api/stockQuote", (req, res) => {
  try {
    const stock = req.query.stock.toUpperCase() + ".BK";
    yahoo2
      .getStockDetial(stock, {
        modules: [
          "earnings",
          "defaultKeyStatistics",
          "price",
          "incomeStatementHistory",
          "incomeStatementHistoryQuarterly",
          "balanceSheetHistory",
        ],
      })
      .then((data) => {
        res.json(data);
      })
      .catch((c) => {
        res.json({ catch: c });
      });
  } catch (ex) {
    res.json({ stockQuote_catch: ex });
  }
});

router.get("/api/stockQuoteV2", (req, res) => {
  try {
    const stock = req.query.stock.toUpperCase() + ".BK";
    yahoo2
      .getStockDetial(stock, {
        modules: [
          "earnings",
          "defaultKeyStatistics",
          "price",
          "incomeStatementHistoryQuarterly",
          "balanceSheetHistoryQuarterly",
          "cashflowStatementHistoryQuarterly",
        ],
      })
      .then((data) => {
        res.json(data);
      })
      .catch((c) => {
        res.json({ catch: c });
      });
  } catch (ex) {
    res.json({ stockQuote_catch: ex });
  }
});

router.get("/api/stockQuoteVYear", (req, res) => {
  try {
    const stock = req.query.stock.toUpperCase() + ".BK";
    yahoo2
      .getStockDetial(stock, {
        modules: [
          "earnings",
          "defaultKeyStatistics",
          "price",
          "incomeStatementHistory",
          "balanceSheetHistory",
          "cashflowStatementHistory",
        ],
      })
      .then((data) => {
        res.json(data);
      })
      .catch((c) => {
        res.json({ catch: c });
      });
  } catch (ex) {
    res.json({ stockQuote_catch: ex });
  }
});

router.get("/api/priceYear", async (req, res) => {
  try {
    const stock = req.query.stock.toUpperCase() + ".BK";
    console.log("priceYear input = " + stock);
    let raw4 = [];
    const r1 = await yahoo2 //1
      .getPriceFixDate(stock, "2018-12-28")
      .then((data) => {
        return data;
      })
      .catch((c) => {
        res.json({ catch: c });
      });
    raw4.push(r1);
    const r2 = await yahoo2 //2
      .getPriceFixDate(stock, "2019-12-30")
      .then((data) => {
        return data;
      })
      .catch((c) => {
        res.json({ catch: c });
      });
    raw4.push(r2);
    const r3 = await yahoo2 //3
      .getPriceFixDate(stock, "2020-12-30")
      .then((data) => {
        return data;
      })
      .catch((c) => {
        res.json({ catch: c });
      });
    raw4.push(r3);
    const r4 = await yahoo2 //4
      .getPriceFixDate(stock, "2021-12-30")
      .then((data) => {
        return data;
      })
      .catch((c) => {
        res.json({ catch: c });
      });
    raw4.push(r4);

    res.json(raw4);
  } catch (ex) {
    res.json({ stockQuote_catch: ex });
  }
});

router.get("/api/priceQuarter", async (req, res) => {
  try {
    const stock = req.query.stock.toUpperCase() + ".BK";
    console.log("priceYear input = " + stock);
    let raw4 = [];
    const r1 = await yahoo2 //1
      .getPriceFixDate(stock, "2021-09-29")
      .then((data) => {
        return data;
      })
      .catch((c) => {
        res.json({ catch: c });
      });
    raw4.push(r1);
    const r2 = await yahoo2 //2
      .getPriceFixDate(stock, "2021-12-30")
      .then((data) => {
        return data;
      })
      .catch((c) => {
        res.json({ catch: c });
      });
    raw4.push(r2);
    const r3 = await yahoo2 //3
      .getPriceFixDate(stock, "2022-03-30")
      .then((data) => {
        return data;
      })
      .catch((c) => {
        res.json({ catch: c });
      });
    raw4.push(r3);
    const r4 = await yahoo2 //4
      .getPriceFixDate(stock, "2022-06-29")
      .then((data) => {
        return data;
      })
      .catch((c) => {
        res.json({ catch: c });
      });
    raw4.push(r4);

    res.json(raw4);
  } catch (ex) {
    res.json({ stockQuote_catch: ex });
  }
});

router.get("/api/priceFixDate", async (req, res) => {
  try {
    const stock = req.query.stock.toUpperCase() + ".BK";
    const datekey = req.query.datekey;
    console.log("priceFixDate input = " + stock + " | " + datekey);
    let raw4 = [];
    await yahoo2
      .getPriceFixDate(stock, datekey)
      .then((data) => {
        res.json(data);
      })
      .catch((c) => {
        res.json({ catch: c });
      });
  } catch (ex) {
    res.json({ stockQuote_catch: ex });
  }
});

router.get("/api/lastprice", async (req, res) => {
  try {
    const keys = req.query.keys;
    console.log("lastprice input = " + keys);
    await yahoo2
      .getLastPrice(mathData.mathPriceKey[keys])
      .then((data) => {
        res.json(data.sort(compareDate).slice(0, 1));
      })
      .catch((c) => {
        res.json({ catch: c });
      });
  } catch (ex) {
    res.json({ stockQuote_catch: ex });
  }
});

router.get("/api/group", (req, res) => {
  const name = req.query.name;
  var incomeGroup = firebase
    .database()
    .ref("stock/incomeGroup")
    .orderByChild("groupName")
    .equalTo(name);
  incomeGroup.on("value", (snapshot) => {
    snapshot.forEach((element) => {
      const rawData = element.val();
      res.json(rawData);
    });
  });
});

router.get("/api/tagstock", (req, res) => {
  try {
    const name = req.query.symbol;
    var tagstock = firebase
      .database()
      .ref("stock/listStock")
      .orderByChild("symbol")
      .equalTo(name);
    tagstock.on("value", (snapshot) => {
      if (snapshot.val() != null) {
        snapshot.forEach((element) => {
          const rawData = element.val();
          res.json({ status: 1, data: rawData });
        });
      } else {
        res.json({ status: 0, message: "no-data" });
      }
    });
  } catch (ex) {
    res.json({ status: -1, message: ex });
  }
});

//Getting List incomeGroup
router.get("/api/getListIncome", (req, res) => {
  try {
    var incomeGroup = firebase.database().ref("stock/incomeGroup");
    incomeGroup.on("value", (snapshot) => {
      const lstGroup = [];
      snapshot.forEach((x, index) => {
        lstGroup.push(x.key);
      });
      //console.log(lstGroup);
      res.json({ status: 1, message: "Success", data: lstGroup });
    });
  } catch (ex) {
    res.json({ status: -1, message: ex });
  }
});

//Getting list symbol
router.get("/api/listIndex", async (req, res) => {
  try {
    await yahoo2.getListIndex().then((data) => {
      res.json({ status: 1, message: "success", data: data });
    });
  } catch (err) {
    res.json({ status: -1, message: err });
  }
});

//Top 20 method
router.get("/api/top20value", (req, res) => {
  try {
    const dateKeys = req.query.date;
    console.log("call function top20value : " + dateKeys);
    var top20 = firebase
      .database()
      .ref("stock/rawData")
      .orderByChild("Date")
      .equalTo(dateKeys);

    top20.on("value", (snapshot) => {
      const raw = snapshotToArray(snapshot).sort(orderyByValue);
      res.json({
        date: dateKeys,
        totalValue: raw.reduce((accumulator, object) => {
          return accumulator + object.VALUE;
        }, 0),
        totalVol: raw.reduce((accumulator, object) => {
          return accumulator + object.VOL;
        }, 0),
        data: raw.slice(0, 20),
      });
    });
  } catch (ex) {
    res.json({ status: -1, message: ex });
  }
});
router.get("/api/top20vol", (req, res) => {
  try {
    const dateKeys = req.query.date;
    console.log("call function top20vol : " + dateKeys);
    var top20 = firebase
      .database()
      .ref("stock/rawData")
      .orderByChild("Date")
      .equalTo(dateKeys);

    top20.on("value", (snapshot) => {
      const raw = snapshotToArray(snapshot).sort(orderyByVol);
      res.json({
        date: dateKeys,
        totalValue: raw.reduce((accumulator, object) => {
          return accumulator + object.VALUE;
        }, 0),
        totalVol: raw.reduce((accumulator, object) => {
          return accumulator + object.VOL;
        }, 0),
        data: raw.slice(0, 20),
      });
    });
  } catch (ex) {
    res.json({ status: -1, message: ex });
  }
});

//list Top Sector
router.get("/api/getSecTrend", (req, res) => {
  try {
    const dateKeys = req.query.date;
    console.log("call function getSecTrend : " + dateKeys);
    var SecTrend = firebase
      .database()
      .ref("stock/sumSector")
      .orderByChild("Date")
      .startAt(dateKeys);
    SecTrend.on("value", (snapshot) => {
      let exportData = [];
      let dataJson = snapshotToArray(snapshot);
      console.log("dataJson : ", dataJson.sort(oderByDate)[0]);
      let dateKey = "";
      dataJson.sort(oderByDate).forEach((el) => {
        if (el.Date == dateKey) {
          const index = exportData.findIndex((data) => {
            return data.dateValue == dateKey;
          });
          exportData[index].value.push(el);
          exportData[index].value.sort(orderyByValue);
        } else {
          let lst = [];
          lst.push(el);
          exportData.push({ dateValue: el.Date, value: lst });
          dateKey = el.Date;
        }
      });

      res.json({ status: 1, data: exportData });
    });
  } catch (ex) {
    res.json({ status: -1, message: ex });
  }
});

router.get("/api/chartsecV3", (req, res) => {
  try {
    //var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    //console.log("IP : ", ip);
    const dateKeys = req.query.date;
    console.log("call function chartsecV3 : " + dateKeys);

    var stockSumSector = firebase
      .database()
      .ref("stock/sumSector")
      .orderByChild("Date")
      .startAt(dateKeys);
    stockSumSector.on("value", (snapshot) => {
      let exportData = [];
      let dataJson = snapshotToArray(snapshot);
      //console.log("dataJson : ", dataJson.sort(oderByDate)[0]);
      let dateKey = "";
      dataJson.sort(oderByDate).forEach((el) => {
        if (el.Date == dateKey) {
          const index = exportData.findIndex((data) => {
            return data.dateValue == dateKey;
          });
          exportData[index].value.push(el);
        } else {
          let lst = [];
          lst.push(el);
          exportData.push({ dateValue: el.Date, value: lst });
          dateKey = el.Date;
        }
      });
      let lstLabel = exportData.map((x) => {
        return x.dateValue;
      });
      let data = [];
      let lstpDayVALUE = [];
      exportData.forEach((rawData, index) => {
        const pDayVALUE = rawData.value.reduce((accumulator, object) => {
          return accumulator + object.VALUE;
        }, 0);
        lstpDayVALUE.push(pDayVALUE);
        rawData.value.forEach((el) => {
          //Index checking sector already have ?
          const indexSector = data.findIndex((data) => {
            return data.name == el.SYS;
          });
          if (indexSector != -1) {
            data[indexSector].data.push(
              parseFloat(((el.VALUE / pDayVALUE) * 100).toFixed(2))
            );
            data[indexSector].vol.push(el.VOL);
            data[indexSector].val.push(el.VALUE);
            if (index == exportData.length - 1) {
              data[indexSector].lastvol = el.VOL;
              data[indexSector].lastvalue = el.VALUE;
            }
          } else {
            data.push({
              name: el.SYS,
              data: [parseFloat(((el.VALUE / pDayVALUE) * 100).toFixed(2))],
              vol: [el.VOL],
              val: [el.VALUE],
              lastvol: 0,
              lastvalue: 0,
            });
          }
        });
      });
      res.json({
        label: lstLabel,
        data: data.sort(oderByLastValue),
        pDayVALUE: lstpDayVALUE,
      });
    });
  } catch (ex) {
    res.json({ status: -1, message: ex });
  }
});

router.get("/api/investor", (req, res) => {
  try {
    var investor = firebase.database().ref("stock/investor");
    investor.on("value", (snapshot) => {
      let rawData = [];
      snapshot.forEach((x, index) => {
        rawData.push(x.val());
      });
      res.json({ status: 1, data: rawData });
    });
  } catch (err) {
    res.json({ status: -1, message: err });
  }
});
router.get("/api/listSymbol", (req, res) => {
  try {
    const dateKeys = req.query.date;
    var stockSumSector = firebase
      .database()
      .ref("stock/rawData")
      .orderByChild("Date")
      .equalTo(dateKeys);
    stockSumSector.on("value", (snapshot) => {
      //console.log("getgroup data : ", snapshot.val());
      let dataJson = [];
      snapshot.forEach((snapData) => {
        dataJson.push({
          symbol: snapData.val().SYS,
          group: snapData.val().Group.replace(".", ""),
        });
      });
      res.json({ status: -1, data: dataJson.sort(compareSymbol) });
    });
  } catch (ex) {
    res.json({ status: -1, message: ex });
  }
});

router.get("/api/cashlist", async (req, res) => {
  try {
    const list = mathData.lstSymbol;
    const lstData = [];
    var bar = new Promise((resolve, reject) => {
      list.forEach((el, index, array) => {
        yahoo2
          .getStockDetial(el.symbol + ".BK", {
            modules: [
              "defaultKeyStatistics",
              "balanceSheetHistoryQuarterly",
              "price",
            ],
          })
          .then((data) => {
            const { sharesOutstanding } = data.defaultKeyStatistics;
            const { regularMarketPrice, marketCap, currencySymbol } =
              data.price;
            const { cash, totalCurrentAssets, totalLiab } =
              data.balanceSheetHistoryQuarterly.balanceSheetStatements.sort(
                compareDate
              )[0];
            const result = {
              symbol: el.symbol,
              price: regularMarketPrice,
              mktCap: marketCap,
              curSys: currencySymbol,
              sharesOutstanding: sharesOutstanding,
              cash: cash,
              assets: totalCurrentAssets,
              liab: totalLiab,
              companyValue: totalCurrentAssets - totalLiab,
              cash2shares: (cash / sharesOutstanding).toFixed(3),
            };
            console.log(
              "[cashlist] " + index + " = " + el.symbol + " : Complete"
            );
            lstData.push(result);
            if (index === array.length - 1) resolve();
          })
          .catch((err) => {});
      });
    });
    bar.then(() => {
      res.json({ status: 1, data: lstData });
    });
  } catch (err) {
    res.json({ status: -1, message: err });
  }
});

router.get("/api/cashlist2", async (req, res) => {
  const list = mathData.lstCash;
});

router.get("/api/nvdrTrade", async (req, res) => {
  try {
    const dateKeys = req.query.date;
    const typesKeys = req.query.mode;
    const topKeys = req.query.number;
    console.log(
      "call function nvdrTrade : " + dateKeys + "," + typesKeys + "," + topKeys
    );
    //Getting information from firbase database.
    var nvdrSummary = firebase
      .database()
      .ref("stock/NVDR")
      .orderByChild("date")
      .equalTo(dateKeys);
    nvdrSummary.on("value", (snapshot) => {
      let dataSend = null;
      snapshot.forEach((snapElement) => {
        const snapData = snapElement.val();
        const snapList = snapData.values.sort(dynamicSort(typesKeys));
        dataSend = snapList.slice(0, topKeys);
      });
      res.json({
        status: 1,
        message: "success",
        data: dataSend,
      });
    });
  } catch (err) {
    res.json({ status: -1, message: err });
  }
});

router.get("/api/nvdrSymbol", async (req, res) => {
  try {
    const dateKeys = req.query.date;
    const sysKeys = req.query.symbol;
    console.log("call function nvdrSymbol : " + dateKeys + "," + sysKeys);
    //Getting information from firbase database.
    var nvdrSymbol = firebase
      .database()
      .ref("stock/NVDR")
      .orderByChild("date")
      .startAt(dateKeys);
    nvdrSymbol.on("value", (snapshot) => {
      const lstNVDR = [];
      snapshot.forEach((snapElement) => {
        const snapData = snapElement.val();
        const snapList = snapData.values.filter(
          (data) => data["Symbol"] == sysKeys
        );
        snapList.forEach((element) => {
          lstNVDR.push({
            data: snapData.date,
            Buy: parseInt(element.Buy.replace(/,/g, "")),
            Net: parseInt(element.Net.replace(/,/g, "")),
            Sell: parseInt(element.Sell.replace(/,/g, "")),
            Symbol: element["Symbol"],
            Total: parseInt(element.Total.replace(/,/g, "")),
          });
        });
      });
      res.json({
        status: 1,
        message: "success",
        data: lstNVDR,
      });
    });
  } catch (err) {
    res.json({ status: -1, message: err });
  }
});

router.get("/api/test5B", async (req, res) => {
  /*
  try {
    const lstData = [];
    const list = [
      "BTNC",
      "NC",
      "NPK",
      "URBNPF",
      "ROCK",
      "ACAP",
      "MNIT",
      "TNPF",
      "SAWANG",
      "TCOAT",
      "JCKH",
      "HYDRO",
      "MNRF",
      "CHARAN",
      "THMUI",
      "M-STOR",
      "YONG",
      "UPF",
      "ABPIF",
      "SANKO",
      "ARIP",
      "GCAP",
      "TNDT",
      "STC",
      "CIG",
      "QHOP",
      "SK",
      "KCM",
      "TCJ",
      "PRECHA",
      "PRAPAT",
      "FANCY",
      "JAK",
      "RP",
      "FLOYD",
      "AFC",
      "MNIT2",
      "PPS",
      "CRD",
      "ASIMAR",
      "OGC",
      "KASET",
      "UP",
      "F&D",
      "DHOUSE",
      "BGT",
      "IRCP",
      "BUI",
      "TVT",
      "IND",
      "NEW",
      "PHOL",
      "TSI",
      "QLT",
      "KK",
      "K",
      "BTW",
      "OCC",
      "DV8",
      "KKC",
      "PPP",
      "WIN",
      "PG",
      "GTB",
      "CITY",
      "BSM",
      "AKP",
      "GENCO",
      "MANRIN",
      "LDC",
      "TPA",
      "THANA",
      "ASN",
      "CPT",
      "SMART",
      "PLANET",
      "ERWPF",
      "TNPC",
      "TPP",
      "CSP",
      "VARO",
      "META",
      "HPT",
      "TMC",
      "TWP",
      "COMAN",
      "TKT",
      "PRAKIT",
      "ABM",
      "ETE",
      "LIT",
      "TIF1",
      "EASON",
      "TRV",
      "NEP",
      "GSC",
      "TM",
      "TPLAS",
      "NDR",
      "SAM",
      "ALLA",
      "BC",
      "TPOLY",
      "SKE",
      "SE",
      "FVC",
      "PAF",
      "SLP",
      "KPNPF",
      "MOONG",
      "WGE",
      "TRT",
      "APP",
      "SE-ED",
      "SAMCO",
      "ACG",
      "SR",
      "CHOTI",
      "CI",
      "TOPP",
      "MBAX",
      "BLESS",
      "SIAM",
      "RWI",
      "PLE",
      "FTE",
      "COLOR",
      "UEC",
      "TPS",
      "PPM",
      "INGRS",
      "SMK",
      "TIGER",
      "FTI",
      "ADB",
      "PK",
      "GLORY",
      "NATION",
      "MVP",
      "PERM",
      "BKKCP",
      "SPACK",
      "KUMWEL",
      "PMTA",
      "PDG",
      "MITSIB",
      "GPI",
      "CHEWA",
      "L&E",
      "JCT",
      "PICO",
      "TEKA",
      "SGF",
      "BSBM",
      "GBX",
      "PTC",
      "MENA",
      "ATP30",
      "CRANE",
      "CM",
      "CCP",
      "ALL",
      "CPL",
      "KWM",
      "MIDA",
      "TITLE",
      "SOLAR",
      "GREEN",
      "JCK",
      "FNS",
      "UBIS",
      "CMO",
      "HTECH",
      "CPANEL",
      "CHO",
      "PROS",
      "SSPF",
      "CPR",
      "ML",
      "TAPAC",
      "NKI",
      "HARN",
      "M-II",
      "TMI",
      "PORT",
      "KC",
      "GYT",
      "CPH",
      "EVER",
      "SUTHA",
      "TLHPF",
      "MJD",
      "DIMET",
      "TMW",
      "CSR",
      "TGPRO",
      "RICHY",
      "SCI",
      "VPO",
      "PROUD",
      "ABICO",
      "RPC",
      "TCMC",
      "CEYE",
      "CAZ",
      "SIRIP",
      "TWZ",
      "AJA",
      "TTI",
      "TCC",
      "KOOL",
      "IFS",
      "SELIC",
      "KIAT",
      "AKR",
      "MALEE",
      "PATO",
      "WAVE",
      "WINNER",
      "STOWER",
      "KWC",
      "AMC",
      "GIFT",
      "YUASA",
      "MGT",
      "SCP",
      "FMT",
      "24CS",
      "MATCH",
      "LUXF",
      "STP",
      "WIIK",
      "PL",
      "CMC",
      "UMI",
      "GEL",
      "TMILL",
      "B",
      "NCL",
      "MATI",
      "PDJ",
      "VL",
      "AF",
      "JSP",
      "SIMAT",
      "W",
      "STECH",
      "VCOM",
      "CNT",
      "QTC",
      "KDH",
      "EMC",
      "CWT",
      "B52",
      "TYCN",
      "ECF",
      "CTARAF",
      "TPBI",
      "KUN",
      "SORKON",
      "PT",
      "BRRGIF",
      "SECURE",
      "ESTAR",
      "TNITY",
      "BROCK",
      "CSS",
      "SSSC",
      "WINMED",
      "CMAN",
      "2S",
      "RT",
      "SALEE",
      "LHK",
      "QHHR",
      "TRUBB",
      "EFORL",
      "TAE",
      "RSP",
      "TVDH",
      "ARROW",
      "AQ",
      "PPPM",
      "NWR",
      "THE",
      "CPI",
      "IT",
      "SAAM",
      "SVOA",
      "LHPF",
      "GRAND",
      "NV.R",
      "NV",
      "SMD",
      "IHL",
      "JDF",
      "DOD",
      "WPH",
      "Q-CON",
      "UKEM",
      "DCON",
      "MDX",
      "NCH",
      "D",
      "FSS",
      "MPIC",
      "UPOIC",
      "ACC",
      "SQ",
      "ASEFA",
      "BM",
      "ICN",
      "CIVIL",
      "HPF",
      "SFT",
      "FN",
      "TSR",
      "CEN",
      "TRITN",
      "SSF",
      "PEACE",
      "KCAR",
      "LEE",
      "MJLF",
      "JKN",
      "ASAP",
      "NOVA",
      "PROEN",
      "BIOTEC",
      "UMS",
      "UREKA",
      "WP",
      "TPCS",
      "ECL",
      "BIG",
      "CV",
      "PIMO",
      "GLOCON",
      "SONIC",
      "DPAINT",
      "SPVI",
      "PAP",
      "ASIA",
      "GC",
      "BR",
      "NSI",
      "CPW",
      "CTW",
      "IMH",
      "CSC",
      "SYNTEC",
      "PREB",
      "SMIT",
      "SEAFCO",
      "INSET",
      "KBS",
      "PPF",
      "INSURE",
      "SFP",
      "MIPF",
      "MODERN",
      "TEAM",
      "TRC",
      "MUD",
      "SFLEX",
      "TQR",
      "SVT",
      "UOBKH",
      "AMR",
      "AHC",
      "BKD",
      "VRANDA",
      "CHOW",
      "INET",
      "ZIGA",
      "ALT",
      "TNR",
      "IRC",
      "HEMP",
      "A5",
      "TTCL",
      "PACO",
      "MFC",
      "TSTE",
      "ADD",
      "NBC",
      "BJCHI",
      "CGH",
      "TTT",
      "TAKUNI",
      "SRICHA",
      "PJW",
      "THREL",
      "APCO",
      "SYMC",
      "SEAOIL",
      "SCN",
      "DEMCO",
      "RML",
      "BIZ",
      "ALPHAX",
      "CFRESH",
      "WFX",
      "SICT",
      "AMA",
      "SUN",
      "TFI",
      "TPCH",
      "BIS",
      "S11",
      "SDC",
      "SWC",
      "TNP",
      "ROH",
      "UPA",
      "NEWS",
      "NVD",
      "KBSPIF",
      "MK",
      "BEYOND",
      "PYLON",
      "APCS",
      "RPH",
      "TSC",
      "SST",
      "MCOT",
      "MSC",
      "STI",
      "UAC",
      "PRIN",
      "BWG",
      "EE",
      "TMD",
      "SMT",
      "CH",
      "CGD",
      "AQUA",
      "MFEC",
      "ARIN",
      "TH",
      "THIP",
      "LEO",
      "PF",
      "TC",
      "TRU",
      "BEAUTY",
      "NNCL",
      "ILINK",
      "LST",
      "PIN",
      "HFT",
      "SITHAI",
      "TTLPF",
      "SKN",
      "TNL",
      "EP",
      "AMANAH",
      "SAMTEL",
      "MILL",
      "TACC",
      "LPH",
      "MICRO",
      "MACO",
      "TGE",
      "TIPCO",
      "IIG",
      "SCM",
      "7UP",
      "SO",
      "WACOAL",
      "TPAC",
      "TOG",
      "TSE",
      "AI",
      "TFM",
      "PSTC",
      "NCAP",
      "ZEN",
      "NYT",
      "S&J",
      "J",
      "BROOK",
      "TK",
      "AIE",
      "APURE",
      "TWPC",
      "THRE",
      "IP",
      "METCO",
      "CPNCG",
      "MCS",
      "UNIQ",
      "ITEL",
      "A",
      "SENAJ",
      "PM",
      "FPI",
      "AGE",
      "JUBILE",
      "LOXLEY",
      "EKH",
      "VIH",
      "M-CHAI",
      "MONO",
      "JR",
      "LRH",
      "TEGH",
      "3K-BAT",
      "TVI",
      "XO",
      "KAMART",
      "AJ",
      "POPF",
      "AUCT",
      "SUSCO",
      "UV",
      "KISS",
      "YGG",
      "TKS",
      "KCC",
      "AMARIN",
      "NETBAY",
      "SPG",
      "SUPEREIF",
      "PTECH",
      "SAMART",
      "SCG",
      "SENA",
      "NFC",
      "DDD",
      "AIT",
      "NTV",
      "ANAN",
      "BRR",
      "HTC",
      "TKC",
      "SNC",
      "NOBLE",
      "PRIME",
      "SKY",
      "LPN",
      "ASP",
      "KYE",
      "DRT",
      "OHTL",
      "UVAN",
      "HL",
      "MST",
      "ASW",
      "TNH",
      "BGC",
      "UBE",
      "AMATAV",
      "TMT",
      "CPTGF",
      "ETC",
      "PRG",
      "SHANG",
      "PLUS",
      "NSL",
      "OTO",
      "KWI",
      "STPI",
      "FUTUREPF",
      "PCSGH",
      "MTI",
      "WICE",
      "QHPF",
      "SSC",
      "MC",
      "ALUCON",
      "SNP",
      "III",
      "WORK",
      "LALIN",
      "SMPC",
      "NRF",
      "ILM",
      "BRI",
      "U",
      "SAT",
      "AS",
      "SUC",
      "EASTW",
      "BOL",
      "SIS",
      "TSTH",
      "AU",
      "SABINA",
      "ICC",
      "PLAT",
      "GRAMMY",
      "INOX",
      "SPA",
      "GJS",
      "TR",
      "HUMAN",
      "BBGI",
      "CHAYO",
      "KGI",
      "TKN",
      "DUSIT",
    ];
    var bar = new Promise((resolve, reject) => {
      list.forEach(async (el, index, array) => {
        let link =
          "https://www.set.or.th/api/set/company/" + el + "/profile?lang=th";

        //console.log("link = > ", link);

        await axios
          .get(link)
          .then((res) => {
            const rawdata = res.data;
            let newData = {
              symbol: el,
              company_name: rawdata.name,
              industry: rawdata.industryName,
              sector: rawdata.sectorName,
              businessType: rawdata.businessType,
              link: rawdata.url,
              score: rawdata.cgScore,
            };
            lstData.push(newData);
            if (index === array.length - 1) resolve();
          })
          .catch((err) => {
            resolve();
          });
      });
    });

    bar
      .then(() => {
        console.log("lstData = > ", lstData);
        res.json({ status: 1, data: lstData });
      })
      .catch((err) => {
        //console.log("catch = > ", err);
      });
  } catch (err) {
    console.log("catch = > ", err);
    res.json({ status: -1, message: err });
  }

  */
});

app.use(bodyParser.json());
app.use("/.netlify/functions/server", router); // path must route to lambda
app.use("/", (req, res) => res.sendFile(path.join(__dirname, "../index.html")));

module.exports = app;
module.exports.handler = serverless(app);

/* Static function */
//Setting data and formation date for searching
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

function compareDate(a, b) {
  if (a.endDate > b.endDate) {
    return -1;
  }
  if (a.endDate < b.endDate) {
    return 1;
  }
  return 0;
}

function getLastActiveDate() {
  const nDate = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Bangkok",
  });
  console.log(nDate);
  var day = getDayName(nDate, "en-US");
  if (day == "Sunday") {
    var date = new Date(nDate).addDays(-2);
    return formatDate(date);
  } else if (day == "Saturday") {
    var date = new Date(nDate).addDays(-1);
    return formatDate(date);
  } else {
    return formatDate(nDate);
  }
}

function getDayName(dateStr) {
  var date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}
//Static function
function compare(a, b) {
  let bValue = a.data[a.data.length - 1];
  let aValue = b.data[b.data.length - 1];
  if (aValue < bValue) {
    return -1;
  }
  if (aValue > bValue) {
    return 1;
  }
  return 0;
}

function compareDateAsc(a, b) {
  if (b.date < a.date) {
    return 1;
  }
  if (b.date > a.date) {
    return -1;
  }
  return 0;
}

function compareSymbol(a, b) {
  if (b.symbol < a.symbol) {
    return 1;
  }
  if (b.symbol > a.symbol) {
    return -1;
  }
  return 0;
}

function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

function oderByDate(a, b) {
  let bValue = a.Date;
  let aValue = b.Date;
  if (aValue < bValue) {
    return 1;
  }
  if (aValue > bValue) {
    return -1;
  }
  return 0;
}

function snapshotToArray(snapshot) {
  var returnArr = [];
  snapshot.forEach(function (childSnapshot) {
    var item = childSnapshot.val();
    returnArr.push(item);
  });
  return returnArr;
}

function orderyByValue(a, b) {
  let bValue = a.VALUE;
  let aValue = b.VALUE;
  if (aValue < bValue) {
    return -1;
  }
  if (aValue > bValue) {
    return 1;
  }
  return 0;
}

function orderyByVol(a, b) {
  let bValue = a.VOL;
  let aValue = b.VOL;
  if (aValue < bValue) {
    return -1;
  }
  if (aValue > bValue) {
    return 1;
  }
  return 0;
}

function oderByLastValue(a, b) {
  let bValue = parseInt(a.lastvalue);
  let aValue = parseInt(b.lastvalue);
  if (aValue < bValue) {
    return -1;
  }
  if (aValue > bValue) {
    return 1;
  }
  return 0;
}

function dynamicSort(property) {
  var sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    let bValue = parseInt(a[property].replace(/,/g, ""));
    let aValue = parseInt(b[property].replace(/,/g, ""));
    if (aValue < bValue) {
      return -1;
    }
    if (aValue > bValue) {
      return 1;
    }
    return 0;
  };
}
/* End Static function */
