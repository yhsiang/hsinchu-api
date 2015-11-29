import express from 'express';
import cors from 'express-cors';
import request from 'request';
import cheerio from 'cheerio';
import async from 'asyncawait/async';
import await from 'asyncawait/await';
import {map} from 'lodash';

const PORT = process.env.PORT || 8080
    , app = express()
    , base_url = 'http://www.hccg.gov.tw'
    , road_url = 'http://pipe.hccg.gov.tw/HCPEMS/CMMDGS/Work.ashx?callback=remove&FunctionName=getWorkAreaList&_=1448756021687'
    , news_url = 'http://www.hccg.gov.tw/web/News?FP=D40000001852000002'
    , event_url = 'http://www.hccg.gov.tw/web/Message?FP=D40000001852000008_2';

app.use(cors({
  allowedOrigins: '*'
}));

app.get('/', (req, res) => {
  return res.json({ message: 'Welcome to HSINCHU API Server!' });
});

function readRoadInfo() {
  return new Promise((resolve, reject) => {
    request(road_url, (err, res, body) => {
      if (err) return reject(err);
      return resolve(body);
    });
  });
}

app.get('/road', async((req, res) => {
  let body = await(readRoadInfo())
    , [fullStr, match] = body.match(/remove\((.+)\)/);

  return res.json({ results: JSON.parse(match) });
}));

function readURLs(url) {
  return new Promise((resolve, reject) => {
    request(url, async(err, res, body) => {
      if (err) return reject(err);
      let $ = cheerio.load(body)
        , urls = $('table.tableside2 tr td a').map((i, el) => {
          return base_url + $(el).attr('href');
      }).get();
      return resolve(urls);
    });
  });
}

function readNewsContent(url) {
  return new Promise((resolve, reject) => {
    request(url, (err, res, body) => {
      if (err) return reject(err);
      let $ = cheerio.load(body)
        , news = {
            title: $('.darktextb-14').text(),
            thumb: base_url + $('.style2 a img').attr('src'),
            content: $('.style2').text(),
            url
          };
      return resolve(news);
    });
  });
}

app.get('/news', async((req, res) => {
  let urls = await(readURLs(news_url))
  , results = await(map(urls, u => readNewsContent(u)));
  return res.json({ results });
}));

function readEventContent(url) {
  return new Promise((resolve, reject) => {
    request(url, (err, res, body) => {
      if (err) return reject(err);
      let $ = cheerio.load(body)
        , thumb = $('.darktextg-11 p a img').attr('src')
        , event = {
            title: $('.jh6 .darktextb-15').text(),
            thumb: (thumb) ? base_url + thumb : '',
            content: $('.darktextg-11').text(),
            startDate: $('.darktextg-13').eq(2).text().replace('活動開始日期：',''),
            endDate: $('.darktextg-13').eq(3).text().replace('活動截止日期：',''),
            url
          };
      return resolve(event);
    });
  });
}

app.get('/events', async((req, res) => {
  let urls = await(readURLs(event_url))
  , results = await(map(urls.slice(0, 5), u => readEventContent(u)));
  return res.json({ results });
}));

app.listen(PORT, () => {
  return console.log(`Server listen on ${PORT}`)
});
