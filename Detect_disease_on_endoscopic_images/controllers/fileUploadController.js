const Upload = require('../models/uploadHistoryModel');
const EventEmitter = require('events');
const eventEmitter = new EventEmitter();    
const multer = require('multer');
const path = require('path');
const axios = require('axios');
// const { spawn } = require('child_process');

// Asynchronous network API module
var net = require('net');
// File system module to store data
var fs = require('fs');

// Thiết lập Multer cho việc tải lên tệp
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/'); // Đặt thư mục tải lên
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });
let uploadedFiles = null;
exports.handleFileUpload = (req, res, next) => {
    upload.any('file', 100)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.log('Upload error.');
        } else if (err) {
            console.log('Server error.');
        }
        // Dạng tệp đã tải lên nằm trong req.files
        uploadedFiles = req.files;
        console.log('req.files:', req.files);
        if (!uploadedFiles || uploadedFiles.length === 0) {
            console.log('No files uploaded.');
        }
        // Xử lý tệp đã tải lên ở đây (ví dụ: lưu vào cơ sở dữ liệu, xử lý, vv.)

        // Phản hồi thành công
        console.log(uploadedFiles.length, 'Files uploaded successfully');
        next();
    });
}

exports.test = (req, res, next) => {
    res.send('abc');
}

exports.convert = (req, res, next) => {
    var i = 0;
    var dataToNext = [];
    const imageFiles = req.files;
    const client = new net.Socket();

        
        client.connect(2021, "localhost", function () {
            console.log('Connected');
            imageFiles.forEach((imageFile, index) => {
                const imagePath = path.join(__dirname, '..', 'public/uploads', imageFile.filename).replace(/\\/g, '/');
                const imageBuffer = fs.readFileSync(imagePath);
                const base64Image = imageBuffer.toString('base64');
                const dataToSend = base64Image + `${imageFiles[index].filename}`;
                client.write(dataToSend);
            });
            // Gửi dữ liệu 'endTransmission' khi tất cả ảnh đã được gửi
            client.write('endTransmission');
        });
    

    // Callback function when data arrives
    client.on('data', function (data) {
        i++;
        const resData = JSON.parse(data.toString('utf-8'));
        dataToNext.push(resData)
        console.log(`${i} Received from server for image: ${resData.fileName}`);
        if (i === imageFiles.length) {
            client.end();
            console.log('-----------end-----------');

            // Gửi yêu cầu đến endpoint mới để lấy dữ liệu mới
            axios.post('http://localhost:80/api/getNewData', { newData: dataToNext })
                .then(response => {
                    console.log('New data fetched:', response.data);

                    // Kiểm tra xem response.data có giá trị không
                    if (response.data) {
                        // Kiểm tra xem response.data có phải là mảng không
                        if (Array.isArray(response.data)) {
                            // Thực hiện các thao tác với mỗi phần tử của mảng
                            response.data.forEach((item) => {
                                // In dữ liệu không bao gồm giá trị 'result'
                                console.log(`Received data for image: ${item.fileName}`);
                            });
                        } else {
                            // Xử lý trường hợp response.data không phải là mảng
                            console.error('Invalid data format. Expected an array.');
                        }
                    } else {
                        // Xử lý trường hợp response.data là undefined
                        console.error('No data received.');
                    }

                    // Phát sự kiện connectionClosed với dữ liệu mới
                    eventEmitter.emit('connectionClosed', response.data);

                    // Gọi next() ở đây để chắc chắn rằng tất cả công việc đã hoàn thành trước khi kết thúc middleware
                    // next();
                })
                .catch(error => {
                    console.error('Error fetching new data:', error);
                    next();
                });
        }
    });

   // Sự kiện được kích hoạt khi kết nối đóng
   client.on('close', function () {
    console.log('Connection closed');
    req.resData = dataToNext;
    // Không cần phải đợi đến khi nhận được dữ liệu mới để thông báo rằng kết nối đã đóng
    // Di chuyển phần này ra khỏi sự kiện 'close'
    console.log('Connection closed');
    eventEmitter.emit('connectionClosed');
    // Đảm bảo gọi next() sau khi đã xử lý tất cả các công việc
    next();
    });

    // Đặt biến để kiểm soát việc gửi phản hồi
    let isResponseSent = false;

    // Đặt sự kiện 'connectionClosed' ở đây
    eventEmitter.on('connectionClosed', (data) => {
        console.log('Connection closed. Data:', data);
        console.log("Kiem tra file: ", isResponseSent);
        // Kiểm tra xem đã gửi phản hồi chưa
        if (!isResponseSent && data) {
          // Gửi dữ liệu đến client thông qua REST API
          res.json(data);
      
          // Đặt biến để đánh dấu là đã gửi phản hồi
          isResponseSent = true;
        }
      });

    
    
    
}

exports.show = (req, res, next) => {
    console.log("test db", req.resData);
    if (req.resData) {
        req.resData.forEach(data => {
            const userId = req.user.id;
            const photo = data.fileName;
            const text = data.fileName;
            const upload = Upload.create({
                user: userId,
                photo,
                text
            });
        });
    }
    // Rest of your code...
}
exports.eventEmitter = eventEmitter; // Xuất eventEmitter