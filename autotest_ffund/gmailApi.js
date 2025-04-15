require('dotenv').config(); // Load biến môi trường từ tệp .env
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// Phạm vi quyền truy cập (chỉ đọc email)
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = 'token.json';

// Ủy quyền ứng dụng với thông tin xác thực
function authorize(callback) {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID, // Lấy CLIENT_ID từ .env
        process.env.CLIENT_SECRET, // Lấy CLIENT_SECRET từ .env
        'http://localhost' // Redirect URI mặc định
    );

    // Kiểm tra xem token đã tồn tại chưa
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

// Lấy token truy cập mới nếu chưa có
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

// Liệt kê các email trong hộp thư đến
function listMessages(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    gmail.users.messages.list(
        {
            userId: 'me',
            q: 'subject:Verify Email', // Tìm email có tiêu đề chứa "Verify Email"
        },
        (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const messages = res.data.messages;
            if (!messages || messages.length === 0) {
                console.log('No messages found.');
                return;
            }
            console.log('Messages:');
            messages.forEach((message) => {
                console.log(`- ${message.id}`);
                getMessage(auth, message.id); // Lấy nội dung email
            });
        }
    );
}

// Lấy nội dung chi tiết của email
function getMessage(auth, messageId) {
    const gmail = google.gmail({ version: 'v1', auth });
    gmail.users.messages.get(
        {
            userId: 'me',
            id: messageId,
        },
        (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const message = res.data;
            console.log('Message snippet:', message.snippet);
        }
    );
}

async function getVerificationLink() {
    const TOKEN_PATH = 'token.json';

    // Tạo OAuth2 client
    const oAuth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        'http://localhost'
    );

    // Đọc token từ tệp
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Tìm email có tiêu đề chứa "Verify Email"
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'subject:Verify Email',
    });

    if (!res.data.messages || res.data.messages.length === 0) {
        console.log('No verification email found.');
        return null;
    }

    // Lấy nội dung email
    const message = await gmail.users.messages.get({
        userId: 'me',
        id: res.data.messages[0].id,
    });

    let emailBody = '';

    // Kiểm tra nếu body nằm trong payload.body.data
    if (message.data.payload.body && message.data.payload.body.data) {
        emailBody = Buffer.from(message.data.payload.body.data, 'base64').toString('utf-8');
    } else if (message.data.payload.parts) {
        // Nếu body nằm trong payload.parts
        for (const part of message.data.payload.parts) {
            if (part.body && part.body.data) {
                emailBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
                break;
            }
        }
    }

    if (!emailBody) {
        console.log('Email body not found.');
        return null;
    }

    // Tìm liên kết xác nhận trong nội dung email
    const verificationLink = emailBody.match(/https?:\/\/[^\s]+/);
    if (verificationLink) {
        return verificationLink[0];
    } else {
        console.log('Verification link not found in email.');
        return null;
    }
}
module.exports = { authorize, getVerificationLink };
// Chạy chương trình
authorize(listMessages);