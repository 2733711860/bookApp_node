const router = require('koa-router')();

// api
const { crawler } = require('./crawler_api');

router.get('/', async (ctx, next) => {
  ctx.body = '初始页面'
})

  // 爬取数据
  .get('/crawler', crawler);


module.exports = {
  router
};