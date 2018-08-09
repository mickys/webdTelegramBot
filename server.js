const axios = require('axios');
const fs = require('fs');
var http = require('http');

const BACM_ADDRESS = 'WEBD$gCsh0nNrsZv9VYQfe5Jn$9YMnD4hdyx62n$';
const WEBD_NETWORK_BLOCKS_URL = 'https://webdollar.network:5001/block';
const WEBD_NETWORK_PAYMENTS_URL = 'https://webdollar.network:5001/address/'+BACM_ADDRESS+'?show_all_transactions=false';

const TOKEN = 'INSERT_TOKEN_HERE'; 
const TELEGRAM_URL = 'https://api.telegram.org/'+TOKEN+'/sendMessage';
const CHAT_ID = '@BACMpool';

http.createServer(function (req, res) {
    res.write('Server stared.'); //write a response to the client
    res.end(); //end the response
}).listen(8080);

tokenCheck();

if(isTokenSet()){
    setInterval(function(){
        axios.get(WEBD_NETWORK_BLOCKS_URL)
            .then(function (response) {
                if(response.status === 200){
                    console.log('Checking last blocks...');
                    let lastBlock = response.data[0];
                    let lastBlockMined = getLastBlockMinedFromDb();

                    if(lastBlock.miner_address === BACM_ADDRESS && lastBlockMined.block_id !== lastBlock.block_id){
                        console.log('New block mined!');
                        writeLastBlockToDb(lastBlock);

                        axios.get(TELEGRAM_URL, {
                            params: {
                                chat_id: CHAT_ID,
                                text: 'New block mined by BACMpool! #'+lastBlockMined.block_id
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
    }, 15000);

    setInterval(function(){
        axios.get(WEBD_NETWORK_PAYMENTS_URL)
            .then(function (response) {
                if(response.status === 200){
                    if(response.data.transactions.length){
                        let lastPayment = response.data.transactions[0];
                        let lastPaymentFromDb = getLastPaymentFromDb();

                        if(lastPayment.blockId !== lastPaymentFromDb.blockId){
                            console.log('New payment made!');
                            writeLastPaymentToDb(lastPayment);

                            axios.get(TELEGRAM_URL, {
                                params: {
                                    chat_id: CHAT_ID,
                                    text: 'New payment made by BACMpool! Value: '+lastPayment.from.amount+' WEBD.'
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
                }
            })
            .catch(function (error) {
                console.log(error);
            }); 
    }, 60000);
};


function getLastBlockMinedFromDb(){
    let DB = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    return DB.blocksMined.slice(-1).pop();
}

function getLastPaymentFromDb(){
    let DB = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    return DB.paymentsSent.slice(-1).pop();
}

function writeLastBlockToDb(lastBlock){
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
            console.log('DB lastBlock write successful!');
        }
    });
}

function writeLastPaymentToDb(lastPayment){
    fs.readFile('db.json', 'utf8', function readDbFile(err, data){
        if (err){
            console.log(err);
        }
        else {
            DB = JSON.parse(data); 
            DB.paymentsSent.push({
                blockId: lastPayment.blockId, 
                value: lastPayment.from.amount, 
                timestamp: lastPayment.timestamp
            });
            json = JSON.stringify(DB);
            fs.writeFile('db.json', json, 'utf8');
            console.log('DB lastPayment write successful!');
        }
    });
}

function tokenCheck(){
    if(TOKEN === 'INSERT_TOKEN_HERE'){
        console.log('Please insert the telegram bot token by replacing the INSERT_TOKEN_HERE wih your token.');
        return true;
    }
}

function isTokenSet(){
    if(TOKEN === 'INSERT_TOKEN_HERE'){
        return false;
    }

    return true;
}