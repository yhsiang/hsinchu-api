import express from 'express';
import request from 'request';
import cheerio from 'cheerio';

const PORT = process.env.PORT || 8080
    , app = express()
    , road_url = 'http://pipe.hccg.gov.tw/HCPEMS/CMMDGS/Work.ashx?callback=remove&FunctionName=getWorkAreaList&_=1448756021687';


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

app.get('/road', async (req, res) => {
  let body = await readRoadInfo()
    , [fullStr, match] = body.match(/remove\((.+)\)/);

  return res.json({ results: JSON.parse(match) });
});

app.listen(PORT, () => {
  return console.log(`Server listen on ${PORT}`)
});
