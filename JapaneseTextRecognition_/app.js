const path = require('path');
const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const handlebars = require('express-handlebars').engine;
const bodyParser = require('body-parser');
const fileUploadController = require('./controllers/fileUploadController');
const { eventEmitter } = require('./controllers/fileUploadController');
// const multer = require('multer');
// Middleware để xử lý dữ liệu JSON từ yêu cầu POST
app.use(bodyParser.json());
const { spawn } = require('child_process');



const userRouter = require('./routes/userRoutes');
const uploadRouter = require('./routes/uploadRoutes');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('dev'));
app.engine(
  'hbs',
  handlebars({
      extname: '.hbs',
      helpers: {
        sum: (a, b) => a + b,
    }
  }),
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// Body parser, reading data from body into req.body
app.use(express.json());
app.use(cookieParser());

// Endpoint mới để lấy dữ liệu mới
// app.post('/api/getNewData', (req, res) => {
//     const newData = req.body.newData;
//     // Xử lý dữ liệu mới ở đây nếu cần
//     // ...
//     console.log("phia ben appjs:", newData);

//     // Trả về dữ liệu mới cho máy khách
//     res.json(newData);
// });

app.post('/api/getNewData', (req, res) => {
  const newData = req.body.newData;
  console.log("phia ben appjs:", newData);

  // Gửi sự kiện cho tất cả các máy khách đang lắng nghe
  eventEmitter.emit('newData', newData);

  // Trả về dữ liệu mới cho máy khách
  res.json(newData);
});

// REST API để xác định kết nối SSE
app.get('/api/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Lắng nghe sự kiện 'newData' và gửi dữ liệu mới khi có sự kiện
  const newDataListener = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  eventEmitter.on('newData', newDataListener);

  // Đóng kết nối khi máy khách ngắt kết nối
  req.on('close', () => {
    eventEmitter.off('newData', newDataListener);
    res.end();
  });
});


// Route
app.use('/', userRouter);

app.use('/api/v1/users', userRouter);
app.use('/api/v1/upload', uploadRouter);

module.exports = app;

