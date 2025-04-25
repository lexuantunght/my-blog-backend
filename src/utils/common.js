import AppConfig from 'config/app';

const CryptoJS = require('crypto-js');

function createResponse(code, data, msg, key = '') {
	return { error_code: code, data: data && key ? encodeAES(data, 0, key) : data, message: msg };
}

function decodeAES(data, retryCount = 0, key) {
	try {
		const iv = CryptoJS.enc.Hex.parse(AppConfig.cryptoIV);
		const key = CryptoJS.enc.Base64.parse(key);
		const decyption = CryptoJS.AES.decrypt(data, key, { iv });
		return decyption.toString(CryptoJS.enc.Utf8);
	} catch (e) {
		console.error(e);
		if (retryCount > 0) {
			return decodeAES(retryCount - 1);
		} else {
			return null;
		}
	}
}

function encodeAES(data, retryCount = 0, key) {
	try {
		const iv = CryptoJS.enc.Hex.parse(AppConfig.cryptoIV);
		const key = CryptoJS.enc.Base64.parse(key);
		const encyption = CryptoJS.AES.encrypt(typeof data === 'string' ? data : JSON.stringify(data), key, { iv });
		return encyption.toString();
	} catch (e) {
		console.error(e);
		if (retryCount > 0) {
			return encodeAES(retryCount - 1);
		} else {
			return null;
		}
	}
}

function deleteProp(data, prop) {
	delete data[prop];
}

function md5(data) {
	return CryptoJS.MD5(data).toString();
}

function getUserFromRequest(req) {
	return req.user;
}

export default { createResponse, decodeAES, encodeAES, deleteProp, md5, getUserFromRequest };
