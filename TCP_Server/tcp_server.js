const path = require('path');
const { spawn } = require('child_process');
var express = require("express");
var app = express();
var net = require('net');
var fs = require('fs');
// const { fileURLToPath } = require('url');
app.use(express.static(__dirname + '/public'));


var server = net.createServer(function (socket) {
    var receivedData = '';
    var fileName = '';

    var tmp = '';
    socket.on('data', function (data) {
        data = data.toString();
        // tmp += '----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------' + data;
        receivedData += data;


        while(receivedData.includes('file'))
        {
            var separatorIndex = receivedData.indexOf('file');
            while (separatorIndex !== -1) {
                var imageData = receivedData.substring(0, separatorIndex);
                receivedData = receivedData.substring(separatorIndex);
    
                // Tìm và trích xuất tên tệp hình ảnh
                var fileNameMatch = receivedData.match(/file\[\d+\]-\d+\.png/);
                if (fileNameMatch) {
                    fileName = fileNameMatch[0];
                }
    
                handleImage(imageData, fileName);
                receivedData = receivedData.substring(fileName.length); // Loại bỏ dữ liệu đã xử lý
    
                separatorIndex = receivedData.indexOf('file');
            }
        }


    });

    var receivedFileNames = [];

    function handleImage(imageData, fileName) {
        if (imageData.length > 0) {
            const filePath = path.join(__dirname, 'uploads', fileName);
            fs.writeFile(filePath, imageData, 'base64', (err) => {
                if (err) {
                    console.error(`Lỗi khi lưu ảnh: ${err}`);
                } else {
                    console.log(`Đã lưu ảnh với tên ${fileName}`);
                    receivedFileNames.push(fileName);
                }
            });
        }
    }

    socket.on('data', function (data) {
        // ... (mã nguồn khác)
        
        if (data.includes('endTransmission')) {
            // Khi nhận được dữ liệu 'endTransmission', gọi convert với mảng tên tệp
            convert(receivedFileNames);
        }
    });
    
    function convert(receivedFileNames) {
        if (receivedFileNames.length > 0) {
            // console.log("File name: ", fileName);
            // const imagePath = path.join(__dirname, 'uploads', fileName).replace(/\\/g, '/');
            // console.log("Image path: ", imagePath);
    
            // Điều chỉnh đường dẫn của các tệp và thư mục
            const pythonScriptPath = 'C:/tensorflow1/models/research/object_detection/detect_from_image.py';
            const modelPath = 'C:/tensorflow1/models/research/object_detection/inference_graph/saved_model';
            const labelmapPath = 'C:/tensorflow1/models/research/object_detection/training/labelmap.pbtxt';
            const imagePath1 = 'D:/ltmnc2/TCP_Server/uploads';
    
            console.log("Absolute path to test_image:", imagePath1);
            console.log("Absolute path to saved_model:", modelPath);
            console.log("Absolute path to labelmap.pbtxt:", labelmapPath);
    
            const pythonProcess = spawn('python', [pythonScriptPath, '-m', modelPath, '-l', labelmapPath, '-i', imagePath1]);
            pythonProcess.stdout.on('data', (data) => {
                // console.log(`Test co gi --------------------->: ${data}`)
            });
    
            pythonProcess.stderr.on('data', (data) => {
                console.error(`Lỗi: ${data}`);
            });
    
            pythonProcess.on('close', () => {
                 fs.readdir(imagePath1, (err, files) => {
                    if (err) throw err;

                    for (const file of files) {
                        const filePath = path.join(imagePath1, file);
                        const fileName = path.basename(filePath);

                        // Xóa tệp
                        fs.unlink(filePath, (err) => {
                            if (err) throw err;
                            console.log(`Deleted file: ${fileName}`);
                            const responseData = { fileName: fileName };
                            socket.write(JSON.stringify(responseData));
                            console.log(`Deleted file responseData: ${responseData}`);
                        });
                    }
                });
                console.log('Data is responded!');
            });
        }
    }
    // Callback function when client disconnected
    socket.on('end', function () {
        console.log("Server: Client disconnected");
    });

    // Callback function when there is error
    socket.on('error', function (err) {
        console.log("Server: ERROR: " + err);
    });
});

// Open port 2021
server.listen(2021, function () {
    console.log("Server: listening !\r\n");
});