const axios = require('axios');
const fs = require('fs');
var http = require('http');

const FULL_URL = 'https://api.telegram.org/bot665043491:AAFFtXMOxEBHupLSBkwPOuLRTabe7ln5O5s/sendMessage?chat_id=@BACMpool&text=testMessage'; // To be deleted

const BACM_ADDRESS = 'WEBD$gCsh0nNrsZv9VYQfe5Jn$9YMnD4hdyx62n$';
const WEBD_NETWORK_URL = 'https://webdollar.network:5001/block';

const TOKEN = 'bot665043491:AAFFtXMOxEBHupLSBkwPOuLRTabe7ln5O5s'; 
const TELEGRAM_URL = 'https://api.telegram.org/'+TOKEN+'/sendMessage';
const CHAT_ID = '@BACMpool';

http.createServer(function (req, res) {
    res.write('Server stared.'); //write a response to the client
    res.end(); //end the response
}).listen(8080);

setInterval(function(){
    axios.get(WEBD_NETWORK_URL)
        .then(function (response) {
            if(response.status === 200){
                console.log('Checking...');
                // let lastBlock = response.data[0];
                let lastBlock = {"block_id":111,"miner_address":"WEBD$222$","nonce":551289399,"timestamp":"Tue, 07 Aug 2018 21:35:10 GMT"};

                let lastBlockMined = getLastBlockIdFromDb();

                if(lastBlock.miner_address !== BACM_ADDRESS && lastBlockMined.block_id !== lastBlock.block_id){
                    writeToDb(lastBlock);

                    axios.get(TELEGRAM_URL, {
                        params: {
                            chat_id: CHAT_ID,
                            text: 'New block mined by BACMpool!'
                        }
                    })
                    .then(function (response) {
                        console.log("Telegram message delivered successfuly!");
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                }
            
            }
        })
        .catch(function (error) {
            console.log(error);
        }); 
}, 5000);

function getLastBlockIdFromDb(){
    let DB = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    return DB.blocksMined.slice(-1).pop();
}

function writeToDb(lastBlock){
    console.log('sss');
    fs.readFile('db.json', 'utf8', function readDbFile(err, data){
        if (err){
            console.log(err);
        }
        else {
            DB = JSON.parse(data); 
            DB.blocksMined.push({
                block_id: lastBlock.block_id, 
                miner_address: lastBlock.miner_address, 
                nonce: lastBlock.nonce,
                timestamp: lastBlock.timestamp
            });
            json = JSON.stringify(DB);
            fs.writeFile('db.json', json, 'utf8');
            console.log('DB write successful!');
        }
    });
}