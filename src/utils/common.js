import AppConfig from 'config/app';

const CryptoJS = require('crypto-js');

function createResponse(code = 0, data, msg) {
	return { error_code: code, data: data ? encodeAES(data) : data, message: msg };
}

function decodeAES(data, retryCount = 0) {
	try {
		const iv = CryptoJS.enc.Hex.parse(AppConfig.cryptoIV);
		const key = CryptoJS.enc.Base64.parse(AppConfig.clientSEK);
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

function encodeAES(data, retryCount = 0) {
	try {
		const iv = CryptoJS.enc.Hex.parse(AppConfig.cryptoIV);
		const key = CryptoJS.enc.Base64.parse(AppConfig.clientSEK);
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

export default { createResponse, decodeAES, encodeAES };
