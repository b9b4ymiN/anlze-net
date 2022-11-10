const { default: yahooFinance } = require("yahoo-finance2");
const mathData = require("./util");

async function getStockDetial(symbol, modules) {
  const result = await yahooFinance.quoteSummary(symbol, modules);
  return result;
}

async function getCash(symbol) {
  await yahooFinance
    .quoteSummary(symbol, {
      modules: ["defaultKeyStatistics", "balanceSheetHistory"],
    })
    .then(async (data) => {
      const { sharesOutstanding } = data.defaultKeyStatistics;
      const { cash } = data.balanceSheetHistory.balanceSheetStatements[3];
      const result = {
        symbol: symbol,
        sharesOutstanding: sharesOutstanding,
        cash: cash,
        cash2shares: (cash / sharesOutstanding).toFixed(3),
      };
      console.log("getCash : ", result);
      return result;
    })
    .catch((err) => {
      return { symbol: symbol, error: "fail loading data" };
    });
}

async function getPriceFixDate(symbol, date) {
  var dateStr = new Date(date);
  let queryOptions = { period1: date, period2: formatDate(dateStr.addDays(1)) };
  console.log("q : ", queryOptions);
  const result = yahooFinance.historical(symbol, queryOptions);
  return result;
}

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

async function getLastPrice(symbol) {
  var dateStr = new Date();
  let queryOptions = {
    period1: formatDate(dateStr.addDays(-1)),
    period2: formatDate(dateStr.addDays(2)),
  };
  console.log("getLastPrice : ", queryOptions, " | symbol : ", symbol);
  const result = yahooFinance.historical(symbol, queryOptions);
  return result;
}

async function getListIndex() {
  const quote = await yahooFinance.quote([
    mathData.mathPriceKey["dowJone"],
    mathData.mathPriceKey["stoxx"],
    mathData.mathPriceKey["dax"],
    mathData.mathPriceKey["shanghai"],
    mathData.mathPriceKey["nikkei"],
    mathData.mathPriceKey["krx"],
    mathData.mathPriceKey["hsi"],
    mathData.mathPriceKey["SETIndex"],
  ]);
  const rawData = [];
  quote.forEach((data) => {
    console.log("getListIndex : ", data);
    const {
      shortName,
      regularMarketChangePercent,
      regularMarketPrice,
      regularMarketPreviousClose,
      regularMarketChange,
      currency,
    } = data;
    rawData.push({
      shortName: shortName,
      regularMarketChangePercent: regularMarketChangePercent,
      regularMarketPrice: regularMarketPrice,
      regularMarketPreviousClose: regularMarketPreviousClose,
      regularMarketChange: regularMarketChange,
      currency: currency,
    });
  });
  return rawData;
}
module.exports.getStockDetial = getStockDetial;
module.exports.getPriceFixDate = getPriceFixDate;
module.exports.getLastPrice = getLastPrice;
module.exports.getListIndex = getListIndex;
module.exports.getCash = getCash;
