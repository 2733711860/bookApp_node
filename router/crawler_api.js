const superagent = require('superagent');
require('superagent-charset')(superagent);
const cheerio = require('cheerio');
const async = require('async');


const crawler = async (ctx) => {
  const url = ctx.query.url;
  let chapters = await getChapter(url); // 根据url爬取书籍所有章节信息
  let results = await mapChapterUrl(chapters); // map遍历章节url
  ctx.body = results
};

// 根据url爬取书籍所有章节信息
function getChapter(url) {
  return new Promise(async (resolve, reject) => {
    superagent.get(url)
      .buffer(true)
      .end((err, res) => {
        if (err) reject(err);
        var $ = cheerio.load(res.text);
        let author = $("#info").find('p').eq(0).text(); // 作者
        author = author.substring(author.indexOf('：') + 1, author.length);
        let lastUpDate =  $("#info").find('p').eq(2).text(); // 最新更新时间
        lastUpDate = lastUpDate.substring(lastUpDate.indexOf('：') + 1, lastUpDate.length);
        let bookMsg = { // 书籍基本信息
          bookName: $("#info h1").text(),
          author: author,
          lastUpDate: lastUpDate,
          intro: $("#intro").find('p').eq(1).text(),
          bookCover: $("#fmimg img").attr('src')
        };
        bookMsg.bookId = url.substring(url.indexOf('.la/') + 4, url.length-1);
        bookMsg.bookId = bookMsg.bookId.substring(bookMsg.bookId.indexOf('/') + 1, bookMsg.bookId.length);
        let chapters = []; // 书籍章节列表
        $("#list dl dd").each((i, v) => {
          let chapterMsg = {};
          chapterMsg.chapterName = $(v).find('a').text();
          chapterMsg.chapterUrl = 'http://www.xbiquge.la' + $(v).find('a').attr('href');
          chapterMsg.chapterId = chapterMsg.chapterUrl.substring(chapterMsg.chapterUrl.lastIndexOf('/') + 1, chapterMsg.chapterUrl.indexOf('.html'));
          chapterMsg.bookId = bookMsg.bookId;
          chapterMsg.bookName = bookMsg.bookName;
          chapters.push(chapterMsg)
        });
        // 将书籍章节信息保存到数据库 ---------需要写
        /*-------------------------------------------*/
        resolve(chapters)
      })
  })
}

// map遍历章节url
function mapChapterUrl(chapters) {
  return new Promise((resolve, reject) => {
    async.mapLimit(chapters, 5, (item, callback) => {
      getChapterContent(item, callback); // 根据章节url获取章节内容
    }, (err, results) => {
      if (err) reject(err);
      resolve(results)
    });
  })
}

// 根据章节url获取章节内容
function getChapterContent(item, callback) {
  superagent.get(item.chapterUrl)
    .buffer(true)
    .end((err, res) => {
      var $ = cheerio.load(res.text);
      const content = $("#content").text().split('<br><br>');
      let contentArr = [];
      content.forEach(elem => {
        elem = trim(elem.toString()); // 去除内容的两端空格和&nbsp;
        contentArr.push(elem);
      });
      item.chapterContent = contentArr;
      callback(null, item)
    })
}

// 去除内容的两端空格和&nbsp;
function trim(str) {
  return str.replace(/(^\s*)|(\s*$)/g, '').replace(/&nbsp;/g, '')
}



module.exports = {
  crawler
};