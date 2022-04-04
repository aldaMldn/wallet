require('dotenv').config()
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const fs = require('fs');

app.use(express.json())

var today = new Date().toISOString().slice(0, 10);
const uuid = require('uuid');

app.get('/user/init', authenticateToken, (req, res) => {
    const users = getUserData()
    const findExists = users.find(user => user.id === req.user.id);
    res
        .status(200)
        .json({ status: 'success', data: findExists })
})

app.post('/user/wallet', authenticateToken, (req, res) => {
    const getWallet = getWalletData()
    const findExists = getWallet.find(wallet => wallet.owned_by === req.user.id);
    if (findExists.status == 'disabled') {
        fs.readFile('wallet.json', 'utf8', (err, data) => {
            resultData = JSON.parse(data)
            let status;
            resultData.find(u => {
                if (u.id === req.user.id) {
                    u.status = "enabled"
                    u.enabled_at = today
                    status = u.status
                }
                response = resultData.filter(u => u.id === req.user.id)
            })
            result = JSON.stringify(resultData);
            fs.writeFile('wallet.json', result, (err) => {
                res
                    .status(200)
                    .json({ status: 'success', data: response })
            })
        })
    } else {
        return res
            .status(401)
            .json({ status: 'fail', data: "Wallet already enabled!" })
    }
})

app.get('/user/wallet', authenticateToken, (req, res) => {
    const walletData = getWalletData()
    const findExists = walletData.find(wallet => wallet.owned_by === req.user.id);
    res
        .status(200)
        .json({ status: 'success', data: findExists })
})

app.post('/user/wallet/deposit', authenticateToken, (req, res) => {
    letInputAmount = req.body.amount
    const getWallet = getWalletData()
    const findExists = getWallet.find(wallet => wallet.owned_by === req.user.id);
    if (findExists.status == 'enabled') {

        fs.readFile('wallet.json', 'utf8', (err, data) => {
            resultData = JSON.parse(data);
            resultData.find(u => {
                if (u.id == req.user.id) {
                    u.balance += letInputAmount
                }
            })
            result = JSON.stringify(resultData);
            fs.writeFile('wallet.json', result, (err) => {
                return
            })
        })

        fs.readFile('deposit.json', 'utf8', (err, data) => {
            obj = JSON.parse(data)
            obj.push({
                id: uuid.v1(),
                deposited_by: req.user.id,
                status: "success",
                deposited_at: today,
                amount: letInputAmount,
                reference_id: uuid.v1()
            })
            json = JSON.stringify(obj)
            fs.writeFile('deposit.json', json, (err) => {
                if (err) return res.sendStatus(403)
                res
                    .status(200)
                    .json({ status: 'success', data: { deposit: obj } })
            })
        })
    } else {
        return res
            .status(401)
            .json({ status: 'fail', data: "Wallet is disabled!" })
    }
})

app.post('/user/wallet/withdrawals', authenticateToken, (req, res) => {
    letInputAmount = req.body.amount
    const getWallet = getWalletData()
    const findExists = getWallet.find(wallet => wallet.owned_by === req.user.id);
    if (findExists.status === 'enabled') {
        if (letInputAmount < findExists.balance) {

            fs.readFile('wallet.json', 'utf8', (err, data) => {
                resultData = JSON.parse(data);
                resultData.find(u => {
                    if (u.id == req.user.id) {
                        u.balance -= letInputAmount
                    }
                })
                result = JSON.stringify(resultData);
                fs.writeFile('wallet.json', result, (err) => {
                    return
                })
            })

            fs.readFile('withdraw.json', 'utf8', (err, data) => {
                obj = JSON.parse(data)
                obj.push({
                    id: uuid.v1(),
                    withdrawn_by: req.user.id,
                    status: "success",
                    withdrawn_at: today,
                    amount: letInputAmount,
                    reference_id: uuid.v1()
                })
                json = JSON.stringify(obj)
                fs.writeFile('withdraw.json', json, (err) => {
                    if (err) return res.sendStatus(403)
                    res
                        .status(200)
                        .json({ status: 'success', data: { withdrawal: obj } })
                })
            })
        } else {
            return res
                .status(401)
                .json({ status: 'fail', data: "balance is not enough!" })
        }
    } else {
        return res
            .status(401)
            .json({ status: 'fail', data: "wallet is disabled!" })
    }
})

app.get('/user/init', authenticateToken, (req, res) => {
    const users = getUserData()
    const findExists = users.find(user => user.id === req.user.id);
    res
        .status(200)
        .json({ status: 'success', data: findExists })
})

app.patch('/user/wallet', authenticateToken, (req, res) => {
    const getWallet = getWalletData()
    const findExists = getWallet.find(wallet => wallet.owned_by === req.user.id);
    if (findExists.status == 'enabled') {
        fs.readFile('wallet.json', 'utf8', (err, data) => {
            resultData = JSON.parse(data)
            let status;
            resultData.find(u => {
                if (u.owned_by === req.user.id) {
                    u.status = "disabled"
                    status = u.status
                }
                response = resultData.filter(u => u.owned_by === req.user.id)
            })
            result = JSON.stringify(resultData);
            fs.writeFile('wallet.json', result, (err) => {
                res
                    .status(200)
                    .json({ status: 'success', data: response })
            })
        })
    } else {
        return res
            .status(401)
            .json({ status: 'fail', data: "User already disabled!" })
    }
})

app.post('/login', (req, res) => {
    const userId = req.body.userId;
    const existUsers = getUserData()
    const findExists = existUsers.find(user => user.id === userId);
    if (!findExists) {
        return res
            .status(404)
            .json({ status: 'fail', data: "User Not Found!" })
    }

    const user = { id: userId }

    const accesToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
    res
        .status(200)
        .json({ status: 'success', data: { accesToken: accesToken } })
})

function authenticateToken(req, res, next) {
    const authorization = req.headers['authorization']
    const token = authorization && req.headers['authorization'].split(" ")[1]
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

const getUserData = () => {
    const jsonData = fs.readFileSync('users.json');
    return JSON.parse(jsonData)
}

const getWalletData = () => {
    const jsonData = fs.readFileSync('wallet.json');
    return JSON.parse(jsonData)
}

const getDepositData = () => {
    const jsonData = fs.readFileSync('deposit.json');
    return JSON.parse(jsonData)
}

const saveUserData = (data) => {
    const stringifyData = JSON.stringify(data)
    fs.writeFileSync('users.json', stringifyData)
}

app.listen(3000);