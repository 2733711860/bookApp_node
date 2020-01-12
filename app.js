const Koa = require('koa');
const app = new Koa();
const { config } = require('./config/config');

// const cors = require('koa-cors');
// app.use(cors());

const { router } = require('./router');
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(config.listenPort, () => {
  console.log(`http://localhost:${config.listenPort}`)
});