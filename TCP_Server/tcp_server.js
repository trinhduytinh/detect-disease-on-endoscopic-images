
// const multer = require('multer');
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

    function handleImage(imageData, fileName) {
        if (imageData.length > 0) {
            const filePath = path.join(__dirname, 'uploads', fileName);
            fs.writeFile(filePath, imageData, 'base64', (err) => {
                if (err) {
                    console.error(`Error saving the image: ${err}`);
                } else {
                    console.log(`Image saved as ${fileName}`);
                    convert(fileName);
                }
            });
        }
    }
   
    function convert(fileName) {
        if (fileName !== '') {
            console.log("File name: ", fileName);
            const imagePath = path.join(__dirname, 'uploads', fileName).replace(/\\/g, '/');
            console.log("Image path: ", imagePath);
    
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
                const responseData = { fileName: fileName };
                // socket.write(`file name: ${fileName} result: ${result}`);
                socket.write(JSON.stringify(responseData));
                 // Xóa tất cả các tệp trong thư mục uploads sau khi xử lý thành công
                 fs.readdir(imagePath1, (err, files) => {
                    if (err) throw err;

                    for (const file of files) {
                        const filePath = path.join(imagePath1, file);

                        // Xóa tệp
                        fs.unlink(filePath, (err) => {
                            if (err) throw err;
                            console.log(`Deleted file: ${filePath}`);
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